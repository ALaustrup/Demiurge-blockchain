import QtQuick
import QtQuick.Layouts
import QtQuick.Controls
import QtMultimedia

import "../components"

/**
 * VideoRecorderApp - QOR Video Recorder
 * 
 * Record video from camera with audio.
 * Built on Qt Multimedia for cross-platform support.
 */
Item {
    id: videoRecorderApp
    
    // ========================================================================
    // PROPERTIES
    // ========================================================================
    
    property bool isRecording: false
    property bool isPaused: false
    property int recordingDuration: 0
    property string outputPath: ""
    property var availableCameras: []
    property int selectedCameraIndex: 0
    
    // ========================================================================
    // MULTIMEDIA COMPONENTS
    // ========================================================================
    
    MediaDevices {
        id: mediaDevices
    }
    
    CaptureSession {
        id: captureSession
        
        camera: Camera {
            id: camera
            cameraDevice: mediaDevices.defaultVideoInput
            active: true
        }
        
        audioInput: AudioInput {
            id: audioInput
            device: mediaDevices.defaultAudioInput
        }
        
        recorder: MediaRecorder {
            id: recorder
            
            quality: MediaRecorder.HighQuality
            
            onRecorderStateChanged: {
                if (recorderState === MediaRecorder.StoppedState) {
                    isRecording = false
                    isPaused = false
                }
            }
            
            onDurationChanged: {
                recordingDuration = duration
            }
            
            onErrorOccurred: function(error, message) {
                console.error("Recording error:", message)
            }
        }
        
        videoOutput: videoOutput
    }
    
    // ========================================================================
    // MAIN LAYOUT
    // ========================================================================
    
    ColumnLayout {
        anchors.fill: parent
        spacing: 0
        
        // Top bar
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: 48
            color: Theme.glassPanelDock
            
            RowLayout {
                anchors.fill: parent
                anchors.margins: Theme.spacingSmall
                spacing: Theme.spacingMedium
                
                Text {
                    text: "📹 Video Recorder"
                    font.family: Theme.fontHeader
                    font.pixelSize: Theme.fontSizeBody
                    color: Theme.textPrimary
                }
                
                Item { Layout.fillWidth: true }
                
                // Camera selector
                ComboBox {
                    id: cameraSelector
                    Layout.preferredWidth: 200
                    model: mediaDevices.videoInputs
                    textRole: "description"
                    
                    onCurrentIndexChanged: {
                        if (currentIndex >= 0 && mediaDevices.videoInputs.length > currentIndex) {
                            camera.cameraDevice = mediaDevices.videoInputs[currentIndex]
                        }
                    }
                    
                    background: Rectangle {
                        color: Theme.glassPanelWindow
                        radius: Theme.radiusSmall
                        border.width: 1
                        border.color: Theme.panelBorder
                    }
                    
                    contentItem: Text {
                        text: cameraSelector.displayText
                        font.family: Theme.fontBody
                        font.pixelSize: Theme.fontSizeSmall
                        color: Theme.textPrimary
                        verticalAlignment: Text.AlignVCenter
                        leftPadding: Theme.spacingSmall
                    }
                }
                
                // Recording indicator
                Row {
                    spacing: Theme.spacingSmall
                    visible: isRecording
                    
                    Rectangle {
                        width: 12
                        height: 12
                        radius: 6
                        color: Theme.error
                        
                        SequentialAnimation on opacity {
                            running: isRecording && !isPaused
                            loops: Animation.Infinite
                            NumberAnimation { to: 0.3; duration: 500 }
                            NumberAnimation { to: 1; duration: 500 }
                        }
                    }
                    
                    Text {
                        text: formatDuration(recordingDuration)
                        font.family: Theme.fontCode
                        font.pixelSize: Theme.fontSizeSmall
                        color: Theme.error
                    }
                }
            }
        }
        
        // Video preview
        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true
            color: Theme.voidBlack
            
            VideoOutput {
                id: videoOutput
                anchors.fill: parent
                fillMode: VideoOutput.PreserveAspectFit
            }
            
            // No camera message
            Text {
                anchors.centerIn: parent
                text: "No camera detected"
                font.family: Theme.fontBody
                font.pixelSize: Theme.fontSizeBody
                color: Theme.textMuted
                visible: mediaDevices.videoInputs.length === 0
            }
        }
        
        // Controls
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: 80
            color: Theme.glassPanelDock
            
            RowLayout {
                anchors.centerIn: parent
                spacing: Theme.spacingLarge
                
                // Record button
                Rectangle {
                    width: 60
                    height: 60
                    radius: 30
                    color: isRecording ? Theme.error : Theme.glassPanelWindow
                    border.width: 3
                    border.color: isRecording ? Theme.error : Theme.accentFlame
                    
                    Rectangle {
                        anchors.centerIn: parent
                        width: isRecording ? 20 : 30
                        height: isRecording ? 20 : 30
                        radius: isRecording ? 4 : 15
                        color: isRecording ? "#FFFFFF" : Theme.accentFlame
                        
                        Behavior on width { NumberAnimation { duration: 150 } }
                        Behavior on height { NumberAnimation { duration: 150 } }
                        Behavior on radius { NumberAnimation { duration: 150 } }
                    }
                    
                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: toggleRecording()
                    }
                }
                
                // Pause button
                Rectangle {
                    width: 48
                    height: 48
                    radius: 24
                    color: pauseMouse.containsMouse ? Theme.glassPanelWindow : "transparent"
                    visible: isRecording
                    
                    Text {
                        anchors.centerIn: parent
                        text: isPaused ? "▶" : "⏸"
                        font.pixelSize: 20
                        color: Theme.textPrimary
                    }
                    
                    MouseArea {
                        id: pauseMouse
                        anchors.fill: parent
                        hoverEnabled: true
                        cursorShape: Qt.PointingHandCursor
                        onClicked: togglePause()
                    }
                }
            }
        }
    }
    
    // ========================================================================
    // FUNCTIONS
    // ========================================================================
    
    function toggleRecording() {
        if (isRecording) {
            recorder.stop()
        } else {
            var timestamp = new Date().toISOString().replace(/[:.]/g, "-")
            outputPath = "video_" + timestamp + ".mp4"
            recorder.outputLocation = outputPath
            recorder.record()
            isRecording = true
        }
    }
    
    function togglePause() {
        if (isPaused) {
            recorder.record()
            isPaused = false
        } else {
            recorder.pause()
            isPaused = true
        }
    }
    
    function formatDuration(ms) {
        var seconds = Math.floor(ms / 1000)
        var minutes = Math.floor(seconds / 60)
        var hours = Math.floor(minutes / 60)
        seconds = seconds % 60
        minutes = minutes % 60
        
        if (hours > 0) {
            return hours + ":" + (minutes < 10 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds
        }
        return minutes + ":" + (seconds < 10 ? "0" : "") + seconds
    }
    
    Component.onDestruction: {
        if (isRecording) {
            recorder.stop()
        }
        camera.active = false
    }
}
