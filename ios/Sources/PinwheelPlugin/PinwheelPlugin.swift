import Capacitor
import PinwheelSDK
import Foundation

@objc(CAPPinwheelPlugin)
public class PinwheelPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CAPPinwheelPlugin"
    public let jsName = "Pinwheel"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "open", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "close", returnType: CAPPluginReturnPromise)
    ]

    private var pinwheelVC: PinwheelViewController?
    private var presentedNav: UINavigationController?

    @objc func open(_ call: CAPPluginCall) {
        guard let token = call.getString("linkToken") else {
            call.reject("linkToken is required")
            return
        }

        let useDarkMode = call.getBool("useDarkMode") ?? false
        let useSecureOrigin = call.getBool("useSecureOrigin") ?? false
        let modeValue = call.getString("mode") ?? "sandbox"
        let environmentValue = call.getString("environment") ?? "staging"
        let linkURL = call.getString("linkURL")
        // The JS layer always passes the wrapper's `package.json` version via
        // `Pinwheel.open()`. We fall back to the build-time constant from
        // ios/Sources/PinwheelPlugin/Version.swift so the value forwarded to Pinwheel
        // Link / Newton stays in sync with the published wrapper, never the legacy
        // "0.0.1" placeholder.
        let sdkVersion = call.getString("sdkVersion") ?? PinwheelCapacitorWrapper.version

        DispatchQueue.main.async { [weak self] in
            guard let self else { return }

            let viewController = self.bridge?.viewController
            if viewController == nil {
                call.reject("No view controller available")
                return
            }

            let mode = PinwheelMode(rawValue: modeValue) ?? .sandbox
            let environment: PinwheelEnvironment
            if let linkURL, !linkURL.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                // Treat linkURL as a hard override (matches pinwheel-demo-ios behavior when linkURL is set).
                environment = .local(linkURL: linkURL)
            } else {
                environment = PinwheelEnvironment(value: environmentValue)
            }
            var config = PinwheelConfig(
                mode: mode,
                environment: environment,
                // Pinwheel Link validates this string strictly.
                sdk: "capacitor",
                version: sdkVersion
            )
            config.useSecureOrigin = useSecureOrigin
            let root: UIViewController
            let controller = PinwheelViewController(
                token: token,
                delegate: self,
                config: config,
                useDarkMode: useDarkMode,
                useAppBoundDomains: false,
                useAppBoundDomainsForNativeLink: false
            )
            self.pinwheelVC = controller
            root = PinwheelContainerViewController(child: controller, useDarkMode: useDarkMode)

            let nav = UINavigationController(rootViewController: root)
            nav.modalPresentationStyle = .fullScreen
            // Pinwheel Link provides its own exit UI; avoid adding a second close button.
            nav.isNavigationBarHidden = true
            nav.overrideUserInterfaceStyle = useDarkMode ? .dark : .light
            nav.view.backgroundColor = useDarkMode ? UIColor.black : UIColor.white
            self.presentedNav = nav
            viewController?.present(nav, animated: true)
            call.resolve()
        }
    }

    @objc func close(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            self.presentedNav?.dismiss(animated: true)
            self.pinwheelVC = nil
            self.presentedNav = nil
            call.resolve()
        }
    }
}

extension PinwheelPlugin: PinwheelDelegate {
    public func onEvent(name: PinwheelEventType, event: PinwheelEventPayload?) {
        notifyListeners("event", data: ["name": name.rawValue, "payload": self.encodePayload(event)])
    }

    public func onExit(_ error: PinwheelError?) {
        if let error {
            notifyListeners("exit", data: ["error": self.encodePayload(error)])
        } else {
            notifyListeners("exit", data: [:])
        }
        DispatchQueue.main.async { [weak self] in
            self?.presentedNav?.dismiss(animated: true)
            self?.pinwheelVC = nil
            self?.presentedNav = nil
        }
    }

    public func onSuccess(_ result: PinwheelSuccessPayload) {
        notifyListeners("success", data: self.payloadDict(self.encodePayload(result)))
    }

    public func onLogin(_ result: PinwheelLoginPayload) {
        notifyListeners("login", data: self.payloadDict(self.encodePayload(result)))
    }

    public func onLoginAttempt(_ result: PinwheelLoginAttemptPayload) {
        notifyListeners("loginAttempt", data: self.payloadDict(self.encodePayload(result)))
    }

    public func onError(_ error: PinwheelError) {
        notifyListeners("error", data: self.payloadDict(self.encodePayload(error)))
    }
}

extension PinwheelPlugin {
    private func encodePayload(_ payload: PinwheelEventPayload?) -> Any {
        guard let payload else { return NSNull() }
        do {
            let json = try payload.jsonString()
            guard let data = json.data(using: .utf8) else { return json }
            return (try JSONSerialization.jsonObject(with: data)) as Any
        } catch {
            return String(describing: payload)
        }
    }

    private func payloadDict(_ payload: Any) -> [String: Any] {
        if payload is NSNull {
            return [:]
        }
        if let dict = payload as? [String: Any] {
            return dict
        }
        return ["value": payload]
    }
}
