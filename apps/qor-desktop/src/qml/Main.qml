// main.qml - QOR Desktop Root Window
import QtQuick
import QtQuick.Window
import QtQuick.Controls

ApplicationWindow {
    id: rootWindow
    
    // ============================================
    // WINDOW CONFIGURATION
    // ============================================
    
    width: 1920
    height: 1080
    visible: true
    title: "QOR - Ancient Code Meets Ethereal Glass"
    
    // Frameless for custom styling
    flags: Qt.Window | Qt.FramelessWindowHint
    
    // Transparent background for glass effects
    color: "transparent"
    
    // ============================================
    // GLOBAL SHORTCUTS
    // ============================================
    
    Shortcut {
        sequence: "Ctrl+Q"
        onActivated: Qt.quit()
    }
    
    Shortcut {
        sequence: "Ctrl+M"
        onActivated: console.log("Monad Settings (to be implemented)")
    }
    
    Shortcut {
        sequence: "Escape"
        onActivated: console.log("Escape pressed")
    }
    
    // Widget shortcuts
    Shortcut {
        sequence: "Ctrl+T"
        onActivated: {
            console.log("Open Terminal (Ctrl+T)")
            workspace.createWidget("terminal")
        }
    }
    
    Shortcut {
        sequence: "Ctrl+W"
        onActivated: {
            console.log("Open Wallet (Ctrl+W)")
            workspace.createWidget("wallet")
        }
    }
    
    Shortcut {
        sequence: "Ctrl+S"
        onActivated: {
            console.log("Open Settings (Ctrl+S)")
            workspace.createWidget("settings")
        }
    }
    
    Shortcut {
        sequence: "Ctrl+E"
        onActivated: {
            console.log("Open Explorer (Ctrl+E)")
            workspace.createWidget("explorer")
        }
    }
    
    Shortcut {
        sequence: "Ctrl+Shift+S"
        onActivated: {
            console.log("Open System Monitor (Ctrl+Shift+S)")
            workspace.createWidget("system")
        }
    }
    
    // ============================================
    // BACKGROUND LAYER
    // ============================================
    
    Image {
        id: backgroundWallpaper
        anchors.fill: parent
        source: "qrc:/assets/wallpapers/default.jpg"
        fillMode: Image.PreserveAspectCrop
        
        // Fallback gradient if no wallpaper
        Rectangle {
            anchors.fill: parent
            visible: backgroundWallpaper.status !== Image.Ready
            
            gradient: Gradient {
                GradientStop { position: 0.0; color: "#0A0A0A" }
                GradientStop { position: 0.5; color: "#050505" }
                GradientStop { position: 1.0; color: "#000000" }
            }
        }
        
        // Subtle vignette overlay
        Rectangle {
            anchors.fill: parent
            
            gradient: Gradient {
                orientation: Gradient.Horizontal
                GradientStop { position: 0.0; color: Qt.rgba(0, 0, 0, 0.3) }
                GradientStop { position: 0.5; color: Qt.rgba(0, 0, 0, 0) }
                GradientStop { position: 1.0; color: Qt.rgba(0, 0, 0, 0.3) }
            }
        }
    }
    
    // ============================================
    // MAIN CONTENT CONTAINER
    // ============================================
    
    Item {
        id: mainContainer
        anchors.fill: parent
        
        // ============================================
        // TOP STATUS BAR
        // ============================================
        
        Rectangle {
            id: statusBar
            width: parent.width
            height: 40
            z: Theme.zIndexStatusBar
            
            // Glass background
            GlassPane {
                anchors.fill: parent
                blurRadius: Theme.blurRadiusSubtle
                tintColor: Theme.glassTintDark
                borderGlow: Theme.glowIntensityLow
                glowColor: Theme.primaryAccent
            }
            
            // Status bar content
            Row {
                anchors {
                    left: parent.left
                    leftMargin: Theme.spacingLarge
                    verticalCenter: parent.verticalCenter
                }
                spacing: Theme.spacingLarge
                
                // QOR Logo/Title
                Text {
                    text: "QOR"
                    font.family: Theme.fontFamilyDisplay
                    font.pixelSize: Theme.fontSizeLarge
                    font.weight: Font.Bold
                    color: Theme.primaryAccent
                    
                    // Subtle glow
                    layer.enabled: true
                    layer.effect: MultiEffect {
                        blurEnabled: true
                        blur: 0.5
                        blurMax: 12
                    }
                }
                
                // Separator
                Rectangle {
                    width: 1
                    height: 20
                    color: Theme.textMuted
                    opacity: 0.3
                }
                
                // Placeholder for system info
                Text {
                    text: "CPU: " + SystemMonitor.cpuUsage.toFixed(1) + "% | " +
                          "RAM: " + SystemMonitor.memoryUsage.toFixed(1) + "%"
                    font.family: Theme.fontFamily
                    font.pixelSize: Theme.fontSizeSmall
                    color: Theme.textSecondary
                }
            }
            
            // Right side info
            Row {
                anchors {
                    right: parent.right
                    rightMargin: Theme.spacingLarge
                    verticalCenter: parent.verticalCenter
                }
                spacing: Theme.spacingMedium
                
                // Time
                Text {
                    id: timeDisplay
                    font.family: Theme.fontFamily
                    font.pixelSize: Theme.fontSizeNormal
                    color: Theme.primaryAccent
                    
                    Component.onCompleted: updateTime()
                    
                    Timer {
                        interval: 1000
                        running: true
                        repeat: true
                        onTriggered: timeDisplay.updateTime()
                    }
                    
                    function updateTime() {
                        var now = new Date()
                        text = Qt.formatTime(now, "hh:mm")
                    }
                }
                
                // Date
                Text {
                    text: Qt.formatDate(new Date(), "MMM dd")
                    font.family: Theme.fontFamily
                    font.pixelSize: Theme.fontSizeSmall
                    color: Theme.textMuted
                }
            }
        }
        
        // ============================================
        // WORKSPACE (Widget Area)
        // ============================================
        
        LiquidWorkspace {
            id: workspace
            anchors {
                top: statusBar.bottom
                left: parent.left
                right: parent.right
                bottom: infinityDock.top
                margins: Theme.spacingMedium
            }
            
            gridSize: 100
            liquidMotion: true
            showGrid: false
        }
        
        // ============================================
        // INFINITY DOCK (Bottom Navigation)
        // ============================================
        
        InfinityDock {
            id: infinityDock
            
            // Pass workspace reference so dock can create widgets
            property var workspace: workspace
            
            anchors {
                horizontalCenter: parent.horizontalCenter
                bottom: parent.bottom
                bottomMargin: Theme.spacingLarge
            }
        }
    }
    
    // ============================================
    // STARTUP ANIMATION
    // ============================================
    
    Component.onCompleted: {
        console.log("🌌 QOR Desktop Environment Initialized")
        console.log("✨ Glass Engine v1.0.0 - Phase 5")
        console.log("🎨 Theme: Ancient Code Meets Ethereal Glass")
        console.log("💫 Features: Liquid Workspace + Infinity Dock + Draggable Widgets")
        console.log("📊 System Integration: Live metrics + Audio reactive colors")
        console.log("⌨️  Keyboard Shortcuts:")
        console.log("   Ctrl+T - Terminal")
        console.log("   Ctrl+W - Wallet")
        console.log("   Ctrl+S - Settings")
        console.log("   Ctrl+E - Explorer")
        console.log("   Ctrl+Shift+S - System Monitor")
        console.log("   Ctrl+Q - Quit")
        
        // Connect audio colors to theme
        if (typeof AudioColors !== 'undefined') {
            AudioColors.basePrimary = Theme.neonCyan
            AudioColors.baseSecondary = Theme.electricPurple
            AudioColors.baseTertiary = Theme.deepGold
            console.log("🎵 Audio reactive colors initialized")
        }
    }
}
