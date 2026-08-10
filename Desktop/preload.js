const { contextBridge, ipcRenderer } = require('electron');

// Exposes a small, explicit bridge for local document backups. The web app
// checks for `window.electronAPI` to know it's running inside the desktop
// shell (vs. a plain browser tab) and only offers local backup there.
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getBackupFolder: () => ipcRenderer.invoke('get-backup-folder'),
  chooseBackupFolder: () => ipcRenderer.invoke('choose-backup-folder'),
  saveDocumentPdf: (meta) => ipcRenderer.invoke('save-document-pdf', meta),
  openInBrowser: () => ipcRenderer.invoke('open-in-browser'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateDownloaded: (callback) => {
    const listener = (event, payload) => callback(payload);
    ipcRenderer.on('update-downloaded', listener);
    return () => ipcRenderer.removeListener('update-downloaded', listener);
  },
});
