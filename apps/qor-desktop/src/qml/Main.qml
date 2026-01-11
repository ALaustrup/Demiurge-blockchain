// main.qml - QOR Desktop Root Window
import QtQuick
import QtQuick.Window
import QtQuick.Controls
import QtQuick.Effects
import QtMultimedia

ApplicationWindow {
    id: rootWindow
    
    // ============================================
    // WINDOW CONFIGURATION
    // ============================================
    
    // Auto-adjust to screen size
    width: Screen.width
    height: Screen.height
    visible: true
    visibility: Window.FullScreen  // Start in fullscreen mode
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
    // BACKGROUND LAYER - VIDEO WALLPAPER
    // ============================================
    
    Rectangle {
        id: backgroundContainer
        anchors.fill: parent
        color: "#000000"  // Fallback black background
        
        // Video Background
        Video {
            id: videoBackground
            anchors.fill: parent
            source: "qrc:/assets/wallpapers/default.mp4"
            fillMode: VideoOutput.PreserveAspectCrop
            autoPlay: true
            loops: MediaPlayer.Infinite
            muted: true  // Silent background video
            
            // Smooth playback
            property bool isReady: playbackState === MediaPlayer.PlayingState
            
            onErrorOccurred: function(error, errorString) {
                console.error("❌ Video background error:", errorString)
                console.error("   Error code:", error)
                console.error("   Source:", source)
                // Fall back to gradient
                fallbackGradient.visible = true
            }
            
            Component.onCompleted: {
                console.log("🎬 Loading video background:", source)
                console.log("   Autoplay:", autoPlay)
                console.log("   Loops:", loops)
                console.log("   Muted:", muted)
                play()
            }
            
            onPlaybackStateChanged: {
                console.log("📺 Video playback state:", 
                    playbackState === MediaPlayer.PlayingState ? "Playing" :
                    playbackState === MediaPlayer.PausedState ? "Paused" :
                    playbackState === MediaPlayer.StoppedState ? "Stopped" : "Unknown")
            }
        }
        
        // Fallback gradient if video fails to load
        Rectangle {
            id: fallbackGradient
            anchors.fill: parent
            visible: videoBackground.playbackState !== MediaPlayer.PlayingState
            
            gradient: Gradient {
                GradientStop { position: 0.0; color: "#1A1A2E" }  // Slightly blue-tinted dark
                GradientStop { position: 0.5; color: "#16213E" }  // Deep blue-grey
                GradientStop { position: 1.0; color: "#0F1419" }  // Very dark blue-black
            }
            
            // Subtle animated scanlines for visual interest
            Rectangle {
                anchors.fill: parent
                opacity: 0.03
                
                gradient: Gradient {
                    orientation: Gradient.Horizontal
                    GradientStop { position: 0.0; color: "#00FFFF" }
                    GradientStop { position: 0.5; color: "#FF00FF" }
                    GradientStop { position: 1.0; color: "#00FFFF" }
                }
                
                SequentialAnimation on opacity {
                    running: true
                    loops: Animation.Infinite
                    NumberAnimation { to: 0.08; duration: 3000; easing.type: Easing.InOutSine }
                    NumberAnimation { to: 0.03; duration: 3000; easing.type: Easing.InOutSine }
                }
            }
        }
        
        // Subtle vignette overlay (helps text readability)
        Rectangle {
            anchors.fill: parent
            opacity: 0.6
            
            gradient: Gradient {
                orientation: Gradient.Horizontal
                GradientStop { position: 0.0; color: Qt.rgba(0, 0, 0, 0.4) }
                GradientStop { position: 0.5; color: Qt.rgba(0, 0, 0, 0) }
                GradientStop { position: 1.0; color: Qt.rgba(0, 0, 0, 0.4) }
            }
        }
        
        // Bottom darkening for dock visibility
        Rectangle {
            anchors {
                left: parent.left
                right: parent.right
                bottom: parent.bottom
            }
            height: 150
            opacity: 0.5
            
            gradient: Gradient {
                GradientStop { position: 0.0; color: "transparent" }
                GradientStop { position: 1.0; color: "#000000" }
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
            
            // Force visible z-index
            z: Theme.zIndexStatusBar + 1
            
            anchors {
                horizontalCenter: parent.horizontalCenter
                bottom: parent.bottom
                bottomMargin: 20  // Fixed margin to ensure visibility
            }
            
            Component.onCompleted: {
                console.log("🎯 Dock anchored at bottom-center")
                console.log("   Dock Y position:", y)
                console.log("   Dock height:", height)
                console.log("   Parent height:", parent.height)
            }
        }
    }
    
    // ============================================
    // STARTUP ANIMATION
    // ============================================
    
    Component.onCompleted: {
        console.log("========================================")
        console.log("🌌 QOR DESKTOP ENVIRONMENT")
        console.log("========================================")
        console.log("📺 Screen:", Screen.width, "x", Screen.height)
        console.log("📐 DPI:", Screen.devicePixelRatio)
        console.log("✨ Glass Engine v1.0.0 - Phase 5")
        console.log("🎨 Theme: Ancient Code Meets Ethereal Glass")
        console.log("💫 Features: Liquid Workspace + Infinity Dock + Draggable Widgets")
        console.log("📊 System Integration: Live metrics + Audio reactive colors")
        console.log("========================================")
        console.log("⌨️  Keyboard Shortcuts:")
        console.log("   Ctrl+T - Terminal")
        console.log("   Ctrl+W - Wallet")
        console.log("   Ctrl+S - Settings")
        console.log("   Ctrl+E - Explorer")
        console.log("   Ctrl+Shift+S - System Monitor")
        console.log("   Ctrl+Q - Quit")
        console.log("========================================")
        
        // Connect audio colors to theme
        if (typeof AudioColors !== 'undefined') {
            AudioColors.basePrimary = Theme.neonCyan
            AudioColors.baseSecondary = Theme.electricPurple
            AudioColors.baseTertiary = Theme.deepGold
            console.log("🎵 Audio reactive colors initialized")
        }
    }
}
