import QtQuick
import QtQuick.Window
import QtQuick.Controls
import Qt.labs.settings

import "components"
import "dock"
import "menu"
import "effects"

/**
 * Main.qml - QØЯ Application Root
 * 
 * The entry point for the QØЯ desktop environment.
 * Manages application state machine and hosts all views.
 * 
 * States:
 *   - splash: 3-stage intro animation
 *   - login: QorID authentication
 *   - desktop: Main workspace
 *   - locked: Screen lock (session active but secured)
 */
Window {
    id: window
    
    visible: true
    visibility: Window.FullScreen
    title: "QØЯ - Demiurge Desktop"
    color: Theme.voidBlack
    minimumWidth: 1280
    minimumHeight: 720
    
    Item {
        id: root
        anchors.fill: parent
        
        // ========================================================================
        // APPLICATION STATE
        // ========================================================================
        
        /** Current application state */
        property string appState: "splash"
        
        /** Whether edit mode is active (UI customization unlocked) */
        property bool editMode: false
        
        /** Connected QorID (empty if not logged in) */
        property string abyssId: ""
        
        /** Premium tier of the user (0=free, 1=archon, 2=genesis) */
        property int premiumTier: 0
        
        // ========================================================================
        // SETTINGS PERSISTENCE
        // ========================================================================
        
        Settings {
            id: appSettings
            category: "app"
            
            property bool skipSplash: false
            property bool rememberLogin: true
            property string lastAbyssId: ""
        }
        
        // ========================================================================
        // STATE MACHINE
        // ========================================================================
        
        states: [
        State {
            name: "splash"
            PropertyChanges { target: splashLoader; active: true }
            PropertyChanges { target: loginLoader; active: false }
            PropertyChanges { target: desktopLoader; active: false }
        },
        State {
            name: "login"
            PropertyChanges { target: splashLoader; active: false }
            PropertyChanges { target: loginLoader; active: true }
            PropertyChanges { target: desktopLoader; active: false }
        },
        State {
            name: "desktop"
            PropertyChanges { target: splashLoader; active: false }
            PropertyChanges { target: loginLoader; active: false }
            PropertyChanges { target: desktopLoader; active: true }
        },
        State {
            name: "locked"
            PropertyChanges { target: lockOverlay; visible: true }
        }
    ]
    
    state: appState
    
    // ========================================================================
    // TRANSITIONS
    // ========================================================================
    
    transitions: [
        Transition {
            from: "splash"; to: "login"
            SequentialAnimation {
                NumberAnimation { target: splashLoader; property: "opacity"; to: 0; duration: Theme.animSlow }
                PropertyAction { target: splashLoader; property: "active"; value: false }
                PropertyAction { target: loginLoader; property: "active"; value: true }
                NumberAnimation { target: loginLoader; property: "opacity"; from: 0; to: 1; duration: Theme.animSlow }
            }
        },
        Transition {
            from: "login"; to: "desktop"
            SequentialAnimation {
                NumberAnimation { target: loginLoader; property: "opacity"; to: 0; duration: Theme.animNormal }
                PropertyAction { target: loginLoader; property: "active"; value: false }
                PropertyAction { target: desktopLoader; property: "active"; value: true }
                NumberAnimation { target: desktopLoader; property: "opacity"; from: 0; to: 1; duration: Theme.animSlow }
            }
        }
    ]
    
    // ========================================================================
    // VOID BACKGROUND (The Abyss)
    // ========================================================================
    
    VoidBackground {
        id: voidBg
        anchors.fill: parent
        z: -1
    }
    
    // ========================================================================
    // SPLASH SCREEN
    // ========================================================================
    
    Loader {
        id: splashLoader
        anchors.fill: parent
        active: true
        sourceComponent: SplashScreen {
            onComplete: {
                console.log("Splash complete! Transitioning to login...")
                if (appSettings.skipSplash && appSettings.rememberLogin && appSettings.lastAbyssId !== "") {
                    // Auto-login with remembered credentials
                    root.abyssId = appSettings.lastAbyssId
                    root.appState = "desktop"
                } else {
                    console.log("Setting appState to 'login'")
                    root.appState = "login"
                }
            }
        }
    }
    
    // ========================================================================
    // LOGIN VIEW
    // ========================================================================
    
    Loader {
        id: loginLoader
        anchors.fill: parent
        active: false
        
        onActiveChanged: {
            console.log("LoginLoader active changed:", active)
        }
        
        onStatusChanged: {
            console.log("LoginLoader status:", status, "- Error:", (status === Loader.Error ? "YES" : "NO"))
        }
        
        sourceComponent: LoginView {
            Component.onCompleted: {
                console.log("LoginView loaded successfully!")
            }
            
            onLoginSuccess: function(id, tier) {
                root.abyssId = id
                root.premiumTier = tier
                if (appSettings.rememberLogin) {
                    appSettings.lastAbyssId = id
                }
                root.appState = "desktop"
            }
        }
    }
    
    // ========================================================================
    // DESKTOP VIEW
    // ========================================================================
    
    Loader {
        id: desktopLoader
        anchors.fill: parent
        active: false
        sourceComponent: DesktopView {
            editMode: root.editMode
            abyssId: root.abyssId
            premiumTier: root.premiumTier
            
            onLogout: {
                root.abyssId = ""
                root.premiumTier = 0
                root.appState = "login"
            }
            
            onLock: {
                root.appState = "locked"
            }
        }
    }
    
    // ========================================================================
    // LOCK OVERLAY
    // ========================================================================
    
    Rectangle {
        id: lockOverlay
        anchors.fill: parent
        color: Qt.rgba(Theme.voidBlack.r, Theme.voidBlack.g, Theme.voidBlack.b, 0.95)
        visible: false
        z: 1000
        
        GlassPanel {
            anchors.centerIn: parent
            width: 400
            height: 300
            depthLevel: 3
            
            Column {
                anchors.centerIn: parent
                spacing: Theme.spacingLarge
                
                GlowText {
                    text: "QØЯ LOCKED"
                    fontFamily: Theme.fontHeader
                    fontSize: Theme.fontSizeH2
                    glowing: true
                    anchors.horizontalCenter: parent.horizontalCenter
                }
                
                Text {
                    text: "Click to unlock"
                    font.family: Theme.fontBody
                    font.pixelSize: Theme.fontSizeBody
                    color: Theme.textSecondary
                    anchors.horizontalCenter: parent.horizontalCenter
                }
            }
        }
        
        MouseArea {
            anchors.fill: parent
            onClicked: {
                lockOverlay.visible = false
                root.appState = "desktop"
            }
        }
    }
    
    // ========================================================================
    // KEYBOARD SHORTCUTS
    // ========================================================================
    
    Shortcut {
        sequence: "Ctrl+L"
        onActivated: if (root.appState === "desktop") root.appState = "locked"
    }
    
    Shortcut {
        sequence: "Escape"
        onActivated: {
            if (window.visibility === Window.FullScreen) {
                window.visibility = Window.Windowed
            } else {
                window.visibility = Window.FullScreen
            }
        }
    }
    
    Shortcut {
        sequence: "Ctrl+E"
        onActivated: root.editMode = !root.editMode
    }
    
    // ========================================================================
    // STARTUP
    // ========================================================================
    
    Component.onCompleted: {
        console.log("QØЯ Desktop Environment starting...")
        console.log("Screen:", Screen.width, "x", Screen.height)
        
        // Skip splash in debug mode
        if (Qt.application.arguments.indexOf("--skip-splash") !== -1) {
            appSettings.skipSplash = true
        }
    }
    
    } // Item root
}
