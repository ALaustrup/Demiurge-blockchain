import QtQuick
import QtQuick.Layouts
import Qt.labs.settings

import "components"
import "dock"
import "menu"
import "window"

/**
 * DesktopView - The Main Workspace
 * 
 * The primary workspace containing the Q-Dock, desktop icons,
 * and the MDI window container for running applications.
 */
Item {
    id: desktopView
    
    // ========================================================================
    // PUBLIC PROPERTIES
    // ========================================================================
    
    /** Whether edit mode is active */
    property bool editMode: false
    
    /** Connected QorID */
    property string abyssId: ""
    
    /** Premium tier */
    property int premiumTier: 0
    
    // ========================================================================
    // SIGNALS
    // ========================================================================
    
    signal logout()
    signal lock()
    
    // ========================================================================
    // DOCK SETTINGS
    // ========================================================================
    
    Settings {
        id: dockSettings
        category: "dock"
        
        property int position: QDock.Position.Top
        property real qorButtonOffset: 0.5
    }
    
    // ========================================================================
    // WINDOW MANAGER STATE
    // ========================================================================
    
    /** List of open windows */
    property var openWindows: []
    
    /** Currently focused window ID */
    property string focusedWindowId: ""
    
    /** Next window z-index */
    property int nextZIndex: 100
    
    // ========================================================================
    // WORKSPACE AREA
    // ========================================================================
    
    Item {
        id: workspace
        anchors.fill: parent
        
        // Adjust for dock position
        anchors.topMargin: qDock.position === QDock.Position.Top ? qDock.dockSize : 0
        anchors.bottomMargin: qDock.position === QDock.Position.Bottom ? qDock.dockSize : 0
        anchors.leftMargin: qDock.position === QDock.Position.Left ? qDock.dockSize : 0
        anchors.rightMargin: qDock.position === QDock.Position.Right ? qDock.dockSize : 0
        
        // ================================================================
        // DESKTOP ICONS GRID
        // ================================================================
        
        GridLayout {
            id: desktopGrid
            anchors.fill: parent
            anchors.margins: Theme.spacingLarge
            columns: Math.floor(width / 100)
            rowSpacing: Theme.spacingMedium
            columnSpacing: Theme.spacingMedium
            
            // Desktop shortcuts - temporarily disabled
            // TODO: Re-implement DesktopIcon component
            /*
            Repeater {
                model: [
                    { name: "Wallet", icon: "💰", app: "wallet" },
                    { name: "Mining", icon: "⛏️", app: "mining" },
                    { name: "Explorer", icon: "🌐", app: "explorer" },
                    { name: "NEON", icon: "🎵", app: "neon" },
                    { name: "WRYT", icon: "📝", app: "wryt" },
                    { name: "Files", icon: "📁", app: "files" },
                    { name: "Settings", icon: "⚙️", app: "settings" }
                ]
                
                DesktopIcon {
                    name: modelData.name
                    icon: modelData.icon
                    appId: modelData.app
                    editMode: desktopView.editMode
                    
                    onLaunch: desktopView.launchApp(appId)
                }
            }
            */
        }
        
        // ================================================================
        // WINDOW CONTAINER (MDI)
        // ================================================================
        
        Item {
            id: windowContainer
            anchors.fill: parent
            z: 10
            
            // Windows will be dynamically created here
        }
        
        // ================================================================
        // EDIT MODE GRID OVERLAY
        // ================================================================
        
        Canvas {
            id: gridOverlay
            anchors.fill: parent
            visible: editMode
            opacity: 0.1
            
            onPaint: {
                var ctx = getContext("2d")
                ctx.clearRect(0, 0, width, height)
                ctx.strokeStyle = Theme.cipherCyan
                ctx.lineWidth = 1
                
                var gridSize = 50
                
                for (var x = 0; x < width; x += gridSize) {
                    ctx.beginPath()
                    ctx.moveTo(x, 0)
                    ctx.lineTo(x, height)
                    ctx.stroke()
                }
                
                for (var y = 0; y < height; y += gridSize) {
                    ctx.beginPath()
                    ctx.moveTo(0, y)
                    ctx.lineTo(width, y)
                    ctx.stroke()
                }
            }
        }
    }
    
    // ========================================================================
    // Q-DOCK
    // ========================================================================
    
    QDock {
        id: qDock
        position: dockSettings.position
        qorButtonOffset: dockSettings.qorButtonOffset
        editMode: desktopView.editMode
        
        onPositionChanged: dockSettings.position = position
        onQorButtonOffsetChanged: dockSettings.qorButtonOffset = qorButtonOffset
        
        onQorButtonClicked: qMenu.toggle()
        
        // Running apps from openWindows
        runningApps: desktopView.openWindows.map(w => w.appId)
    }
    
    // ========================================================================
    // Q-MENU
    // ========================================================================
    
    QMenu {
        id: qMenu
        dockPosition: qDock.position
        dockRect: qDock.qorButtonRect
        abyssId: desktopView.abyssId
        premiumTier: desktopView.premiumTier
        
        onAppLaunched: desktopView.launchApp(appId)
        onLogoutRequested: desktopView.logout()
        onLockRequested: desktopView.lock()
    }
    
    // ========================================================================
    // EDIT MODE INDICATOR
    // ========================================================================
    
    Rectangle {
        visible: editMode
        anchors.top: parent.top
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.topMargin: qDock.position === QDock.Position.Top ? qDock.dockSize + Theme.spacingSmall : Theme.spacingSmall
        
        width: editModeText.implicitWidth + Theme.spacingLarge
        height: 32
        radius: Theme.radiusSmall
        color: Theme.accentFlame
        
        Text {
            id: editModeText
            anchors.centerIn: parent
            text: "EDIT MODE • Press Ctrl+E to lock"
            font.family: Theme.fontBody
            font.pixelSize: Theme.fontSizeSmall
            font.weight: Font.Medium
            color: Theme.voidBlack
        }
    }
    
    // ========================================================================
    // WINDOW MANAGEMENT FUNCTIONS
    // ========================================================================
    
    /**
     * Launch an application
     */
    function launchApp(appId) {
        console.log("Launching app:", appId)
        
        // Check if already open
        for (var i = 0; i < openWindows.length; i++) {
            if (openWindows[i].appId === appId) {
                focusWindow(openWindows[i].windowId)
                return
            }
        }
        
        // Create new window
        var windowId = "window_" + Date.now()
        var windowComponent = Qt.createComponent("window/QWindow.qml")
        
        if (windowComponent.status === Component.Ready) {
            var window = windowComponent.createObject(windowContainer, {
                windowId: windowId,
                appId: appId,
                title: getAppTitle(appId),
                x: 100 + openWindows.length * 30,
                y: 100 + openWindows.length * 30,
                z: nextZIndex++
            })
            
            window.focused.connect(function() { focusWindow(windowId) })
            window.closed.connect(function() { closeWindow(windowId) })
            window.minimized.connect(function() { minimizeWindow(windowId) })
            
            openWindows.push({ windowId: windowId, appId: appId, window: window })
            openWindows = openWindows // Trigger binding update
            focusedWindowId = windowId
        }
    }
    
    /**
     * Focus a window
     */
    function focusWindow(windowId) {
        for (var i = 0; i < openWindows.length; i++) {
            if (openWindows[i].windowId === windowId) {
                openWindows[i].window.z = nextZIndex++
                focusedWindowId = windowId
                break
            }
        }
    }
    
    /**
     * Close a window
     */
    function closeWindow(windowId) {
        for (var i = 0; i < openWindows.length; i++) {
            if (openWindows[i].windowId === windowId) {
                openWindows[i].window.destroy()
                openWindows.splice(i, 1)
                openWindows = openWindows // Trigger binding update
                break
            }
        }
    }
    
    /**
     * Minimize a window
     */
    function minimizeWindow(windowId) {
        for (var i = 0; i < openWindows.length; i++) {
            if (openWindows[i].windowId === windowId) {
                openWindows[i].window.visible = false
                break
            }
        }
    }
    
    /**
     * Get app display title
     */
    function getAppTitle(appId) {
        switch (appId) {
            case "wallet": return "QOR Wallet"
            case "mining": return "Mining Dashboard"
            case "explorer": return "QOR Explorer"
            case "neon": return "NEON Player"
            case "wryt": return "WRYT Editor"
            case "files": return "Files"
            case "settings": return "Settings"
            default: return appId
        }
    }
}

// Desktop Icon Component removed - moved to separate file if needed
