# Shipping Neural Orb (installers + website)

Everything is already wired. Three things must line up: the GitHub repository
that hosts the files, the version number, and the `releaseReady` switch.

## 1. Point the site at your repository

`src/config/site.ts`:

```ts
releaseBase: "https://github.com/bulitvincent-lang/neural-nexus-live/releases/latest/download",
releasesPage: "https://github.com/bulitvincent-lang/neural-nexus-live/releases/latest",
version: "0.1.0",     // must match src-tauri/tauri.conf.json + Cargo.toml
releaseReady: false,  // flip to true once step 3 succeeded
```

## 2. Publish the installers

Bump the version in all three places (`src/config/site.ts`,
`src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`), then push a tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

`.github/workflows/release.yml` then builds, on GitHub's runners:

| Platform | Artifact |
| --- | --- |
| macOS Apple Silicon | `Neural.Orb_<version>_aarch64.dmg` |
| macOS Intel | `Neural.Orb_<version>_x64.dmg` |
| Windows | `Neural.Orb_<version>_x64_en-US.msi` |
| Linux | `Neural.Orb_<version>_amd64.AppImage` |
| Browser companion | `neural-orb-connector.zip` |

All five are attached to the GitHub release for that tag. The website builds its
download URLs from those exact names, so do not rename them.

## 3. Turn the download buttons on

Set `releaseReady: true` in `src/config/site.ts` and publish the site. The home
page swaps "Try the orb now" for real per-platform download buttons, and
`/connect` starts serving the companion zip.

## 4. Domain

Publish the site from Lovable, then attach `neural-orb.com` in
Project settings → Domains. Nothing else in the code needs to change; `SITE.url`
and `SITE.domain` are the only places the name appears.

## Signing (recommended before public launch)

Unsigned builds show a warning on macOS and Windows. Add repository secrets and
they are picked up automatically by `tauri-action`:

- macOS: `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`,
  `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID`
- Windows: `WINDOWS_CERTIFICATE`, `WINDOWS_CERTIFICATE_PASSWORD`

## Local check before tagging

```bash
bun install
bun run build          # web bundle
cargo check --manifest-path src-tauri/Cargo.toml
```
