// Local backup folder configuration — persisted once per install in
// Electron's userData directory (survives app updates, not per-user-profile
// in the app bundle itself).
const { app } = require('electron');
const fs = require('fs');
const path = require('path');

function configPath() {
  return path.join(app.getPath('userData'), 'backup-config.json');
}

function defaultBackupFolder() {
  return path.join(app.getPath('documents'), 'Imran Pro Services Backups');
}

function readConfig() {
  try {
    const raw = fs.readFileSync(configPath(), 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeConfig(config) {
  fs.mkdirSync(path.dirname(configPath()), { recursive: true });
  fs.writeFileSync(configPath(), JSON.stringify(config, null, 2), 'utf8');
}

function getBackupFolder() {
  const config = readConfig();
  return config?.backupFolder || null;
}

function setBackupFolder(folder) {
  fs.mkdirSync(folder, { recursive: true });
  writeConfig({ backupFolder: folder });
  return folder;
}

module.exports = { configPath, defaultBackupFolder, getBackupFolder, setBackupFolder };
