import QtQuick
import QtQuick.Layouts
import QtQuick.Controls
import QtMultimedia

import "../components"

/**
 * CameraApp - QOR Camera Application
 * 
 * Capture photos from camera with various settings.
 * Built on Qt Multimedia.
 */
Item {
    id: cameraApp
    
    // ========================================================================
    // PROPERTIES
    // ========================================================================
    
    property bool flashEnabled: false
    property int photoCount: 0
    property string lastPhotoPath: ""
    property real zoomLevel: 1.0
    property bool isTakingPhoto: false
    
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
            
            flashMode: flashEnabled ? Camera.FlashOn : Camera.FlashOff
        }
        
        imageCapture: ImageCapture {
            id: imageCapture
            
            onImageCaptured: function(requestId, preview) {
                lastPreview.source = preview
                isTakingPhoto = false
            }
            
            onImageSaved: function(requestId, path) {
                lastPhotoPath = path
                photoCount++
                console.log("Photo saved:", path)
            }
            
            onErrorOccurred: function(requestId, error, message) {
                console.error("Capture error:", message)
                isTakingPhoto = false
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
                    text: "📷 Camera"
                    font.family: Theme.fontHeader
                    font.pixelSize: Theme.fontSizeBody
                    color: Theme.textPrimary
                }
                
                Item { Layout.fillWidth: true }
                
                // Flash toggle
                Rectangle {
                    width: 36
                    height: 36
                    radius: Theme.radiusSmall
                    color: flashEnabled ? Theme.accentFlame : Theme.glassPanelWindow
                    
                    Text {
                        anchors.centerIn: parent
                        text: "⚡"
                        font.pixelSize: 18
                    }
                    
                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: flashEnabled = !flashEnabled
                    }
                }
                
                // Camera switch
                Rectangle {
                    width: 36
                    height: 36
                    radius: Theme.radiusSmall
                    color: switchMouse.containsMouse ? Theme.glassPanelWindow : "transparent"
                    visible: mediaDevices.videoInputs.length > 1
                    
                    Text {
                        anchors.centerIn: parent
                        text: "🔄"
                        font.pixelSize: 18
                    }
                    
                    MouseArea {
                        id: switchMouse
                        anchors.fill: parent
                        hoverEnabled: true
                        cursorShape: Qt.PointingHandCursor
                        onClicked: switchCamera()
                    }
                }
                
                // Photo count
                Text {
                    text: photoCount + " photos"
                    font.family: Theme.fontCode
                    font.pixelSize: Theme.fontSizeSmall
                    color: Theme.textSecondary
                }
            }
        }
        
        // Camera preview
        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true
            color: Theme.voidBlack
            
            VideoOutput {
                id: videoOutput
                anchors.fill: parent
                fillMode: VideoOutput.PreserveAspectCrop
            }
            
            // Zoom indicator
            Rectangle {
                anchors.right: parent.right
                anchors.verticalCenter: parent.verticalCenter
                anchors.rightMargin: Theme.spacingMedium
                width: 40
                height: 200
                radius: Theme.radiusSmall
                color: Qt.rgba(0, 0, 0, 0.5)
                visible: zoomLevel > 1.0
                
                Rectangle {
                    anchors.bottom: parent.bottom
                    anchors.horizontalCenter: parent.horizontalCenter
                    anchors.bottomMargin: 4
                    width: 32
                    height: (zoomLevel - 1.0) / 3.0 * (parent.height - 8)
                    radius: Theme.radiusSmall
                    color: Theme.accentFlame
                }
                
                Text {
                    anchors.top: parent.top
                    anchors.horizontalCenter: parent.horizontalCenter
                    anchors.topMargin: 4
                    text: zoomLevel.toFixed(1) + "x"
                    font.family: Theme.fontCode
                    font.pixelSize: Theme.fontSizeTiny
                    color: Theme.textPrimary
                }
            }
            
            // Flash effect
            Rectangle {
                id: flashEffect
                anchors.fill: parent
                color: "#FFFFFF"
                opacity: 0
                
                SequentialAnimation {
                    id: flashAnimation
                    NumberAnimation { target: flashEffect; property: "opacity"; to: 1; duration: 50 }
                    NumberAnimation { target: flashEffect; property: "opacity"; to: 0; duration: 200 }
                }
            }
            
            // Last photo preview
            Rectangle {
                anchors.left: parent.left
                anchors.bottom: parent.bottom
                anchors.margins: Theme.spacingMedium
                width: 80
                height: 80
                radius: Theme.radiusSmall
                color: Theme.glassPanelDock
                clip: true
                visible: lastPhotoPath !== ""
                
                Image {
                    id: lastPreview
                    anchors.fill: parent
                    anchors.margins: 2
                    fillMode: Image.PreserveAspectCrop
                }
                
                MouseArea {
                    anchors.fill: parent
                    cursorShape: Qt.PointingHandCursor
                    onClicked: openGallery()
                }
            }
            
            // Grid overlay
            Item {
                anchors.fill: parent
                visible: gridVisible
                
                // Vertical lines
                Rectangle { x: parent.width / 3; width: 1; height: parent.height; color: Qt.rgba(1, 1, 1, 0.3) }
                Rectangle { x: parent.width * 2 / 3; width: 1; height: parent.height; color: Qt.rgba(1, 1, 1, 0.3) }
                
                // Horizontal lines
                Rectangle { y: parent.height / 3; width: parent.width; height: 1; color: Qt.rgba(1, 1, 1, 0.3) }
                Rectangle { y: parent.height * 2 / 3; width: parent.width; height: 1; color: Qt.rgba(1, 1, 1, 0.3) }
            }
            
            // Pinch to zoom
            PinchArea {
                anchors.fill: parent
                
                onPinchUpdated: function(pinch) {
                    var newZoom = zoomLevel * pinch.scale
                    zoomLevel = Math.max(1.0, Math.min(4.0, newZoom))
                    camera.zoomFactor = zoomLevel
                }
            }
            
            MouseArea {
                anchors.fill: parent
                onWheel: function(wheel) {
                    var delta = wheel.angleDelta.y > 0 ? 0.1 : -0.1
                    zoomLevel = Math.max(1.0, Math.min(4.0, zoomLevel + delta))
                    camera.zoomFactor = zoomLevel
                }
            }
        }
        
        // Controls
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: 100
            color: Theme.glassPanelDock
            
            RowLayout {
                anchors.centerIn: parent
                spacing: Theme.spacingXLarge
                
                // Gallery button
                Rectangle {
                    width: 48
                    height: 48
                    radius: 8
                    color: galleryMouse.containsMouse ? Theme.glassPanelWindow : "transparent"
                    
                    Text {
                        anchors.centerIn: parent
                        text: "🖼️"
                        font.pixelSize: 24
                    }
                    
                    MouseArea {
                        id: galleryMouse
                        anchors.fill: parent
                        hoverEnabled: true
                        cursorShape: Qt.PointingHandCursor
                        onClicked: openGallery()
                    }
                }
                
                // Capture button
                Rectangle {
                    width: 70
                    height: 70
                    radius: 35
                    color: "transparent"
                    border.width: 4
                    border.color: Theme.textPrimary
                    
                    Rectangle {
                        anchors.centerIn: parent
                        width: 58
                        height: 58
                        radius: 29
                        color: captureMouse.pressed ? Theme.textSecondary : Theme.textPrimary
                        
                        Behavior on color { ColorAnimation { duration: 100 } }
                    }
                    
                    MouseArea {
                        id: captureMouse
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        enabled: !isTakingPhoto
                        onClicked: takePhoto()
                    }
                    
                    scale: captureMouse.pressed ? 0.95 : 1
                    Behavior on scale { NumberAnimation { duration: 50 } }
                }
                
                // Grid toggle
                Rectangle {
                    width: 48
                    height: 48
                    radius: 8
                    color: gridVisible ? Theme.accentFlame : (gridMouse.containsMouse ? Theme.glassPanelWindow : "transparent")
                    
                    Text {
                        anchors.centerIn: parent
                        text: "⊞"
                        font.pixelSize: 24
                        color: gridVisible ? Theme.voidBlack : Theme.textPrimary
                    }
                    
                    MouseArea {
                        id: gridMouse
                        anchors.fill: parent
                        hoverEnabled: true
                        cursorShape: Qt.PointingHandCursor
                        onClicked: gridVisible = !gridVisible
                    }
                }
            }
        }
    }
    
    property bool gridVisible: false
    property int currentCameraIndex: 0
    
    // ========================================================================
    // FUNCTIONS
    // ========================================================================
    
    function takePhoto() {
        if (isTakingPhoto) return
        
        isTakingPhoto = true
        flashAnimation.start()
        imageCapture.captureToFile()
    }
    
    function switchCamera() {
        currentCameraIndex = (currentCameraIndex + 1) % mediaDevices.videoInputs.length
        camera.cameraDevice = mediaDevices.videoInputs[currentCameraIndex]
    }
    
    function openGallery() {
        // Would open gallery/files
        console.log("Open gallery")
    }
    
    Component.onDestruction: {
        camera.active = false
    }
}
