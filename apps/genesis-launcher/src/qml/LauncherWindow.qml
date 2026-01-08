/**
 * LauncherWindow.qml - Genesis Launcher Main Window
 * 
 * Style: "Obsidian Monolith" - Frameless, dark glass, floating construct
 * 
 * Features:
 * - Cinematic intro video sequence on first launch
 * - Minimize to system tray on close
 * - State machine for login/signup/dashboard
 */
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Effects

import "components"
import "views"

ApplicationWindow {
    id: root
    
    // Frameless, floating monolith
    flags: Qt.FramelessWindowHint | Qt.WindowStaysOnTopHint
    color: "transparent"
    
    width: 800
    height: 600
    visible: !startMinimized  // From C++ context
    title: "Genesis Launcher"
    
    // State machine
    property string appState: skipIntro ? "main" : "intro"  // intro, main
    property bool introComplete: skipIntro || false
    property bool hasPlayedIntro: false
    
    // Center on screen
    Component.onCompleted: {
        x = (Screen.width - width) / 2
        y = (Screen.height - height) / 2
        
        // Check if intro should be skipped
        checkIntroState()
    }
    
    function checkIntroState() {
        // Check if intro has been played before in this session
        if (skipIntro || hasPlayedIntro) {
            appState = "main"
            introComplete = true
        }
    }
    
    // Theme colors
    readonly property color voidColor: "#050505"
    readonly property color glassColor: "#0A0A0A"
    readonly property color textPrimary: "#E0E0E0"
    readonly property color textSecondary: "#7A7A7A"
    readonly property color flameOrange: "#FF3D00"
    readonly property color flameGold: "#FF9100"
    readonly property color cipherCyan: "#00FFC8"
    
    // Main container with drop shadow
    Rectangle {
        id: container
        anchors.fill: parent
        anchors.margins: 20
        
        color: voidColor
        radius: 16
        
        // Obsidian glass effect
        layer.enabled: true
        layer.effect: MultiEffect {
            shadowEnabled: true
            shadowColor: "#000000"
            shadowBlur: 1.0
            shadowHorizontalOffset: 0
            shadowVerticalOffset: 8
        }
        
        // Subtle noise texture overlay
        Image {
            anchors.fill: parent
            source: "qrc:/textures/noise.png"
            opacity: 0.03
            fillMode: Image.Tile
            visible: appState === "main"
        }
        
        // Border glow
        Rectangle {
            anchors.fill: parent
            radius: parent.radius
            color: "transparent"
            border.color: Qt.rgba(1, 1, 1, 0.05)
            border.width: 1
            visible: appState === "main"
        }
        
        // ==================== INTRO SEQUENCE ====================
        IntroSequence {
            id: introSequence
            anchors.fill: parent
            visible: appState === "intro"
            
            onSequenceComplete: {
                hasPlayedIntro = true
                introComplete = true
                appState = "main"
            }
            
            onSkipRequested: {
                hasPlayedIntro = true
            }
        }
        
        // ==================== MAIN CONTENT ====================
        Item {
            id: mainContent
            anchors.fill: parent
            visible: appState === "main"
            opacity: appState === "main" ? 1.0 : 0.0
            
            Behavior on opacity {
                NumberAnimation { duration: 500; easing.type: Easing.OutQuad }
            }
            
            // Draggable title bar area
            MouseArea {
                id: dragArea
                anchors.top: parent.top
                anchors.left: parent.left
                anchors.right: parent.right
                height: 50
                
                property point clickPos
                
                onPressed: (mouse) => {
                    clickPos = Qt.point(mouse.x, mouse.y)
                }
                
                onPositionChanged: (mouse) => {
                    if (pressed) {
                        var delta = Qt.point(mouse.x - clickPos.x, mouse.y - clickPos.y)
                        root.x += delta.x
                        root.y += delta.y
                    }
                }
            }
            
            // Close button - minimizes to tray
            CloseButton {
                anchors.right: parent.right
                anchors.top: parent.top
                anchors.margins: 16
                onClicked: {
                    if (TrayManager.minimizeToTray && TrayManager.isSystemTrayAvailable()) {
                        root.hide()
                        TrayManager.hideToTray()
                    } else {
                        Qt.quit()
                    }
                }
            }
            
            // Minimize button
            MinimizeButton {
                anchors.right: parent.right
                anchors.top: parent.top
                anchors.rightMargin: 50
                anchors.topMargin: 16
                onClicked: root.showMinimized()
            }
            
            // Content area
            StackView {
                id: contentStack
                anchors.fill: parent
                anchors.margins: 20
                
                initialItem: AuthManager.isAuthenticated ? dashboardView : loginView
            }
            
            // View components
            Component {
                id: loginView
                LoginView {
                    onLoginSuccess: {
                        contentStack.replace(dashboardView)
                    }
                    onCreateAccount: {
                        contentStack.push(signUpView)
                    }
                }
            }
            
            Component {
                id: signUpView
                SignUpView {
                    onSignUpSuccess: {
                        contentStack.replace(dashboardView)
                    }
                    onBackToLogin: {
                        contentStack.pop()
                    }
                }
            }
            
            Component {
                id: dashboardView
                DashboardView {
                    onLogout: {
                        contentStack.replace(loginView)
                    }
                }
            }
            
            // Update overlay
            UpdateOverlay {
                id: updateOverlay
                anchors.fill: parent
                visible: UpdateEngine.isDownloading
            }
            
            // Version label
            Text {
                anchors.bottom: parent.bottom
                anchors.right: parent.right
                anchors.margins: 12
                
                text: "Genesis v" + LauncherCore.version
                color: textSecondary
                font.family: "JetBrains Mono"
                font.pixelSize: 10
            }
        }
    }
    
    // Breathing glow animation on the border (only in main state)
    SequentialAnimation on opacity {
        loops: Animation.Infinite
        running: appState === "main"
        
        NumberAnimation {
            from: 1.0
            to: 0.97
            duration: 2000
            easing.type: Easing.InOutSine
        }
        NumberAnimation {
            from: 0.97
            to: 1.0
            duration: 2000
            easing.type: Easing.InOutSine
        }
    }
    
    // Keyboard shortcuts
    Shortcut {
        sequence: "Escape"
        onActivated: {
            if (appState === "intro" && introSequence.canSkip) {
                introSequence.sequenceComplete()
            }
        }
    }
    
    // Listen for tray manager signals
    Connections {
        target: TrayManager
        
        function onShowWindowRequested() {
            root.show()
            root.raise()
            root.requestActivate()
        }
    }
    
    // Handle window visibility changes
    onVisibleChanged: {
        if (visible && !introComplete && !hasPlayedIntro) {
            // Window is showing for first time, play intro
            appState = "intro"
        }
    }
}
