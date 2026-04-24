# Changelog

## [0.0.2]

- Fix: include `Package.swift` in the npm package so Capacitor 8 SPM consumers can link the native iOS plugin class (previously caused `"Pinwheel" plugin is not implemented on ios` at runtime).
- Support Capacitor 6, 7, and 8. `Package.swift` now depends on `capacitor-swift-pm` in the range `"6.0.0" ..< "9.0.0"`; `peerDependencies["@capacitor/core"]` widened to `">=6.0.0 <9.0.0"`.

## [0.0.1]

- Initial publish of `@pinwheel/capacitor-sdk`: Capacitor plugin wrapping Pinwheel native iOS and Android SDKs.
- Typed JavaScript API (`PinwheelOpenOptions`, event payloads, canonical `event` stream).
- Web stub directs developers to Pinwheel Web and React SDK documentation.
