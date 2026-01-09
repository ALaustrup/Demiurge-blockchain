/**
 * TORRNT Main Window
 * 
 * Main UI for the torrenting application with blockchain integration
 */

import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import QtQuick.Window 2.15

ApplicationWindow {
    id: window
    width: 1200
    height: 800
    visible: true
    title: "TORRNT - On-Chain Torrenting"
    
    // Genesis theme colors
    readonly property color flameOrange: "#FF6B35"
    readonly property color cipherCyan: "#00D9FF"
    readonly property color voidBlack: "#0A0A0F"
    readonly property color obsidianGray: "#1A1A2E"
    
    color: voidBlack
    
    // Header
    header: ToolBar {
        height: 60
        background: Rectangle {
            color: obsidianGray
            border.color: flameOrange
            border.width: 1
        }
        
        RowLayout {
            anchors.fill: parent
            anchors.margins: 10
            
            Text {
                text: "TORRNT"
                font.pixelSize: 24
                font.bold: true
                color: flameOrange
            }
            
            Item { Layout.fillWidth: true }
            
            // Connection status
            Rectangle {
                width: 12
                height: 12
                radius: 6
                color: blockchainBridge.isConnected ? cipherCyan : "#666"
                
                Text {
                    anchors.centerIn: parent
                    text: blockchainBridge.isConnected ? "●" : "○"
                    color: "white"
                    font.pixelSize: 8
                }
            }
            
            Text {
                text: blockchainBridge.isConnected ? "Connected" : "Disconnected"
                color: "white"
                font.pixelSize: 12
            }
            
            // Stats
            Text {
                text: `Active: ${torrentManager.activeTorrents} | ↓ ${formatSpeed(torrentManager.totalDownloadSpeed)} | ↑ ${formatSpeed(torrentManager.totalUploadSpeed)}`
                color: "white"
                font.pixelSize: 12
            }
        }
    }
    
    // Main content
    RowLayout {
        anchors.fill: parent
        anchors.margins: 10
        spacing: 10
        
        // Left panel - Add torrent
        ColumnLayout {
            Layout.preferredWidth: 300
            spacing: 10
            
            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 200
                color: obsidianGray
                border.color: flameOrange
                border.width: 1
                radius: 4
                
                ColumnLayout {
                    anchors.fill: parent
                    anchors.margins: 15
                    spacing: 10
                    
                    Text {
                        text: "Add Torrent"
                        font.pixelSize: 18
                        font.bold: true
                        color: flameOrange
                    }
                    
                    TextField {
                        id: magnetInput
                        Layout.fillWidth: true
                        placeholderText: "magnet:?xt=urn:btih:..."
                        color: "white"
                        background: Rectangle {
                            color: voidBlack
                            border.color: cipherCyan
                            border.width: 1
                            radius: 2
                        }
                    }
                    
                    Button {
                        Layout.fillWidth: true
                        text: "Add Magnet Link"
                        onClicked: {
                            if (magnetInput.text.trim() !== "") {
                                torrentManager.addMagnetLink(magnetInput.text.trim())
                                magnetInput.text = ""
                            }
                        }
                        background: Rectangle {
                            color: flameOrange
                            radius: 4
                        }
                        contentItem: Text {
                            text: parent.text
                            color: "white"
                            horizontalAlignment: Text.AlignHCenter
                        }
                    }
                    
                    Button {
                        Layout.fillWidth: true
                        text: "Browse Torrent File"
                        onClicked: {
                            // TODO: File dialog
                        }
                        background: Rectangle {
                            color: cipherCyan
                            radius: 4
                        }
                        contentItem: Text {
                            text: parent.text
                            color: "black"
                            horizontalAlignment: Text.AlignHCenter
                        }
                    }
                    
                    Button {
                        Layout.fillWidth: true
                        text: "Search On-Chain"
                        onClicked: {
                            searchDialog.open()
                        }
                        background: Rectangle {
                            color: obsidianGray
                            border.color: cipherCyan
                            border.width: 1
                            radius: 4
                        }
                        contentItem: Text {
                            text: parent.text
                            color: cipherCyan
                            horizontalAlignment: Text.AlignHCenter
                        }
                    }
                }
            }
            
            // Blockchain search
            Rectangle {
                Layout.fillWidth: true
                Layout.fillHeight: true
                color: obsidianGray
                border.color: cipherCyan
                border.width: 1
                radius: 4
                
                ColumnLayout {
                    anchors.fill: parent
                    anchors.margins: 15
                    spacing: 10
                    
                    Text {
                        text: "On-Chain Torrents"
                        font.pixelSize: 16
                        font.bold: true
                        color: cipherCyan
                    }
                    
                    ScrollView {
                        Layout.fillWidth: true
                        Layout.fillHeight: true
                        clip: true
                        
                        ListView {
                            id: chainTorrentsList
                            model: ListModel {}
                            
                            delegate: Rectangle {
                                width: chainTorrentsList.width
                                height: 60
                                color: voidBlack
                                border.color: cipherCyan
                                border.width: 1
                                radius: 2
                                
                                ColumnLayout {
                                    anchors.fill: parent
                                    anchors.margins: 8
                                    
                                    Text {
                                        text: model.name || "Unknown"
                                        color: "white"
                                        font.pixelSize: 14
                                        font.bold: true
                                        elide: Text.ElideRight
                                        Layout.fillWidth: true
                                    }
                                    
                                    Text {
                                        text: `Seeders: ${model.seeders || 0} | Leechers: ${model.leechers || 0}`
                                        color: "#AAA"
                                        font.pixelSize: 11
                                    }
                                }
                                
                                MouseArea {
                                    anchors.fill: parent
                                    onClicked: {
                                        if (model.magnetUri) {
                                            torrentManager.addMagnetLink(model.magnetUri)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Right panel - Torrent list
        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true
            color: obsidianGray
            border.color: flameOrange
            border.width: 1
            radius: 4
            
            ColumnLayout {
                anchors.fill: parent
                anchors.margins: 15
                spacing: 10
                
                Text {
                    text: "Active Torrents"
                    font.pixelSize: 20
                    font.bold: true
                    color: flameOrange
                }
                
                ScrollView {
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    clip: true
                    
                    ListView {
                        id: torrentsList
                        model: ListModel {}
                        
                        delegate: TorrentItem {
                            width: torrentsList.width
                            status: model
                            onPause: torrentManager.pauseTorrent(model.infoHash)
                            onResume: torrentManager.resumeTorrent(model.infoHash)
                            onRemove: torrentManager.removeTorrent(model.infoHash, false)
                        }
                    }
                }
            }
        }
    }
    
    // Search dialog
    Dialog {
        id: searchDialog
        title: "Search On-Chain Torrents"
        width: 600
        height: 400
        
        ColumnLayout {
            anchors.fill: parent
            spacing: 10
            
            TextField {
                id: searchInput
                Layout.fillWidth: true
                placeholderText: "Search torrents..."
                onAccepted: performSearch()
            }
            
            Button {
                Layout.fillWidth: true
                text: "Search"
                onClicked: performSearch()
            }
            
            ScrollView {
                Layout.fillWidth: true
                Layout.fillHeight: true
                
                ListView {
                    id: searchResults
                    model: ListModel {}
                    
                    delegate: Rectangle {
                        width: searchResults.width
                        height: 80
                        color: obsidianGray
                        border.color: cipherCyan
                        border.width: 1
                        
                        ColumnLayout {
                            anchors.fill: parent
                            anchors.margins: 10
                            
                            Text {
                                text: model.name || "Unknown"
                                color: "white"
                                font.pixelSize: 14
                                font.bold: true
                                Layout.fillWidth: true
                            }
                            
                            Text {
                                text: model.description || ""
                                color: "#AAA"
                                font.pixelSize: 12
                                wrapMode: Text.Wrap
                                Layout.fillWidth: true
                            }
                            
                            RowLayout {
                                Text {
                                    text: `Seeders: ${model.seeders || 0}`
                                    color: cipherCyan
                                    font.pixelSize: 11
                                }
                                
                                Item { Layout.fillWidth: true }
                                
                                Button {
                                    text: "Add"
                                    onClicked: {
                                        if (model.magnetUri) {
                                            torrentManager.addMagnetLink(model.magnetUri)
                                            searchDialog.close()
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Functions
    function formatSpeed(bytesPerSecond) {
        if (bytesPerSecond < 1024) return bytesPerSecond + " B/s"
        if (bytesPerSecond < 1024 * 1024) return (bytesPerSecond / 1024).toFixed(1) + " KB/s"
        return (bytesPerSecond / (1024 * 1024)).toFixed(1) + " MB/s"
    }
    
    function performSearch() {
        if (searchInput.text.trim() === "") return
        
        var results = blockchainBridge.searchTorrents(searchInput.text.trim())
        searchResults.model.clear()
        
        for (var i = 0; i < results.length; i++) {
            searchResults.model.append(results[i])
        }
    }
    
    // Update torrent list
    Connections {
        target: torrentManager
        
        function onTorrentAdded(infoHash, name) {
            var status = torrentManager.getTorrentStatus(infoHash)
            torrentsList.model.append(status)
        }
        
        function onTorrentRemoved(infoHash) {
            for (var i = 0; i < torrentsList.model.count; i++) {
                if (torrentsList.model.get(i).infoHash === infoHash) {
                    torrentsList.model.remove(i)
                    break
                }
            }
        }
        
        function onTorrentStatusChanged(infoHash, status) {
            for (var i = 0; i < torrentsList.model.count; i++) {
                if (torrentsList.model.get(i).infoHash === infoHash) {
                    torrentsList.model.set(i, status)
                    break
                }
            }
        }
        
        function onStatsUpdated() {
            // Refresh all statuses
            var allTorrents = torrentManager.getAllTorrents()
            torrentsList.model.clear()
            for (var i = 0; i < allTorrents.length; i++) {
                torrentsList.model.append(allTorrents[i])
            }
        }
    }
    
    // Initialize
    Component.onCompleted: {
        // Load existing torrents
        var allTorrents = torrentManager.getAllTorrents()
        for (var i = 0; i < allTorrents.length; i++) {
            torrentsList.model.append(allTorrents[i])
        }
    }
}
