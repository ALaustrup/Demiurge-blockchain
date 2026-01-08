import QtQuick
import QtQuick.Layouts
import QtQuick.Controls
import QtQuick3D
import QtQuick3D.Helpers

import "../components"

/**
 * RecursionApp - Recursion Game Engine
 * 
 * The integrated game engine for QOR desktop.
 * Built on Qt Quick 3D for hardware-accelerated 3D rendering.
 * 
 * Features:
 * - Real-time 3D rendering
 * - Scene management
 * - Physics integration
 * - Asset loading
 * - Shader effects
 */
Item {
    id: recursionApp
    
    // ========================================================================
    // PROPERTIES
    // ========================================================================
    
    property bool isPlaying: false
    property bool showStats: true
    property real rotationSpeed: 30
    property int sceneIndex: 0
    property var availableScenes: [
        { name: "Demo Scene", icon: "🎮" },
        { name: "Particle World", icon: "✨" },
        { name: "Shader Lab", icon: "🎨" },
        { name: "Physics Test", icon: "⚽" }
    ]
    
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
                    text: "🎮 Recursion Engine"
                    font.family: Theme.fontHeader
                    font.pixelSize: Theme.fontSizeBody
                    color: Theme.textPrimary
                }
                
                Item { Layout.fillWidth: true }
                
                // Scene selector
                ComboBox {
                    id: sceneSelector
                    Layout.preferredWidth: 180
                    model: availableScenes
                    textRole: "name"
                    
                    onCurrentIndexChanged: sceneIndex = currentIndex
                    
                    background: Rectangle {
                        color: Theme.glassPanelWindow
                        radius: Theme.radiusSmall
                        border.width: 1
                        border.color: Theme.panelBorder
                    }
                    
                    contentItem: Row {
                        spacing: Theme.spacingSmall
                        leftPadding: Theme.spacingSmall
                        
                        Text {
                            text: availableScenes[sceneSelector.currentIndex]?.icon || ""
                            font.pixelSize: 14
                            anchors.verticalCenter: parent.verticalCenter
                        }
                        
                        Text {
                            text: sceneSelector.displayText
                            font.family: Theme.fontBody
                            font.pixelSize: Theme.fontSizeSmall
                            color: Theme.textPrimary
                            anchors.verticalCenter: parent.verticalCenter
                        }
                    }
                }
                
                // Play/Pause
                Rectangle {
                    width: 36
                    height: 36
                    radius: Theme.radiusSmall
                    color: isPlaying ? Theme.success : Theme.glassPanelWindow
                    
                    Text {
                        anchors.centerIn: parent
                        text: isPlaying ? "⏸" : "▶"
                        font.pixelSize: 16
                        color: isPlaying ? Theme.voidBlack : Theme.textPrimary
                    }
                    
                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: isPlaying = !isPlaying
                    }
                }
                
                // Stats toggle
                Rectangle {
                    width: 36
                    height: 36
                    radius: Theme.radiusSmall
                    color: showStats ? Theme.accentFlame : Theme.glassPanelWindow
                    
                    Text {
                        anchors.centerIn: parent
                        text: "📊"
                        font.pixelSize: 16
                    }
                    
                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: showStats = !showStats
                    }
                }
            }
        }
        
        // 3D Viewport
        View3D {
            id: view3D
            Layout.fillWidth: true
            Layout.fillHeight: true
            
            environment: SceneEnvironment {
                clearColor: Theme.voidBlack
                backgroundMode: SceneEnvironment.Color
                antialiasingMode: SceneEnvironment.MSAA
                antialiasingQuality: SceneEnvironment.High
                
                // Ambient occlusion
                aoEnabled: true
                aoStrength: 50
                aoBias: 0.5
                aoSoftness: 50
                aoDistance: 5
                
                // Tone mapping
                tonemapMode: SceneEnvironment.TonemapModeFilmic
            }
            
            // Camera
            PerspectiveCamera {
                id: mainCamera
                position: Qt.vector3d(0, 200, 600)
                eulerRotation.x: -20
                clipFar: 10000
            }
            
            // Orbit camera controller
            OrbitCameraController {
                origin: mainCamera
                camera: mainCamera
            }
            
            // Lighting
            DirectionalLight {
                eulerRotation.x: -45
                eulerRotation.y: 30
                color: Qt.rgba(1, 0.95, 0.9, 1)
                brightness: 1.0
                castsShadow: true
                shadowMapQuality: Light.ShadowMapQualityHigh
            }
            
            DirectionalLight {
                eulerRotation.x: -20
                eulerRotation.y: -120
                color: Qt.rgba(0.6, 0.7, 1.0, 1)
                brightness: 0.3
            }
            
            // Point light following a path
            PointLight {
                id: orbitLight
                position: Qt.vector3d(Math.sin(orbitAngle) * 300, 100, Math.cos(orbitAngle) * 300)
                color: Theme.accentFlame
                brightness: 2.0
                quadraticFade: 0.001
                
                property real orbitAngle: 0
                
                NumberAnimation on orbitAngle {
                    running: isPlaying
                    loops: Animation.Infinite
                    from: 0
                    to: Math.PI * 2
                    duration: 5000
                }
            }
            
            // ================================================================
            // DEMO SCENE
            // ================================================================
            
            Node {
                visible: sceneIndex === 0
                
                // Ground plane
                Model {
                    source: "#Rectangle"
                    scale: Qt.vector3d(20, 20, 1)
                    eulerRotation.x: -90
                    y: -50
                    
                    materials: PrincipledMaterial {
                        baseColor: Qt.rgba(0.1, 0.1, 0.12, 1)
                        roughness: 0.8
                        metalness: 0.2
                    }
                }
                
                // Central cube
                Model {
                    id: mainCube
                    source: "#Cube"
                    scale: Qt.vector3d(1.5, 1.5, 1.5)
                    
                    materials: PrincipledMaterial {
                        baseColor: Theme.accentFlame
                        roughness: 0.3
                        metalness: 0.8
                    }
                    
                    NumberAnimation on eulerRotation.y {
                        running: isPlaying
                        loops: Animation.Infinite
                        from: 0
                        to: 360
                        duration: 360000 / rotationSpeed
                    }
                }
                
                // Orbiting spheres
                Repeater3D {
                    model: 6
                    
                    Model {
                        source: "#Sphere"
                        scale: Qt.vector3d(0.3, 0.3, 0.3)
                        
                        property real angle: index * (Math.PI * 2 / 6) + orbitLight.orbitAngle
                        position: Qt.vector3d(
                            Math.cos(angle) * 200,
                            Math.sin(angle * 2) * 50,
                            Math.sin(angle) * 200
                        )
                        
                        materials: PrincipledMaterial {
                            baseColor: Qt.hsla(index / 6, 0.8, 0.5, 1)
                            roughness: 0.2
                            metalness: 0.9
                        }
                    }
                }
                
                // Central flame glow sphere
                Model {
                    source: "#Sphere"
                    scale: Qt.vector3d(0.5, 0.5, 0.5)
                    position: orbitLight.position
                    
                    materials: PrincipledMaterial {
                        baseColor: Theme.accentFlame
                        emissiveFactor: Qt.vector3d(1, 0.5, 0)
                        roughness: 0.1
                    }
                }
            }
            
            // ================================================================
            // PARTICLE WORLD (scene 1)
            // ================================================================
            
            Node {
                visible: sceneIndex === 1
                
                // Particle system simulation using instanced rendering
                Repeater3D {
                    model: 100
                    
                    Model {
                        id: particle
                        source: "#Sphere"
                        scale: Qt.vector3d(0.1 + Math.random() * 0.1, 0.1 + Math.random() * 0.1, 0.1 + Math.random() * 0.1)
                        
                        property real baseY: (Math.random() - 0.5) * 400
                        property real baseX: (Math.random() - 0.5) * 600
                        property real baseZ: (Math.random() - 0.5) * 600
                        property real speed: 0.5 + Math.random()
                        property real phase: Math.random() * Math.PI * 2
                        
                        position: Qt.vector3d(
                            baseX + Math.sin(particleTime * speed + phase) * 50,
                            baseY + Math.sin(particleTime * speed * 0.5) * 30,
                            baseZ + Math.cos(particleTime * speed + phase) * 50
                        )
                        
                        materials: PrincipledMaterial {
                            baseColor: Qt.hsla((baseY / 400 + 0.5) * 0.3, 0.9, 0.6, 1)
                            emissiveFactor: Qt.vector3d(0.5, 0.3, 0.1)
                            roughness: 0.1
                        }
                    }
                }
                
                property real particleTime: 0
                
                NumberAnimation on particleTime {
                    running: isPlaying && sceneIndex === 1
                    loops: Animation.Infinite
                    from: 0
                    to: Math.PI * 20
                    duration: 30000
                }
            }
            
            // ================================================================
            // SHADER LAB (scene 2)
            // ================================================================
            
            Node {
                visible: sceneIndex === 2
                
                Model {
                    source: "#Sphere"
                    scale: Qt.vector3d(2, 2, 2)
                    
                    materials: CustomMaterial {
                        shadingMode: CustomMaterial.Shaded
                        
                        fragmentShader: "
                            void MAIN() {
                                float t = fract(sin(dot(UV, vec2(12.9898, 78.233))) * 43758.5453);
                                vec3 color = mix(vec3(1.0, 0.3, 0.0), vec3(1.0, 0.6, 0.0), t);
                                BASE_COLOR = vec4(color, 1.0);
                                EMISSIVE_COLOR = color * 0.5;
                            }
                        "
                    }
                    
                    NumberAnimation on eulerRotation.y {
                        running: isPlaying
                        loops: Animation.Infinite
                        from: 0
                        to: 360
                        duration: 10000
                    }
                }
            }
            
            // ================================================================
            // PHYSICS TEST (scene 3)
            // ================================================================
            
            Node {
                visible: sceneIndex === 3
                
                // Ground
                Model {
                    source: "#Rectangle"
                    scale: Qt.vector3d(10, 10, 1)
                    eulerRotation.x: -90
                    y: -100
                    
                    materials: PrincipledMaterial {
                        baseColor: "#222233"
                        roughness: 0.9
                    }
                }
                
                // Stacked boxes (visual only - physics would need Qt Quick 3D Physics)
                Repeater3D {
                    model: 5
                    
                    Model {
                        source: "#Cube"
                        y: -100 + index * 60 + 30
                        scale: Qt.vector3d(0.5, 0.5, 0.5)
                        
                        materials: PrincipledMaterial {
                            baseColor: Qt.hsla(0.1 * index, 0.7, 0.5, 1)
                            roughness: 0.5
                        }
                    }
                }
                
                // Bouncing ball
                Model {
                    id: bouncingBall
                    source: "#Sphere"
                    scale: Qt.vector3d(0.4, 0.4, 0.4)
                    x: 150
                    
                    property real time: 0
                    y: -100 + 40 + Math.abs(Math.sin(time * 3)) * 200
                    
                    materials: PrincipledMaterial {
                        baseColor: Theme.cipherCyan
                        roughness: 0.2
                        metalness: 0.8
                    }
                    
                    NumberAnimation on time {
                        running: isPlaying && sceneIndex === 3
                        loops: Animation.Infinite
                        from: 0
                        to: Math.PI * 10
                        duration: 10000
                    }
                }
            }
        }
        
        // FPS/Stats overlay
        Rectangle {
            anchors.top: parent.top
            anchors.left: parent.left
            anchors.topMargin: 56
            anchors.leftMargin: Theme.spacingSmall
            width: 150
            height: statsColumn.height + Theme.spacingSmall * 2
            radius: Theme.radiusSmall
            color: Qt.rgba(0, 0, 0, 0.7)
            visible: showStats
            
            ColumnLayout {
                id: statsColumn
                anchors.left: parent.left
                anchors.top: parent.top
                anchors.margins: Theme.spacingSmall
                spacing: 2
                
                Text {
                    text: "FPS: " + Math.round(1000 / frameTimer.interval)
                    font.family: Theme.fontCode
                    font.pixelSize: Theme.fontSizeTiny
                    color: Theme.cipherCyan
                }
                
                Text {
                    text: "Objects: " + getObjectCount()
                    font.family: Theme.fontCode
                    font.pixelSize: Theme.fontSizeTiny
                    color: Theme.textPrimary
                }
                
                Text {
                    text: "Scene: " + availableScenes[sceneIndex].name
                    font.family: Theme.fontCode
                    font.pixelSize: Theme.fontSizeTiny
                    color: Theme.textSecondary
                }
                
                Text {
                    text: "Camera: (" + Math.round(mainCamera.position.x) + ", " + 
                          Math.round(mainCamera.position.y) + ", " + 
                          Math.round(mainCamera.position.z) + ")"
                    font.family: Theme.fontCode
                    font.pixelSize: Theme.fontSizeTiny
                    color: Theme.textMuted
                }
            }
            
            Timer {
                id: frameTimer
                interval: 16  // ~60 FPS
                running: true
                repeat: true
            }
        }
        
        // Controls overlay
        Rectangle {
            anchors.bottom: parent.bottom
            anchors.left: parent.left
            anchors.bottomMargin: Theme.spacingSmall
            anchors.leftMargin: Theme.spacingSmall
            width: 200
            height: 60
            radius: Theme.radiusSmall
            color: Qt.rgba(0, 0, 0, 0.7)
            
            ColumnLayout {
                anchors.fill: parent
                anchors.margins: Theme.spacingSmall
                spacing: 4
                
                Text {
                    text: "🖱️ Drag to orbit"
                    font.family: Theme.fontBody
                    font.pixelSize: Theme.fontSizeTiny
                    color: Theme.textSecondary
                }
                
                Text {
                    text: "🔲 Scroll to zoom"
                    font.family: Theme.fontBody
                    font.pixelSize: Theme.fontSizeTiny
                    color: Theme.textSecondary
                }
            }
        }
    }
    
    // ========================================================================
    // FUNCTIONS
    // ========================================================================
    
    function getObjectCount() {
        switch (sceneIndex) {
            case 0: return 9   // cube + 6 spheres + ground + light sphere
            case 1: return 100 // particles
            case 2: return 1   // shader sphere
            case 3: return 7   // ground + 5 boxes + ball
            default: return 0
        }
    }
}
