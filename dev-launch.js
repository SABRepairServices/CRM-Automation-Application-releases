// Single entry point for local dev: starts the API server hidden in the
// background, then runs the Next.js dev server in the foreground so the
// launcher only ever shows ONE app, not separate frontend/backend rows.
const { spawn } = require('child_process');
const path = require('path');

const ROOT = __dirname;
const API_DIR = path.join(ROOT, 'API');
const WEB_DIR = path.join(ROOT, 'Web');

const apiProcess = spawn(process.execPath, ['server.js'], {
  cwd: API_DIR,
  stdio: 'ignore',
  windowsHide: true,
});

function shutdown() {
  if (apiProcess && !apiProcess.killed) {
    apiProcess.kill();
  }
  process.exit();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('exit', shutdown);

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const webProcess = spawn(npmCmd, ['run', 'dev'], {
  cwd: WEB_DIR,
  stdio: 'inherit',
  shell: true,
});

webProcess.on('exit', (code) => {
  shutdown();
  process.exit(code || 0);
});
