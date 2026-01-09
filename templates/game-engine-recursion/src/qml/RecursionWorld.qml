/**
 * RecursionWorld.qml - Main 3D game world scene
 * 
 * Uses Qt Quick 3D for rendering the Recursion game world
 */

import QtQuick
import QtQuick3D
import QtQuick.Controls
import QtQuick.Layouts
import "components"

Window {
    id: root
    width: 1280
    height: 720
    visible: true
    title: recursionEngine.worldTitle || "Recursion Engine - Demiurge Blockchain"

    // ========================================================================
    // 3D SCENE
    // ========================================================================
    
    View3D {
        id: view3d
        anchors.fill: parent
        
        // Scene environment
        environment: SceneEnvironment {
            clearColor: "#050505"
            backgroundMode: SceneEnvironment.Color
            antialiasingMode: SceneEnvironment.MSAA
            antialiasingQuality: SceneEnvironment.High
        }
        
        // Camera with mouse controls
        PerspectiveCamera {
            id: camera
            position: Qt.vector3d(0, 5, 15)
            eulerRotation: Qt.vector3d(-20, 0, 0)
            fieldOfView: 60
            
            // Camera controls
            property real cameraDistance: 15
            property real cameraAngle: 0
            property real cameraHeight: 5
            
            // Update position based on angle
            onCameraAngleChanged: {
                var rad = cameraAngle * Math.PI / 180
                position.x = Math.sin(rad) * cameraDistance
                position.z = Math.cos(rad) * cameraDistance
                position.y = cameraHeight
            }
        }
        
        // Lighting
        DirectionalLight {
            id: sunLight
            eulerRotation: Qt.vector3d(-45, 45, 0)
            color: "#FFFFFF"
            brightness: 1.0
            castsShadow: true
        }
        
        // Ambient light
        AmbientLight {
            color: "#404040"
            brightness: 0.3
        }
        
        // ====================================================================
        // WORLD GEOMETRY
        // ====================================================================
        
        Node {
            id: worldRoot
            
            // Ground plane
            Model {
                id: ground
                source: "#Rectangle"
                materials: PrincipledMaterial {
                    baseColor: "#1a1a1a"
                    roughness: 0.8
                    metalness: 0.1
                }
                scale: Qt.vector3d(50, 1, 50)
                y: -0.5
            }
            
            // Grid helper
            Repeater {
                model: 20
                Model {
                    source: "#Rectangle"
                    materials: PrincipledMaterial {
                        baseColor: "#333333"
                        roughness: 1.0
                    }
                    scale: Qt.vector3d(0.1, 1, 50)
                    x: (index - 10) * 2.5
                    y: -0.49
                }
            }
            
            Repeater {
                model: 20
                Model {
                    source: "#Rectangle"
                    materials: PrincipledMaterial {
                        baseColor: "#333333"
                        roughness: 1.0
                    }
                    scale: Qt.vector3d(50, 1, 0.1)
                    z: (index - 10) * 2.5
                    y: -0.49
                }
            }
            
            // Entities will be dynamically created here
            // Example entity (will be replaced with dynamic entity system)
            Model {
                source: "#Sphere"
                position: Qt.vector3d(0, 2, 0)
                materials: PrincipledMaterial {
                    baseColor: "#FF3D00"
                    roughness: 0.3
                    metalness: 0.7
                    emissiveColor: "#FF3D00"
                    emissiveFactor: 0.5
                }
                
                SequentialAnimation on eulerRotation.y {
                    running: true
                    loops: Animation.Infinite
                    NumberAnimation {
                        from: 0
                        to: 360
                        duration: 5000
                    }
                }
            }
        }
        
        // Mouse area for camera control
        MouseArea {
            anchors.fill: parent
            acceptedButtons: Qt.LeftButton | Qt.RightButton
            property point lastMousePos
            
            onPressed: (mouse) => {
                lastMousePos = Qt.point(mouse.x, mouse.y)
            }
            
            onPositionChanged: (mouse) => {
                if (pressedButtons & Qt.LeftButton) {
                    // Rotate camera
                    var dx = mouse.x - lastMousePos.x
                    camera.cameraAngle += dx * 0.5
                }
                if (pressedButtons & Qt.RightButton) {
                    // Zoom camera
                    var dy = mouse.y - lastMousePos.y
                    camera.cameraDistance = Math.max(5, Math.min(50, camera.cameraDistance + dy * 0.1))
                }
                lastMousePos = Qt.point(mouse.x, mouse.y)
            }
            
            onWheel: (wheel) => {
                // Zoom with mouse wheel
                camera.cameraDistance = Math.max(5, Math.min(50, camera.cameraDistance - wheel.angleDelta.y * 0.01))
            }
        }
        
        // ====================================================================
        // UI OVERLAY
        // ====================================================================
        
        Rectangle {
            anchors.fill: parent
            color: "transparent"
            
            // Blockchain HUD
            BlockchainHUD {
                anchors.fill: parent
            }
            
            // Top HUD
            ColumnLayout {
                anchors.top: parent.top
                anchors.left: parent.left
                anchors.right: parent.right
                anchors.margins: 20
                spacing: 10
                
                // World info
                Rectangle {
                    Layout.fillWidth: true
                    height: 60
                    color: "#AA000000"
                    radius: 8
                    border.color: "#FF3D00"
                    border.width: 1
                    
                    Column {
                        anchors.left: parent.left
                        anchors.verticalCenter: parent.verticalCenter
                        anchors.margins: 15
                        spacing: 5
                        
                        Text {
                            text: recursionEngine.worldTitle || "Recursion World"
                            font.pixelSize: 18
                            font.bold: true
                            color: "#FFFFFF"
                        }
                        
                        Text {
                            text: "World ID: " + (recursionEngine.worldId || "loading...")
                            font.pixelSize: 12
                            color: "#AAAAAA"
                        }
                    }
                }
                
                // FPS counter
                Rectangle {
                    Layout.alignSelf: Qt.AlignRight
                    width: 100
                    height: 30
                    color: "#AA000000"
                    radius: 4
                    
                    Text {
                        anchors.centerIn: parent
                        text: "FPS: " + Math.round(recursionEngine.fps || 0)
                        font.pixelSize: 14
                        color: recursionEngine.fps > 55 ? "#00FFC8" : "#FF3D00"
                    }
                }
            }
            
            // Bottom controls
            RowLayout {
                anchors.bottom: parent.bottom
                anchors.horizontalCenter: parent.horizontalCenter
                anchors.margins: 20
                spacing: 10
                
                Button {
                    text: recursionEngine.isRunning ? "Pause" : "Start"
                    onClicked: {
                        if (recursionEngine.isRunning) {
                            recursionEngine.pause()
                        } else {
                            recursionEngine.start()
                        }
                    }
                }
                
                Button {
                    text: "Export State"
                    onClicked: {
                        var snapshot = recursionEngine.exportStateSnapshot()
                        console.log("State snapshot:", JSON.stringify(snapshot))
                    }
                }
            }
        }
    }
    
    // ========================================================================
    // INITIALIZATION
    // ========================================================================
    
    Component.onCompleted: {
        // Initialize engine with default world
        if (!recursionEngine.worldId) {
            recursionEngine.initialize("default_world")
        }
    }
}
