// swift-tools-version: 5.9
import PackageDescription

// Supports Capacitor 6, 7, and 8. SPM resolves to whichever version the
// consumer app's Package.swift pins via capacitor-swift-pm.
let package = Package(
    name: "PinwheelCapacitorSdk",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "PinwheelCapacitorSdk",
            targets: ["PinwheelPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", "6.0.0" ..< "9.0.0"),
        .package(url: "https://github.com/underdog-tech/pinwheel-ios-sdk", from: "3.0.0")
    ],
    targets: [
        .target(
            name: "PinwheelPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "PinwheelSDK", package: "pinwheel-ios-sdk")
            ],
            path: "ios/Sources/PinwheelPlugin")
    ]
)
