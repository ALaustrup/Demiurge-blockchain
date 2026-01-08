import QtQuick
import QtQuick.Layouts
import QtQuick.Controls
import QtMultimedia

import "../components"

/**
 * AudioDevicesApp - QOR Audio Devices Manager
 * 
 * View and manage audio input/output devices.
 * Test audio levels and configure defaults.
 */
Item {
    id: audioDevicesApp
    
    // ========================================================================
    // PROPERTIES
    // ========================================================================
    
    property var selectedInputDevice: null
    property var selectedOutputDevice: null
    property real inputLevel: 0
    property real outputLevel: 0
    property bool testingInput: false
    property bool testingOutput: false
    
    // ========================================================================
    // MULTIMEDIA COMPONENTS
    // ========================================================================
    
    MediaDevices {
        id: mediaDevices
        
        onAudioInputsChanged: refreshDevices()
        onAudioOutputsChanged: refreshDevices()
    }
    
    AudioInput {
        id: testInput
        device: selectedInputDevice || mediaDevices.defaultAudioInput
    }
    
    AudioOutput {
        id: testOutput
        device: selectedOutputDevice || mediaDevices.defaultAudioOutput
    }
    
    // Test tone player
    MediaPlayer {
        id: testTonePlayer
        source: "qrc:/audio/test_tone.wav"
        audioOutput: testOutput
    }
    
    // Input level simulation
    Timer {
        running: testingInput
        interval: 50
        repeat: true
        onTriggered: {
            inputLevel = Math.random() * 0.6 + 0.2
        }
    }
    
    // ========================================================================
    // MAIN LAYOUT
    // ========================================================================
    
    ColumnLayout {
        anchors.fill: parent
        anchors.margins: Theme.spacingLarge
        spacing: Theme.spacingLarge
        
        // Header
        Text {
            text: "🔊 Audio Devices"
            font.family: Theme.fontHeader
            font.pixelSize: Theme.fontSizeH2
            color: Theme.textPrimary
        }
        
        // Input devices section
        GlassPanel {
            Layout.fillWidth: true
            Layout.preferredHeight: 250
            depthLevel: 2
            
            ColumnLayout {
                anchors.fill: parent
                anchors.margins: Theme.spacingMedium
                spacing: Theme.spacingMedium
                
                RowLayout {
                    Layout.fillWidth: true
                    
                    Text {
                        text: "🎤 Input Devices"
                        font.family: Theme.fontBody
                        font.pixelSize: Theme.fontSizeBody
                        font.weight: Font.Medium
                        color: Theme.textPrimary
                    }
                    
                    Item { Layout.fillWidth: true }
                    
                    FlameButton {
                        text: testingInput ? "Stop Test" : "Test"
                        implicitWidth: 80
                        implicitHeight: 32
                        onClicked: {
                            testingInput = !testingInput
                            if (!testingInput) inputLevel = 0
                        }
                    }
                }
                
                ListView {
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    clip: true
                    spacing: Theme.spacingSmall
                    
                    model: mediaDevices.audioInputs
                    
                    delegate: Rectangle {
                        width: ListView.view.width
                        height: 50
                        radius: Theme.radiusSmall
                        color: selectedInputDevice === modelData ? Theme.glassPanelWindow : 
                               inputMouse.containsMouse ? Qt.rgba(Theme.glassPanelWindow.r, Theme.glassPanelWindow.g, Theme.glassPanelWindow.b, 0.5) : "transparent"
                        border.width: selectedInputDevice === modelData ? 1 : 0
                        border.color: Theme.accentFlame
                        
                        RowLayout {
                            anchors.fill: parent
                            anchors.margins: Theme.spacingSmall
                            spacing: Theme.spacingMedium
                            
                            Rectangle {
                                width: 32
                                height: 32
                                radius: 16
                                color: modelData.isDefault ? Theme.accentFlame : Theme.glassPanelDock
                                
                                Text {
                                    anchors.centerIn: parent
                                    text: modelData.isDefault ? "★" : "🎤"
                                    font.pixelSize: 14
                                    color: modelData.isDefault ? Theme.voidBlack : Theme.textPrimary
                                }
                            }
                            
                            ColumnLayout {
                                Layout.fillWidth: true
                                spacing: 2
                                
                                Text {
                                    text: modelData.description
                                    font.family: Theme.fontBody
                                    font.pixelSize: Theme.fontSizeSmall
                                    color: Theme.textPrimary
                                    elide: Text.ElideRight
                                    Layout.fillWidth: true
                                }
                                
                                Text {
                                    text: modelData.isDefault ? "Default Device" : modelData.id
                                    font.family: Theme.fontCode
                                    font.pixelSize: Theme.fontSizeTiny
                                    color: Theme.textMuted
                                    elide: Text.ElideRight
                                    Layout.fillWidth: true
                                }
                            }
                            
                            // Level meter (when testing)
                            Rectangle {
                                width: 100
                                height: 8
                                radius: 4
                                color: Theme.glassPanelDock
                                visible: testingInput && selectedInputDevice === modelData
                                
                                Rectangle {
                                    width: inputLevel * parent.width
                                    height: parent.height
                                    radius: 4
                                    
                                    gradient: Gradient {
                                        orientation: Gradient.Horizontal
                                        GradientStop { position: 0; color: Theme.success }
                                        GradientStop { position: 0.7; color: Theme.warning }
                                        GradientStop { position: 1; color: Theme.error }
                                    }
                                    
                                    Behavior on width { NumberAnimation { duration: 50 } }
                                }
                            }
                        }
                        
                        MouseArea {
                            id: inputMouse
                            anchors.fill: parent
                            hoverEnabled: true
                            cursorShape: Qt.PointingHandCursor
                            onClicked: selectedInputDevice = modelData
                        }
                    }
                }
            }
        }
        
        // Output devices section
        GlassPanel {
            Layout.fillWidth: true
            Layout.preferredHeight: 250
            depthLevel: 2
            
            ColumnLayout {
                anchors.fill: parent
                anchors.margins: Theme.spacingMedium
                spacing: Theme.spacingMedium
                
                RowLayout {
                    Layout.fillWidth: true
                    
                    Text {
                        text: "🔊 Output Devices"
                        font.family: Theme.fontBody
                        font.pixelSize: Theme.fontSizeBody
                        font.weight: Font.Medium
                        color: Theme.textPrimary
                    }
                    
                    Item { Layout.fillWidth: true }
                    
                    FlameButton {
                        text: testingOutput ? "Stop" : "Play Test"
                        implicitWidth: 80
                        implicitHeight: 32
                        onClicked: {
                            testingOutput = !testingOutput
                            if (testingOutput) {
                                testTonePlayer.play()
                            } else {
                                testTonePlayer.stop()
                            }
                        }
                    }
                }
                
                ListView {
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    clip: true
                    spacing: Theme.spacingSmall
                    
                    model: mediaDevices.audioOutputs
                    
                    delegate: Rectangle {
                        width: ListView.view.width
                        height: 50
                        radius: Theme.radiusSmall
                        color: selectedOutputDevice === modelData ? Theme.glassPanelWindow : 
                               outputMouse.containsMouse ? Qt.rgba(Theme.glassPanelWindow.r, Theme.glassPanelWindow.g, Theme.glassPanelWindow.b, 0.5) : "transparent"
                        border.width: selectedOutputDevice === modelData ? 1 : 0
                        border.color: Theme.cipherCyan
                        
                        RowLayout {
                            anchors.fill: parent
                            anchors.margins: Theme.spacingSmall
                            spacing: Theme.spacingMedium
                            
                            Rectangle {
                                width: 32
                                height: 32
                                radius: 16
                                color: modelData.isDefault ? Theme.cipherCyan : Theme.glassPanelDock
                                
                                Text {
                                    anchors.centerIn: parent
                                    text: modelData.isDefault ? "★" : "🔊"
                                    font.pixelSize: 14
                                    color: modelData.isDefault ? Theme.voidBlack : Theme.textPrimary
                                }
                            }
                            
                            ColumnLayout {
                                Layout.fillWidth: true
                                spacing: 2
                                
                                Text {
                                    text: modelData.description
                                    font.family: Theme.fontBody
                                    font.pixelSize: Theme.fontSizeSmall
                                    color: Theme.textPrimary
                                    elide: Text.ElideRight
                                    Layout.fillWidth: true
                                }
                                
                                Text {
                                    text: modelData.isDefault ? "Default Device" : modelData.id
                                    font.family: Theme.fontCode
                                    font.pixelSize: Theme.fontSizeTiny
                                    color: Theme.textMuted
                                    elide: Text.ElideRight
                                    Layout.fillWidth: true
                                }
                            }
                            
                            // Volume slider
                            Slider {
                                Layout.preferredWidth: 100
                                from: 0
                                to: 1
                                value: 0.8
                                
                                background: Rectangle {
                                    x: parent.leftPadding
                                    y: parent.topPadding + parent.availableHeight / 2 - height / 2
                                    width: parent.availableWidth
                                    height: 4
                                    radius: 2
                                    color: Theme.glassPanelDock
                                    
                                    Rectangle {
                                        width: parent.parent.visualPosition * parent.width
                                        height: parent.height
                                        radius: 2
                                        color: Theme.cipherCyan
                                    }
                                }
                                
                                handle: Rectangle {
                                    x: parent.leftPadding + parent.visualPosition * (parent.availableWidth - width)
                                    y: parent.topPadding + parent.availableHeight / 2 - height / 2
                                    width: 12
                                    height: 12
                                    radius: 6
                                    color: Theme.textPrimary
                                }
                            }
                        }
                        
                        MouseArea {
                            id: outputMouse
                            anchors.fill: parent
                            hoverEnabled: true
                            cursorShape: Qt.PointingHandCursor
                            onClicked: selectedOutputDevice = modelData
                        }
                    }
                }
            }
        }
        
        Item { Layout.fillHeight: true }
        
        // Actions
        RowLayout {
            Layout.fillWidth: true
            spacing: Theme.spacingMedium
            
            Item { Layout.fillWidth: true }
            
            FlameButton {
                text: "Apply as Default"
                primary: true
                enabled: selectedInputDevice || selectedOutputDevice
                onClicked: applyDefaults()
            }
            
            FlameButton {
                text: "Refresh"
                onClicked: refreshDevices()
            }
        }
    }
    
    // ========================================================================
    // FUNCTIONS
    // ========================================================================
    
    function refreshDevices() {
        // Devices are auto-refreshed by MediaDevices
        console.log("Audio inputs:", mediaDevices.audioInputs.length)
        console.log("Audio outputs:", mediaDevices.audioOutputs.length)
    }
    
    function applyDefaults() {
        if (selectedInputDevice) {
            testInput.device = selectedInputDevice
            console.log("Set default input:", selectedInputDevice.description)
        }
        if (selectedOutputDevice) {
            testOutput.device = selectedOutputDevice
            console.log("Set default output:", selectedOutputDevice.description)
        }
    }
    
    Component.onCompleted: {
        refreshDevices()
        selectedInputDevice = mediaDevices.defaultAudioInput
        selectedOutputDevice = mediaDevices.defaultAudioOutput
    }
    
    Component.onDestruction: {
        testTonePlayer.stop()
    }
}
