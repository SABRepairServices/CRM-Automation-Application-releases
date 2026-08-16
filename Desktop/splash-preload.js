const { contextBridge, ipcRenderer } = require('electron');

// Lets the splash screen show real boot progress instead of a static
// "Starting local services…" the whole time — separate from preload.js
// since the splash window has no business seeing the CRM's backup/update
// bridge.
contextBridge.exposeInMainWorld('splashAPI', {
  onStatus: (callback) => {
    const listener = (event, text) => callback(text);
    ipcRenderer.on('splash-status', listener);
    return () => ipcRenderer.removeListener('splash-status', listener);
  },
});
