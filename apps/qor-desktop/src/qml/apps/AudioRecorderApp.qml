import QtQuick
import QtQuick.Layouts
import QtQuick.Controls
import QtMultimedia

import "../components"

/**
 * AudioRecorderApp - QOR Audio Recorder
 * 
 * Record audio from microphone with waveform visualization.
 * Built on Qt Multimedia.
 */
Item {
    id: audioRecorderApp
    
    // ========================================================================
    // PROPERTIES
    // ========================================================================
    
    property bool isRecording: false
    property bool isPaused: false
    property int recordingDuration: 0
    property string outputPath: ""
    property var recordings: []
    property real audioLevel: 0
    
    // ========================================================================
    // MULTIMEDIA COMPONENTS
    // ========================================================================
    
    MediaDevices {
        id: mediaDevices
    }
    
    CaptureSession {
        id: captureSession
        
        audioInput: AudioInput {
            id: audioInput
            device: mediaDevices.defaultAudioInput
        }
        
        recorder: MediaRecorder {
            id: recorder
            
            quality: MediaRecorder.HighQuality
            mediaFormat {
                fileFormat: MediaFormat.MP3
                audioCodec: MediaFormat.AudioCodec.MP3
            }
            
            onRecorderStateChanged: {
                if (recorderState === MediaRecorder.StoppedState) {
                    isRecording = false
                    isPaused = false
                    
                    // Add to recordings list
                    recordings.push({
                        path: outputPath,
                        duration: recordingDuration,
                        date: new Date()
                    })
                    recordingsChanged()
                }
            }
            
            onDurationChanged: {
                recordingDuration = duration
            }
            
            onErrorOccurred: function(error, message) {
                console.error("Recording error:", message)
            }
        }
    }
    
    // Audio level meter simulation
    Timer {
        running: isRecording && !isPaused
        interval: 50
        repeat: true
        onTriggered: {
            // Simulate audio level (would use actual audio analysis)
            audioLevel = Math.random() * 0.4 + (isRecording ? 0.3 : 0)
        }
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
                    text: "🎙️ Audio Recorder"
                    font.family: Theme.fontHeader
                    font.pixelSize: Theme.fontSizeBody
                    color: Theme.textPrimary
                }
                
                Item { Layout.fillWidth: true }
                
                // Input device selector
                ComboBox {
                    id: inputSelector
                    Layout.preferredWidth: 200
                    model: mediaDevices.audioInputs
                    textRole: "description"
                    
                    onCurrentIndexChanged: {
                        if (currentIndex >= 0 && mediaDevices.audioInputs.length > currentIndex) {
                            audioInput.device = mediaDevices.audioInputs[currentIndex]
                        }
                    }
                    
                    background: Rectangle {
                        color: Theme.glassPanelWindow
                        radius: Theme.radiusSmall
                        border.width: 1
                        border.color: Theme.panelBorder
                    }
                    
                    contentItem: Text {
                        text: inputSelector.displayText
                        font.family: Theme.fontBody
                        font.pixelSize: Theme.fontSizeSmall
                        color: Theme.textPrimary
                        verticalAlignment: Text.AlignVCenter
                        leftPadding: Theme.spacingSmall
                        elide: Text.ElideRight
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
        
        // Waveform visualization area
        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true
            color: Theme.voidBlack
            
            // Waveform canvas
            Canvas {
                id: waveformCanvas
                anchors.fill: parent
                anchors.margins: Theme.spacingLarge
                
                property var waveformData: []
                
                onPaint: {
                    var ctx = getContext("2d")
                    ctx.clearRect(0, 0, width, height)
                    
                    var centerY = height / 2
                    var barWidth = 4
                    var gap = 2
                    var barCount = Math.floor(width / (barWidth + gap))
                    
                    // Draw center line
                    ctx.strokeStyle = Qt.rgba(Theme.panelBorder.r, Theme.panelBorder.g, Theme.panelBorder.b, 0.5)
                    ctx.lineWidth = 1
                    ctx.beginPath()
                    ctx.moveTo(0, centerY)
                    ctx.lineTo(width, centerY)
                    ctx.stroke()
                    
                    // Draw waveform
                    var gradient = ctx.createLinearGradient(0, 0, 0, height)
                    gradient.addColorStop(0, Theme.accentFlame.toString())
                    gradient.addColorStop(0.5, Theme.accentMagma.toString())
                    gradient.addColorStop(1, Theme.accentFlame.toString())
                    
                    ctx.fillStyle = gradient
                    
                    for (var i = 0; i < waveformData.length && i < barCount; i++) {
                        var barHeight = waveformData[i] * (height * 0.8)
                        var x = i * (barWidth + gap)
                        
                        ctx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight)
                    }
                }
            }
            
            Timer {
                running: isRecording && !isPaused
                interval: 50
                repeat: true
                onTriggered: {
                    // Add new sample and scroll
                    waveformCanvas.waveformData.push(audioLevel)
                    if (waveformCanvas.waveformData.length > 200) {
                        waveformCanvas.waveformData.shift()
                    }
                    waveformCanvas.requestPaint()
                }
            }
            
            // Level meter
            Rectangle {
                anchors.right: parent.right
                anchors.top: parent.top
                anchors.bottom: parent.bottom
                anchors.margins: Theme.spacingMedium
                width: 20
                radius: Theme.radiusSmall
                color: Theme.glassPanelDock
                
                Rectangle {
                    anchors.bottom: parent.bottom
                    anchors.horizontalCenter: parent.horizontalCenter
                    anchors.margins: 2
                    width: 16
                    height: audioLevel * (parent.height - 4)
                    radius: Theme.radiusSmall
                    
                    gradient: Gradient {
                        GradientStop { position: 0; color: Theme.error }
                        GradientStop { position: 0.3; color: Theme.warning }
                        GradientStop { position: 1; color: Theme.success }
                    }
                    
                    Behavior on height { NumberAnimation { duration: 50 } }
                }
            }
            
            // Duration display when recording
            Text {
                anchors.centerIn: parent
                text: formatDuration(recordingDuration)
                font.family: Theme.fontCode
                font.pixelSize: Theme.fontSizeHuge
                color: Theme.textPrimary
                opacity: isRecording ? 1 : 0
                
                Behavior on opacity { NumberAnimation { duration: 200 } }
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
        
        // Recordings list
        GlassPanel {
            Layout.fillWidth: true
            Layout.preferredHeight: 150
            Layout.margins: Theme.spacingMedium
            depthLevel: 2
            visible: recordings.length > 0
            
            ColumnLayout {
                anchors.fill: parent
                anchors.margins: Theme.spacingSmall
                
                Text {
                    text: "Recordings"
                    font.family: Theme.fontBody
                    font.pixelSize: Theme.fontSizeSmall
                    font.weight: Font.Medium
                    color: Theme.textPrimary
                }
                
                ListView {
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    clip: true
                    spacing: Theme.spacingTiny
                    
                    model: recordings
                    
                    delegate: Rectangle {
                        width: ListView.view.width
                        height: 36
                        radius: Theme.radiusSmall
                        color: recMouse.containsMouse ? Theme.glassPanelWindow : "transparent"
                        
                        RowLayout {
                            anchors.fill: parent
                            anchors.margins: Theme.spacingSmall
                            
                            Text {
                                text: "🎵"
                                font.pixelSize: 16
                            }
                            
                            Text {
                                text: modelData.path
                                font.family: Theme.fontBody
                                font.pixelSize: Theme.fontSizeSmall
                                color: Theme.textPrimary
                                Layout.fillWidth: true
                                elide: Text.ElideMiddle
                            }
                            
                            Text {
                                text: formatDuration(modelData.duration)
                                font.family: Theme.fontCode
                                font.pixelSize: Theme.fontSizeTiny
                                color: Theme.textSecondary
                            }
                        }
                        
                        MouseArea {
                            id: recMouse
                            anchors.fill: parent
                            hoverEnabled: true
                            cursorShape: Qt.PointingHandCursor
                            onDoubleClicked: playRecording(modelData.path)
                        }
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
            waveformCanvas.waveformData = []
            waveformCanvas.requestPaint()
        } else {
            var timestamp = new Date().toISOString().replace(/[:.]/g, "-")
            outputPath = "audio_" + timestamp + ".mp3"
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
    
    function playRecording(path) {
        console.log("Play recording:", path)
        // Would play the recording
    }
    
    function formatDuration(ms) {
        var seconds = Math.floor(ms / 1000)
        var minutes = Math.floor(seconds / 60)
        seconds = seconds % 60
        return minutes + ":" + (seconds < 10 ? "0" : "") + seconds
    }
    
    Component.onDestruction: {
        if (isRecording) {
            recorder.stop()
        }
    }
}
