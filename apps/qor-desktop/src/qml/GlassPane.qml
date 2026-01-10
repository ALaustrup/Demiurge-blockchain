// GlassPane.qml - Core Glass Material Component
import QtQuick
import QtQuick.Effects

Rectangle {
    id: root
    
    // ============================================
    // PROPERTIES
    // ============================================
    
    property real blurRadius: 64
    property real noiseStrength: 0.15
    property color tintColor: Qt.rgba(0.02, 0.02, 0.02, 0.85)
    property bool animated: false
    property bool frosted: false
    property real borderGlow: 0.3
    property color glowColor: Qt.rgba(0.3, 0.8, 1.0, borderGlow)
    
    // Audio reactivity
    property real pulseIntensity: 0.0
    
    // Advanced options
    property bool captureBackground: true
    property bool showNoise: true
    property bool showGlow: true
    
    // ============================================
    // BASE
    // ============================================
    
    color: "transparent"
    
    // ============================================
    // BACKGROUND CAPTURE
    // ============================================
    
    ShaderEffectSource {
        id: backgroundSource
        anchors.fill: parent
        sourceItem: root.parent
        sourceRect: Qt.rect(root.x, root.y, root.width, root.height)
        live: root.captureBackground
        hideSource: false
        visible: false
    }
    
    // ============================================
    // GLASS BLUR EFFECT
    // ============================================
    
    MultiEffect {
        id: blurEffect
        anchors.fill: parent
        source: backgroundSource
        visible: root.captureBackground
        
        // Blur settings
        blur: 1.0
        blurEnabled: true
        blurMax: root.blurRadius + (root.pulseIntensity * 16)
        blurMultiplier: 0.8
        
        // Color adjustments
        saturation: root.frosted ? 0.3 : 0.6
        brightness: root.frosted ? -0.3 : -0.1
        contrast: 0.2
        
        // Smooth animation for blur changes
        Behavior on blurMax {
            NumberAnimation {
                duration: 300
                easing.type: Easing.InOutQuad
            }
        }
    }
    
    // ============================================
    // ANIMATED BREATHING EFFECT (Optional)
    // ============================================
    
    SequentialAnimation on blurRadius {
        running: root.animated
        loops: Animation.Infinite
        
        NumberAnimation {
            from: root.blurRadius - 8
            to: root.blurRadius + 8
            duration: 3000
            easing.type: Easing.InOutSine
        }
        
        NumberAnimation {
            from: root.blurRadius + 8
            to: root.blurRadius - 8
            duration: 3000
            easing.type: Easing.InOutSine
        }
    }
    
    // ============================================
    // NOISE TEXTURE OVERLAY
    // ============================================
    
    ShaderEffect {
        id: noiseOverlay
        anchors.fill: parent
        visible: root.showNoise
        
        property real time: 0.0
        property real noiseStrength: root.noiseStrength
        
        // Animate noise over time
        NumberAnimation on time {
            from: 0
            to: 100
            duration: 100000
            loops: Animation.Infinite
        }
        
        fragmentShader: "
            #version 440
            layout(location = 0) in vec2 qt_TexCoord0;
            layout(location = 0) out vec4 fragColor;
            layout(std140, binding = 0) uniform buf {
                mat4 qt_Matrix;
                float qt_Opacity;
                float time;
                float noiseStrength;
            };
            
            // Simple hash-based noise
            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
            }
            
            void main() {
                vec2 st = qt_TexCoord0;
                
                // Animated noise
                float noise = random(st + time * 0.001);
                
                // Apply noise strength
                noise *= noiseStrength;
                
                // Output with opacity
                fragColor = vec4(vec3(noise), noise * qt_Opacity);
            }
        "
    }
    
    // ============================================
    // TINT LAYER
    // ============================================
    
    Rectangle {
        id: tintLayer
        anchors.fill: parent
        color: root.tintColor
        radius: root.radius
    }
    
    // ============================================
    // EDGE GLOW (Neon Border)
    // ============================================
    
    Rectangle {
        id: edgeGlow
        anchors.fill: parent
        color: "transparent"
        border.width: 1
        border.color: root.glowColor
        radius: root.radius
        visible: root.showGlow
        
        // Smooth glow transitions
        Behavior on border.color {
            ColorAnimation { duration: 300 }
        }
        
        // Glow effect
        layer.enabled: true
        layer.effect: MultiEffect {
            blurEnabled: true
            blur: 0.8
            blurMax: 16
        }
    }
    
    // ============================================
    // INNER HIGHLIGHT (Subtle)
    // ============================================
    
    Rectangle {
        anchors {
            fill: parent
            margins: 1
        }
        color: "transparent"
        border.width: 1
        border.color: Qt.rgba(1, 1, 1, 0.05)
        radius: root.radius - 1
        visible: root.showGlow
    }
}
