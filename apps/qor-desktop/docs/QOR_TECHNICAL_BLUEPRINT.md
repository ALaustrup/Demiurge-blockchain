# QOR Desktop Environment - Technical Blueprint
## The Glass Engine Architecture

**Version:** 1.0.0  
**Framework:** Qt 6.10+ / Qt Quick / C++20  
**Target Platform:** Windows, Linux, macOS  
**Graphics:** OpenGL 4.5+ / Vulkan (optional)

---

## 1. Executive Summary

QOR is a standalone desktop environment that serves as the visual gateway to the Demiurge Blockchain. It combines ancient, mystical aesthetics with modern glassmorphism, creating an ethereal interface where "ancient code meets liquid glass."

**Core Principles:**
- **Glass-first Design:** Every surface uses real-time background blur and layered opacity
- **Reactive Visuals:** UI responds to audio analysis, system events, and blockchain state
- **Fluid Motion:** Physics-based animations with spring dynamics
- **GPU-Accelerated:** All visual effects leverage Qt Quick's scene graph and custom shaders
- **Modular Architecture:** Widget-based system with hot-reload capability

---

## 2. Visual Language: The Glass Engine

### 2.1 Material System

#### Base Glass Shader (QML ShaderEffect)

```qml
// GlassPane.qml
import QtQuick
import QtQuick.Effects

Rectangle {
    id: root
    
    property real blurRadius: 64
    property real noiseStrength: 0.15
    property color tintColor: Qt.rgba(0.02, 0.02, 0.02, 0.85)
    property bool animated: true
    
    color: "transparent"
    
    // Capture background
    ShaderEffectSource {
        id: backgroundSource
        sourceItem: root.parent
        sourceRect: Qt.rect(root.x, root.y, root.width, root.height)
        live: true
        hideSource: false
    }
    
    // Apply glass effect
    MultiEffect {
        anchors.fill: parent
        source: backgroundSource
        
        blur: 1.0
        blurMax: root.blurRadius
        blurMultiplier: 0.8
        
        saturation: 0.6
        brightness: -0.1
        contrast: 0.2
        
        // Reactive animation
        SequentialAnimation on blurMax {
            running: root.animated
            loops: Animation.Infinite
            NumberAnimation { from: root.blurRadius - 8; to: root.blurRadius + 8; duration: 3000; easing.type: Easing.InOutSine }
            NumberAnimation { from: root.blurRadius + 8; to: root.blurRadius - 8; duration: 3000; easing.type: Easing.InOutSine }
        }
    }
    
    // Noise overlay
    ShaderEffect {
        anchors.fill: parent
        property real time: 0.0
        property real noiseStrength: root.noiseStrength
        
        NumberAnimation on time {
            from: 0; to: 100
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
            
            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }
            
            void main() {
                float noise = random(qt_TexCoord0 + time * 0.001) * noiseStrength;
                fragColor = vec4(noise, noise, noise, noise) * qt_Opacity;
            }
        "
    }
    
    // Tint overlay
    Rectangle {
        anchors.fill: parent
        color: root.tintColor
    }
    
    // Edge glow
    Rectangle {
        anchors.fill: parent
        color: "transparent"
        border.width: 1
        border.color: Qt.rgba(0.3, 0.8, 1.0, 0.3)
        radius: parent.radius
    }
}
```

### 2.2 Color System & Audio Reactivity

```cpp
// AudioReactiveColors.h
#pragma once
#include <QObject>
#include <QColor>
#include <QAudioInput>
#include <QAudioBuffer>

class AudioReactiveColors : public QObject {
    Q_OBJECT
    Q_PROPERTY(QColor primaryAccent READ primaryAccent NOTIFY colorsChanged)
    Q_PROPERTY(QColor secondaryAccent READ secondaryAccent NOTIFY colorsChanged)
    Q_PROPERTY(QColor tertiaryAccent READ tertiaryAccent NOTIFY colorsChanged)
    Q_PROPERTY(float bassIntensity READ bassIntensity NOTIFY bassChanged)
    Q_PROPERTY(float midIntensity READ midIntensity NOTIFY midChanged)
    Q_PROPERTY(float highIntensity READ highIntensity NOTIFY highChanged)

public:
    explicit AudioReactiveColors(QObject *parent = nullptr);
    
    QColor primaryAccent() const { return m_primaryAccent; }
    QColor secondaryAccent() const { return m_secondaryAccent; }
    QColor tertiaryAccent() const { return m_tertiaryAccent; }
    float bassIntensity() const { return m_bassIntensity; }
    float midIntensity() const { return m_midIntensity; }
    float highIntensity() const { return m_highIntensity; }

signals:
    void colorsChanged();
    void bassChanged();
    void midChanged();
    void highChanged();

private slots:
    void processAudioBuffer(const QAudioBuffer &buffer);
    void updateColors();

private:
    QAudioInput *m_audioInput;
    
    // Base palette
    QColor m_baseCyan = QColor(0, 255, 255);      // #00FFFF
    QColor m_basePurple = QColor(138, 43, 226);   // #8A2BE2
    QColor m_baseGold = QColor(255, 215, 0);      // #FFD700
    
    // Reactive colors
    QColor m_primaryAccent;
    QColor m_secondaryAccent;
    QColor m_tertiaryAccent;
    
    // Frequency analysis
    float m_bassIntensity = 0.0f;
    float m_midIntensity = 0.0f;
    float m_highIntensity = 0.0f;
    
    void analyzeFrequencies(const QAudioBuffer &buffer);
};
```

```cpp
// AudioReactiveColors.cpp
#include "AudioReactiveColors.h"
#include <QAudioFormat>
#include <QtMath>

AudioReactiveColors::AudioReactiveColors(QObject *parent)
    : QObject(parent)
    , m_primaryAccent(m_baseCyan)
    , m_secondaryAccent(m_basePurple)
    , m_tertiaryAccent(m_baseGold)
{
    // Setup audio input
    QAudioFormat format;
    format.setSampleRate(44100);
    format.setChannelCount(2);
    format.setSampleFormat(QAudioFormat::Float);
    
    m_audioInput = new QAudioInput(format, this);
    connect(m_audioInput, &QAudioInput::readyRead, this, [this]() {
        // Process audio data
        QByteArray data = m_audioInput->read(m_audioInput->bytesAvailable());
        // Convert to QAudioBuffer and process
        // Implementation depends on Qt version
    });
    
    // Update colors at 60 FPS
    QTimer *timer = new QTimer(this);
    connect(timer, &QTimer::timeout, this, &AudioReactiveColors::updateColors);
    timer->start(16); // ~60 FPS
}

void AudioReactiveColors::analyzeFrequencies(const QAudioBuffer &buffer) {
    // Simplified frequency analysis
    // In production, use FFT (FFTW library or Qt's built-in)
    
    const float *data = buffer.constData<float>();
    int frameCount = buffer.frameCount();
    
    float bass = 0.0f, mid = 0.0f, high = 0.0f;
    
    // Analyze frequency bands (simplified)
    for (int i = 0; i < frameCount; ++i) {
        float sample = qAbs(data[i]);
        if (i < frameCount * 0.2) bass += sample;
        else if (i < frameCount * 0.6) mid += sample;
        else high += sample;
    }
    
    m_bassIntensity = qBound(0.0f, bass / (frameCount * 0.2f), 1.0f);
    m_midIntensity = qBound(0.0f, mid / (frameCount * 0.4f), 1.0f);
    m_highIntensity = qBound(0.0f, high / (frameCount * 0.4f), 1.0f);
    
    emit bassChanged();
    emit midChanged();
    emit highChanged();
}

void AudioReactiveColors::updateColors() {
    // Modulate base colors with frequency intensities
    auto modulateColor = [](const QColor &base, float intensity) {
        return QColor::fromHsvF(
            base.hueF(),
            base.saturationF() * (0.7 + intensity * 0.3),
            base.valueF() * (0.8 + intensity * 0.2)
        );
    };
    
    m_primaryAccent = modulateColor(m_baseCyan, m_highIntensity);
    m_secondaryAccent = modulateColor(m_basePurple, m_midIntensity);
    m_tertiaryAccent = modulateColor(m_baseGold, m_bassIntensity);
    
    emit colorsChanged();
}
```

---

## 3. Component Architecture

### 3.1 The Infinity Dock

```qml
// InfinityDock.qml
import QtQuick
import QtQuick.Controls

Rectangle {
    id: dock
    
    width: parent.width * 0.6
    height: 80
    radius: height / 2
    
    anchors {
        horizontalCenter: parent.horizontalCenter
        bottom: parent.bottom
        bottomMargin: 20
    }
    
    // Glass background
    GlassPane {
        anchors.fill: parent
        blurRadius: 48
        tintColor: Qt.rgba(0.05, 0.05, 0.05, 0.9)
        radius: parent.radius
    }
    
    ListView {
        id: dockView
        anchors.fill: parent
        anchors.margins: 10
        
        orientation: ListView.Horizontal
        spacing: 10
        
        model: DockModel { id: dockModel }
        
        // Smooth scrolling with snap
        snapMode: ListView.SnapToItem
        highlightRangeMode: ListView.StrictlyEnforceRange
        
        delegate: Item {
            id: iconDelegate
            width: 60
            height: 60
            
            property real mouseDistance: {
                var center = iconDelegate.x + iconDelegate.width / 2
                var mouseDist = Math.abs(mouseArea.mouseX - center)
                return Math.max(0, 200 - mouseDist) / 200
            }
            
            // Magnification effect
            scale: 1.0 + (mouseDistance * 0.5)
            
            Behavior on scale {
                SpringAnimation {
                    spring: 3
                    damping: 0.2
                    epsilon: 0.01
                }
            }
            
            Rectangle {
                anchors.centerIn: parent
                width: 50
                height: 50
                radius: 10
                color: Qt.rgba(0.1, 0.1, 0.1, 0.5)
                border.width: 2
                border.color: AudioColors.primaryAccent
                
                Image {
                    anchors.fill: parent
                    anchors.margins: 8
                    source: model.icon
                    fillMode: Image.PreserveAspectFit
                }
                
                // Glow effect
                Rectangle {
                    anchors.fill: parent
                    radius: parent.radius
                    color: "transparent"
                    border.width: 2
                    border.color: AudioColors.primaryAccent
                    opacity: iconDelegate.mouseDistance * 0.6
                }
            }
            
            MouseArea {
                anchors.fill: parent
                hoverEnabled: true
                onClicked: model.action()
                
                // Tooltip
                ToolTip.visible: containsMouse
                ToolTip.text: model.name
                ToolTip.delay: 500
            }
        }
        
        // Global mouse tracking for magnification
        MouseArea {
            id: mouseArea
            anchors.fill: parent
            hoverEnabled: true
            propagateComposedEvents: true
            
            onPositionChanged: {
                // Force delegate updates
                dockView.currentIndex = dockView.indexAt(mouseX, mouseY)
            }
        }
    }
    
    // System info overlay
    Row {
        anchors {
            right: parent.right
            verticalCenter: parent.verticalCenter
            rightMargin: 20
        }
        spacing: 15
        
        // Time
        Text {
            text: Qt.formatDateTime(new Date(), "hh:mm")
            font.pixelSize: 16
            font.family: "SF Pro Display"
            color: AudioColors.primaryAccent
            
            Timer {
                interval: 1000
                running: true
                repeat: true
                onTriggered: parent.text = Qt.formatDateTime(new Date(), "hh:mm")
            }
        }
        
        // Date
        Text {
            text: Qt.formatDateTime(new Date(), "MMM dd")
            font.pixelSize: 14
            color: Qt.rgba(1, 1, 1, 0.6)
        }
    }
    
    // Drag & drop to pin
    DropArea {
        anchors.fill: parent
        onDropped: (drop) => {
            if (drop.hasUrls) {
                dockModel.addItem(drop.urls[0])
            }
        }
    }
}
```

```cpp
// DockModel.h
#pragma once
#include <QAbstractListModel>
#include <QJsonObject>

struct DockItem {
    QString name;
    QString icon;
    QString action;
    QString widgetPath;
};

class DockModel : public QAbstractListModel {
    Q_OBJECT

public:
    enum Roles {
        NameRole = Qt::UserRole + 1,
        IconRole,
        ActionRole
    };

    explicit DockModel(QObject *parent = nullptr);
    
    int rowCount(const QModelIndex &parent = QModelIndex()) const override;
    QVariant data(const QModelIndex &index, int role) const override;
    QHash<int, QByteArray> roleNames() const override;
    
    Q_INVOKABLE void addItem(const QString &widgetPath);
    Q_INVOKABLE void removeItem(int index);
    Q_INVOKABLE void moveItem(int from, int to);

private:
    QList<DockItem> m_items;
    void loadFromSettings();
    void saveToSettings();
};
```

### 3.2 The Monad Settings Menu

```qml
// MonadSettings.qml
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Popup {
    id: monadPopup
    
    width: 900
    height: 600
    anchors.centerIn: Overlay.overlay
    
    modal: true
    dim: true
    
    // Heavy glass background
    background: GlassPane {
        blurRadius: 80
        tintColor: Qt.rgba(0.02, 0.02, 0.02, 0.95)
        radius: 20
    }
    
    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 30
        spacing: 20
        
        // Header with system stats
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: 150
            color: "transparent"
            
            RowLayout {
                anchors.fill: parent
                spacing: 20
                
                // CPU Usage Graph
                SystemGraph {
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    title: "CPU"
                    value: SystemMonitor.cpuUsage
                    color: AudioColors.primaryAccent
                    dataPoints: SystemMonitor.cpuHistory
                }
                
                // RAM Usage Graph
                SystemGraph {
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    title: "RAM"
                    value: SystemMonitor.ramUsage
                    color: AudioColors.secondaryAccent
                    dataPoints: SystemMonitor.ramHistory
                }
                
                // Network Activity
                SystemGraph {
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    title: "Network"
                    value: SystemMonitor.networkSpeed
                    color: AudioColors.tertiaryAccent
                    dataPoints: SystemMonitor.networkHistory
                }
            }
        }
        
        // Main content
        SplitView {
            Layout.fillWidth: true
            Layout.fillHeight: true
            
            orientation: Qt.Horizontal
            
            // Left sidebar (categories)
            Rectangle {
                SplitView.preferredWidth: 200
                SplitView.minimumWidth: 150
                color: Qt.rgba(0.1, 0.1, 0.1, 0.3)
                radius: 10
                
                ListView {
                    id: categoryList
                    anchors.fill: parent
                    anchors.margins: 10
                    
                    model: ["Appearance", "Blockchain", "Widgets", "Audio", "Performance", "About"]
                    
                    delegate: ItemDelegate {
                        width: categoryList.width
                        height: 50
                        
                        background: Rectangle {
                            color: categoryList.currentIndex === index 
                                ? Qt.rgba(0.2, 0.6, 1.0, 0.2)
                                : "transparent"
                            radius: 8
                            
                            border.width: categoryList.currentIndex === index ? 2 : 0
                            border.color: AudioColors.primaryAccent
                        }
                        
                        contentItem: Text {
                            text: modelData
                            font.pixelSize: 16
                            color: categoryList.currentIndex === index 
                                ? AudioColors.primaryAccent
                                : Qt.rgba(1, 1, 1, 0.7)
                            verticalAlignment: Text.AlignVCenter
                        }
                        
                        onClicked: {
                            categoryList.currentIndex = index
                            stackLayout.currentIndex = index
                        }
                    }
                }
            }
            
            // Right content area
            StackLayout {
                id: stackLayout
                SplitView.fillWidth: true
                currentIndex: categoryList.currentIndex
                
                // Appearance Settings
                AppearanceSettings { }
                
                // Blockchain Settings
                BlockchainSettings { }
                
                // Widget Manager
                WidgetManager { }
                
                // Audio Settings
                AudioSettings { }
                
                // Performance Settings
                PerformanceSettings { }
                
                // About
                AboutPage { }
            }
        }
    }
    
    // Close button
    RoundButton {
        anchors {
            top: parent.top
            right: parent.right
            margins: 10
        }
        
        text: "✕"
        font.pixelSize: 20
        
        background: Rectangle {
            radius: width / 2
            color: parent.hovered ? Qt.rgba(1, 0.2, 0.2, 0.8) : Qt.rgba(0.3, 0.3, 0.3, 0.5)
        }
        
        onClicked: monadPopup.close()
    }
}
```

```cpp
// SystemMonitor.h
#pragma once
#include <QObject>
#include <QTimer>
#include <QVector>

class SystemMonitor : public QObject {
    Q_OBJECT
    Q_PROPERTY(float cpuUsage READ cpuUsage NOTIFY cpuUsageChanged)
    Q_PROPERTY(float ramUsage READ ramUsage NOTIFY ramUsageChanged)
    Q_PROPERTY(float networkSpeed READ networkSpeed NOTIFY networkSpeedChanged)
    Q_PROPERTY(QVector<float> cpuHistory READ cpuHistory NOTIFY cpuHistoryChanged)
    Q_PROPERTY(QVector<float> ramHistory READ ramHistory NOTIFY ramHistoryChanged)
    Q_PROPERTY(QVector<float> networkHistory READ networkHistory NOTIFY networkHistoryChanged)

public:
    explicit SystemMonitor(QObject *parent = nullptr);
    
    float cpuUsage() const { return m_cpuUsage; }
    float ramUsage() const { return m_ramUsage; }
    float networkSpeed() const { return m_networkSpeed; }
    QVector<float> cpuHistory() const { return m_cpuHistory; }
    QVector<float> ramHistory() const { return m_ramHistory; }
    QVector<float> networkHistory() const { return m_networkHistory; }

signals:
    void cpuUsageChanged();
    void ramUsageChanged();
    void networkSpeedChanged();
    void cpuHistoryChanged();
    void ramHistoryChanged();
    void networkHistoryChanged();

private slots:
    void updateStats();

private:
    QTimer *m_updateTimer;
    
    float m_cpuUsage = 0.0f;
    float m_ramUsage = 0.0f;
    float m_networkSpeed = 0.0f;
    
    static constexpr int HISTORY_SIZE = 60; // 60 data points
    QVector<float> m_cpuHistory;
    QVector<float> m_ramHistory;
    QVector<float> m_networkHistory;
    
    void addToHistory(QVector<float> &history, float value);
    
#ifdef Q_OS_WIN
    void updateCpuUsageWindows();
#elif defined(Q_OS_LINUX)
    void updateCpuUsageLinux();
#elif defined(Q_OS_MAC)
    void updateCpuUsageMac();
#endif
};
```

### 3.3 Context-Aware Right-Click Menus

```qml
// ContextMenu.qml
import QtQuick
import QtQuick.Controls

Menu {
    id: contextMenu
    
    property var targetItem: null
    property string contextType: ""
    
    // Glass background
    background: GlassPane {
        implicitWidth: 200
        implicitHeight: 40
        blurRadius: 32
        tintColor: Qt.rgba(0.05, 0.05, 0.05, 0.95)
        radius: 8
    }
    
    delegate: MenuItem {
        id: menuItem
        
        implicitWidth: 200
        implicitHeight: 40
        
        background: Rectangle {
            color: menuItem.highlighted 
                ? Qt.rgba(0.2, 0.6, 1.0, 0.3)
                : "transparent"
            radius: 6
        }
        
        contentItem: Row {
            spacing: 10
            leftPadding: 10
            
            Text {
                text: menuItem.icon.name || ""
                font.family: "Segoe Fluent Icons"
                font.pixelSize: 16
                color: AudioColors.primaryAccent
                verticalAlignment: Text.AlignVCenter
            }
            
            Text {
                text: menuItem.text
                font.pixelSize: 14
                color: menuItem.highlighted 
                    ? Qt.rgba(1, 1, 1, 1)
                    : Qt.rgba(1, 1, 1, 0.8)
                verticalAlignment: Text.AlignVCenter
            }
        }
    }
    
    // Dynamic menu population
    function showForItem(item, x, y) {
        targetItem = item
        contextType = item.objectName || "generic"
        
        // Clear existing items
        while (count > 0) {
            removeItem(0)
        }
        
        // Add context-specific items
        if (contextType === "desktop") {
            addAction("Add Widget", () => WidgetBrowser.open())
            addAction("Change Wallpaper", () => WallpaperPicker.open())
            addSeparator()
            addAction("Monad Settings", () => monadSettings.open())
        }
        else if (contextType === "widget") {
            addAction("Configure", () => item.openSettings())
            addAction("Pin to Dock", () => DockModel.addWidget(item))
            addSeparator()
            addAction("Remove", () => item.destroy())
        }
        else if (contextType === "file") {
            addAction("Inspect on Chain", () => ChainExplorer.inspect(item.hash))
            addAction("Verify Signature", () => CryptoTools.verify(item.path))
            addSeparator()
            addAction("Properties", () => FileProperties.show(item))
        }
        
        popup(x, y)
    }
    
    function addAction(text, callback) {
        var item = menuItemComponent.createObject(contextMenu, {
            "text": text,
            "onTriggered": callback
        })
        addItem(item)
    }
    
    Component {
        id: menuItemComponent
        MenuItem { }
    }
}
```

---

## 4. Workspace & Widget System

### 4.1 Liquid Layout Manager

```qml
// LiquidWorkspace.qml
import QtQuick

Item {
    id: workspace
    
    property alias widgets: widgetContainer.children
    property int gridSize: 100
    property bool liquidMotion: true
    
    // Background
    Image {
        anchors.fill: parent
        source: WallpaperManager.currentWallpaper
        fillMode: Image.PreserveAspectCrop
        
        // Subtle parallax on mouse move
        property real parallaxStrength: 20
        transform: Translate {
            x: -workspace.mouseX / workspace.width * parent.parallaxStrength
            y: -workspace.mouseY / workspace.height * parent.parallaxStrength
        }
    }
    
    // Widget container
    Item {
        id: widgetContainer
        anchors.fill: parent
    }
    
    // Collision detection and liquid motion
    Timer {
        interval: 16 // 60 FPS
        running: liquidMotion
        repeat: true
        onTriggered: workspace.updateWidgetPositions()
    }
    
    function updateWidgetPositions() {
        for (let i = 0; i < widgets.length; i++) {
            let widget = widgets[i]
            if (!widget.dragging) {
                // Check collisions with other widgets
                for (let j = 0; j < widgets.length; j++) {
                    if (i === j) continue
                    let other = widgets[j]
                    
                    if (checkCollision(widget, other)) {
                        resolveCollision(widget, other)
                    }
                }
                
                // Snap to grid
                if (widget.snapToGrid) {
                    widget.targetX = Math.round(widget.x / gridSize) * gridSize
                    widget.targetY = Math.round(widget.y / gridSize) * gridSize
                }
            }
        }
    }
    
    function checkCollision(a, b) {
        return !(a.x + a.width < b.x ||
                 b.x + b.width < a.x ||
                 a.y + a.height < b.y ||
                 b.y + b.height < a.y)
    }
    
    function resolveCollision(a, b) {
        // Calculate push direction
        let centerAX = a.x + a.width / 2
        let centerAY = a.y + a.height / 2
        let centerBX = b.x + b.width / 2
        let centerBY = b.y + b.height / 2
        
        let dx = centerBX - centerAX
        let dy = centerBY - centerAY
        let distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance > 0) {
            // Push b away from a
            let pushStrength = 5
            b.targetX = b.x + (dx / distance) * pushStrength
            b.targetY = b.y + (dy / distance) * pushStrength
        }
    }
    
    // Load widgets from config
    Component.onCompleted: {
        WidgetManager.loadWidgets(workspace)
    }
    
    // Right-click context menu
    MouseArea {
        anchors.fill: parent
        acceptedButtons: Qt.RightButton
        propagateComposedEvents: true
        
        onClicked: (mouse) => {
            if (mouse.button === Qt.RightButton) {
                contextMenu.showForItem(workspace, mouse.x, mouse.y)
            }
        }
    }
}
```

### 4.2 Base Widget Component

```qml
// BaseWidget.qml
import QtQuick
import QtQuick.Controls

Item {
    id: widget
    
    property string widgetName: "Widget"
    property string widgetIcon: ""
    property bool dragging: false
    property bool resizing: false
    property bool snapToGrid: true
    property real targetX: x
    property real targetY: y
    
    width: 400
    height: 300
    
    // Smooth position animation
    Behavior on x {
        enabled: !dragging
        SpringAnimation {
            spring: 3
            damping: 0.3
            epsilon: 0.1
        }
    }
    
    Behavior on y {
        enabled: !dragging
        SpringAnimation {
            spring: 3
            damping: 0.3
            epsilon: 0.1
        }
    }
    
    // Widget frame
    GlassPane {
        id: frame
        anchors.fill: parent
        blurRadius: 48
        tintColor: Qt.rgba(0.02, 0.02, 0.02, 0.85)
        radius: 15
        
        // Title bar
        Rectangle {
            id: titleBar
            width: parent.width
            height: 40
            color: Qt.rgba(0.1, 0.1, 0.1, 0.5)
            radius: 15
            
            Rectangle {
                anchors {
                    left: parent.left
                    right: parent.right
                    bottom: parent.bottom
                }
                height: parent.height / 2
                color: parent.color
            }
            
            Row {
                anchors {
                    left: parent.left
                    leftMargin: 15
                    verticalCenter: parent.verticalCenter
                }
                spacing: 10
                
                Text {
                    text: widget.widgetIcon
                    font.pixelSize: 16
                    color: AudioColors.primaryAccent
                }
                
                Text {
                    text: widget.widgetName
                    font.pixelSize: 14
                    font.family: "SF Pro Display"
                    color: Qt.rgba(1, 1, 1, 0.9)
                }
            }
            
            Row {
                anchors {
                    right: parent.right
                    rightMargin: 10
                    verticalCenter: parent.verticalCenter
                }
                spacing: 5
                
                // Minimize
                RoundButton {
                    width: 20
                    height: 20
                    text: "−"
                    onClicked: widget.minimize()
                }
                
                // Close
                RoundButton {
                    width: 20
                    height: 20
                    text: "✕"
                    onClicked: widget.close()
                }
            }
            
            // Drag handle
            MouseArea {
                anchors.fill: parent
                drag.target: widget
                drag.axis: Drag.XAndYAxis
                
                onPressed: widget.dragging = true
                onReleased: {
                    widget.dragging = false
                    widget.x = widget.targetX
                    widget.y = widget.targetY
                }
            }
        }
        
        // Content area
        Item {
            id: contentArea
            anchors {
                top: titleBar.bottom
                left: parent.left
                right: parent.right
                bottom: parent.bottom
                margins: 15
            }
        }
        
        // Resize handle
        Rectangle {
            anchors {
                right: parent.right
                bottom: parent.bottom
            }
            width: 20
            height: 20
            color: "transparent"
            
            Canvas {
                anchors.fill: parent
                onPaint: {
                    var ctx = getContext("2d")
                    ctx.strokeStyle = AudioColors.primaryAccent
                    ctx.lineWidth = 2
                    
                    ctx.beginPath()
                    ctx.moveTo(width, 0)
                    ctx.lineTo(width, height)
                    ctx.lineTo(0, height)
                    ctx.stroke()
                }
            }
            
            MouseArea {
                anchors.fill: parent
                cursorShape: Qt.SizeFDiagCursor
                
                property point startPos
                property size startSize
                
                onPressed: (mouse) => {
                    widget.resizing = true
                    startPos = Qt.point(mouse.x, mouse.y)
                    startSize = Qt.size(widget.width, widget.height)
                }
                
                onPositionChanged: (mouse) => {
                    if (pressed) {
                        widget.width = Math.max(200, startSize.width + mouse.x - startPos.x)
                        widget.height = Math.max(150, startSize.height + mouse.y - startPos.y)
                    }
                }
                
                onReleased: widget.resizing = false
            }
        }
    }
    
    // Widget-specific content (override in derived widgets)
    property Component content: Item { }
    
    Loader {
        sourceComponent: content
        anchors.fill: contentArea
    }
    
    // Methods
    function minimize() {
        widget.visible = false
        // Add to minimized widgets in dock
    }
    
    function close() {
        widget.destroy()
    }
    
    function openSettings() {
        // Override in derived widgets
    }
    
    // Right-click context menu
    MouseArea {
        anchors.fill: parent
        acceptedButtons: Qt.RightButton
        propagateComposedEvents: true
        
        onClicked: (mouse) => {
            if (mouse.button === Qt.RightButton) {
                contextMenu.showForItem(widget, mouse.x, mouse.y)
            }
        }
    }
}
```

---

## 5. Input Handling & Mouse Lock

```cpp
// MouseLockManager.h
#pragma once
#include <QObject>
#include <QWindow>
#include <QCursor>

class MouseLockManager : public QObject {
    Q_OBJECT
    Q_PROPERTY(bool gameModeEnabled READ gameModeEnabled WRITE setGameModeEnabled NOTIFY gameModeChanged)
    Q_PROPERTY(bool mouseLocked READ mouseLocked NOTIFY mouseLockedChanged)

public:
    explicit MouseLockManager(QWindow *window, QObject *parent = nullptr);
    
    bool gameModeEnabled() const { return m_gameModeEnabled; }
    void setGameModeEnabled(bool enabled);
    
    bool mouseLocked() const { return m_mouseLocked; }
    
    Q_INVOKABLE void lockMouse();
    Q_INVOKABLE void unlockMouse();

signals:
    void gameModeChanged();
    void mouseLockedChanged();
    void escapePressed();

protected:
    bool eventFilter(QObject *obj, QEvent *event) override;

private:
    QWindow *m_window;
    bool m_gameModeEnabled = false;
    bool m_mouseLocked = false;
    QPoint m_lockCenter;
    
    void constrainMouse();
};
```

```cpp
// MouseLockManager.cpp
#include "MouseLockManager.h"
#include <QEvent>
#include <QKeyEvent>
#include <QMouseEvent>
#include <QGuiApplication>

MouseLockManager::MouseLockManager(QWindow *window, QObject *parent)
    : QObject(parent)
    , m_window(window)
{
    m_window->installEventFilter(this);
}

void MouseLockManager::setGameModeEnabled(bool enabled) {
    if (m_gameModeEnabled != enabled) {
        m_gameModeEnabled = enabled;
        
        if (enabled && m_window->isActive()) {
            lockMouse();
        } else {
            unlockMouse();
        }
        
        emit gameModeChanged();
    }
}

void MouseLockManager::lockMouse() {
    if (!m_mouseLocked) {
        m_mouseLocked = true;
        
        // Hide cursor
        QGuiApplication::setOverrideCursor(Qt::BlankCursor);
        
        // Set lock center
        m_lockCenter = QPoint(m_window->width() / 2, m_window->height() / 2);
        
        // Enable mouse grab
        m_window->setMouseGrabEnabled(true);
        
        emit mouseLockedChanged();
    }
}

void MouseLockManager::unlockMouse() {
    if (m_mouseLocked) {
        m_mouseLocked = false;
        
        // Restore cursor
        QGuiApplication::restoreOverrideCursor();
        
        // Disable mouse grab
        m_window->setMouseGrabEnabled(false);
        
        emit mouseLockedChanged();
    }
}

void MouseLockManager::constrainMouse() {
    if (m_mouseLocked) {
        QPoint globalPos = QCursor::pos();
        QPoint localPos = m_window->mapFromGlobal(globalPos);
        
        // Constrain to window bounds
        QRect bounds = m_window->geometry();
        bounds.adjust(10, 10, -10, -10); // 10px margin
        
        if (!bounds.contains(globalPos)) {
            int clampedX = qBound(bounds.left(), globalPos.x(), bounds.right());
            int clampedY = qBound(bounds.top(), globalPos.y(), bounds.bottom());
            QCursor::setPos(clampedX, clampedY);
        }
    }
}

bool MouseLockManager::eventFilter(QObject *obj, QEvent *event) {
    if (obj == m_window) {
        if (event->type() == QEvent::KeyPress) {
            QKeyEvent *keyEvent = static_cast<QKeyEvent*>(event);
            
            // Escape releases mouse lock
            if (keyEvent->key() == Qt::Key_Escape && m_mouseLocked) {
                unlockMouse();
                emit escapePressed();
                return true; // Consume event
            }
        }
        else if (event->type() == QEvent::MouseMove) {
            if (m_mouseLocked) {
                constrainMouse();
            }
        }
        else if (event->type() == QEvent::FocusOut) {
            // Auto-unlock when window loses focus
            if (m_mouseLocked) {
                unlockMouse();
            }
        }
    }
    
    return QObject::eventFilter(obj, event);
}
```

---

## 6. System Architecture

### 6.1 File Structure

```
apps/qor-desktop/
├── src/
│   ├── main.cpp                      # Application entry point
│   ├── QorIDManager.h/cpp            # Authentication system
│   ├── AudioReactiveColors.h/cpp     # Audio analysis and color modulation
│   ├── SystemMonitor.h/cpp           # System stats (CPU/RAM/Network)
│   ├── MouseLockManager.h/cpp        # Input handling and mouse lock
│   ├── DockModel.h/cpp               # Dock widget management
│   ├── WidgetManager.h/cpp           # Widget lifecycle and registry
│   ├── WallpaperManager.h/cpp        # Background management
│   ├── ChainBridge.h/cpp             # Blockchain IPC bridge
│   └── qml/
│       ├── main.qml                  # Root application window
│       ├── Theme.qml                 # Global theme singleton
│       ├── GlassPane.qml             # Base glass material
│       ├── InfinityDock.qml          # Bottom navigation bar
│       ├── MonadSettings.qml         # Settings interface
│       ├── LiquidWorkspace.qml       # Widget workspace
│       ├── BaseWidget.qml            # Widget base class
│       ├── ContextMenu.qml           # Right-click menus
│       ├── LoginView.qml             # QorID authentication
│       ├── components/
│       │   ├── SystemGraph.qml       # Real-time system graphs
│       │   ├── AudioVisualizer.qml   # Audio frequency display
│       │   └── ChainStatus.qml       # Blockchain sync status
│       └── widgets/
│           ├── WalletWidget.qml      # CGT wallet interface
│           ├── NodeWidget.qml        # Node status and controls
│           ├── MarketplaceWidget.qml # NFT marketplace
│           ├── ChatWidget.qml        # Encrypted chat
│           └── MinerWidget.qml       # Mining dashboard
├── assets/
│   ├── icons/                        # Widget and dock icons
│   ├── shaders/                      # Custom GLSL shaders
│   ├── fonts/                        # SF Pro Display, etc.
│   └── wallpapers/                   # Default backgrounds
├── CMakeLists.txt
└── qor-desktop.qrc                   # Qt Resource file
```

### 6.2 Main Application Setup

```cpp
// main.cpp
#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QQmlContext>
#include <QQuickWindow>
#include <QSurfaceFormat>

#include "QorIDManager.h"
#include "AudioReactiveColors.h"
#include "SystemMonitor.h"
#include "MouseLockManager.h"
#include "DockModel.h"
#include "WidgetManager.h"
#include "WallpaperManager.h"
#include "ChainBridge.h"

int main(int argc, char *argv[])
{
    // Enable High-DPI scaling
    QGuiApplication::setHighDpiScaleFactorRoundingPolicy(
        Qt::HighDpiScaleFactorRoundingPolicy::PassThrough);
    
    QGuiApplication app(argc, argv);
    
    // Setup OpenGL surface format for shaders
    QSurfaceFormat format;
    format.setRenderableType(QSurfaceFormat::OpenGL);
    format.setProfile(QSurfaceFormat::CoreProfile);
    format.setVersion(4, 5);
    format.setSamples(4); // MSAA
    QSurfaceFormat::setDefaultFormat(format);
    
    // Create QML engine
    QQmlApplicationEngine engine;
    
    // Register C++ types
    qmlRegisterType<DockModel>("QorDesktop", 1, 0, "DockModel");
    qmlRegisterType<WidgetManager>("QorDesktop", 1, 0, "WidgetManager");
    
    // Create singletons
    QorIDManager qorIDManager;
    AudioReactiveColors audioColors;
    SystemMonitor systemMonitor;
    WallpaperManager wallpaperManager;
    ChainBridge chainBridge;
    
    // Expose to QML context
    engine.rootContext()->setContextProperty("QorIDManager", &qorIDManager);
    engine.rootContext()->setContextProperty("AudioColors", &audioColors);
    engine.rootContext()->setContextProperty("SystemMonitor", &systemMonitor);
    engine.rootContext()->setContextProperty("WallpaperManager", &wallpaperManager);
    engine.rootContext()->setContextProperty("ChainBridge", &chainBridge);
    
    // Load main QML
    const QUrl url(QStringLiteral("qrc:/qml/main.qml"));
    
    QObject::connect(&engine, &QQmlApplicationEngine::objectCreated,
                     &app, [url](QObject *obj, const QUrl &objUrl) {
        if (!obj && url == objUrl)
            QCoreApplication::exit(-1);
    }, Qt::QueuedConnection);
    
    engine.load(url);
    
    // Setup mouse lock manager after window is created
    if (!engine.rootObjects().isEmpty()) {
        QQuickWindow *window = qobject_cast<QQuickWindow*>(engine.rootObjects().first());
        if (window) {
            MouseLockManager *mouseLock = new MouseLockManager(window, &app);
            engine.rootContext()->setContextProperty("MouseLock", mouseLock);
        }
    }
    
    return app.exec();
}
```

### 6.3 Main Window QML

```qml
// main.qml
import QtQuick
import QtQuick.Window
import QtQuick.Controls

ApplicationWindow {
    id: rootWindow
    
    width: Screen.desktopAvailableWidth
    height: Screen.desktopAvailableHeight
    visible: true
    title: "QOR - Demiurge Gateway"
    
    // Frameless window with custom decoration
    flags: Qt.Window | Qt.FramelessWindowHint
    
    // Enable transparency for glass effects
    color: "transparent"
    
    // Keyboard shortcuts
    Shortcut {
        sequence: "Ctrl+Q"
        onActivated: Qt.quit()
    }
    
    Shortcut {
        sequence: "Ctrl+M"
        onActivated: monadSettings.open()
    }
    
    Shortcut {
        sequence: "Meta+Space"
        onActivated: commandPalette.open()
    }
    
    // Main content
    Item {
        anchors.fill: parent
        
        // Workspace (widget area)
        LiquidWorkspace {
            id: workspace
            anchors.fill: parent
            objectName: "desktop"
        }
        
        // Infinity Dock (bottom navigation)
        InfinityDock {
            id: dock
            z: 100
        }
        
        // Top status bar
        Rectangle {
            id: statusBar
            width: parent.width
            height: 30
            
            GlassPane {
                anchors.fill: parent
                blurRadius: 32
                tintColor: Qt.rgba(0.02, 0.02, 0.02, 0.8)
            }
            
            Row {
                anchors {
                    left: parent.left
                    leftMargin: 20
                    verticalCenter: parent.verticalCenter
                }
                spacing: 20
                
                // Blockchain sync status
                ChainStatus { }
                
                // Network status
                Text {
                    text: ChainBridge.peerCount + " peers"
                    font.pixelSize: 12
                    color: Qt.rgba(1, 1, 1, 0.7)
                }
            }
            
            Row {
                anchors {
                    right: parent.right
                    rightMargin: 20
                    verticalCenter: parent.verticalCenter
                }
                spacing: 15
                
                // Audio visualizer
                AudioVisualizer {
                    width: 100
                    height: 20
                }
                
                // System resources
                Text {
                    text: "CPU: " + Math.round(SystemMonitor.cpuUsage) + "%"
                    font.pixelSize: 12
                    color: AudioColors.primaryAccent
                }
                
                Text {
                    text: "RAM: " + Math.round(SystemMonitor.ramUsage) + "%"
                    font.pixelSize: 12
                    color: AudioColors.secondaryAccent
                }
            }
        }
    }
    
    // Global context menu
    ContextMenu {
        id: contextMenu
    }
    
    // Monad settings popup
    MonadSettings {
        id: monadSettings
    }
    
    // Command palette (Ctrl+Shift+P style)
    CommandPalette {
        id: commandPalette
    }
    
    // Authentication overlay
    Loader {
        id: authLoader
        anchors.fill: parent
        active: !QorIDManager.authenticated
        sourceComponent: LoginView { }
        z: 1000
    }
    
    // Startup initialization
    Component.onCompleted: {
        // Check authentication
        if (!QorIDManager.authenticated) {
            QorIDManager.tryAutoLogin()
        }
        
        // Start system monitoring
        SystemMonitor.start()
        
        // Initialize audio reactive colors
        AudioColors.startListening()
        
        // Connect to blockchain
        ChainBridge.connect()
    }
}
```

---

## 7. Performance Optimization

### 7.1 Shader Caching

```cpp
// ShaderCache.h
#pragma once
#include <QHash>
#include <QString>
#include <QByteArray>

class ShaderCache {
public:
    static ShaderCache& instance() {
        static ShaderCache cache;
        return cache;
    }
    
    QByteArray getShader(const QString &name);
    void cacheShader(const QString &name, const QByteArray &code);
    void precompileShaders();

private:
    ShaderCache() = default;
    QHash<QString, QByteArray> m_cache;
};
```

### 7.2 GPU Resource Management

```qml
// Use LayerEffect for performance
Item {
    layer.enabled: true
    layer.effect: MultiEffect {
        // Cached on GPU
    }
}

// Lazy loading for widgets
Loader {
    asynchronous: true
    active: visible
    sourceComponent: HeavyWidget { }
}

// Scene graph batching
Repeater {
    model: 100
    delegate: Rectangle {
        // Automatically batched by Qt Quick
        color: "blue"
    }
}
```

### 7.3 Memory Management

```cpp
// Widget recycling
class WidgetPool {
public:
    QQuickItem* acquire(const QString &type);
    void release(QQuickItem *widget);
    
private:
    QHash<QString, QList<QQuickItem*>> m_pool;
};
```

---

## 8. Build Configuration

```cmake
# CMakeLists.txt
cmake_minimum_required(VERSION 3.28)
project(QorDesktop VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Qt6 6.10 REQUIRED COMPONENTS
    Core
    Gui
    Quick
    QuickControls2
    Multimedia
    Network
)

qt_standard_project_setup()

set(SOURCES
    src/main.cpp
    src/QorIDManager.cpp
    src/AudioReactiveColors.cpp
    src/SystemMonitor.cpp
    src/MouseLockManager.cpp
    src/DockModel.cpp
    src/WidgetManager.cpp
    src/WallpaperManager.cpp
    src/ChainBridge.cpp
)

set(HEADERS
    src/QorIDManager.h
    src/AudioReactiveColors.h
    src/SystemMonitor.h
    src/MouseLockManager.h
    src/DockModel.h
    src/WidgetManager.h
    src/WallpaperManager.h
    src/ChainBridge.h
)

qt_add_executable(QOR
    ${SOURCES}
    ${HEADERS}
)

qt_add_qml_module(QOR
    URI QorDesktop
    VERSION 1.0
    QML_FILES
        src/qml/main.qml
        src/qml/Theme.qml
        src/qml/GlassPane.qml
        src/qml/InfinityDock.qml
        src/qml/MonadSettings.qml
        src/qml/LiquidWorkspace.qml
        src/qml/BaseWidget.qml
        src/qml/ContextMenu.qml
        src/qml/LoginView.qml
    RESOURCES
        assets/icons/
        assets/shaders/
        assets/fonts/
        assets/wallpapers/
)

target_link_libraries(QOR PRIVATE
    Qt6::Core
    Qt6::Gui
    Qt6::Quick
    Qt6::QuickControls2
    Qt6::Multimedia
    Qt6::Network
)

# Platform-specific settings
if(WIN32)
    set_target_properties(QOR PROPERTIES
        WIN32_EXECUTABLE TRUE
        OUTPUT_NAME "QOR"
    )
elseif(APPLE)
    set_target_properties(QOR PROPERTIES
        MACOSX_BUNDLE TRUE
        OUTPUT_NAME "QOR"
    )
endif()

# Deployment
qt_generate_deploy_qml_app_script(
    TARGET QOR
    OUTPUT_SCRIPT deploy_script
    MACOS_BUNDLE_POST_BUILD
    NO_UNSUPPORTED_PLATFORM_ERROR
    DEPLOY_USER_QML_MODULES_ON_UNSUPPORTED_PLATFORM
)

install(SCRIPT ${deploy_script})
```

---

## 9. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- ✅ Project structure and build system
- ✅ GlassPane component with shaders
- ✅ Theme system and color palette
- ✅ Basic window and layout

### Phase 2: Core Components (Week 3-4)
- ⏳ InfinityDock with magnification
- ⏳ LiquidWorkspace with collision detection
- ⏳ BaseWidget with drag/resize
- ⏳ ContextMenu system

### Phase 3: System Integration (Week 5-6)
- ⏳ SystemMonitor with live graphs
- ⏳ AudioReactiveColors with FFT
- ⏳ MouseLockManager
- ⏳ WallpaperManager

### Phase 4: Blockchain Integration (Week 7-8)
- ⏳ ChainBridge IPC
- ⏳ QorID authentication refinement
- ⏳ Wallet widget
- ⏳ Node status widget

### Phase 5: Polish & Optimization (Week 9-10)
- ⏳ Shader optimization
- ⏳ Animation refinement
- ⏳ Performance profiling
- ⏳ Documentation

---

## 10. Technical Requirements

### Minimum System Requirements
- **OS:** Windows 10 21H2+, Ubuntu 22.04+, macOS 12+
- **CPU:** Quad-core 2.5 GHz+
- **RAM:** 8 GB
- **GPU:** OpenGL 4.5 or Vulkan 1.2 compatible
- **Storage:** 500 MB

### Recommended System Requirements
- **CPU:** 8-core 3.5 GHz+
- **RAM:** 16 GB
- **GPU:** Dedicated GPU with 2GB+ VRAM
- **Display:** 1920x1080+ with HDR support

---

## 11. Security Considerations

### Sandboxing
- Widgets run in isolated QML contexts
- File system access controlled via C++ backend
- Network requests proxied through ChainBridge

### Cryptography
- QorID credentials encrypted with AES-256
- Private keys never exposed to QML
- Secure storage via Qt Keychain

### Input Validation
- All user inputs sanitized
- QML property bindings validated
- Injection attack prevention

---

## Conclusion

This blueprint provides a complete architectural foundation for QOR, a next-generation desktop environment that merges ancient aesthetics with cutting-edge technology. The glass-first design, reactive visuals, and fluid animations create an immersive experience while maintaining high performance through GPU acceleration and intelligent caching.

**Next Steps:**
1. Review and approve this blueprint
2. Begin Phase 1 implementation
3. Set up CI/CD pipeline
4. Create design mockups in Figma
5. Start building core components

**Contact:** `@Alaustrup` on GitHub for questions and collaboration.

---

**Document Version:** 1.0.0  
**Last Updated:** January 7, 2026  
**Status:** 📋 READY FOR IMPLEMENTATION
