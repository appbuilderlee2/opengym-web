# openGym Web — browser-only GitHub Pages build

This fork keeps the upstream React UI while compiling its local/mobile state path into a browser-only PWA. There is no application server, login, or cloud sync.

## Architecture

- `VITE_MOBILE=1 VITE_WEB_LOCAL=1 npm run build` from `frontend/`
- Browser IndexedDB (`opengym-web-local`) mirrors the workout state and small JSON device records.
- Original localStorage state is retained for backward compatibility.
- The official service worker caches the app shell and exercise media for offline re-opening.
- Exercise catalogue assets are staged by `scripts/catalogue/stage-media.mjs`.
- The existing `.github/workflows/pages.yml` deploys the static site on every push to `main`.

## Initial setup

In GitHub **Settings → Pages → Build and deployment**, choose **GitHub Actions**.
Open `https://appbuilderlee2.github.io/opengym-web/` after the first successful workflow deployment, then use **Add to Home Screen** on iOS.

## Important limitations

- IndexedDB and localStorage are local to each browser/origin. Devices do not sync.
- Deleting website storage may erase training history. Export backup regularly.
- Native Capacitor notifications, OS filesystem backups, Health Connect, and native-only integrations cannot work as browser APIs and may need browser-specific alternatives.
- This first port is not equivalent to a tested native build. Exercise playback, media storage, backup import/export, and full offline behavior should be checked on iPhone Safari and an installed PWA.
- Keep upstream copyright notices and comply with AGPL-3.0-or-later and exercise-media licensing.
