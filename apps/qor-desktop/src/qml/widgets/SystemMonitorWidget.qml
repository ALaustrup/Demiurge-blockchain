// SystemMonitorWidget.qml - Live System Statistics
import QtQuick
import QtQuick.Controls
import QtCharts

BaseWidget {
    id: widget
    
    widgetName: "System Monitor"
    widgetIcon: "📊"
    
    width: 500
    height: 400
    
    content: Item {
        anchors.fill: parent
        
        Column {
            anchors.fill: parent
            spacing: Theme.spacingMedium
            
            // ============================================
            // HEADER
            // ============================================
            
            Text {
                text: "System Performance"
                font.family: Theme.fontFamilyDisplay
                font.pixelSize: Theme.fontSizeLarge
                font.weight: Font.Bold
                color: Theme.textPrimary
                anchors.horizontalCenter: parent.horizontalCenter
            }
            
            // ============================================
            // CPU USAGE
            // ============================================
            
            Rectangle {
                width: parent.width
                height: 80
                radius: Theme.borderRadiusMedium
                color: Qt.rgba(0.1, 0.1, 0.1, 0.5)
                border.width: 1
                border.color: Qt.rgba(0.3, 0.3, 0.3, 0.5)
                
                Column {
                    anchors {
                        fill: parent
                        margins: Theme.spacingMedium
                    }
                    spacing: Theme.spacingSmall
                    
                    Row {
                        width: parent.width
                        
                        Text {
                            text: "CPU"
                            font.family: Theme.fontFamily
                            font.pixelSize: Theme.fontSizeNormal
                            font.weight: Font.Bold
                            color: Theme.textPrimary
                            width: parent.width * 0.3
                        }
                        
                        Text {
                            text: SystemMonitor.cpuUsage.toFixed(1) + "%"
                            font.family: Theme.fontFamilyMono
                            font.pixelSize: Theme.fontSizeLarge
                            font.weight: Font.Bold
                            color: SystemMonitor.cpuUsage > 80 ? Theme.errorRed : Theme.primaryAccent
                            width: parent.width * 0.7
                            horizontalAlignment: Text.AlignRight
                        }
                    }
                    
                    // CPU Usage Bar
                    Rectangle {
                        width: parent.width
                        height: 12
                        radius: 6
                        color: Qt.rgba(0.2, 0.2, 0.2, 0.8)
                        
                        Rectangle {
                            width: parent.width * (SystemMonitor.cpuUsage / 100)
                            height: parent.height
                            radius: parent.radius
                            
                            gradient: Gradient {
                                orientation: Gradient.Horizontal
                                GradientStop { 
                                    position: 0.0
                                    color: SystemMonitor.cpuUsage > 80 ? Theme.errorRed : Theme.primaryAccent
                                }
                                GradientStop { 
                                    position: 1.0
                                    color: SystemMonitor.cpuUsage > 80 ? Theme.warningYellow : Theme.secondaryAccent
                                }
                            }
                            
                            Behavior on width {
                                NumberAnimation { duration: Theme.animationNormal }
                            }
                        }
                    }
                    
                    Text {
                        text: SystemMonitor.cpuName
                        font.family: Theme.fontFamily
                        font.pixelSize: Theme.fontSizeSmall
                        color: Theme.textMuted
                    }
                }
            }
            
            // ============================================
            // MEMORY USAGE
            // ============================================
            
            Rectangle {
                width: parent.width
                height: 80
                radius: Theme.borderRadiusMedium
                color: Qt.rgba(0.1, 0.1, 0.1, 0.5)
                border.width: 1
                border.color: Qt.rgba(0.3, 0.3, 0.3, 0.5)
                
                Column {
                    anchors {
                        fill: parent
                        margins: Theme.spacingMedium
                    }
                    spacing: Theme.spacingSmall
                    
                    Row {
                        width: parent.width
                        
                        Text {
                            text: "Memory"
                            font.family: Theme.fontFamily
                            font.pixelSize: Theme.fontSizeNormal
                            font.weight: Font.Bold
                            color: Theme.textPrimary
                            width: parent.width * 0.3
                        }
                        
                        Text {
                            text: SystemMonitor.memoryUsage.toFixed(1) + "%"
                            font.family: Theme.fontFamilyMono
                            font.pixelSize: Theme.fontSizeLarge
                            font.weight: Font.Bold
                            color: SystemMonitor.memoryUsage > 80 ? Theme.errorRed : Theme.primaryAccent
                            width: parent.width * 0.7
                            horizontalAlignment: Text.AlignRight
                        }
                    }
                    
                    // Memory Usage Bar
                    Rectangle {
                        width: parent.width
                        height: 12
                        radius: 6
                        color: Qt.rgba(0.2, 0.2, 0.2, 0.8)
                        
                        Rectangle {
                            width: parent.width * (SystemMonitor.memoryUsage / 100)
                            height: parent.height
                            radius: parent.radius
                            
                            gradient: Gradient {
                                orientation: Gradient.Horizontal
                                GradientStop { 
                                    position: 0.0
                                    color: SystemMonitor.memoryUsage > 80 ? Theme.errorRed : Theme.secondaryAccent
                                }
                                GradientStop { 
                                    position: 1.0
                                    color: SystemMonitor.memoryUsage > 80 ? Theme.warningYellow : Theme.primaryAccent
                                }
                            }
                            
                            Behavior on width {
                                NumberAnimation { duration: Theme.animationNormal }
                            }
                        }
                    }
                    
                    Text {
                        text: (SystemMonitor.usedMemoryMB / 1024).toFixed(1) + " GB / " + 
                              (SystemMonitor.totalMemoryMB / 1024).toFixed(1) + " GB"
                        font.family: Theme.fontFamily
                        font.pixelSize: Theme.fontSizeSmall
                        color: Theme.textMuted
                    }
                }
            }
            
            // ============================================
            // NETWORK USAGE
            // ============================================
            
            Rectangle {
                width: parent.width
                height: 70
                radius: Theme.borderRadiusMedium
                color: Qt.rgba(0.1, 0.1, 0.1, 0.5)
                border.width: 1
                border.color: Qt.rgba(0.3, 0.3, 0.3, 0.5)
                
                Row {
                    anchors {
                        fill: parent
                        margins: Theme.spacingMedium
                    }
                    spacing: Theme.spacingLarge
                    
                    Column {
                        width: parent.width / 2 - Theme.spacingLarge / 2
                        spacing: Theme.spacingSmall
                        
                        Text {
                            text: "↓ Download"
                            font.family: Theme.fontFamily
                            font.pixelSize: Theme.fontSizeSmall
                            color: Theme.textSecondary
                        }
                        
                        Text {
                            text: SystemMonitor.networkDownloadKBps.toFixed(1) + " KB/s"
                            font.family: Theme.fontFamilyMono
                            font.pixelSize: Theme.fontSizeMedium
                            font.weight: Font.Bold
                            color: Theme.primaryAccent
                        }
                    }
                    
                    Column {
                        width: parent.width / 2 - Theme.spacingLarge / 2
                        spacing: Theme.spacingSmall
                        
                        Text {
                            text: "↑ Upload"
                            font.family: Theme.fontFamily
                            font.pixelSize: Theme.fontSizeSmall
                            color: Theme.textSecondary
                        }
                        
                        Text {
                            text: SystemMonitor.networkUploadKBps.toFixed(1) + " KB/s"
                            font.family: Theme.fontFamilyMono
                            font.pixelSize: Theme.fontSizeMedium
                            font.weight: Font.Bold
                            color: Theme.secondaryAccent
                        }
                    }
                }
            }
            
            // ============================================
            // DISK USAGE
            // ============================================
            
            Rectangle {
                width: parent.width
                height: 60
                radius: Theme.borderRadiusMedium
                color: Qt.rgba(0.1, 0.1, 0.1, 0.5)
                border.width: 1
                border.color: Qt.rgba(0.3, 0.3, 0.3, 0.5)
                
                Column {
                    anchors {
                        fill: parent
                        margins: Theme.spacingMedium
                    }
                    spacing: Theme.spacingSmall
                    
                    Row {
                        width: parent.width
                        
                        Text {
                            text: "Disk"
                            font.family: Theme.fontFamily
                            font.pixelSize: Theme.fontSizeNormal
                            color: Theme.textPrimary
                            width: parent.width * 0.3
                        }
                        
                        Text {
                            text: SystemMonitor.diskUsage.toFixed(1) + "%"
                            font.family: Theme.fontFamilyMono
                            font.pixelSize: Theme.fontSizeMedium
                            font.weight: Font.Bold
                            color: SystemMonitor.diskUsage > 90 ? Theme.errorRed : Theme.tertiaryAccent
                            width: parent.width * 0.7
                            horizontalAlignment: Text.AlignRight
                        }
                    }
                    
                    Text {
                        text: SystemMonitor.usedDiskGB + " GB / " + SystemMonitor.totalDiskGB + " GB used"
                        font.family: Theme.fontFamily
                        font.pixelSize: Theme.fontSizeSmall
                        color: Theme.textMuted
                    }
                }
            }
        }
        
        // ============================================
        // REFRESH INDICATOR
        // ============================================
        
        Text {
            anchors {
                bottom: parent.bottom
                right: parent.right
                margins: Theme.spacingSmall
            }
            text: "● Live"
            font.family: Theme.fontFamily
            font.pixelSize: Theme.fontSizeXS
            color: Theme.successGreen
            
            SequentialAnimation on opacity {
                running: true
                loops: Animation.Infinite
                NumberAnimation { from: 1.0; to: 0.3; duration: 1000 }
                NumberAnimation { from: 0.3; to: 1.0; duration: 1000 }
            }
        }
    }
    
    Component.onCompleted: {
        console.log("📊 System Monitor Widget initialized")
    }
}
