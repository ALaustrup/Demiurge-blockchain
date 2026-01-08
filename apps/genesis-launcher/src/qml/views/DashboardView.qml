/**
 * DashboardView.qml - The Fork Selection
 * 
 * Choose between "The Construct" (Miner) or "Enter Abyss" (Full OS)
 */
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Effects

import "../components"

Item {
    id: root
    
    signal logout()
    
    // Theme colors
    readonly property color textPrimary: "#E0E0E0"
    readonly property color textSecondary: "#7A7A7A"
    readonly property color flameOrange: "#FF3D00"
    readonly property color cipherCyan: "#00FFC8"
    
    ColumnLayout {
        anchors.fill: parent
        spacing: 20
        
        // Header with user info
        RowLayout {
            Layout.fillWidth: true
            
            // User avatar/info
            RowLayout {
                spacing: 12
                
                // Avatar placeholder
                Rectangle {
                    width: 40
                    height: 40
                    radius: 20
                    color: "#1A1A1A"
                    
                    Text {
                        anchors.centerIn: parent
                        text: AuthManager.username.charAt(0).toUpperCase()
                        color: flameOrange
                        font.pixelSize: 18
                        font.weight: Font.Bold
                    }
                }
                
                Column {
                    Text {
                        text: "Welcome back,"
                        color: textSecondary
                        font.pixelSize: 11
                    }
                    Text {
                        text: AuthManager.username
                        color: textPrimary
                        font.family: "Orbitron"
                        font.pixelSize: 16
                    }
                }
            }
            
            Item { Layout.fillWidth: true }
            
            // Logout button
            Text {
                text: "Logout"
                color: textSecondary
                font.pixelSize: 12
                
                MouseArea {
                    anchors.fill: parent
                    cursorShape: Qt.PointingHandCursor
                    onClicked: {
                        AuthManager.logout()
                        root.logout()
                    }
                }
            }
        }
        
        // Status message
        Rectangle {
            Layout.fillWidth: true
            height: 40
            color: "#0A0A0A"
            radius: 8
            
            RowLayout {
                anchors.fill: parent
                anchors.margins: 10
                spacing: 10
                
                // Status indicator
                Rectangle {
                    width: 8
                    height: 8
                    radius: 4
                    color: UpdateEngine.hasUpdates ? "#FFAA00" : cipherCyan
                    
                    SequentialAnimation on opacity {
                        loops: Animation.Infinite
                        running: true
                        NumberAnimation { to: 0.4; duration: 1000 }
                        NumberAnimation { to: 1.0; duration: 1000 }
                    }
                }
                
                Text {
                    text: LauncherCore.statusMessage
                    color: textSecondary
                    font.family: "JetBrains Mono"
                    font.pixelSize: 11
                }
                
                Item { Layout.fillWidth: true }
                
                // Update button if available
                Text {
                    visible: UpdateEngine.hasUpdates
                    text: "Update Available"
                    color: "#FFAA00"
                    font.pixelSize: 11
                    
                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onClicked: UpdateEngine.downloadUpdates()
                    }
                }
            }
        }
        
        // The Fork - Launch cards
        Item {
            Layout.fillWidth: true
            Layout.fillHeight: true
            
            RowLayout {
                anchors.centerIn: parent
                spacing: 30
                
                // PATH A: The Construct (Miner)
                LaunchCard {
                    id: constructCard
                    title: "THE CONSTRUCT"
                    subtitle: "Miner + Wallet"
                    description: "Low Latency. Pure Profit.\nLightweight daemon with system tray presence."
                    iconSource: "qrc:/icons/construct.png"
                    accentColor: cipherCyan
                    
                    onClicked: {
                        LauncherCore.launchConstruct()
                    }
                }
                
                // Divider
                Rectangle {
                    width: 1
                    height: 300
                    color: Qt.rgba(1, 1, 1, 0.1)
                }
                
                // PATH B: Enter Abyss (Full OS)
                LaunchCard {
                    id: abyssCard
                    title: "ENTER ABYSS"
                    subtitle: "Full Desktop"
                    description: "Full Immersion. The Desktop.\nComplete Abyss OS environment."
                    iconSource: "qrc:/icons/abyss.png"
                    accentColor: flameOrange
                    
                    onClicked: {
                        LauncherCore.launchAbyss()
                    }
                }
            }
        }
        
        // Progress bar (for updates/launches)
        CyberpunkProgressBar {
            Layout.fillWidth: true
            Layout.preferredHeight: 30
            visible: UpdateEngine.isDownloading
            value: UpdateEngine.downloadProgress
            statusText: UpdateEngine.statusMessage
        }
        
        // Footer with component versions
        RowLayout {
            Layout.fillWidth: true
            
            Text {
                text: "QOR Desktop: " + (LauncherCore.getComponentStatus().qorInstalled ? "Installed" : "Not Installed")
                color: textSecondary
                font.family: "JetBrains Mono"
                font.pixelSize: 10
            }
            
            Item { Layout.fillWidth: true }
            
            Text {
                text: "Miner: " + (LauncherCore.getComponentStatus().minerInstalled ? "Installed" : "Not Installed")
                color: textSecondary
                font.family: "JetBrains Mono"
                font.pixelSize: 10
            }
        }
    }
    
    // Listen for launch events
    Connections {
        target: LauncherCore
        
        function onLaunchStarted(mode) {
            constructCard.enabled = false
            abyssCard.enabled = false
        }
        
        function onLaunchCompleted(mode, success) {
            if (success) {
                // Optionally minimize launcher
                // root.Window.window.showMinimized()
            }
            constructCard.enabled = true
            abyssCard.enabled = true
        }
        
        function onLaunchFailed(mode, error) {
            constructCard.enabled = true
            abyssCard.enabled = true
        }
    }
}
