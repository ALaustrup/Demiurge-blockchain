import QtQuick
import QtQuick.Layouts
import QtQuick.Controls
import QtMultimedia

import "../components"

/**
 * ScreenCaptureApp - QOR Screen Capture
 * 
 * Record screen with optional audio.
 * Built on Qt Multimedia ScreenCapture.
 */
Item {
    id: screenCaptureApp
    
    // ========================================================================
    // PROPERTIES
    // ========================================================================
    
    property bool isRecording: false
    property bool isPaused: false
    property int recordingDuration: 0
    property bool captureAudio: true
    property bool captureMicrophone: false
    property var availableScreens: []
    property int selectedScreenIndex: 0
    
    // ========================================================================
    // MULTIMEDIA COMPONENTS
    // ========================================================================
    
    MediaDevices {
        id: mediaDevices
    }
    
    CaptureSession {
        id: captureSession
        
        screenCapture: ScreenCapture {
            id: screenCapture
            active: isRecording
        }
        
        audioInput: AudioInput {
            id: micInput
            device: mediaDevices.defaultAudioInput
            muted: !captureMicrophone
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
        
        videoOutput: previewOutput
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
                    text: "🖥️ Screen Capture"
                    font.family: Theme.fontHeader
                    font.pixelSize: Theme.fontSizeBody
                    color: Theme.textPrimary
                }
                
                Item { Layout.fillWidth: true }
                
                // Audio options
                Row {
                    spacing: Theme.spacingSmall
                    
                    // System audio
                    Rectangle {
                        width: 36
                        height: 36
                        radius: Theme.radiusSmall
                        color: captureAudio ? Theme.accentFlame : Theme.glassPanelWindow
                        
                        Text {
                            anchors.centerIn: parent
                            text: "🔊"
                            font.pixelSize: 16
                        }
                        
                        MouseArea {
                            anchors.fill: parent
                            cursorShape: Qt.PointingHandCursor
                            onClicked: captureAudio = !captureAudio
                        }
                        
                        ToolTip.visible: hovered
                        ToolTip.text: "System Audio"
                        property bool hovered: false
                        MouseArea {
                            anchors.fill: parent
                            hoverEnabled: true
                            onEntered: parent.hovered = true
                            onExited: parent.hovered = false
                            onClicked: captureAudio = !captureAudio
                        }
                    }
                    
                    // Microphone
                    Rectangle {
                        width: 36
                        height: 36
                        radius: Theme.radiusSmall
                        color: captureMicrophone ? Theme.accentFlame : Theme.glassPanelWindow
                        
                        Text {
                            anchors.centerIn: parent
                            text: "🎤"
                            font.pixelSize: 16
                        }
                        
                        MouseArea {
                            anchors.fill: parent
                            cursorShape: Qt.PointingHandCursor
                            onClicked: captureMicrophone = !captureMicrophone
                        }
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
        
        // Preview area
        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true
            color: Theme.voidBlack
            
            VideoOutput {
                id: previewOutput
                anchors.fill: parent
                fillMode: VideoOutput.PreserveAspectFit
            }
            
            // Capture mode selector (when not recording)
            ColumnLayout {
                anchors.centerIn: parent
                spacing: Theme.spacingLarge
                visible: !isRecording
                
                Text {
                    text: "Select Capture Mode"
                    font.family: Theme.fontHeader
                    font.pixelSize: Theme.fontSizeH3
                    color: Theme.textPrimary
                    Layout.alignment: Qt.AlignHCenter
                }
                
                RowLayout {
                    spacing: Theme.spacingMedium
                    Layout.alignment: Qt.AlignHCenter
                    
                    GlassPanel {
                        Layout.preferredWidth: 150
                        Layout.preferredHeight: 120
                        depthLevel: 2
                        active: captureMode === "fullscreen"
                        
                        ColumnLayout {
                            anchors.centerIn: parent
                            spacing: Theme.spacingSmall
                            
                            Text {
                                text: "🖥️"
                                font.pixelSize: 40
                                Layout.alignment: Qt.AlignHCenter
                            }
                            
                            Text {
                                text: "Full Screen"
                                font.family: Theme.fontBody
                                font.pixelSize: Theme.fontSizeSmall
                                color: Theme.textPrimary
                                Layout.alignment: Qt.AlignHCenter
                            }
                        }
                        
                        MouseArea {
                            anchors.fill: parent
                            cursorShape: Qt.PointingHandCursor
                            onClicked: captureMode = "fullscreen"
                        }
                    }
                    
                    GlassPanel {
                        Layout.preferredWidth: 150
                        Layout.preferredHeight: 120
                        depthLevel: 2
                        active: captureMode === "window"
                        
                        ColumnLayout {
                            anchors.centerIn: parent
                            spacing: Theme.spacingSmall
                            
                            Text {
                                text: "⬜"
                                font.pixelSize: 40
                                Layout.alignment: Qt.AlignHCenter
                            }
                            
                            Text {
                                text: "Window"
                                font.family: Theme.fontBody
                                font.pixelSize: Theme.fontSizeSmall
                                color: Theme.textPrimary
                                Layout.alignment: Qt.AlignHCenter
                            }
                        }
                        
                        MouseArea {
                            anchors.fill: parent
                            cursorShape: Qt.PointingHandCursor
                            onClicked: captureMode = "window"
                        }
                    }
                    
                    GlassPanel {
                        Layout.preferredWidth: 150
                        Layout.preferredHeight: 120
                        depthLevel: 2
                        active: captureMode === "region"
                        
                        ColumnLayout {
                            anchors.centerIn: parent
                            spacing: Theme.spacingSmall
                            
                            Text {
                                text: "⬒"
                                font.pixelSize: 40
                                Layout.alignment: Qt.AlignHCenter
                            }
                            
                            Text {
                                text: "Region"
                                font.family: Theme.fontBody
                                font.pixelSize: Theme.fontSizeSmall
                                color: Theme.textPrimary
                                Layout.alignment: Qt.AlignHCenter
                            }
                        }
                        
                        MouseArea {
                            anchors.fill: parent
                            cursorShape: Qt.PointingHandCursor
                            onClicked: captureMode = "region"
                        }
                    }
                }
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
    
    property string captureMode: "fullscreen"
    
    // ========================================================================
    // FUNCTIONS
    // ========================================================================
    
    function toggleRecording() {
        if (isRecording) {
            recorder.stop()
            screenCapture.active = false
        } else {
            var timestamp = new Date().toISOString().replace(/[:.]/g, "-")
            recorder.outputLocation = "screen_" + timestamp + ".mp4"
            screenCapture.active = true
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
        screenCapture.active = false
    }
}
