// ExplorerWidget.qml - Simple File Browser
import QtQuick
import QtQuick.Controls
import QtCore

BaseWidget {
    id: widget
    
    widgetName: "Explorer"
    widgetIcon: "🔮"
    
    width: 500
    height: 450
    
    property string currentPath: StandardPaths.writableLocation(StandardPaths.HomeLocation)
    
    content: Item {
        anchors.fill: parent
        
        Column {
            anchors.fill: parent
            spacing: 0
            
            // ============================================
            // ADDRESS BAR
            // ============================================
            
            Rectangle {
                width: parent.width
                height: 40
                color: Qt.rgba(0.08, 0.08, 0.08, 0.8)
                radius: Theme.borderRadiusSmall
                
                Row {
                    anchors {
                        fill: parent
                        margins: Theme.spacingSmall
                    }
                    spacing: Theme.spacingSmall
                    
                    // Back button
                    Rectangle {
                        width: 30
                        height: 30
                        radius: Theme.borderRadiusSmall
                        color: backArea.containsMouse ? Qt.rgba(0.3, 0.3, 0.3, 0.8) : "transparent"
                        anchors.verticalCenter: parent.verticalCenter
                        
                        Text {
                            anchors.centerIn: parent
                            text: "←"
                            font.pixelSize: 18
                            color: Theme.primaryAccent
                        }
                        
                        MouseArea {
                            id: backArea
                            anchors.fill: parent
                            hoverEnabled: true
                            onClicked: {
                                // Navigate to parent directory
                                var parts = widget.currentPath.split("/")
                                parts.pop()
                                widget.currentPath = parts.join("/") || "/"
                                refreshFileList()
                            }
                        }
                    }
                    
                    // Home button
                    Rectangle {
                        width: 30
                        height: 30
                        radius: Theme.borderRadiusSmall
                        color: homeArea.containsMouse ? Qt.rgba(0.3, 0.3, 0.3, 0.8) : "transparent"
                        anchors.verticalCenter: parent.verticalCenter
                        
                        Text {
                            anchors.centerIn: parent
                            text: "🏠"
                            font.pixelSize: 14
                        }
                        
                        MouseArea {
                            id: homeArea
                            anchors.fill: parent
                            hoverEnabled: true
                            onClicked: {
                                widget.currentPath = StandardPaths.writableLocation(StandardPaths.HomeLocation)
                                refreshFileList()
                            }
                        }
                    }
                    
                    // Path display
                    Rectangle {
                        width: parent.width - 80
                        height: 30
                        radius: Theme.borderRadiusSmall
                        color: Qt.rgba(0.1, 0.1, 0.1, 0.8)
                        border.width: 1
                        border.color: Qt.rgba(0.3, 0.3, 0.3, 0.5)
                        anchors.verticalCenter: parent.verticalCenter
                        
                        Text {
                            anchors {
                                left: parent.left
                                leftMargin: Theme.spacingSmall
                                verticalCenter: parent.verticalCenter
                            }
                            text: widget.currentPath
                            font.family: Theme.fontFamilyMono
                            font.pixelSize: Theme.fontSizeSmall
                            color: Theme.textPrimary
                            elide: Text.ElideMiddle
                            width: parent.width - Theme.spacingMedium
                        }
                    }
                }
            }
            
            // ============================================
            // FILE LIST
            // ============================================
            
            Rectangle {
                width: parent.width
                height: parent.height - 40
                color: Qt.rgba(0.02, 0.02, 0.02, 0.95)
                
                ListView {
                    id: fileListView
                    anchors {
                        fill: parent
                        margins: Theme.spacingSmall
                    }
                    
                    clip: true
                    spacing: Theme.spacingXS
                    
                    model: ListModel {
                        id: fileModel
                    }
                    
                    delegate: Rectangle {
                        width: fileListView.width
                        height: 40
                        radius: Theme.borderRadiusSmall
                        color: delegateArea.containsMouse ? Qt.rgba(0.2, 0.2, 0.2, 0.6) : "transparent"
                        
                        Row {
                            anchors {
                                fill: parent
                                margins: Theme.spacingSmall
                            }
                            spacing: Theme.spacingMedium
                            
                            // Icon
                            Text {
                                text: model.isDir ? "📁" : "📄"
                                font.pixelSize: 24
                                anchors.verticalCenter: parent.verticalCenter
                            }
                            
                            // File name and info
                            Column {
                                width: parent.width - 40
                                anchors.verticalCenter: parent.verticalCenter
                                spacing: 2
                                
                                Text {
                                    text: model.name
                                    font.family: Theme.fontFamily
                                    font.pixelSize: Theme.fontSizeNormal
                                    color: Theme.textPrimary
                                    elide: Text.ElideRight
                                    width: parent.width
                                }
                                
                                Row {
                                    spacing: Theme.spacingMedium
                                    
                                    Text {
                                        text: model.isDir ? "Folder" : model.size
                                        font.family: Theme.fontFamily
                                        font.pixelSize: Theme.fontSizeXS
                                        color: Theme.textMuted
                                    }
                                    
                                    Text {
                                        text: model.modified
                                        font.family: Theme.fontFamily
                                        font.pixelSize: Theme.fontSizeXS
                                        color: Theme.textMuted
                                    }
                                }
                            }
                        }
                        
                        MouseArea {
                            id: delegateArea
                            anchors.fill: parent
                            hoverEnabled: true
                            
                            onDoubleClicked: {
                                if (model.isDir) {
                                    widget.currentPath = model.path
                                    refreshFileList()
                                } else {
                                    console.log("Open file:", model.path)
                                }
                            }
                            
                            onClicked: {
                                fileListView.currentIndex = index
                            }
                        }
                    }
                    
                    ScrollBar.vertical: ScrollBar {
                        policy: ScrollBar.AsNeeded
                    }
                }
                
                // Empty state
                Text {
                    anchors.centerIn: parent
                    visible: fileModel.count === 0
                    text: "Empty folder"
                    font.family: Theme.fontFamily
                    font.pixelSize: Theme.fontSizeNormal
                    color: Theme.textMuted
                }
            }
        }
        
        function refreshFileList() {
            fileModel.clear()
            
            // Add mock files (in production, use QDir/QFileInfo)
            var mockFiles = [
                {name: "Documents", isDir: true, path: widget.currentPath + "/Documents", size: "", modified: "Today"},
                {name: "Downloads", isDir: true, path: widget.currentPath + "/Downloads", size: "", modified: "Yesterday"},
                {name: "Pictures", isDir: true, path: widget.currentPath + "/Pictures", size: "", modified: "2 days ago"},
                {name: "Music", isDir: true, path: widget.currentPath + "/Music", size: "", modified: "1 week ago"},
                {name: "README.txt", isDir: false, path: widget.currentPath + "/README.txt", size: "1.2 KB", modified: "Today"},
                {name: "config.json", isDir: false, path: widget.currentPath + "/config.json", size: "542 B", modified: "Yesterday"},
                {name: "notes.md", isDir: false, path: widget.currentPath + "/notes.md", size: "3.5 KB", modified: "3 days ago"}
            ]
            
            for (var i = 0; i < mockFiles.length; i++) {
                fileModel.append(mockFiles[i])
            }
        }
        
        Component.onCompleted: {
            refreshFileList()
        }
    }
    
    Component.onCompleted: {
        console.log("🔮 Explorer Widget initialized")
        console.log("   Current path:", currentPath)
    }
}
