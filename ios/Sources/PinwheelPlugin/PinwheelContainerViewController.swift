import UIKit

final class PinwheelContainerViewController: UIViewController {
    private let child: UIViewController
    private let useDarkMode: Bool

    init(child: UIViewController, useDarkMode: Bool) {
        self.child = child
        self.useDarkMode = useDarkMode
        super.init(nibName: nil, bundle: nil)
        // Ensure the system resolves appearance consistently before the transition starts.
        self.overrideUserInterfaceStyle = useDarkMode ? .dark : .light
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func loadView() {
        // Set an explicit background early to avoid a white flash during presentation.
        let v = UIView()
        v.backgroundColor = useDarkMode ? UIColor.black : UIColor.white
        self.view = v
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        addChild(child)
        child.view.translatesAutoresizingMaskIntoConstraints = false
        // If the Pinwheel VC briefly renders a blank/white background while loading,
        // the container background will show through instead of flashing white.
        child.view.backgroundColor = .clear
        child.view.isOpaque = false
        view.addSubview(child.view)
        NSLayoutConstraint.activate([
            child.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            child.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            child.view.topAnchor.constraint(equalTo: view.topAnchor),
            child.view.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])
        child.didMove(toParent: self)
    }
}

