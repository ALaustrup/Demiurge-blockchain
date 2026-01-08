/**
 * IntroSequence.qml - Cinematic Intro Video Sequence
 * 
 * Plays 3 branded intro videos in sequence:
 * 1. Genesis Logo (3-5s)
 * 2. Abyss OS Logo (3-5s)
 * 3. Demiurge Blockchain Logo (3-5s)
 * 
 * Shows skip option after first video.
 */
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Effects
import QtMultimedia

Item {
    id: root
    
    signal sequenceComplete()
    signal skipRequested()
    
    // Theme colors
    readonly property color voidColor: "#050505"
    readonly property color textSecondary: "#7A7A7A"
    readonly property color flameOrange: "#FF3D00"
    
    // Video sequence configuration
    readonly property var videoSequence: [
        "qrc:/videos/01_genesis_intro.mp4",
        "qrc:/videos/02_abyssos_intro.mp4", 
        "qrc:/videos/03_demiurge_intro.mp4"
    ]
    
    property int currentVideoIndex: 0
    property bool canSkip: false
    property bool hasVideos: false
    
    // Full black background
    Rectangle {
        anchors.fill: parent
        color: voidColor
    }
    
    // Video player
    Video {
        id: videoPlayer
        anchors.fill: parent
        fillMode: VideoOutput.PreserveAspectFit
        
        // Audio settings
        volume: 0.7
        
        onErrorOccurred: (error, errorString) => {
            console.warn("Video error:", errorString)
            // Skip to next video or complete
            playNext()
        }
        
        onPlaybackStateChanged: {
            if (playbackState === MediaPlayer.StoppedState && 
                position >= duration - 100) {  // Near end
                playNext()
            }
        }
        
        onMediaStatusChanged: {
            if (mediaStatus === MediaPlayer.EndOfMedia) {
                playNext()
            } else if (mediaStatus === MediaPlayer.InvalidMedia ||
                       mediaStatus === MediaPlayer.NoMedia) {
                // Video file doesn't exist, skip
                playNext()
            } else if (mediaStatus === MediaPlayer.LoadedMedia) {
                hasVideos = true
            }
        }
    }
    
    // Fallback for missing videos - animated logo
    Item {
        id: fallbackLogo
        anchors.centerIn: parent
        visible: !hasVideos && videoPlayer.mediaStatus !== MediaPlayer.LoadingMedia
        
        Text {
            anchors.centerIn: parent
            text: getCurrentLogoText()
            font.family: "Orbitron"
            font.pixelSize: 48
            font.weight: Font.Bold
            color: "#E0E0E0"
            
            opacity: fadeAnim.running ? fadeAnim.opacity : 1.0
            
            // Glow effect
            layer.enabled: true
            layer.effect: MultiEffect {
                blurEnabled: true
                blur: 0.4
                blurMax: 20
                colorization: 1.0
                colorizationColor: currentVideoIndex === 0 ? flameOrange : 
                                   currentVideoIndex === 1 ? "#00FFC8" : "#8844FF"
            }
        }
        
        SequentialAnimation {
            id: fadeAnim
            running: fallbackLogo.visible
            
            property real opacity: 0
            
            // Fade in
            NumberAnimation {
                target: fadeAnim
                property: "opacity"
                from: 0
                to: 1
                duration: 500
                easing.type: Easing.OutQuad
            }
            
            // Hold
            PauseAnimation { duration: 2500 }
            
            // Fade out
            NumberAnimation {
                target: fadeAnim
                property: "opacity"
                from: 1
                to: 0
                duration: 500
                easing.type: Easing.InQuad
            }
            
            onFinished: playNext()
        }
    }
    
    // Skip button (appears after first video)
    Rectangle {
        anchors.bottom: parent.bottom
        anchors.right: parent.right
        anchors.margins: 30
        
        width: skipText.implicitWidth + 30
        height: 36
        radius: 18
        
        color: Qt.rgba(1, 1, 1, 0.1)
        border.width: 1
        border.color: Qt.rgba(1, 1, 1, 0.2)
        
        visible: canSkip
        opacity: skipMouseArea.containsMouse ? 1.0 : 0.6
        
        Behavior on opacity {
            NumberAnimation { duration: 150 }
        }
        
        Text {
            id: skipText
            anchors.centerIn: parent
            text: "SKIP →"
            color: textSecondary
            font.family: "Rajdhani"
            font.pixelSize: 13
            font.letterSpacing: 1
        }
        
        MouseArea {
            id: skipMouseArea
            anchors.fill: parent
            hoverEnabled: true
            cursorShape: Qt.PointingHandCursor
            
            onClicked: {
                videoPlayer.stop()
                root.skipRequested()
                root.sequenceComplete()
            }
        }
    }
    
    // Progress dots
    Row {
        anchors.bottom: parent.bottom
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.bottomMargin: 30
        spacing: 12
        
        Repeater {
            model: 3
            
            Rectangle {
                width: 8
                height: 8
                radius: 4
                color: index <= currentVideoIndex ? "#E0E0E0" : "#404040"
                
                Behavior on color {
                    ColorAnimation { duration: 300 }
                }
            }
        }
    }
    
    // Click anywhere to skip (after first video)
    MouseArea {
        anchors.fill: parent
        enabled: canSkip
        
        onClicked: {
            // Double-click or press Enter to skip entirely
        }
        
        onDoubleClicked: {
            videoPlayer.stop()
            root.skipRequested()
            root.sequenceComplete()
        }
    }
    
    // Keyboard shortcut to skip
    Keys.onPressed: (event) => {
        if (event.key === Qt.Key_Escape || event.key === Qt.Key_Space || 
            event.key === Qt.Key_Return) {
            if (canSkip) {
                videoPlayer.stop()
                root.skipRequested()
                root.sequenceComplete()
            }
        }
    }
    
    function getCurrentLogoText() {
        switch (currentVideoIndex) {
            case 0: return "GENESIS"
            case 1: return "ABYSS OS"
            case 2: return "DEMIURGE"
            default: return ""
        }
    }
    
    function playNext() {
        currentVideoIndex++
        
        if (currentVideoIndex >= videoSequence.length) {
            // Sequence complete
            root.sequenceComplete()
            return
        }
        
        // Enable skip after first video
        if (currentVideoIndex >= 1) {
            canSkip = true
        }
        
        // Reset for fallback animation
        hasVideos = false
        
        // Try to play next video
        videoPlayer.source = videoSequence[currentVideoIndex]
        videoPlayer.play()
    }
    
    function start() {
        currentVideoIndex = 0
        canSkip = false
        hasVideos = false
        
        // Start with first video
        videoPlayer.source = videoSequence[0]
        videoPlayer.play()
        
        // If video fails to load, fallback animation will trigger
    }
    
    Component.onCompleted: {
        // Auto-start when component loads
        start()
        
        // Enable keyboard focus
        forceActiveFocus()
    }
}
