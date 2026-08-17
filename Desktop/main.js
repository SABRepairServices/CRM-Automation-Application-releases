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
    webPreferences: {
      preload: path.join(__dirname, 'splash-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  splashReady = false;
  splashWindow.webContents.once('did-finish-load', () => {
    splashReady = true;
    pendingSplashText.forEach((text) => splashWindow.webContents.send('splash-status', text));
    pendingSplashText = [];
  });
  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
}

// Surfaces real boot progress on the splash screen (instead of a static
// spinner that looks frozen for however long startup actually takes) and
// timestamps each stage in the log, so a slow launch is diagnosable from
// the log file instead of guesswork. The most common cause of a slow first
// launch after an auto-update is Windows Defender scanning the freshly
// written .exe and bundled files on first run — this doesn't fix that (only
// code-signing does), but it makes it visible which stage is actually slow.
const bootStart = Date.now();
let splashReady = false;
let pendingSplashText = [];
function setSplashStatus(text) {
  const elapsed = ((Date.now() - bootStart) / 1000).toFixed(1);
  log(`[Boot +${elapsed}s]`, text);
  if (!splashWindow || splashWindow.isDestroyed()) return;
  if (splashReady) {
    splashWindow.webContents.send('splash-status', text);
  } else {
    pendingSplashText.push(text);
  }
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

// Shared between registerIpcHandlers (the manual "Restart Now" button) and
// setupAutoUpdates (the 30s no-interaction auto-install) so whichever one
// fires first cancels the other — otherwise a click right at the 30s mark
// could trigger quitAndInstall twice.
let pendingAutoInstallTimer = null;
function clearPendingAutoInstall() {
  if (pendingAutoInstallTimer) {
    clearTimeout(pendingAutoInstallTimer);
    pendingAutoInstallTimer = null;
  }
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

  // Triggered by the "Restart Now" button on the in-app update card, and
  // also by the 30s auto-install timer in setupAutoUpdates if nobody
  // clicks anything. Both isSilent and isForceRunAfter are set: the NSIS
  // installer runs with no UI of its own and overwrites the existing
  // install path in place, and the app is guaranteed to relaunch
  // afterward even though the install itself was silent.
  ipcMain.handle('install-update', () => {
    clearPendingAutoInstall();
    autoUpdater.quitAndInstall(true, true);
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

  // A download is in flight the whole time from "update-available" until
  // either "update-downloaded" or "error" fires. Without this guard, the
  // 15s poll would fire a fresh checkForUpdates() on top of a still-running
  // multi-minute download of the ~80MB installer, which electron-updater
  // doesn't handle cleanly.
  let updateInFlight = false;

  autoUpdater.on('checking-for-update', () => log('[Update] checking...'));
  autoUpdater.on('update-not-available', () => log('[Update] already on the latest version.'));
  autoUpdater.on('update-available', (info) => {
    updateInFlight = true;
    log('[Update] new version found:', info.version, '— downloading in the background.');
  });
  autoUpdater.on('download-progress', (p) => log(`[Update] downloading: ${Math.round(p.percent)}%`));
  autoUpdater.on('update-downloaded', (info) => {
    updateInFlight = false;
    log('[Update] version', info.version, 'downloaded — notifying the UI.');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-downloaded', {
        version: info.version,
        releaseNotes: info.releaseNotes || info.releaseName || null,
      });
    }

    // Nobody has to click "Restart Now" for the update to actually land —
    // if the card sits untouched for 30s, install it anyway (silently,
    // relaunching after) so the app never gets stuck on an old build just
    // because it was left running unattended, which is exactly what let
    // installs pile up 10+ releases behind before.
    clearPendingAutoInstall();
    pendingAutoInstallTimer = setTimeout(() => {
      pendingAutoInstallTimer = null;
      log('[Update] no interaction within 30s — installing automatically.');
      autoUpdater.quitAndInstall(true, true);
    }, 30 * 1000);
  });
  autoUpdater.on('error', (err) => {
    updateInFlight = false;
    log('[Update] check failed (not fatal, app keeps running):', err.message);
  });

  const runCheck = (label) => {
    if (updateInFlight) return;
    autoUpdater.checkForUpdates().catch((err) => log(`[Update] ${label} check failed:`, err.message));
  };

  // Checked once immediately on every launch (covers "user restarted the
  // app") and again every 15s while it stays open (covers "app left running
  // through a release") — so a fresh build never sits undetected for long
  // either way.
  runCheck('initial');
  setInterval(() => runCheck('periodic'), 15 * 1000);
}

async function boot() {
  createSplashWindow();
  setSplashStatus('Starting local services…');

  try {
    if (!WEB_PORT) {
      WEB_PORT = await getFreePort();
    }
    WEB_URL = `http://localhost:${WEB_PORT}`;
    log('Using UI server port', WEB_PORT);

    setSplashStatus('Starting the app server…');
    startWebServer();

    log('Waiting for the UI server...');
    setSplashStatus('Waiting for the app server…');
    await waitForServer(WEB_URL, 90000);
    log('UI server is up.');
    setSplashStatus('Loading the app…');

    createMainWindow();
    registerIpcHandlers();
    setupAutoUpdates();

    mainWindow.once('ready-to-show', () => {
      setSplashStatus('Ready.');
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
