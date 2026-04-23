# @pinwheel/capacitor-sdk

Capacitor plugin that opens Pinwheel Link natively on iOS and Android and forwards Link events to JavaScript.

## Install

```sh
npm i @pinwheel/capacitor-sdk
npx cap sync
```

## Usage

```ts
import { Pinwheel } from '@pinwheel/capacitor-sdk';

Pinwheel.addListener('event', ({ name, payload }) => {
  console.log('pinwheel event', name, payload);
});
Pinwheel.addListener('exit', (payload) => console.log('exit', payload));
Pinwheel.addListener('success', (payload) => console.log('success', payload));

await Pinwheel.open({
  linkToken: '<LINK_TOKEN>',
  // Optional wrapper version forwarded to the native SDK:
  // sdkVersion: '0.0.1',
  useSecureOrigin: true,
  useDarkMode: false,
  mode: 'sandbox',
  environment: 'production',
  // Optional Link UI override:
  // linkURL: 'https://cdn.getpinwheel.com/link.html?version=3.0.0',
});
```

## iOS Notes

- Add `NSCameraUsageDescription` if you use flows that require camera access.
- If you load non-HTTPS content (not recommended), configure ATS accordingly.

## Android Notes

- If you use camera flows, declare camera permission in your app manifest.

## Example app

See [example-app/README.md](example-app/README.md). From the repo root, `npm install && npm run build` the plugin, then in `example-app/` run `npm install && npm run build` and `npx cap add ios android && npx cap sync`.

## Public GitHub repo (`pinwheel-capacitor-sdk`)

The npm package is published from this **internal** repo. The **public** GitHub repo (default: `pinwheel-hq/pinwheel-capacitor-sdk`) uses the same **update-external-repo** pattern as **pinwheel-android-sdk-internal**: copy **`CHANGELOG.md`**, push to **`main`**, tag the version, and create a **GitHub Release** (notes from the changelog diff; `prerelease` when the branch is not `main`). Scripts: [`scripts/update-external-repo/main.sh`](scripts/update-external-repo/main.sh), [`scripts/helpers.sh`](scripts/helpers.sh).

### One-time setup

1. Create the public GitHub repository (it should track `CHANGELOG.md` on `main`; an initial commit is fine).
2. Ensure the CircleCI **`frontend-production`** context contains:
   - **`GITHUB_TOKEN_CTX`** — PAT with **Contents: Read and write** on the public repo (same token Android uses).
   - **`NPM_TOKEN`** — npm publish token for `@pinwheel/capacitor-sdk`.
3. Optional env vars in the context (or CircleCI project env): **`PUBLIC_REPO_OWNER`** / **`PUBLIC_REPO_NAME`** if the public repo is not `pinwheel-hq/pinwheel-capacitor-sdk`.

### CI pipeline (CircleCI)

Mirrors **pinwheel-android-sdk-internal** (`.circleci/config.yml`):

1. **`check_mergable`** + **`build_and_lint`** — run on every push/PR.
2. **`hold_for_approval`** — manual gate in the CircleCI UI; only reachable from `main` / `deploy/*`.
3. **`publish_to_npm`** (`context: frontend-production`) — after approval.
4. **`update_public_repo`** (`context: frontend-production`) — after npm publish; copies `CHANGELOG.md`, pushes to `main`, tags, creates a GitHub Release.

### Local sync

```sh
export GITHUB_TOKEN_CTX=ghp_...
npm run sync-public
```

Does **not** push/tag/release unless `CIRCLECI=true`.
