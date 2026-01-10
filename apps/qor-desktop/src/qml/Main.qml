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
                    text: "Initializing Glass Engine..."
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
        
        Item {
            id: workspace
            anchors {
                top: statusBar.bottom
                left: parent.left
                right: parent.right
                bottom: infinityDock.top
            }
            
            // Demo Glass Panel in center
            GlassPane {
                id: demoPanel
                anchors.centerIn: parent
                width: 600
                height: 400
                radius: Theme.borderRadiusLarge
                
                blurRadius: Theme.blurRadiusDefault
                animated: true
                showGlow: true
                glowColor: Theme.primaryAccent
                
                Column {
                    anchors.centerIn: parent
                    spacing: Theme.spacingLarge
                    
                    // Title
                    Text {
                        anchors.horizontalCenter: parent.horizontalCenter
                        text: "QOR Desktop"
                        font.family: Theme.fontFamilyDisplay
                        font.pixelSize: Theme.fontSizeXL
                        font.weight: Font.Bold
                        color: Theme.textPrimary
                        
                        layer.enabled: true
                        layer.effect: MultiEffect {
                            blurEnabled: true
                            blur: 0.3
                            blurMax: 8
                        }
                    }
                    
                    // Subtitle
                    Text {
                        anchors.horizontalCenter: parent.horizontalCenter
                        text: "Ancient Code Meets Ethereal Glass"
                        font.family: Theme.fontFamily
                        font.pixelSize: Theme.fontSizeMedium
                        color: Theme.textSecondary
                    }
                    
                    // Accent line
                    Rectangle {
                        anchors.horizontalCenter: parent.horizontalCenter
                        width: 200
                        height: 2
                        
                        gradient: Gradient {
                            orientation: Gradient.Horizontal
                            GradientStop { position: 0.0; color: "transparent" }
                            GradientStop { position: 0.5; color: Theme.primaryAccent }
                            GradientStop { position: 1.0; color: "transparent" }
                        }
                        
                        layer.enabled: true
                        layer.effect: MultiEffect {
                            blurEnabled: true
                            blur: 0.8
                            blurMax: 12
                        }
                    }
                    
                    // Status text
                    Text {
                        anchors.horizontalCenter: parent.horizontalCenter
                        text: "Glass Engine v1.0.0 - Phase 1 Foundation"
                        font.family: Theme.fontFamilyMono
                        font.pixelSize: Theme.fontSizeSmall
                        color: Theme.primaryAccent
                        opacity: 0.7
                    }
                }
                
                // Pulsing animation on glass
                PropertyAnimation on pulseIntensity {
                    from: 0.0
                    to: 0.3
                    duration: 2000
                    easing.type: Easing.InOutSine
                    loops: Animation.Infinite
                    running: true
                }
            }
        }
        
        // ============================================
        // INFINITY DOCK (Bottom Navigation)
        // ============================================
        
        Rectangle {
            id: infinityDock
            width: parent.width * 0.6
            height: 80
            radius: height / 2
            z: Theme.zIndexDock
            
            anchors {
                horizontalCenter: parent.horizontalCenter
                bottom: parent.bottom
                bottomMargin: Theme.spacingLarge
            }
            
            // Glass background
            GlassPane {
                anchors.fill: parent
                blurRadius: Theme.blurRadiusLight
                tintColor: Theme.glassTintDark
                borderGlow: Theme.glowIntensityMedium
                glowColor: Theme.primaryAccent
                radius: parent.radius
            }
            
            // Dock content
            Row {
                anchors.centerIn: parent
                spacing: Theme.spacingLarge
                
                // Placeholder dock items
                Repeater {
                    model: ["⚡", "🎨", "⚙️", "📊", "🔮"]
                    
                    Rectangle {
                        width: 50
                        height: 50
                        radius: Theme.borderRadiusMedium
                        color: Qt.rgba(0.2, 0.2, 0.2, 0.5)
                        border.width: 2
                        border.color: Theme.primaryAccent
                        
                        Text {
                            anchors.centerIn: parent
                            text: modelData
                            font.pixelSize: 24
                        }
                        
                        // Hover effect
                        MouseArea {
                            anchors.fill: parent
                            hoverEnabled: true
                            
                            onEntered: parent.scale = 1.2
                            onExited: parent.scale = 1.0
                        }
                        
                        Behavior on scale {
                            SpringAnimation {
                                spring: Theme.springSnappy
                                damping: Theme.dampingSnappy
                                epsilon: 0.01
                            }
                        }
                    }
                }
            }
        }
    }
    
    // ============================================
    // STARTUP ANIMATION
    // ============================================
    
    Component.onCompleted: {
        console.log("🌌 QOR Desktop Environment Initialized")
        console.log("✨ Glass Engine v1.0.0 - Phase 1")
        console.log("🎨 Theme: Ancient Code Meets Ethereal Glass")
    }
}
