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
- This wrapper requires **PinwheelSDK >= 3.5.0**.

## Android Notes

- If you use camera flows, declare camera permission in your app manifest.
- This wrapper requires **pinwheel-android >= 3.5.2**.
- Use the Java runtime expected by your Capacitor Android major when building locally:
  - **Capacitor 6 / 7**: run Gradle with **JDK 17**. Newer runtimes such as JDK 24 can fail
    during Gradle script analysis with `Unsupported class file major version 68`.
  - **Capacitor 8**: run Gradle with **JDK 21+** because `@capacitor/android` compiles with
    Java source release 21.

## Example apps

The repo includes three local example apps for validating the wrapper against supported Capacitor majors:

- [https://github.com/underdog-tech/pinwheel-capacitor-sdk/tree/main/example-app](example-app) — Capacitor 8
- [https://github.com/underdog-tech/pinwheel-capacitor-sdk/tree/main/example-app-capacitor-7](example-app-capacitor-7) — Capacitor 7
- [https://github.com/underdog-tech/pinwheel-capacitor-sdk/tree/main/example-app-capacitor-6](example-app-capacitor-6) — Capacitor 6

From the repo root, `npm install && npm run build` the plugin, then in the example app directory run `npm install && npm run build` and `npx cap sync`.
