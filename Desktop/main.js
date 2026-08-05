const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const treeKill = require('tree-kill');
const backupConfig = require('./backupConfig');
const { saveDocumentPdf } = require('./pdfBackup');

const ROOT = path.resolve(__dirname, '..');
const API_DIR = path.join(ROOT, 'API');
const WEB_DIR = path.join(ROOT, 'Web');

const API_PORT = process.env.API_PORT || 5000;
const WEB_PORT = process.env.WEB_PORT || 3000;
const API_URL = `http://localhost:${API_PORT}/api/health`;
const WEB_URL = `http://localhost:${WEB_PORT}`;

let mainWindow;
let splashWindow;
let apiProcess;
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

function startApiServer() {
  log('Starting API server (Express)...');
  apiProcess = spawn(process.execPath, [path.join(API_DIR, 'server.js')], {
    cwd: API_DIR,
    env: { ...process.env, NODE_ENV: 'production' },
    windowsHide: true,
  });
  apiProcess.stdout.on('data', (d) => log('[API]', d.toString().trim()));
  apiProcess.stderr.on('data', (d) => log('[API:ERR]', d.toString().trim()));
  apiProcess.on('exit', (code) => log('API server exited with code', code));
}

function startWebServer() {
  log('Starting Web server (Next.js)...');
  const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  webProcess = spawn(npxCmd, ['next', 'start', '-p', String(WEB_PORT)], {
    cwd: WEB_DIR,
    env: { ...process.env, NODE_ENV: 'production' },
    windowsHide: true,
    shell: true,
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

async function boot() {
  createSplashWindow();

  try {
    startApiServer();
    startWebServer();

    log('Waiting for API server...');
    await waitForServer(API_URL, 60000);
    log('API server is up.');

    log('Waiting for Web server...');
    await waitForServer(WEB_URL, 90000);
    log('Web server is up.');

    createMainWindow();
    registerIpcHandlers();

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
      `Imran Pro Services failed to start.\n\n${err.message}\n\nCheck that Configs/.env is set up correctly and that ports ${API_PORT} / ${WEB_PORT} are free.`
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
  if (apiProcess && apiProcess.pid) {
    treeKill(apiProcess.pid);
    apiProcess = null;
  }
  if (webProcess && webProcess.pid) {
    treeKill(webProcess.pid);
    webProcess = null;
  }
}

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});
