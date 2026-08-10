// Single entry point for local dev: starts the API server hidden in the
// background, then runs the Next.js dev server in the foreground so the
// launcher only ever shows ONE app, not separate frontend/backend rows.
const { spawn } = require('child_process');
const path = require('path');

const ROOT = __dirname;
const API_DIR = path.join(ROOT, 'API');
const WEB_DIR = path.join(ROOT, 'Web');

// Explicitly pin each child's port instead of letting it inherit whatever
// PORT the outer launcher happens to have set (e.g. a preview tool exporting
// PORT=3000 to match launch.json). Without this the API grabbed that
// inherited PORT too — since server.js prioritizes process.env.PORT for
// Render — colliding with the Web dev server and silently never listening
// on 5000, which looked like "the API isn't running" with no error visible
// anywhere (stdio was 'ignore').
const apiProcess = spawn(process.execPath, ['server.js'], {
  cwd: API_DIR,
  stdio: 'ignore',
  windowsHide: true,
  env: { ...process.env, PORT: '5000' },
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
  env: { ...process.env, PORT: '3000' },
});

webProcess.on('exit', (code) => {
  shutdown();
  process.exit(code || 0);
});
