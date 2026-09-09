import Cocoa
import WebKit

final class AppDelegate: NSObject, NSApplicationDelegate {
    private var window: NSWindow!
    private enum WindowMode: String { case front, normal, background }
    private var mode: WindowMode = .front

    func applicationDidFinishLaunching(_ notification: Notification) {
        let contentRect = NSRect(x: 0, y: 0, width: 920, height: 640)
        window = NSWindow(
            contentRect: contentRect,
            styleMask: [.titled, .closable, .miniaturizable, .resizable],
            backing: .buffered,
            defer: false
        )
        window.title = "Mon Kanban"
        window.titlebarAppearsTransparent = true
        window.titleVisibility = .visible
        window.isMovableByWindowBackground = true
        window.isOpaque = true
        window.backgroundColor = NSColor(calibratedRed: 0.82, green: 0.82, blue: 0.78, alpha: 1)
        window.minSize = NSSize(width: 540, height: 420)
        window.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        window.center()
        installMenu()
        mode = WindowMode(rawValue: UserDefaults.standard.string(forKey: "windowMode") ?? "front") ?? .front
        applyMode(mode)

        let settings = WKWebpagePreferences()
        settings.allowsContentJavaScript = true
        let configuration = WKWebViewConfiguration()
        configuration.defaultWebpagePreferences = settings
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.setValue(false, forKey: "drawsBackground")
        webView.autoresizingMask = [.width, .height]
        window.contentView = webView

        guard let page = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "kanban-bureau") else {
            showError("Les fichiers du tableau sont introuvables.")
            return
        }
        webView.loadFileURL(page, allowingReadAccessTo: page.deletingLastPathComponent())
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    private func showError(_ message: String) {
        let alert = NSAlert()
        alert.messageText = "Mon Kanban ne peut pas s’ouvrir"
        alert.informativeText = message
        alert.runModal()
    }

    private func installMenu() {
        let mainMenu = NSMenu()
        let appItem = NSMenuItem()
        let appMenu = NSMenu()
        appMenu.addItem(withTitle: "Quitter Mon Kanban", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appItem.submenu = appMenu
        mainMenu.addItem(appItem)

        let displayItem = NSMenuItem(title: "Affichage", action: nil, keyEquivalent: "")
        let displayMenu = NSMenu(title: "Affichage")
        displayMenu.addItem(withTitle: "Toujours au premier plan", action: #selector(setFront), keyEquivalent: "1")
        displayMenu.addItem(withTitle: "Fenêtre normale", action: #selector(setNormal), keyEquivalent: "2")
        displayMenu.addItem(withTitle: "En arrière-plan du bureau", action: #selector(setBackground), keyEquivalent: "3")
        displayItem.submenu = displayMenu
        mainMenu.addItem(displayItem)
        NSApp.mainMenu = mainMenu
    }

    @objc private func setFront() { applyMode(.front) }
    @objc private func setNormal() { applyMode(.normal) }
    @objc private func setBackground() { applyMode(.background) }

    private func applyMode(_ newMode: WindowMode) {
        mode = newMode
        // In desktop mode the window stays behind other apps, but it must still
        // receive clicks on the visible desktop so columns and tasks remain movable.
        window.ignoresMouseEvents = false
        switch newMode {
        case .front: window.level = .floating
        case .normal: window.level = .normal
        // The desktop window level is underneath Finder, which prevents all
        // interaction. The desktop-icon level stays below normal apps while
        // remaining clickable on the visible desktop.
        case .background: window.level = NSWindow.Level(rawValue: Int(CGWindowLevelForKey(.desktopIconWindow)))
        }
        UserDefaults.standard.set(newMode.rawValue, forKey: "windowMode")
        guard let displayMenu = NSApp.mainMenu?.items.last?.submenu else { return }
        for item in displayMenu.items {
            item.state = .off
        }
        let index = newMode == .front ? 0 : newMode == .normal ? 1 : 2
        displayMenu.items[index].state = .on
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
