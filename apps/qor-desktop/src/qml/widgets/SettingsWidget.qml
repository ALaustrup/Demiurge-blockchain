// SettingsWidget.qml - Complete Settings Panel
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

BaseWidget {
    id: widget
    
    widgetName: "Settings"
    widgetIcon: "⚙️"
    
    width: 550
    height: 600
    
    content: Item {
        anchors.fill: parent
        
        Column {
            anchors.fill: parent
            spacing: 0
            
            // ============================================
            // SETTINGS TABS
            // ============================================
            
            Rectangle {
                width: parent.width
                height: 45
                color: Qt.rgba(0.08, 0.08, 0.08, 0.8)
                radius: Theme.borderRadiusSmall
                
                Row {
                    anchors {
                        left: parent.left
                        leftMargin: Theme.spacingMedium
                        verticalCenter: parent.verticalCenter
                    }
                    spacing: Theme.spacingSmall
                    
                    Repeater {
                        model: ["Appearance", "System", "Audio", "Advanced"]
                        
                        Rectangle {
                            width: 120
                            height: 35
                            radius: Theme.borderRadiusSmall
                            color: tabBar.currentIndex === index ? 
                                   Qt.rgba(0.2, 0.2, 0.2, 0.9) : "transparent"
                            border.width: tabBar.currentIndex === index ? 2 : 0
                            border.color: Theme.primaryAccent
                            
                            Text {
                                anchors.centerIn: parent
                                text: modelData
                                font.family: Theme.fontFamily
                                font.pixelSize: Theme.fontSizeSmall
                                font.weight: tabBar.currentIndex === index ? Font.Bold : Font.Normal
                                color: tabBar.currentIndex === index ? Theme.primaryAccent : Theme.textSecondary
                            }
                            
                            MouseArea {
                                anchors.fill: parent
                                onClicked: tabBar.currentIndex = index
                            }
                        }
                    }
                }
            }
            
            // ============================================
            // SETTINGS CONTENT
            // ============================================
            
            StackLayout {
                id: tabBar
                width: parent.width
                height: parent.height - 45
                currentIndex: 0
                
                // ============================================
                // APPEARANCE TAB
                // ============================================
                
                ScrollView {
                    width: parent.width
                    height: parent.height
                    clip: true
                    
                    Column {
                        width: parent.width - Theme.spacingLarge
                        padding: Theme.spacingLarge
                        spacing: Theme.spacingLarge
                        
                        // Theme Selection
                        GroupBox {
                            width: parent.width
                            title: "Theme"
                            
                            background: Rectangle {
                                color: Qt.rgba(0.05, 0.05, 0.05, 0.8)
                                radius: Theme.borderRadiusMedium
                                border.width: 1
                                border.color: Qt.rgba(0.3, 0.3, 0.3, 0.5)
                            }
                            
                            label: Text {
                                text: parent.title
                                font.family: Theme.fontFamily
                                font.pixelSize: Theme.fontSizeNormal
                                font.weight: Font.Bold
                                color: Theme.textPrimary
                                padding: Theme.spacingSmall
                            }
                            
                            Column {
                                width: parent.width
                                spacing: Theme.spacingMedium
                                
                                Row {
                                    spacing: Theme.spacingMedium
                                    
                                    Repeater {
                                        model: ["Neon Cyan", "Electric Purple", "Deep Gold"]
                                        
                                        Rectangle {
                                            width: 80
                                            height: 80
                                            radius: Theme.borderRadiusMedium
                                            
                                            gradient: Gradient {
                                                GradientStop { 
                                                    position: 0.0
                                                    color: index === 0 ? Theme.neonCyan : 
                                                           index === 1 ? Theme.electricPurple : 
                                                           Theme.deepGold
                                                }
                                                GradientStop { 
                                                    position: 1.0
                                                    color: Qt.darker(
                                                        index === 0 ? Theme.neonCyan : 
                                                        index === 1 ? Theme.electricPurple : 
                                                        Theme.deepGold, 1.5)
                                                }
                                            }
                                            
                                            border.width: 3
                                            border.color: index === 0 ? Theme.primaryAccent : "transparent"
                                            
                                            Text {
                                                anchors.centerIn: parent
                                                text: index === 0 ? "✓" : ""
                                                font.pixelSize: 24
                                                font.weight: Font.Bold
                                                color: "white"
                                            }
                                            
                                            MouseArea {
                                                anchors.fill: parent
                                                onClicked: console.log("Theme selected:", modelData)
                                            }
                                        }
                                    }
                                }
                                
                                Text {
                                    text: "Current: Ancient Glass (Neon Cyan)"
                                    font.family: Theme.fontFamily
                                    font.pixelSize: Theme.fontSizeSmall
                                    color: Theme.textSecondary
                                }
                            }
                        }
                        
                        // Glass Effect Intensity
                        GroupBox {
                            width: parent.width
                            title: "Glass Effects"
                            
                            background: Rectangle {
                                color: Qt.rgba(0.05, 0.05, 0.05, 0.8)
                                radius: Theme.borderRadiusMedium
                                border.width: 1
                                border.color: Qt.rgba(0.3, 0.3, 0.3, 0.5)
                            }
                            
                            label: Text {
                                text: parent.title
                                font.family: Theme.fontFamily
                                font.pixelSize: Theme.fontSizeNormal
                                font.weight: Font.Bold
                                color: Theme.textPrimary
                                padding: Theme.spacingSmall
                            }
                            
                            Column {
                                width: parent.width
                                spacing: Theme.spacingMedium
                                
                                Row {
                                    width: parent.width
                                    spacing: Theme.spacingMedium
                                    
                                    Text {
                                        text: "Blur Intensity:"
                                        font.family: Theme.fontFamily
                                        font.pixelSize: Theme.fontSizeSmall
                                        color: Theme.textPrimary
                                        width: 100
                                        anchors.verticalCenter: parent.verticalCenter
                                    }
                                    
                                    Slider {
                                        id: blurSlider
                                        width: parent.width - 150
                                        from: 0
                                        to: 100
                                        value: 80
                                        
                                        background: Rectangle {
                                            x: blurSlider.leftPadding
                                            y: blurSlider.topPadding + blurSlider.availableHeight / 2 - height / 2
                                            width: blurSlider.availableWidth
                                            height: 4
                                            radius: 2
                                            color: Qt.rgba(0.3, 0.3, 0.3, 0.5)
                                            
                                            Rectangle {
                                                width: blurSlider.visualPosition * parent.width
                                                height: parent.height
                                                color: Theme.primaryAccent
                                                radius: 2
                                            }
                                        }
                                        
                                        handle: Rectangle {
                                            x: blurSlider.leftPadding + blurSlider.visualPosition * (blurSlider.availableWidth - width)
                                            y: blurSlider.topPadding + blurSlider.availableHeight / 2 - height / 2
                                            width: 20
                                            height: 20
                                            radius: 10
                                            color: Theme.primaryAccent
                                            border.width: 2
                                            border.color: Theme.voidBlack
                                        }
                                    }
                                    
                                    Text {
                                        text: blurSlider.value.toFixed(0) + "%"
                                        font.family: Theme.fontFamilyMono
                                        font.pixelSize: Theme.fontSizeSmall
                                        color: Theme.primaryAccent
                                        width: 40
                                        anchors.verticalCenter: parent.verticalCenter
                                    }
                                }
                                
                                CheckBox {
                                    text: "Show animated noise overlay"
                                    checked: true
                                    
                                    contentItem: Text {
                                        text: parent.text
                                        font.family: Theme.fontFamily
                                        font.pixelSize: Theme.fontSizeSmall
                                        color: Theme.textPrimary
                                        leftPadding: parent.indicator.width + Theme.spacingSmall
                                        verticalAlignment: Text.AlignVCenter
                                    }
                                }
                            }
                        }
                    }
                }
                
                // ============================================
                // SYSTEM TAB
                // ============================================
                
                ScrollView {
                    width: parent.width
                    height: parent.height
                    clip: true
                    
                    Column {
                        width: parent.width - Theme.spacingLarge
                        padding: Theme.spacingLarge
                        spacing: Theme.spacingLarge
                        
                        GroupBox {
                            width: parent.width
                            title: "Performance"
                            
                            background: Rectangle {
                                color: Qt.rgba(0.05, 0.05, 0.05, 0.8)
                                radius: Theme.borderRadiusMedium
                                border.width: 1
                                border.color: Qt.rgba(0.3, 0.3, 0.3, 0.5)
                            }
                            
                            label: Text {
                                text: parent.title
                                font.family: Theme.fontFamily
                                font.pixelSize: Theme.fontSizeNormal
                                font.weight: Font.Bold
                                color: Theme.textPrimary
                                padding: Theme.spacingSmall
                            }
                            
                            Column {
                                width: parent.width
                                spacing: Theme.spacingMedium
                                
                                CheckBox {
                                    text: "Enable hardware acceleration"
                                    checked: true
                                    
                                    contentItem: Text {
                                        text: parent.text
                                        font.family: Theme.fontFamily
                                        font.pixelSize: Theme.fontSizeSmall
                                        color: Theme.textPrimary
                                        leftPadding: parent.indicator.width + Theme.spacingSmall
                                        verticalAlignment: Text.AlignVCenter
                                    }
                                }
                                
                                CheckBox {
                                    text: "Limit CPU usage when idle"
                                    checked: false
                                    
                                    contentItem: Text {
                                        text: parent.text
                                        font.family: Theme.fontFamily
                                        font.pixelSize: Theme.fontSizeSmall
                                        color: Theme.textPrimary
                                        leftPadding: parent.indicator.width + Theme.spacingSmall
                                        verticalAlignment: Text.AlignVCenter
                                    }
                                }
                                
                                Text {
                                    text: "System Monitor Update Rate:"
                                    font.family: Theme.fontFamily
                                    font.pixelSize: Theme.fontSizeSmall
                                    color: Theme.textPrimary
                                }
                                
                                Row {
                                    spacing: Theme.spacingMedium
                                    
                                    Repeater {
                                        model: ["Fast (500ms)", "Normal (1s)", "Slow (2s)"]
                                        
                                        RadioButton {
                                            text: modelData
                                            checked: index === 1
                                            
                                            contentItem: Text {
                                                text: parent.text
                                                font.family: Theme.fontFamily
                                                font.pixelSize: Theme.fontSizeSmall
                                                color: Theme.textPrimary
                                                leftPadding: parent.indicator.width + Theme.spacingSmall
                                                verticalAlignment: Text.AlignVCenter
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        
                        GroupBox {
                            width: parent.width
                            title: "System Info"
                            
                            background: Rectangle {
                                color: Qt.rgba(0.05, 0.05, 0.05, 0.8)
                                radius: Theme.borderRadiusMedium
                                border.width: 1
                                border.color: Qt.rgba(0.3, 0.3, 0.3, 0.5)
                            }
                            
                            label: Text {
                                text: parent.title
                                font.family: Theme.fontFamily
                                font.pixelSize: Theme.fontSizeNormal
                                font.weight: Font.Bold
                                color: Theme.textPrimary
                                padding: Theme.spacingSmall
                            }
                            
                            Column {
                                width: parent.width
                                spacing: Theme.spacingSmall
                                
                                Text {
                                    text: "CPU: " + SystemMonitor.cpuName
                                    font.family: Theme.fontFamilyMono
                                    font.pixelSize: Theme.fontSizeSmall
                                    color: Theme.textSecondary
                                    width: parent.width
                                    wrapMode: Text.WordWrap
                                }
                                
                                Text {
                                    text: "Cores: " + SystemMonitor.cpuCores
                                    font.family: Theme.fontFamilyMono
                                    font.pixelSize: Theme.fontSizeSmall
                                    color: Theme.textSecondary
                                }
                                
                                Text {
                                    text: "RAM: " + (SystemMonitor.totalMemoryMB / 1024).toFixed(1) + " GB"
                                    font.family: Theme.fontFamilyMono
                                    font.pixelSize: Theme.fontSizeSmall
                                    color: Theme.textSecondary
                                }
                                
                                Text {
                                    text: "Disk: " + SystemMonitor.totalDiskGB + " GB"
                                    font.family: Theme.fontFamilyMono
                                    font.pixelSize: Theme.fontSizeSmall
                                    color: Theme.textSecondary
                                }
                            }
                        }
                    }
                }
                
                // ============================================
                // AUDIO TAB
                // ============================================
                
                ScrollView {
                    width: parent.width
                    height: parent.height
                    clip: true
                    
                    Column {
                        width: parent.width - Theme.spacingLarge
                        padding: Theme.spacingLarge
                        spacing: Theme.spacingLarge
                        
                        GroupBox {
                            width: parent.width
                            title: "Audio Reactivity"
                            
                            background: Rectangle {
                                color: Qt.rgba(0.05, 0.05, 0.05, 0.8)
                                radius: Theme.borderRadiusMedium
                                border.width: 1
                                border.color: Qt.rgba(0.3, 0.3, 0.3, 0.5)
                            }
                            
                            label: Text {
                                text: parent.title
                                font.family: Theme.fontFamily
                                font.pixelSize: Theme.fontSizeNormal
                                font.weight: Font.Bold
                                color: Theme.textPrimary
                                padding: Theme.spacingSmall
                            }
                            
                            Column {
                                width: parent.width
                                spacing: Theme.spacingMedium
                                
                                Switch {
                                    text: "Enable audio-reactive colors"
                                    checked: typeof AudioColors !== 'undefined' ? AudioColors.enabled : false
                                    
                                    onToggled: {
                                        if (typeof AudioColors !== 'undefined') {
                                            AudioColors.enabled = checked
                                        }
                                    }
                                    
                                    contentItem: Text {
                                        text: parent.text
                                        font.family: Theme.fontFamily
                                        font.pixelSize: Theme.fontSizeSmall
                                        color: Theme.textPrimary
                                        leftPadding: parent.indicator.width + Theme.spacingMedium
                                        verticalAlignment: Text.AlignVCenter
                                    }
                                }
                                
                                Row {
                                    width: parent.width
                                    spacing: Theme.spacingMedium
                                    
                                    Text {
                                        text: "Sensitivity:"
                                        font.family: Theme.fontFamily
                                        font.pixelSize: Theme.fontSizeSmall
                                        color: Theme.textPrimary
                                        width: 100
                                        anchors.verticalCenter: parent.verticalCenter
                                    }
                                    
                                    Slider {
                                        id: sensitivitySlider
                                        width: parent.width - 150
                                        from: 0.1
                                        to: 5.0
                                        value: typeof AudioColors !== 'undefined' ? AudioColors.sensitivity : 1.0
                                        
                                        onValueChanged: {
                                            if (typeof AudioColors !== 'undefined') {
                                                AudioColors.sensitivity = value
                                            }
                                        }
                                        
                                        background: Rectangle {
                                            x: sensitivitySlider.leftPadding
                                            y: sensitivitySlider.topPadding + sensitivitySlider.availableHeight / 2 - height / 2
                                            width: sensitivitySlider.availableWidth
                                            height: 4
                                            radius: 2
                                            color: Qt.rgba(0.3, 0.3, 0.3, 0.5)
                                            
                                            Rectangle {
                                                width: sensitivitySlider.visualPosition * parent.width
                                                height: parent.height
                                                color: Theme.secondaryAccent
                                                radius: 2
                                            }
                                        }
                                        
                                        handle: Rectangle {
                                            x: sensitivitySlider.leftPadding + sensitivitySlider.visualPosition * (sensitivitySlider.availableWidth - width)
                                            y: sensitivitySlider.topPadding + sensitivitySlider.availableHeight / 2 - height / 2
                                            width: 20
                                            height: 20
                                            radius: 10
                                            color: Theme.secondaryAccent
                                            border.width: 2
                                            border.color: Theme.voidBlack
                                        }
                                    }
                                    
                                    Text {
                                        text: sensitivitySlider.value.toFixed(1) + "x"
                                        font.family: Theme.fontFamilyMono
                                        font.pixelSize: Theme.fontSizeSmall
                                        color: Theme.secondaryAccent
                                        width: 40
                                        anchors.verticalCenter: parent.verticalCenter
                                    }
                                }
                                
                                Text {
                                    text: "Current Audio Levels:"
                                    font.family: Theme.fontFamily
                                    font.pixelSize: Theme.fontSizeSmall
                                    color: Theme.textSecondary
                                }
                                
                                Column {
                                    width: parent.width
                                    spacing: Theme.spacingSmall
                                    
                                    Repeater {
                                        model: [
                                            {name: "Bass", level: typeof AudioColors !== 'undefined' ? AudioColors.bassLevel : 0, color: Theme.primaryAccent},
                                            {name: "Mid", level: typeof AudioColors !== 'undefined' ? AudioColors.midLevel : 0, color: Theme.secondaryAccent},
                                            {name: "Treble", level: typeof AudioColors !== 'undefined' ? AudioColors.trebleLevel : 0, color: Theme.tertiaryAccent}
                                        ]
                                        
                                        Row {
                                            width: parent.width
                                            spacing: Theme.spacingMedium
                                            
                                            Text {
                                                text: modelData.name + ":"
                                                font.family: Theme.fontFamily
                                                font.pixelSize: Theme.fontSizeSmall
                                                color: Theme.textPrimary
                                                width: 60
                                            }
                                            
                                            Rectangle {
                                                width: parent.width - 120
                                                height: 12
                                                radius: 6
                                                color: Qt.rgba(0.2, 0.2, 0.2, 0.8)
                                                anchors.verticalCenter: parent.verticalCenter
                                                
                                                Rectangle {
                                                    width: parent.width * modelData.level
                                                    height: parent.height
                                                    radius: parent.radius
                                                    color: modelData.color
                                                    
                                                    Behavior on width {
                                                        NumberAnimation { duration: 100 }
                                                    }
                                                }
                                            }
                                            
                                            Text {
                                                text: (modelData.level * 100).toFixed(0) + "%"
                                                font.family: Theme.fontFamilyMono
                                                font.pixelSize: Theme.fontSizeXS
                                                color: modelData.color
                                                width: 40
                                                anchors.verticalCenter: parent.verticalCenter
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                
                // ============================================
                // ADVANCED TAB
                // ============================================
                
                ScrollView {
                    width: parent.width
                    height: parent.height
                    clip: true
                    
                    Column {
                        width: parent.width - Theme.spacingLarge
                        padding: Theme.spacingLarge
                        spacing: Theme.spacingLarge
                        
                        GroupBox {
                            width: parent.width
                            title: "Desktop Environment"
                            
                            background: Rectangle {
                                color: Qt.rgba(0.05, 0.05, 0.05, 0.8)
                                radius: Theme.borderRadiusMedium
                                border.width: 1
                                border.color: Qt.rgba(0.3, 0.3, 0.3, 0.5)
                            }
                            
                            label: Text {
                                text: parent.title
                                font.family: Theme.fontFamily
                                font.pixelSize: Theme.fontSizeNormal
                                font.weight: Font.Bold
                                color: Theme.textPrimary
                                padding: Theme.spacingSmall
                            }
                            
                            Column {
                                width: parent.width
                                spacing: Theme.spacingMedium
                                
                                CheckBox {
                                    text: "Enable liquid motion physics"
                                    checked: true
                                    
                                    contentItem: Text {
                                        text: parent.text
                                        font.family: Theme.fontFamily
                                        font.pixelSize: Theme.fontSizeSmall
                                        color: Theme.textPrimary
                                        leftPadding: parent.indicator.width + Theme.spacingSmall
                                        verticalAlignment: Text.AlignVCenter
                                    }
                                }
                                
                                CheckBox {
                                    text: "Show widget grid"
                                    checked: false
                                    
                                    contentItem: Text {
                                        text: parent.text
                                        font.family: Theme.fontFamily
                                        font.pixelSize: Theme.fontSizeSmall
                                        color: Theme.textPrimary
                                        leftPadding: parent.indicator.width + Theme.spacingSmall
                                        verticalAlignment: Text.AlignVCenter
                                    }
                                }
                                
                                CheckBox {
                                    text: "Snap widgets to grid"
                                    checked: false
                                    
                                    contentItem: Text {
                                        text: parent.text
                                        font.family: Theme.fontFamily
                                        font.pixelSize: Theme.fontSizeSmall
                                        color: Theme.textPrimary
                                        leftPadding: parent.indicator.width + Theme.spacingSmall
                                        verticalAlignment: Text.AlignVCenter
                                    }
                                }
                            }
                        }
                        
                        GroupBox {
                            width: parent.width
                            title: "About"
                            
                            background: Rectangle {
                                color: Qt.rgba(0.05, 0.05, 0.05, 0.8)
                                radius: Theme.borderRadiusMedium
                                border.width: 1
                                border.color: Qt.rgba(0.3, 0.3, 0.3, 0.5)
                            }
                            
                            label: Text {
                                text: parent.title
                                font.family: Theme.fontFamily
                                font.pixelSize: Theme.fontSizeNormal
                                font.weight: Font.Bold
                                color: Theme.textPrimary
                                padding: Theme.spacingSmall
                            }
                            
                            Column {
                                width: parent.width
                                spacing: Theme.spacingSmall
                                
                                Text {
                                    text: "QOR Desktop Environment"
                                    font.family: Theme.fontFamilyDisplay
                                    font.pixelSize: Theme.fontSizeMedium
                                    font.weight: Font.Bold
                                    color: Theme.primaryAccent
                                }
                                
                                Text {
                                    text: "Glass Engine v1.0.0 - Phase 5"
                                    font.family: Theme.fontFamily
                                    font.pixelSize: Theme.fontSizeSmall
                                    color: Theme.textSecondary
                                }
                                
                                Text {
                                    text: "Ancient Code Meets Ethereal Glass"
                                    font.family: Theme.fontFamily
                                    font.pixelSize: Theme.fontSizeSmall
                                    color: Theme.textMuted
                                }
                                
                                Rectangle {
                                    width: parent.width
                                    height: 1
                                    color: Qt.rgba(0.3, 0.3, 0.3, 0.5)
                                    anchors.margins: Theme.spacingSmall
                                }
                                
                                Text {
                                    text: "© 2026 Demiurge Blockchain"
                                    font.family: Theme.fontFamily
                                    font.pixelSize: Theme.fontSizeXS
                                    color: Theme.textMuted
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    Component.onCompleted: {
        console.log("⚙️ Settings Widget initialized")
    }
}
