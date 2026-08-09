# Desktop App: Auto-Update Setup (one-time, manual)

Everything on the code side is done and tested. Two things need doing once,
by hand, before pushing to `master` triggers a real published release.

## 1. Create the public releases repo

This is separate from the private source repo on purpose — installed apps
need to check for updates without any credential baked into the `.exe`, and
that's only safe if what they're checking is public.

1. github.com → New repository
2. Owner: **SABRepairServices**
3. Name: **`CRM-Automation-Application-releases`** (must match exactly —
   `Desktop/package.json`'s `build.publish` points here)
4. Visibility: **Public**
5. Don't add a README/gitignore — leave it empty, electron-builder creates
   Releases in it directly

## 2. Create a token that can publish to it

1. github.com → Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token
2. Note: `desktop-release-publisher`
3. Expiration: 90 days (or your call, same tradeoff as the deploy token)
4. Repository access: **Only select repositories** → `CRM-Automation-Application-releases`
5. Permissions → Contents: **Read and write** (this is what lets it create Releases)
6. Generate, copy it

## 3. Add it as a secret on the SOURCE (private) repo

The GitHub Actions workflow runs in the private source repo but needs to
publish to the public releases repo — that requires this token, added there:

1. Go to `github.com/SABRepairServices/CRM-Automation-Application` → Settings → Secrets and variables → Actions
2. New repository secret
3. Name: **`RELEASE_TOKEN`** (must match exactly — `.github/workflows/build-desktop.yml` reads this name)
4. Value: paste the token from step 2
5. Add secret

---

## What happens after that

Every push to `master` now:
1. Builds the UI with the live Render API URL baked in
2. Bumps the version automatically
3. Packages the `.exe`
4. Publishes it as a Release on the public releases repo

Any installed copy of the app checks that repo automatically (every 4 hours,
and once on startup), downloads a newer version silently in the background,
and installs it the next time it's restarted — never interrupting a job in
progress.

## Installing on your boss's laptop (first time only)

Auto-update only works once a version is *already installed* — the very
first install has to be manual:

1. After the steps above, wait for the Actions run to finish (Actions tab
   on the repo, or the public releases repo's Releases page)
2. Download `Imran Pro Services Setup <version>.exe` from that Release
3. Run it on his laptop, follow the installer
4. From then on, it updates itself
