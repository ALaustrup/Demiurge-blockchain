/**
 * IntroVideo.qml
 * 
 * Plays the intro video on app startup
 * Video should be placed at: resources/video/intro.mp4
 */

import QtQuick 2.15
import QtMultimedia 5.15

Rectangle {
    id: root
    anchors.fill: parent
    color: "#000000"
    
    signal videoFinished()
    signal videoSkipped()
    
    // Video player
    Video {
        id: videoPlayer
        anchors.fill: parent
        source: "qrc:/video/intro.mp4"
        autoPlay: true
        fillMode: VideoOutput.PreserveAspectFit
        muted: false
        volume: 0.7
        
        onStatusChanged: {
            if (status === MediaPlayer.EndOfMedia) {
                console.log("[IntroVideo] Video finished naturally");
                root.videoFinished();
            } else if (status === MediaPlayer.InvalidMedia) {
                console.error("[IntroVideo] Invalid video file");
                // Auto-skip if video fails
                skipTimer.start();
            } else if (status === MediaPlayer.Loaded) {
                console.log("[IntroVideo] Video loaded successfully");
            }
        }
        
        onErrorChanged: {
            if (error !== MediaPlayer.NoError) {
                console.error("[IntroVideo] Video error:", errorString);
                // Auto-skip on error
                skipTimer.start();
            }
        }
    }
    
    // Skip button (appears after 1 second)
    Rectangle {
        id: skipButton
        anchors.right: parent.right
        anchors.bottom: parent.bottom
        anchors.margins: 32
        width: 120
        height: 40
        radius: 8
        color: "#1A1A1A"
        border.color: "#FF6B35"
        border.width: 2
        opacity: 0
        visible: opacity > 0
        
        Text {
            anchors.centerIn: parent
            text: "Skip Intro"
            color: "#FFFFFF"
            font.pixelSize: 14
            font.bold: true
        }
        
        MouseArea {
            anchors.fill: parent
            hoverEnabled: true
            cursorShape: Qt.PointingHandCursor
            
            onEntered: parent.color = "#2A2A2A"
            onExited: parent.color = "#1A1A1A"
            
            onClicked: {
                console.log("[IntroVideo] Skip button clicked");
                videoPlayer.stop();
                root.videoSkipped();
            }
        }
        
        // Fade in after 1 second
        Timer {
            id: showSkipTimer
            interval: 1000
            running: true
            repeat: false
            onTriggered: {
                skipButtonAnimation.start();
            }
        }
        
        PropertyAnimation {
            id: skipButtonAnimation
            target: skipButton
            property: "opacity"
            to: 1.0
            duration: 300
            easing.type: Easing.InOutQuad
        }
    }
    
    // Auto-skip timer (fallback if video fails)
    Timer {
        id: skipTimer
        interval: 500
        running: false
        repeat: false
        onTriggered: {
            console.log("[IntroVideo] Auto-skipping due to error");
            root.videoFinished();
        }
    }
    
    // Fade out animation
    PropertyAnimation {
        id: fadeOutAnimation
        target: root
        property: "opacity"
        to: 0
        duration: 500
        easing.type: Easing.InOutQuad
        onFinished: {
            root.visible = false;
        }
    }
    
    // Public function to skip with fade
    function skip() {
        videoPlayer.stop();
        fadeOutAnimation.start();
    }
    
    Component.onCompleted: {
        console.log("[IntroVideo] Component loaded, video source:", videoPlayer.source);
    }
}
