// Builds the Next.js UI as a self-contained standalone server and stages it
// into Desktop/web-standalone/, which is what gets bundled into the .exe
// (via electron-builder's extraResources) and what `npm start` runs locally.
//
// Two things Next's standalone output does NOT include on its own, so we
// copy them by hand: .next/static (client JS/CSS) and public/ (icons etc).
// Miss either one and the packaged app boots to a blank/unstyled page.
//
// NEXT_PUBLIC_API_URL is baked into the client bundle AT BUILD TIME — it is
// not something the running app can change later. Whatever value is set
// when this script runs is permanent for that build.
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WEB_DIR = path.join(ROOT, 'Web');
const STAGE_DIR = path.join(__dirname, 'web-standalone');

const API_URL = process.env.DESKTOP_API_URL || 'https://ips-api-uque.onrender.com/api';

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

console.log(`[build-standalone] Building Web UI with NEXT_PUBLIC_API_URL=${API_URL}`);
execSync('npm run build', {
  cwd: WEB_DIR,
  stdio: 'inherit',
  env: { ...process.env, NEXT_PUBLIC_API_URL: API_URL },
});

console.log('[build-standalone] Staging standalone server...');
fs.rmSync(STAGE_DIR, { recursive: true, force: true });
copyDir(path.join(WEB_DIR, '.next', 'standalone'), STAGE_DIR);

console.log('[build-standalone] Copying static assets...');
copyDir(path.join(WEB_DIR, '.next', 'static'), path.join(STAGE_DIR, '.next', 'static'));

if (fs.existsSync(path.join(WEB_DIR, 'public'))) {
  copyDir(path.join(WEB_DIR, 'public'), path.join(STAGE_DIR, 'public'));
}

console.log(`[build-standalone] Done. Staged at ${STAGE_DIR}`);
