/**
 * TorrentItem - Individual torrent display component
 */

import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

Rectangle {
    id: root
    height: 120
    color: "#0A0A0F"
    border.color: status.isPaused ? "#666" : "#FF6B35"
    border.width: 1
    radius: 4
    
    property var status: ({})
    
    signal pause()
    signal resume()
    signal remove()
    
    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 12
        spacing: 8
        
        // Name and info hash
        RowLayout {
            Layout.fillWidth: true
            
            Text {
                text: status.name || "Unknown Torrent"
                color: "white"
                font.pixelSize: 16
                font.bold: true
                elide: Text.ElideRight
                Layout.fillWidth: true
            }
            
            Text {
                text: status.infoHash ? status.infoHash.substring(0, 8) + "..." : ""
                color: "#AAA"
                font.pixelSize: 11
                font.family: "monospace"
            }
        }
        
        // Progress bar
        ProgressBar {
            Layout.fillWidth: true
            value: status.progress || 0
            from: 0
            to: 1
            
            background: Rectangle {
                color: "#1A1A2E"
                radius: 2
            }
            
            contentItem: Item {
                Rectangle {
                    width: parent.width * (status.progress || 0)
                    height: parent.height
                    color: status.isFinished ? "#00D9FF" : "#FF6B35"
                    radius: 2
                }
            }
        }
        
        // Stats row
        RowLayout {
            Layout.fillWidth: true
            
            Text {
                text: `Progress: ${((status.progress || 0) * 100).toFixed(1)}%`
                color: "#AAA"
                font.pixelSize: 12
            }
            
            Text {
                text: `↓ ${formatSpeed(status.downloadRate || 0)}`
                color: "#00D9FF"
                font.pixelSize: 12
            }
            
            Text {
                text: `↑ ${formatSpeed(status.uploadRate || 0)}`
                color: "#FF6B35"
                font.pixelSize: 12
            }
            
            Text {
                text: `Peers: ${status.numPeers || 0} | Seeds: ${status.numSeeds || 0}`
                color: "#AAA"
                font.pixelSize: 11
            }
            
            Item { Layout.fillWidth: true }
            
            // Buttons
            Button {
                text: status.isPaused ? "Resume" : "Pause"
                onClicked: status.isPaused ? root.resume() : root.pause()
                background: Rectangle {
                    color: status.isPaused ? "#00D9FF" : "#FF6B35"
                    radius: 2
                }
                contentItem: Text {
                    text: parent.text
                    color: "white"
                    font.pixelSize: 11
                }
            }
            
            Button {
                text: "Remove"
                onClicked: root.remove()
                background: Rectangle {
                    color: "#666"
                    radius: 2
                }
                contentItem: Text {
                    text: parent.text
                    color: "white"
                    font.pixelSize: 11
                }
            }
        }
    }
    
    function formatSpeed(bytesPerSecond) {
        if (bytesPerSecond < 1024) return bytesPerSecond + " B/s"
        if (bytesPerSecond < 1024 * 1024) return (bytesPerSecond / 1024).toFixed(1) + " KB/s"
        return (bytesPerSecond / (1024 * 1024)).toFixed(1) + " MB/s"
    }
}
