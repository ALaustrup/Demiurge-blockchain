/**
 * LauncherWindow.qml - DEMIURGE QOR Main Window
 * Features: Intro video sequence → Login screen
 */
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtMultimedia

ApplicationWindow {
    id: root
    
    width: 800
    height: 600
    visible: true
    title: "DEMIURGE QOR"
    color: "transparent"
    flags: Qt.FramelessWindowHint | Qt.Window
    
    // State management
    property bool introComplete: false
    property bool introSkipped: false
    
    // Center on screen
    Component.onCompleted: {
        x = (Screen.width - width) / 2
        y = (Screen.height - height) / 2
    }
    
    // Theme colors
    readonly property color voidColor: "#050505"
    readonly property color textPrimary: "#E0E0E0"
    readonly property color textSecondary: "#7A7A7A"
    readonly property color flameOrange: "#FF3D00"
    readonly property color cipherCyan: "#00FFC8"
    
    // Main container
    Rectangle {
        id: container
        anchors.fill: parent
        anchors.margins: 20
        color: voidColor
        radius: 16
        border.color: Qt.rgba(1, 1, 1, 0.1)
        border.width: 1
        clip: true
        
        // ====================================================================
        // INTRO VIDEO SEQUENCE
        // ====================================================================
        Item {
            id: introLayer
            anchors.fill: parent
            visible: !introComplete
            z: 100
            
            Rectangle {
                anchors.fill: parent
                color: "#000"
            }
            
            MediaPlayer {
                id: introPlayer
                // Load video from executable directory
                // Try: assets/intro.mp4 first, then videos/intro.mp4
                property string videoPath: {
                    var exePath = Qt.application.arguments[0]
                    console.log("Executable path:", exePath)
                    
                    // Normalize path separators
                    var normalizedPath = exePath.replace(/\\/g, "/")
                    var lastSlash = normalizedPath.lastIndexOf("/")
                    var exeDir = normalizedPath.substring(0, lastSlash + 1)
                    
                    // Try assets/intro.mp4 first (preferred location)
                    var videoFile = exeDir + "assets/intro.mp4"
                    
                    // Fallback to videos/intro.mp4 if assets doesn't exist
                    // (We'll check this in onErrorOccurred)
                    
                    // Convert to file:// URL format for Windows
                    if (videoFile.indexOf(":") >= 0) {
                        // Windows absolute path (C:/...)
                        videoFile = "file:///" + videoFile
                    } else {
                        // Relative path
                        videoFile = "file:///" + videoFile
                    }
                    
                    console.log("Video path:", videoFile)
                    return videoFile
                }
                source: videoPath
                videoOutput: videoOutput
                audioOutput: AudioOutput { volume: 0.8 }
                
                onSourceChanged: {
                    console.log("MediaPlayer source changed to:", source)
                }
                
                onPlaybackStateChanged: {
                    console.log("Playback state:", playbackState)
                    if (playbackState === MediaPlayer.StoppedState && !introSkipped) {
                        introComplete = true
                    }
                }
                
                onErrorOccurred: (error, errorString) => {
                    console.log("Video error:", error, errorString)
                    console.log("Attempted path:", videoPath)
                    
                    // Try fallback path: videos/intro.mp4
                    var exePath = Qt.application.arguments[0]
                    var normalizedPath = exePath.replace(/\\/g, "/")
                    var lastSlash = normalizedPath.lastIndexOf("/")
                    var exeDir = normalizedPath.substring(0, lastSlash + 1)
                    var fallbackPath = "file:///" + exeDir + "videos/intro.mp4"
                    
                    console.log("Trying fallback path:", fallbackPath)
                    if (source !== fallbackPath) {
                        source = fallbackPath
                        return
                    }
                    
                    // If both paths fail, skip to login
                    introComplete = true
                }
            }
            
            VideoOutput {
                id: videoOutput
                anchors.fill: parent
                fillMode: VideoOutput.PreserveAspectFit
            }
            
            // Skip button
            Rectangle {
                anchors.right: parent.right
                anchors.bottom: parent.bottom
                anchors.margins: 20
                width: skipText.width + 30
                height: 36
                radius: 18
                color: skipArea.containsMouse ? Qt.rgba(1, 1, 1, 0.2) : Qt.rgba(1, 1, 1, 0.1)
                border.color: Qt.rgba(1, 1, 1, 0.3)
                border.width: 1
                
                Text {
                    id: skipText
                    anchors.centerIn: parent
                    text: "SKIP ▸"
                    color: "#AAA"
                    font.pixelSize: 12
                    font.bold: true
                }
                
                MouseArea {
                    id: skipArea
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onClicked: {
                        introSkipped = true
                        introPlayer.stop()
                        introComplete = true
                    }
                }
            }
            
            // Start video when component is ready
            Component.onCompleted: {
                introPlayer.play()
            }
        }
        
        // ====================================================================
        // LOGIN SCREEN
        // ====================================================================
        Item {
            id: loginLayer
            anchors.fill: parent
            visible: introComplete
            opacity: introComplete ? 1 : 0
            
            Behavior on opacity {
                NumberAnimation { duration: 500; easing.type: Easing.OutCubic }
            }
            
            // Draggable area
            MouseArea {
                anchors.top: parent.top
                anchors.left: parent.left
                anchors.right: parent.right
                height: 50
                property point clickPos
                onPressed: (mouse) => { clickPos = Qt.point(mouse.x, mouse.y) }
                onPositionChanged: (mouse) => {
                    if (pressed) {
                        root.x += mouse.x - clickPos.x
                        root.y += mouse.y - clickPos.y
                    }
                }
            }
            
            // Close button
            Rectangle {
                anchors.right: parent.right
                anchors.top: parent.top
                anchors.margins: 16
                width: 24; height: 24; radius: 12
                color: closeArea.containsMouse ? "#FF4444" : "transparent"
                Text {
                    anchors.centerIn: parent
                    text: "✕"
                    color: closeArea.containsMouse ? "#FFF" : "#666"
                    font.pixelSize: 12
                }
                MouseArea {
                    id: closeArea
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onClicked: Qt.quit()
                }
            }
            
            // Minimize button
            Rectangle {
                anchors.right: parent.right
                anchors.top: parent.top
                anchors.rightMargin: 50
                anchors.topMargin: 16
                width: 24; height: 24; radius: 12
                color: minArea.containsMouse ? "#333" : "transparent"
                Rectangle {
                    anchors.centerIn: parent
                    width: 10; height: 2
                    color: minArea.containsMouse ? "#FFF" : "#666"
                }
                MouseArea {
                    id: minArea
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onClicked: root.showMinimized()
                }
            }
            
            // Main content
            ColumnLayout {
                anchors.centerIn: parent
                spacing: 30
                width: 360
                
                // Logo
                Text {
                    Layout.alignment: Qt.AlignHCenter
                    text: "GENESIS"
                    font.pixelSize: 42
                    font.bold: true
                    color: textPrimary
                }
                
                // Subtitle
                Text {
                    Layout.alignment: Qt.AlignHCenter
                    text: "Sign in with your QOR ID"
                    color: textSecondary
                    font.pixelSize: 14
                }
                
                // Username field
                TextField {
                    id: usernameField
                    Layout.fillWidth: true
                    Layout.preferredHeight: 50
                    placeholderText: "Username"
                    color: textPrimary
                    placeholderTextColor: "#555"
                    background: Rectangle {
                        color: "#0D0D0D"
                        radius: 8
                        border.color: usernameField.activeFocus ? flameOrange : "#252525"
                        border.width: 1
                    }
                }
                
                // Password field
                TextField {
                    id: passwordField
                    Layout.fillWidth: true
                    Layout.preferredHeight: 50
                    placeholderText: "Password"
                    echoMode: TextInput.Password
                    color: textPrimary
                    placeholderTextColor: "#555"
                    background: Rectangle {
                        color: "#0D0D0D"
                        radius: 8
                        border.color: passwordField.activeFocus ? flameOrange : "#252525"
                        border.width: 1
                    }
                }
                
                // Login button
                Rectangle {
                    Layout.fillWidth: true
                    Layout.preferredHeight: 50
                    radius: 8
                    color: loginArea.containsMouse ? "#FF5722" : flameOrange
                    
                    Text {
                        anchors.centerIn: parent
                        text: "SIGN IN"
                        color: "#FFF"
                        font.pixelSize: 14
                        font.bold: true
                    }
                    
                    MouseArea {
                        id: loginArea
                        anchors.fill: parent
                        hoverEnabled: true
                        cursorShape: Qt.PointingHandCursor
                        onClicked: {
                            console.log("Login clicked:", usernameField.text)
                        }
                    }
                }
                
                // Create account link
                Text {
                    Layout.alignment: Qt.AlignHCenter
                    text: "Create new QOR ID"
                    color: cipherCyan
                    font.pixelSize: 13
                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: console.log("Create account")
                    }
                }
            }
            
            // Version
            Text {
                anchors.bottom: parent.bottom
                anchors.right: parent.right
                anchors.margins: 12
                text: "Genesis v1.0.0"
                color: textSecondary
                font.pixelSize: 10
            }
        }
    }
}
