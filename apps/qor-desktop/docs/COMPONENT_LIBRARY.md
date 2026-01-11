# QOR Component Library
## Glass Engine UI Components Reference

**Version:** 1.0.0  
**Framework:** Qt 6.10+ / QML

---

## Table of Contents

1. [Glass Materials](#1-glass-materials)
2. [Typography](#2-typography)
3. [Buttons & Controls](#3-buttons--controls)
4. [Data Visualization](#4-data-visualization)
5. [Animations](#5-animations)
6. [Widgets](#6-widgets)

---

## 1. Glass Materials

### GlassPaneAdvanced

Extended glass material with customizable effects.

```qml
// GlassPaneAdvanced.qml
import QtQuick
import QtQuick.Effects

Rectangle {
    id: root
    
    // Configuration
    property real blurRadius: 64
    property real noiseStrength: 0.15
    property color tintColor: Qt.rgba(0.02, 0.02, 0.02, 0.85)
    property bool animated: true
    property bool frosted: false
    property real borderGlow: 0.3
    property color glowColor: Qt.rgba(0.3, 0.8, 1.0, borderGlow)
    
    // Edge lighting (reactive to audio)
    property real pulseIntensity: 0.0
    
    color: "transparent"
    
    ShaderEffectSource {
        id: backgroundSource
        sourceItem: root.parent
        sourceRect: Qt.rect(root.x, root.y, root.width, root.height)
        live: true
        hideSource: false
    }
    
    MultiEffect {
        anchors.fill: parent
        source: backgroundSource
        
        blur: 1.0
        blurMax: root.blurRadius + (pulseIntensity * 16)
        blurMultiplier: 0.8
        
        saturation: root.frosted ? 0.3 : 0.6
        brightness: root.frosted ? -0.3 : -0.1
        contrast: 0.2
    }
    
    // Animated noise
    ShaderEffect {
        anchors.fill: parent
        property real time: 0.0
        property real noiseStrength: root.noiseStrength
        
        NumberAnimation on time {
            from: 0; to: 100
            duration: 100000
            loops: Animation.Infinite
        }
        
        fragmentShader: "qrc:/shaders/noise.frag"
    }
    
    // Tint
    Rectangle {
        anchors.fill: parent
        color: root.tintColor
        radius: parent.radius
    }
    
    // Edge glow with pulse
    Rectangle {
        anchors.fill: parent
        color: "transparent"
        border.width: 1
        border.color: root.glowColor
        radius: parent.radius
        
        Behavior on border.color {
            ColorAnimation { duration: 300 }
        }
    }
}
```

### NeumorphicGlass

Neumorphic-style glass with depth.

```qml
// NeumorphicGlass.qml
import QtQuick
import QtQuick.Effects

Item {
    id: root
    
    property real depth: 10
    property bool raised: true
    property color baseColor: Qt.rgba(0.05, 0.05, 0.05, 0.9)
    
    Rectangle {
        id: base
        anchors.fill: parent
        color: root.baseColor
        radius: 15
        
        layer.enabled: true
        layer.effect: MultiEffect {
            shadowEnabled: true
            shadowBlur: root.depth
            shadowHorizontalOffset: root.raised ? -root.depth/2 : root.depth/2
            shadowVerticalOffset: root.raised ? -root.depth/2 : root.depth/2
            shadowColor: root.raised 
                ? Qt.rgba(1, 1, 1, 0.1)
                : Qt.rgba(0, 0, 0, 0.5)
        }
    }
    
    // Inner shadow (opposite direction)
    Rectangle {
        anchors.fill: parent
        radius: parent.radius
        color: "transparent"
        
        layer.enabled: true
        layer.effect: InnerShadow {
            horizontalOffset: root.raised ? root.depth/2 : -root.depth/2
            verticalOffset: root.raised ? root.depth/2 : -root.depth/2
            radius: root.depth
            samples: 16
            color: root.raised 
                ? Qt.rgba(0, 0, 0, 0.3)
                : Qt.rgba(1, 1, 1, 0.05)
        }
    }
}
```

---

## 2. Typography

### NeonText

Glowing text with audio reactivity.

```qml
// NeonText.qml
import QtQuick
import QtQuick.Effects

Item {
    id: root
    
    property alias text: label.text
    property alias font: label.font
    property color textColor: AudioColors.primaryAccent
    property real glowStrength: 1.0
    property bool audioReactive: false
    
    implicitWidth: label.implicitWidth
    implicitHeight: label.implicitHeight
    
    Text {
        id: label
        anchors.centerIn: parent
        color: root.textColor
        
        layer.enabled: true
        layer.effect: MultiEffect {
            blurEnabled: true
            blur: 0.5
            blurMax: 16 * root.glowStrength
            
            // Audio reactive glow
            property real audioPulse: root.audioReactive 
                ? AudioColors.bassIntensity 
                : 0.0
            
            Behavior on audioPulse {
                NumberAnimation { duration: 100 }
            }
            
            brightness: audioPulse * 0.3
        }
    }
    
    // Duplicate for stronger glow
    Text {
        anchors.centerIn: parent
        text: label.text
        font: label.font
        color: root.textColor
        opacity: 0.5
        
        layer.enabled: true
        layer.effect: MultiEffect {
            blurEnabled: true
            blur: 1.0
            blurMax: 32 * root.glowStrength
        }
    }
}
```

### CodeText

Monospace text with syntax highlighting capability.

```qml
// CodeText.qml
import QtQuick

Text {
    id: root
    
    property string syntaxTheme: "cyberpunk"
    
    font.family: "Fira Code"
    font.pixelSize: 14
    color: Qt.rgba(0.8, 0.8, 0.8, 1)
    
    // Syntax colors
    property var syntaxColors: ({
        "keyword": AudioColors.secondaryAccent,
        "string": AudioColors.tertiaryAccent,
        "number": AudioColors.primaryAccent,
        "comment": Qt.rgba(0.5, 0.5, 0.5, 0.8),
        "function": Qt.rgba(0.4, 0.8, 0.4, 1)
    })
    
    textFormat: Text.RichText
    wrapMode: Text.Wrap
}
```

---

## 3. Buttons & Controls

### GlassButton

Primary button with glass aesthetic.

```qml
// GlassButton.qml
import QtQuick
import QtQuick.Controls

Button {
    id: root
    
    property color accentColor: AudioColors.primaryAccent
    property bool glowOnHover: true
    
    implicitWidth: 150
    implicitHeight: 45
    
    background: GlassPane {
        blurRadius: 32
        tintColor: root.down 
            ? Qt.rgba(0.1, 0.1, 0.1, 0.95)
            : Qt.rgba(0.05, 0.05, 0.05, 0.85)
        radius: 12
        
        borderGlow: root.hovered && root.glowOnHover ? 0.8 : 0.3
        glowColor: root.accentColor
        
        Behavior on borderGlow {
            NumberAnimation { duration: 200 }
        }
    }
    
    contentItem: Text {
        text: root.text
        font.pixelSize: 14
        font.family: "SF Pro Display"
        font.weight: Font.Medium
        color: root.enabled 
            ? (root.hovered ? Qt.rgba(1, 1, 1, 1) : Qt.rgba(1, 1, 1, 0.9))
            : Qt.rgba(1, 1, 1, 0.4)
        horizontalAlignment: Text.AlignHCenter
        verticalAlignment: Text.AlignVCenter
        
        Behavior on color {
            ColorAnimation { duration: 150 }
        }
    }
    
    // Press animation
    scale: root.down ? 0.95 : 1.0
    Behavior on scale {
        SpringAnimation {
            spring: 5
            damping: 0.5
        }
    }
}
```

### IconButton

Circular icon button.

```qml
// IconButton.qml
import QtQuick
import QtQuick.Controls

RoundButton {
    id: root
    
    property string iconText: ""
    property color iconColor: AudioColors.primaryAccent
    property real iconSize: 20
    
    width: 40
    height: 40
    
    background: Rectangle {
        radius: width / 2
        color: root.down 
            ? Qt.rgba(0.2, 0.2, 0.2, 0.8)
            : (root.hovered 
                ? Qt.rgba(0.15, 0.15, 0.15, 0.7)
                : Qt.rgba(0.1, 0.1, 0.1, 0.5))
        
        border.width: root.hovered ? 2 : 0
        border.color: root.iconColor
        
        Behavior on color {
            ColorAnimation { duration: 150 }
        }
        
        Behavior on border.width {
            NumberAnimation { duration: 150 }
        }
    }
    
    contentItem: Text {
        text: root.iconText
        font.pixelSize: root.iconSize
        font.family: "Segoe Fluent Icons"
        color: root.iconColor
        horizontalAlignment: Text.AlignHCenter
        verticalAlignment: Text.AlignVCenter
    }
    
    scale: root.down ? 0.9 : 1.0
    Behavior on scale {
        SpringAnimation {
            spring: 4
            damping: 0.4
        }
    }
}
```

### SliderNeon

Glowing slider control.

```qml
// SliderNeon.qml
import QtQuick
import QtQuick.Controls

Slider {
    id: root
    
    property color accentColor: AudioColors.primaryAccent
    
    background: Rectangle {
        x: root.leftPadding
        y: root.topPadding + root.availableHeight / 2 - height / 2
        implicitWidth: 200
        implicitHeight: 4
        width: root.availableWidth
        height: implicitHeight
        radius: 2
        color: Qt.rgba(0.3, 0.3, 0.3, 0.5)
        
        // Filled portion
        Rectangle {
            width: root.visualPosition * parent.width
            height: parent.height
            radius: parent.radius
            color: root.accentColor
            
            // Glow effect
            layer.enabled: true
            layer.effect: MultiEffect {
                blurEnabled: true
                blur: 1.0
                blurMax: 16
            }
        }
    }
    
    handle: Rectangle {
        x: root.leftPadding + root.visualPosition * (root.availableWidth - width)
        y: root.topPadding + root.availableHeight / 2 - height / 2
        implicitWidth: 20
        implicitHeight: 20
        radius: 10
        color: root.accentColor
        border.width: 2
        border.color: Qt.rgba(1, 1, 1, 0.8)
        
        scale: root.pressed ? 1.2 : 1.0
        Behavior on scale {
            SpringAnimation {
                spring: 4
                damping: 0.3
            }
        }
        
        // Glow
        layer.enabled: true
        layer.effect: MultiEffect {
            blurEnabled: true
            blur: 0.8
            blurMax: 24
        }
    }
}
```

---

## 4. Data Visualization

### SystemGraph

Real-time line graph with neon styling.

```qml
// SystemGraph.qml
import QtQuick
import QtQuick.Shapes

Item {
    id: root
    
    property string title: "Graph"
    property real value: 0.0
    property color color: AudioColors.primaryAccent
    property var dataPoints: []
    property int maxPoints: 60
    
    Rectangle {
        anchors.fill: parent
        color: Qt.rgba(0.05, 0.05, 0.05, 0.5)
        radius: 10
        border.width: 1
        border.color: Qt.rgba(root.color.r, root.color.g, root.color.b, 0.3)
        
        // Title
        Text {
            anchors {
                top: parent.top
                left: parent.left
                margins: 10
            }
            text: root.title
            font.pixelSize: 12
            font.weight: Font.Medium
            color: Qt.rgba(1, 1, 1, 0.7)
        }
        
        // Current value
        Text {
            anchors {
                top: parent.top
                right: parent.right
                margins: 10
            }
            text: Math.round(root.value) + "%"
            font.pixelSize: 16
            font.weight: Font.Bold
            color: root.color
        }
        
        // Graph
        Shape {
            id: graph
            anchors {
                fill: parent
                margins: 20
            }
            
            ShapePath {
                strokeWidth: 2
                strokeColor: root.color
                fillColor: "transparent"
                capStyle: ShapePath.RoundCap
                joinStyle: ShapePath.RoundJoin
                
                PathLine {
                    id: graphPath
                }
            }
            
            // Update path when data changes
            Connections {
                target: root
                function onDataPointsChanged() {
                    updateGraphPath()
                }
            }
            
            function updateGraphPath() {
                let path = graph.data[0]
                path.startX = 0
                path.startY = graph.height
                
                let points = root.dataPoints
                if (points.length === 0) return
                
                let stepX = graph.width / (root.maxPoints - 1)
                
                for (let i = 0; i < points.length; i++) {
                    let x = i * stepX
                    let y = graph.height - (points[i] / 100 * graph.height)
                    
                    if (i === 0) {
                        path.startX = x
                        path.startY = y
                    }
                }
            }
        }
        
        // Gradient fill under line
        Rectangle {
            anchors {
                fill: graph
            }
            
            gradient: Gradient {
                GradientStop { 
                    position: 0.0
                    color: Qt.rgba(root.color.r, root.color.g, root.color.b, 0.3)
                }
                GradientStop { 
                    position: 1.0
                    color: Qt.rgba(root.color.r, root.color.g, root.color.b, 0.0)
                }
            }
        }
    }
}
```

### CircularProgress

Neon circular progress indicator.

```qml
// CircularProgress.qml
import QtQuick
import QtQuick.Shapes

Item {
    id: root
    
    property real value: 0.0
    property real maxValue: 100.0
    property color color: AudioColors.primaryAccent
    property real lineWidth: 8
    property string centerText: ""
    
    width: 100
    height: 100
    
    Shape {
        anchors.centerIn: parent
        width: parent.width
        height: parent.height
        
        // Background circle
        ShapePath {
            strokeWidth: root.lineWidth
            strokeColor: Qt.rgba(0.3, 0.3, 0.3, 0.3)
            fillColor: "transparent"
            capStyle: ShapePath.RoundCap
            
            PathAngleArc {
                centerX: root.width / 2
                centerY: root.height / 2
                radiusX: (root.width - root.lineWidth) / 2
                radiusY: (root.height - root.lineWidth) / 2
                startAngle: -90
                sweepAngle: 360
            }
        }
        
        // Progress arc
        ShapePath {
            strokeWidth: root.lineWidth
            strokeColor: root.color
            fillColor: "transparent"
            capStyle: ShapePath.RoundCap
            
            PathAngleArc {
                centerX: root.width / 2
                centerY: root.height / 2
                radiusX: (root.width - root.lineWidth) / 2
                radiusY: (root.height - root.lineWidth) / 2
                startAngle: -90
                sweepAngle: (root.value / root.maxValue) * 360
            }
            
            layer.enabled: true
            layer.effect: MultiEffect {
                blurEnabled: true
                blur: 0.5
                blurMax: 16
            }
        }
    }
    
    // Center text
    NeonText {
        anchors.centerIn: parent
        text: root.centerText || Math.round((root.value / root.maxValue) * 100) + "%"
        font.pixelSize: root.width / 4
        font.weight: Font.Bold
        textColor: root.color
        glowStrength: 0.8
    }
}
```

### WaveformVisualizer

Audio waveform display.

```qml
// WaveformVisualizer.qml
import QtQuick
import QtQuick.Shapes

Item {
    id: root
    
    property var audioBuffer: []
    property color color: AudioColors.primaryAccent
    property int barCount: 32
    property real barSpacing: 2
    
    Repeater {
        model: root.barCount
        
        Rectangle {
            x: index * (root.width / root.barCount)
            width: (root.width / root.barCount) - root.barSpacing
            height: root.audioBuffer[index] || 4
            
            anchors.bottom: parent.bottom
            
            color: root.color
            radius: width / 2
            
            Behavior on height {
                SpringAnimation {
                    spring: 5
                    damping: 0.3
                }
            }
            
            layer.enabled: true
            layer.effect: MultiEffect {
                blurEnabled: true
                blur: 0.5
                blurMax: 12
            }
        }
    }
}
```

---

## 5. Animations

### SpringBehavior

Reusable spring animation preset.

```qml
// SpringBehavior.qml
SpringAnimation {
    property string preset: "smooth" // smooth, bouncy, snappy, slow
    
    spring: {
        switch(preset) {
            case "bouncy": return 2
            case "snappy": return 5
            case "slow": return 1.5
            default: return 3 // smooth
        }
    }
    
    damping: {
        switch(preset) {
            case "bouncy": return 0.15
            case "snappy": return 0.5
            case "slow": return 0.4
            default: return 0.3
        }
    }
    
    epsilon: 0.01
}
```

### PulseAnimation

Continuous pulse effect.

```qml
// PulseAnimation.qml
SequentialAnimation {
    property real from: 1.0
    property real to: 1.2
    property int duration: 2000
    
    loops: Animation.Infinite
    
    NumberAnimation {
        from: parent.from
        to: parent.to
        duration: parent.duration / 2
        easing.type: Easing.InOutSine
    }
    
    NumberAnimation {
        from: parent.to
        to: parent.from
        duration: parent.duration / 2
        easing.type: Easing.InOutSine
    }
}
```

### GlowPulse

Animated glow effect.

```qml
// GlowPulse.qml
import QtQuick
import QtQuick.Effects

Item {
    id: root
    
    property alias source: effect.source
    property color glowColor: AudioColors.primaryAccent
    property real intensity: 1.0
    property int duration: 2000
    
    MultiEffect {
        id: effect
        anchors.fill: parent
        
        blurEnabled: true
        blur: 1.0
        blurMax: 32
        
        colorization: root.intensity
        colorizationColor: root.glowColor
        
        SequentialAnimation on colorization {
            loops: Animation.Infinite
            NumberAnimation {
                from: root.intensity * 0.5
                to: root.intensity
                duration: root.duration / 2
                easing.type: Easing.InOutSine
            }
            NumberAnimation {
                from: root.intensity
                to: root.intensity * 0.5
                duration: root.duration / 2
                easing.type: Easing.InOutSine
            }
        }
    }
}
```

---

## 6. Widgets

### MiniWidget

Compact widget template.

```qml
// MiniWidget.qml
import QtQuick

BaseWidget {
    id: root
    
    width: 200
    height: 150
    
    property string icon: ""
    property string subtitle: ""
    property color accentColor: AudioColors.primaryAccent
    
    content: Item {
        Column {
            anchors.centerIn: parent
            spacing: 10
            
            Text {
                anchors.horizontalCenter: parent.horizontalCenter
                text: root.icon
                font.pixelSize: 48
                color: root.accentColor
            }
            
            Text {
                anchors.horizontalCenter: parent.horizontalCenter
                text: root.widgetName
                font.pixelSize: 16
                font.weight: Font.Medium
                color: Qt.rgba(1, 1, 1, 0.9)
            }
            
            Text {
                anchors.horizontalCenter: parent.horizontalCenter
                text: root.subtitle
                font.pixelSize: 12
                color: Qt.rgba(1, 1, 1, 0.6)
            }
        }
    }
}
```

---

## Usage Examples

### Basic Glass Panel

```qml
GlassPane {
    width: 400
    height: 300
    blurRadius: 64
    tintColor: Qt.rgba(0.02, 0.02, 0.02, 0.85)
    
    Text {
        anchors.centerIn: parent
        text: "Glass Panel"
        font.pixelSize: 24
        color: "white"
    }
}
```

### Interactive Button

```qml
GlassButton {
    text: "Launch Widget"
    accentColor: AudioColors.primaryAccent
    onClicked: {
        console.log("Button clicked!")
    }
}
```

### Real-time Graph

```qml
SystemGraph {
    width: 300
    height: 150
    title: "CPU Usage"
    value: SystemMonitor.cpuUsage
    color: AudioColors.primaryAccent
    dataPoints: SystemMonitor.cpuHistory
}
```

---

## Best Practices

1. **Performance:** Use `layer.enabled` sparingly - only on items that need effects
2. **Consistency:** Always use the same blur radius within a context (e.g., all panels in a view)
3. **Accessibility:** Ensure text contrast meets WCAG standards even with glass backgrounds
4. **Responsiveness:** Use anchors and Layout items for scalable designs
5. **Audio Reactivity:** Bind to `AudioColors` properties for dynamic color changes

---

**Document Version:** 1.0.0  
**Last Updated:** January 7, 2026  
**Status:** 📚 REFERENCE GUIDE
