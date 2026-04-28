# @pinwheel/capacitor-sdk — Example App

React + Vite + Capacitor sample that creates Pinwheel Link tokens and opens the native SDK via the local plugin (`file:..`).

## Prerequisites

- Node 20+
- [Capacitor CLI](https://capacitorjs.com/docs/getting-started/environment-setup) (`npx cap`)
- Xcode (iOS) or Android Studio (Android)
- A Pinwheel API key (sandbox or production)

## Setup

**1. Build the plugin** (from the repository root, one level up):

```sh
npm install
npm run build
```

**2. Install example-app dependencies** (from this directory):

```sh
npm install
```

**3. Configure your API key**

Copy `.env.example` to `.env` and fill in your key:

```sh
cp .env.example .env
```

```
# example-app/.env
VITE_PINWHEEL_API_KEY=your_api_key_here
```

The key pre-fills the **API key** field in the UI. It is stored only in memory and never leaves the device. The `.env` file is git-ignored.

| Variable | Default | Purpose |
|---|---|---|
| `VITE_PINWHEEL_API_KEY` | _(empty)_ | Pre-fills the API key field in the UI |
| `VITE_PINWHEEL_API_BASE_URL` | `https://api.getpinwheel.com/v1` | API base URL — set to `https://sandbox.getpinwheel.com/v1` to run against sandbox |
| `VITE_EDGE_SMOKE_PLATFORM_ID` | _(empty)_ | Pre-fills the **platform_id** in the **Edge native smoke test** panel |

**4. Build the web assets and sync to native**

```sh
npm run build
npx cap add ios      # first time only
npx cap add android  # first time only
npx cap sync
```

## Run

### Web (browser, no native plugin)

```sh
npm run start
```

Opens at `http://localhost:5173`. The native `Pinwheel.open()` call will no-op in the browser — useful for UI iteration only.

### iOS (Xcode)

```sh
npm run build && npx cap sync
npx cap open ios
```

Run the scheme in Xcode on a simulator or device.

### Android (Android Studio)

```sh
npm run build && npx cap sync
npx cap open android
```

Run the app from Android Studio.

### Live reload (native + Vite dev server)

Set `server.url` in `capacitor.config.ts` to your machine's LAN address:

```ts
server: {
  url: 'http://192.168.x.x:5173',
  cleartext: true,
}
```

Then run `npm run start` and sync (`npx cap sync`). The native app will load from the dev server, giving you hot-reload without a full rebuild.

## What the app does

The example UI has three sections:

1. **Create Link Token** — fills in the direct deposit switch defaults (org `test`, a fixed `end_user_id`, and a pre-populated `allocation` target). Hit **Create token** to call `POST /v1/link_tokens` using your API key. The returned token is automatically copied into the launch section.

2. **Launch** — paste or auto-fill a link token and tap **Open** to open the native Pinwheel modal. All SDK events (`event`, `success`, `exit`, `error`, `login`, `loginAttempt`) are printed to the on-screen event log.

3. **Edge native smoke test** — creates a link token pre-selected to a known edge-native platform (configured via `VITE_EDGE_SMOKE_PLATFORM_ID` or the in-UI input), opens Pinwheel, and watches for a `success` event to verify the end-to-end edge-native flow. Status badge transitions: `idle` → `creating token…` → `native modal open — waiting for success` → `PASS` (success fired) or `FAIL` (exit/error before success). DD-form download flows are part of edge-native success on payroll-aware platforms — use the same panel on iOS and Android to verify both `PINWHEEL_DOWNLOAD_EVENT` (legacy blob) and `PINWHEEL_URL_DOWNLOAD_EVENT` (Android URL) paths.

## Default request body

```json
{
  "solution": "Deposit Switch",
  "features": ["direct_deposit_switch"],
  "org_name": "test",
  "end_user_id": "1f8d54a4-f5c3-4a44-9f88-68347fe8d59d",
  "allocation": {
    "targets": [
      {
        "name": "New account",
        "type": "checking",
        "routing_number": "044002051",
        "account_number": "0962447390"
      }
    ]
  }
}
```

Enable **Use JSON editor as the request body** in the UI to override this freely.
