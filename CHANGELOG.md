# Changelog

## [0.0.3]

- **Edge native support**: the wrapper now correctly identifies itself to Pinwheel Link and Newton as `sdk: "capacitor"` with the actual wrapper version, enabling edge-native login flows (where the payroll site is loaded in a native WebView controlled by the underlying SDK rather than a browser tab).
- **Automatic version forwarding**: `Pinwheel.open()` automatically injects the wrapper's `package.json` version as `sdkVersion` — callers no longer need to pass it manually. `package.json` is now the single source of truth; a build-time script (`scripts/write-version.mjs`) generates `src/version.ts` (TypeScript) and `ios/.../Version.swift` (Swift constant) from it.
- **Min native SDK floors pinned**: iOS requires `PinwheelSDK ~> 3.5` and Android requires `pinwheel-android:3.5.2`. Both versions implement the full `PINWHEEL_INTERNAL_COMM_*` postMessage bridge needed for edge-native flows.
- **Android lifecycle fix**: `close()`, the `exit` event handler, and `handleOnDestroy()` all now properly clear the `PinwheelFragment` listener back-reference, preventing a plugin memory leak across config changes or process kills.
- **Example app**: added an edge-native smoke test panel with a PASS/FAIL status badge. Configure the target platform via `VITE_EDGE_SMOKE_PLATFORM_ID`.

## [0.0.2]

- Fix: include `Package.swift` in the npm package so Capacitor 8 SPM consumers can link the native iOS plugin class (previously caused `"Pinwheel" plugin is not implemented on ios` at runtime).
- Support Capacitor 6, 7, and 8. `Package.swift` now depends on `capacitor-swift-pm` in the range `"6.0.0" ..< "9.0.0"`; `peerDependencies["@capacitor/core"]` widened to `">=6.0.0 <9.0.0"`.

## [0.0.1]

- Initial publish of `@pinwheel/capacitor-sdk`: Capacitor plugin wrapping Pinwheel native iOS and Android SDKs.
- Typed JavaScript API (`PinwheelOpenOptions`, event payloads, canonical `event` stream).
- Web stub directs developers to Pinwheel Web and React SDK documentation.
