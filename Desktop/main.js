const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');

// Permanent fix for the black/blank-window bug: on some Windows machines
// (older or driver-buggy GPUs, remote desktop sessions, certain laptop
// hybrid-graphics setups) Electron's GPU compositor silently fails to paint
// anything, leaving a window that loaded successfully but never renders a
// pixel — confirmed in our own testing that the server and page were fine,
// only the compositor wasn't drawing. Disabling GPU acceleration forces
// software rendering, which is slower but always paints. Must be called
// before app.whenReady().
app.disableHardwareAcceleration();
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const net = require('net');
const treeKill = require('tree-kill');
const { autoUpdater } = require('electron-updater');
const backupConfig = require('./backupConfig');
const { saveDocumentPdf } = require('./pdfBackup');

// The API is no longer bundled or spawned locally — it runs on Render
// (see ../render.yaml) and every screen the UI shows talks to it over the
// internet, same as any other web app. What ships in the .exe is only the
// UI: a self-contained Next.js "standalone" server, staged into
// web-standalone/ by build-standalone.js and packaged as an extraResource
// so it lives outside the asar archive (see package.json's build.extraResources).
//
// The actual root cause of the recurring blank-screen/crash: this used to be
// hardcoded to port 3000. Any leftover server from a previous run (crashed,
// force-closed, or killed via Task Manager instead of a clean quit) stays
// bound to that port forever, since the cleanup in shutdownChildProcesses()
// only runs on a graceful Electron quit. The next launch would then either
// fail outright (EADDRINUSE) or — worse — silently connect the window to
// that stale orphaned server instead of its own fresh one, which is what
// produced the blank window. Picking a free ephemeral port on every launch
// makes that class of collision impossible.
let WEB_PORT = process.env.WEB_PORT ? Number(process.env.WEB_PORT) : null;
let WEB_URL = null;

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

// app.isPackaged is false both in plain `node main.js` and in `electron .`
// during development — in both cases the staged build next to this file is
// what we want, so packaged vs dev only matters for locating that folder
// relative to resourcesPath vs __dirname.
const STANDALONE_DIR = app.isPackaged
  ? path.join(process.resourcesPath, 'web-standalone')
  : path.join(__dirname, 'web-standalone');
const STANDALONE_SERVER = path.join(STANDALONE_DIR, 'server.js');

let mainWindow;
let splashWindow;
let webProcess;

function log(...args) {
  console.log('[Desktop]', ...args);
}

function waitForServer(url, timeoutMs = 60000, intervalMs = 500) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      http
        .get(url, (res) => {
          resolve(true);
        })
        .on('error', () => {
          if (Date.now() - start > timeoutMs) {
            reject(new Error(`Timed out waiting for ${url}`));
          } else {
            setTimeout(check, intervalMs);
          }
        });
    };
    check();
  });
}

function startWebServer() {
  if (!fs.existsSync(STANDALONE_SERVER)) {
    throw new Error(
      `UI build not found at ${STANDALONE_SERVER}.\n\nRun "npm run build-standalone" in Desktop/ before "npm start" or packaging — the app has nothing to display without it.`
    );
  }
  log('Starting bundled UI server...');
  webProcess = spawn(process.execPath, [STANDALONE_SERVER], {
    cwd: STANDALONE_DIR,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(WEB_PORT),
      // Without this, process.execPath in a PACKAGED build is the app's own
      // .exe — spawning it "normally" re-launches the whole Electron app
      // (which spawns another web server, which re-launches again...) into
      // an unbounded fork bomb instead of running server.js as plain Node.
      // This flag makes Electron's bundled Node runtime behave as a plain
      // node.exe for this one child process — the documented way Electron
      // apps run Node scripts without requiring Node installed separately.
      ELECTRON_RUN_AS_NODE: '1',
    },
    windowsHide: true,
  });
  webProcess.stdout.on('data', (d) => log('[WEB]', d.toString().trim()));
  webProcess.stderr.on('data', (d) => log('[WEB:ERR]', d.toString().trim()));
  webProcess.on('exit', (code) => log('Web server exited with code', code));
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 420,
    height: 280,
    frame: false,
    resizable: false,
    center: true,
    show: true,
    backgroundColor: '#0B1F3A',
  });
  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    backgroundColor: '#0B1F3A',
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  // The menu bar (and with it, the usual View > Toggle DevTools) is hidden,
  // so without this there's no way to see renderer console errors in a
  // packaged build — every UI bug report becomes a guessing game. F12 /
  // Ctrl+Shift+I work the same as any normal browser.
  mainWindow.webContents.on('before-input-event', (event, input) => {
    const isDevToolsShortcut =
      input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i');
    if (isDevToolsShortcut) {
      mainWindow.webContents.toggleDevTools();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.loadURL(WEB_URL);

  mainWindow.once('ready-to-show', () => {
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow.show();
    mainWindow.maximize();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Self-heal instead of staying on a blank window: a crashed/killed
  // renderer or a page that failed to load gets one automatic reload.
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    log('Renderer process gone:', details.reason, '- reloading');
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.reload();
  });

  mainWindow.webContents.on('unresponsive', () => {
    log('Window became unresponsive - reloading');
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.reload();
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    if (errorCode === -3) return; // ERR_ABORTED — normal on navigation, not a real failure
    log('Page failed to load:', errorCode, errorDescription, '- retrying in 1s');
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) mainWindow.loadURL(WEB_URL);
    }, 1000);
  });
}

async function ensureBackupFolder() {
  const existing = backupConfig.getBackupFolder();
  if (existing) {
    log('Local backup folder:', existing);
    return existing;
  }

  const suggested = backupConfig.defaultBackupFolder();
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Choose a folder for local document backups (Invoices, Quotations, Inspections)',
    defaultPath: suggested,
    properties: ['openDirectory', 'createDirectory'],
    buttonLabel: 'Use This Folder',
  });

  const chosen = !result.canceled && result.filePaths[0] ? result.filePaths[0] : suggested;
  const saved = backupConfig.setBackupFolder(chosen);
  log('Local backup folder set to:', saved);
  return saved;
}

function registerIpcHandlers() {
  ipcMain.handle('get-app-version', () => app.getVersion());

  ipcMain.handle('get-backup-folder', () => {
    return backupConfig.getBackupFolder() || backupConfig.defaultBackupFolder();
  });

  ipcMain.handle('choose-backup-folder', async () => {
    const current = backupConfig.getBackupFolder() || backupConfig.defaultBackupFolder();
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Choose a folder for local document backups',
      defaultPath: current,
      properties: ['openDirectory', 'createDirectory'],
      buttonLabel: 'Use This Folder',
    });
    if (result.canceled || !result.filePaths[0]) return current;
    return backupConfig.setBackupFolder(result.filePaths[0]);
  });

  ipcMain.handle('open-in-browser', () => {
    shell.openExternal(WEB_URL);
  });

  // Triggered by the "Restart Now" button on the in-app update card.
  // quitAndInstall relaunches the app on the new version immediately;
  // if the user instead dismisses with "Later", autoInstallOnAppQuit
  // (set in setupAutoUpdates) installs it the next time they close the
  // app normally, so it's never lost either way.
  ipcMain.handle('install-update', () => {
    autoUpdater.quitAndInstall();
  });

  ipcMain.handle('save-document-pdf', async (event, meta) => {
    try {
      const backupRoot = backupConfig.getBackupFolder() || backupConfig.setBackupFolder(backupConfig.defaultBackupFolder());
      const filePath = await saveDocumentPdf(event.sender, backupRoot, meta);
      log('Saved local PDF backup:', filePath);
      return { success: true, filePath };
    } catch (err) {
      log('Failed to save local PDF backup:', err.message);
      return { success: false, error: err.message };
    }
  });
}

/**
 * Checks a public GitHub Releases repo (configured in package.json's
 * build.publish, and again below for the dev-mode config electron-updater
 * needs since it otherwise reads app-update.yml, which only exists in a
 * packaged build) for a newer version, downloads it silently in the
 * background, and installs it the next time the app restarts — never
 * interrupting whoever is mid-job. Only runs in packaged builds: in dev,
 * electron-updater has nothing meaningful to check and would just log noise.
 */
function setupAutoUpdates() {
  if (!app.isPackaged) {
    log('Auto-update skipped (dev build).');
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => log('[Update] checking...'));
  autoUpdater.on('update-not-available', () => log('[Update] already on the latest version.'));
  autoUpdater.on('update-available', (info) => log('[Update] new version found:', info.version, '— downloading in the background.'));
  autoUpdater.on('download-progress', (p) => log(`[Update] downloading: ${Math.round(p.percent)}%`));
  autoUpdater.on('update-downloaded', (info) => {
    log('[Update] version', info.version, 'downloaded — notifying the UI.');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-downloaded', { version: info.version });
    }
  });
  autoUpdater.on('error', (err) => log('[Update] check failed (not fatal, app keeps running):', err.message));

  autoUpdater.checkForUpdates().catch((err) => log('[Update] initial check failed:', err.message));
  // Re-check periodically for anyone who leaves the app open for days.
  setInterval(() => {
    autoUpdater.checkForUpdates().catch((err) => log('[Update] periodic check failed:', err.message));
  }, 4 * 60 * 60 * 1000);
}

async function boot() {
  createSplashWindow();

  try {
    if (!WEB_PORT) {
      WEB_PORT = await getFreePort();
    }
    WEB_URL = `http://localhost:${WEB_PORT}`;
    log('Using UI server port', WEB_PORT);

    startWebServer();

    log('Waiting for the UI server...');
    await waitForServer(WEB_URL, 90000);
    log('UI server is up.');

    createMainWindow();
    registerIpcHandlers();
    setupAutoUpdates();

    mainWindow.once('ready-to-show', () => {
      // Runs after the window is visible so the folder-picker dialog has a
      // proper parent. Only prompts once — the choice is remembered from
      // here on (see backupConfig.js).
      ensureBackupFolder();
    });
  } catch (err) {
    log('Startup failed:', err.message);
    dialog.showErrorBox(
      'Startup Error',
      `Imran Pro Services failed to start.\n\n${err.message}\n\nIf this keeps happening, reinstall the app or contact support.`
    );
    app.quit();
  }
}

app.whenReady().then(boot);

app.on('window-all-closed', () => {
  shutdownChildProcesses();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  shutdownChildProcesses();
});

function shutdownChildProcesses() {
  if (webProcess && webProcess.pid) {
    treeKill(webProcess.pid);
    webProcess = null;
  }
}

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});
