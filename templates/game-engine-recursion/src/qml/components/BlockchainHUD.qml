/**
 * BlockchainHUD.qml - HUD overlay showing blockchain info
 */

import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Rectangle {
    id: hud
    anchors.fill: parent
    color: "transparent"
    
    // Chain event notifications
    Column {
        anchors.top: parent.top
        anchors.right: parent.right
        anchors.margins: 20
        spacing: 10
        
        Repeater {
            model: chainEvents
            
            Rectangle {
                width: 300
                height: 60
                color: "#AA000000"
                radius: 8
                border.color: "#FF3D00"
                border.width: 1
                
                Column {
                    anchors.left: parent.left
                    anchors.verticalCenter: parent.verticalCenter
                    anchors.margins: 10
                    spacing: 5
                    
                    Text {
                        text: modelData.type || "Chain Event"
                        font.pixelSize: 14
                        font.bold: true
                        color: "#FF3D00"
                    }
                    
                    Text {
                        text: modelData.description || ""
                        font.pixelSize: 12
                        color: "#AAAAAA"
                    }
                }
                
                // Auto-remove after 3 seconds
                Timer {
                    interval: 3000
                    running: true
                    onTriggered: chainEvents.remove(index)
                }
            }
        }
    }
    
    // List model for chain events
    ListModel {
        id: chainEvents
    }
    
    // Connect to engine signals
    Connections {
        target: recursionEngine
        
        function onChainEventReceived(eventType, eventData) {
            chainEvents.append({
                type: eventType,
                description: JSON.stringify(eventData),
                timestamp: Date.now()
            })
        }
    }
}
