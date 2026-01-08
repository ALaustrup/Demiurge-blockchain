import QtQuick
import QtQuick.Layouts
import QtQuick.Controls
import QtMultimedia

import "../components"

/**
 * NeonApp - NEON Media Player
 * 
 * The native media player for QØЯ desktop.
 * Supports audio, video, and NFT media playback with
 * audio-reactive visualizers and 10-band equalizer.
 */
Item {
    id: neonApp
    
    // ========================================================================
    // PROPERTIES
    // ========================================================================
    
    /** Current media item */
    property var currentMedia: null
    
    /** Playback state */
    property bool isPlaying: false
    
    /** Current position (ms) */
    property int currentPosition: 0
    
    /** Duration (ms) */
    property int duration: 0
    
    /** Volume (0-1) */
    property real volume: 0.8
    
    /** Current view mode */
    property string viewMode: "library"  // library, player, visualizer
    
    /** Media library */
    property var mediaLibrary: []
    
    /** Current playlist */
    property var playlist: []
    
    /** Playlist index */
    property int playlistIndex: 0
    
    /** Visualizer type */
    property int visualizerType: 0
    
    // ========================================================================
    // MAIN LAYOUT
    // ========================================================================
    
    ColumnLayout {
        anchors.fill: parent
        spacing: 0
        
        // ================================================================
        // TOP BAR
        // ================================================================
        
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: 48
            color: Theme.glassPanelDock
            
            RowLayout {
                anchors.fill: parent
                anchors.margins: Theme.spacingSmall
                spacing: Theme.spacingMedium
                
                // View mode tabs
                Row {
                    spacing: 2
                    
                    Repeater {
                        model: [
                            { id: "library", label: "Library", icon: "📚" },
                            { id: "player", label: "Now Playing", icon: "🎵" },
                            { id: "visualizer", label: "Visualizer", icon: "🌊" }
                        ]
                        
                        Rectangle {
                            width: 100
                            height: 32
                            radius: Theme.radiusSmall
                            color: viewMode === modelData.id ? Theme.glassPanelWindow : "transparent"
                            
                            Row {
                                anchors.centerIn: parent
                                spacing: Theme.spacingTiny
                                
                                Text {
                                    text: modelData.icon
                                    font.pixelSize: 14
                                }
                                
                                Text {
                                    text: modelData.label
                                    font.family: Theme.fontBody
                                    font.pixelSize: Theme.fontSizeSmall
                                    color: viewMode === modelData.id ? Theme.textPrimary : Theme.textSecondary
                                }
                            }
                            
                            MouseArea {
                                anchors.fill: parent
                                cursorShape: Qt.PointingHandCursor
                                onClicked: viewMode = modelData.id
                            }
                        }
                    }
                }
                
                Item { Layout.fillWidth: true }
                
                // Search
                Rectangle {
                    width: 200
                    height: 32
                    radius: Theme.radiusSmall
                    color: Theme.glassPanelDock
                    border.width: 1
                    border.color: Theme.panelBorder
                    
                    RowLayout {
                        anchors.fill: parent
                        anchors.margins: Theme.spacingSmall
                        spacing: Theme.spacingSmall
                        
                        Text {
                            text: "🔍"
                            font.pixelSize: 14
                        }
                        
                        TextInput {
                            id: searchInput
                            Layout.fillWidth: true
                            font.family: Theme.fontBody
                            font.pixelSize: Theme.fontSizeSmall
                            color: Theme.textPrimary
                            clip: true
                            
                            Text {
                                anchors.fill: parent
                                text: "Search media..."
                                font: parent.font
                                color: Theme.textMuted
                                visible: !parent.text && !parent.activeFocus
                            }
                        }
                    }
                }
            }
        }
        
        // ================================================================
        // CONTENT AREA
        // ================================================================
        
        StackLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            currentIndex: viewMode === "library" ? 0 : (viewMode === "player" ? 1 : 2)
            
            // Library View
            LibraryView {
                onMediaSelected: function(media) {
                    currentMedia = media
                    viewMode = "player"
                    playMedia(media)
                }
            }
            
            // Now Playing View
            NowPlayingView {
                media: currentMedia
                playing: isPlaying
                position: currentPosition
                mediaDuration: duration
            }
            
            // Visualizer View
            VisualizerView {
                visualizerType: neonApp.visualizerType
                isPlaying: neonApp.isPlaying
            }
        }
        
        // ================================================================
        // PLAYBACK CONTROLS (Always visible)
        // ================================================================
        
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: 80
            color: Theme.glassPanelDock
            
            RowLayout {
                anchors.fill: parent
                anchors.margins: Theme.spacingMedium
                spacing: Theme.spacingMedium
                
                // Current media info
                Row {
                    spacing: Theme.spacingSmall
                    Layout.preferredWidth: 200
                    
                    Rectangle {
                        width: 50
                        height: 50
                        radius: Theme.radiusSmall
                        color: Theme.glassPanelWindow
                        
                        Text {
                            anchors.centerIn: parent
                            text: currentMedia ? "🎵" : "♫"
                            font.pixelSize: 24
                        }
                    }
                    
                    ColumnLayout {
                        spacing: 2
                        
                        Text {
                            text: currentMedia ? currentMedia.title : "No media playing"
                            font.family: Theme.fontBody
                            font.pixelSize: Theme.fontSizeSmall
                            font.weight: Font.Medium
                            color: Theme.textPrimary
                            elide: Text.ElideRight
                            Layout.preferredWidth: 140
                        }
                        
                        Text {
                            text: currentMedia ? currentMedia.artist : ""
                            font.family: Theme.fontBody
                            font.pixelSize: Theme.fontSizeTiny
                            color: Theme.textSecondary
                            elide: Text.ElideRight
                            Layout.preferredWidth: 140
                        }
                    }
                }
                
                // Progress bar
                ColumnLayout {
                    Layout.fillWidth: true
                    spacing: 4
                    
                    Slider {
                        id: progressSlider
                        Layout.fillWidth: true
                        from: 0
                        to: duration > 0 ? duration : 100
                        value: currentPosition
                        
                        background: Rectangle {
                            x: progressSlider.leftPadding
                            y: progressSlider.topPadding + progressSlider.availableHeight / 2 - height / 2
                            width: progressSlider.availableWidth
                            height: 4
                            radius: 2
                            color: Theme.glassPanelWindow
                            
                            Rectangle {
                                width: progressSlider.visualPosition * parent.width
                                height: parent.height
                                radius: 2
                                gradient: Gradient {
                                    orientation: Gradient.Horizontal
                                    GradientStop { position: 0; color: Theme.accentFlame }
                                    GradientStop { position: 1; color: Theme.accentMagma }
                                }
                            }
                        }
                        
                        handle: Rectangle {
                            x: progressSlider.leftPadding + progressSlider.visualPosition * (progressSlider.availableWidth - width)
                            y: progressSlider.topPadding + progressSlider.availableHeight / 2 - height / 2
                            width: 12
                            height: 12
                            radius: 6
                            color: progressSlider.pressed ? Theme.accentMagma : Theme.accentFlame
                        }
                        
                        onMoved: {
                            // Would seek to position
                            currentPosition = value
                        }
                    }
                    
                    RowLayout {
                        Layout.fillWidth: true
                        
                        Text {
                            text: formatTime(currentPosition)
                            font.family: Theme.fontCode
                            font.pixelSize: Theme.fontSizeTiny
                            color: Theme.textMuted
                        }
                        
                        Item { Layout.fillWidth: true }
                        
                        Text {
                            text: formatTime(duration)
                            font.family: Theme.fontCode
                            font.pixelSize: Theme.fontSizeTiny
                            color: Theme.textMuted
                        }
                    }
                }
                
                // Playback controls
                Row {
                    spacing: Theme.spacingSmall
                    
                    // Previous
                    Rectangle {
                        width: 36
                        height: 36
                        radius: 18
                        color: prevMouse.containsMouse ? Theme.glassPanelWindow : "transparent"
                        
                        Text {
                            anchors.centerIn: parent
                            text: "⏮"
                            font.pixelSize: 18
                        }
                        
                        MouseArea {
                            id: prevMouse
                            anchors.fill: parent
                            hoverEnabled: true
                            cursorShape: Qt.PointingHandCursor
                            onClicked: previousTrack()
                        }
                    }
                    
                    // Play/Pause
                    Rectangle {
                        width: 48
                        height: 48
                        radius: 24
                        gradient: Gradient {
                            GradientStop { position: 0; color: Theme.accentFlame }
                            GradientStop { position: 1; color: Theme.accentMagma }
                        }
                        
                        Text {
                            anchors.centerIn: parent
                            text: isPlaying ? "⏸" : "▶"
                            font.pixelSize: 20
                            color: Theme.voidBlack
                        }
                        
                        MouseArea {
                            anchors.fill: parent
                            cursorShape: Qt.PointingHandCursor
                            onClicked: togglePlayback()
                        }
                        
                        scale: playMouse.pressed ? 0.95 : 1
                        Behavior on scale { NumberAnimation { duration: 50 } }
                        
                        MouseArea {
                            id: playMouse
                            anchors.fill: parent
                            cursorShape: Qt.PointingHandCursor
                            onClicked: togglePlayback()
                        }
                    }
                    
                    // Next
                    Rectangle {
                        width: 36
                        height: 36
                        radius: 18
                        color: nextMouse.containsMouse ? Theme.glassPanelWindow : "transparent"
                        
                        Text {
                            anchors.centerIn: parent
                            text: "⏭"
                            font.pixelSize: 18
                        }
                        
                        MouseArea {
                            id: nextMouse
                            anchors.fill: parent
                            hoverEnabled: true
                            cursorShape: Qt.PointingHandCursor
                            onClicked: nextTrack()
                        }
                    }
                }
                
                // Volume
                Row {
                    spacing: Theme.spacingSmall
                    Layout.preferredWidth: 120
                    
                    Text {
                        text: volume > 0 ? "🔊" : "🔇"
                        font.pixelSize: 16
                        anchors.verticalCenter: parent.verticalCenter
                        
                        MouseArea {
                            anchors.fill: parent
                            cursorShape: Qt.PointingHandCursor
                            onClicked: volume = volume > 0 ? 0 : 0.8
                        }
                    }
                    
                    Slider {
                        id: volumeSlider
                        width: 80
                        from: 0
                        to: 1
                        value: volume
                        
                        background: Rectangle {
                            x: volumeSlider.leftPadding
                            y: volumeSlider.topPadding + volumeSlider.availableHeight / 2 - height / 2
                            width: volumeSlider.availableWidth
                            height: 3
                            radius: 1.5
                            color: Theme.glassPanelWindow
                            
                            Rectangle {
                                width: volumeSlider.visualPosition * parent.width
                                height: parent.height
                                radius: 1.5
                                color: Theme.cipherCyan
                            }
                        }
                        
                        handle: Rectangle {
                            x: volumeSlider.leftPadding + volumeSlider.visualPosition * (volumeSlider.availableWidth - width)
                            y: volumeSlider.topPadding + volumeSlider.availableHeight / 2 - height / 2
                            width: 10
                            height: 10
                            radius: 5
                            color: volumeSlider.pressed ? Theme.cipherCyan : Theme.textPrimary
                        }
                        
                        onMoved: volume = value
                    }
                }
            }
        }
    }
    
    // ========================================================================
    // HELPER COMPONENTS
    // ========================================================================
    
    component LibraryView: Item {
        signal mediaSelected(var media)
        
        GridView {
            anchors.fill: parent
            anchors.margins: Theme.spacingMedium
            cellWidth: 180
            cellHeight: 200
            clip: true
            
            model: mediaLibrary
            
            delegate: Item {
                width: 170
                height: 190
                
                GlassPanel {
                    anchors.fill: parent
                    anchors.margins: 4
                    depthLevel: 2
                    
                    ColumnLayout {
                        anchors.fill: parent
                        anchors.margins: Theme.spacingSmall
                        spacing: Theme.spacingSmall
                        
                        // Album art placeholder
                        Rectangle {
                            Layout.fillWidth: true
                            Layout.preferredHeight: 120
                            radius: Theme.radiusSmall
                            color: Theme.glassPanelWindow
                            
                            Text {
                                anchors.centerIn: parent
                                text: modelData.type === "video" ? "🎬" : "🎵"
                                font.pixelSize: 48
                            }
                        }
                        
                        Text {
                            text: modelData.title
                            font.family: Theme.fontBody
                            font.pixelSize: Theme.fontSizeSmall
                            font.weight: Font.Medium
                            color: Theme.textPrimary
                            elide: Text.ElideRight
                            Layout.fillWidth: true
                        }
                        
                        Text {
                            text: modelData.artist || modelData.type
                            font.family: Theme.fontBody
                            font.pixelSize: Theme.fontSizeTiny
                            color: Theme.textSecondary
                            elide: Text.ElideRight
                            Layout.fillWidth: true
                        }
                    }
                    
                    MouseArea {
                        anchors.fill: parent
                        cursorShape: Qt.PointingHandCursor
                        onDoubleClicked: mediaSelected(modelData)
                    }
                }
            }
            
            // Empty state
            Text {
                anchors.centerIn: parent
                text: "Drop media files here or add from Files"
                font.family: Theme.fontBody
                font.pixelSize: Theme.fontSizeBody
                color: Theme.textMuted
                visible: mediaLibrary.length === 0
            }
        }
    }
    
    component NowPlayingView: Item {
        property var media: null
        property bool playing: false
        property int position: 0
        property int mediaDuration: 0
        
        ColumnLayout {
            anchors.centerIn: parent
            spacing: Theme.spacingLarge
            
            // Large album art
            Rectangle {
                Layout.preferredWidth: 300
                Layout.preferredHeight: 300
                Layout.alignment: Qt.AlignHCenter
                radius: Theme.radiusLarge
                color: Theme.glassPanelWindow
                
                Text {
                    anchors.centerIn: parent
                    text: media && media.type === "video" ? "🎬" : "🎵"
                    font.pixelSize: 120
                }
                
                // Spinning animation when playing
                RotationAnimation on rotation {
                    running: playing && (!media || media.type !== "video")
                    loops: Animation.Infinite
                    duration: 20000
                    from: 0
                    to: 360
                }
            }
            
            // Track info
            ColumnLayout {
                Layout.alignment: Qt.AlignHCenter
                spacing: Theme.spacingSmall
                
                GlowText {
                    text: media ? media.title : "No Track Selected"
                    fontFamily: Theme.fontHeader
                    fontSize: Theme.fontSizeH2
                    glowing: playing
                    Layout.alignment: Qt.AlignHCenter
                }
                
                Text {
                    text: media ? (media.artist || "Unknown Artist") : ""
                    font.family: Theme.fontBody
                    font.pixelSize: Theme.fontSizeBody
                    color: Theme.textSecondary
                    Layout.alignment: Qt.AlignHCenter
                }
            }
        }
    }
    
    component VisualizerView: Item {
        property int visualizerType: 0
        property bool isPlaying: false
        
        Rectangle {
            anchors.fill: parent
            color: Theme.voidBlack
            
            // Visualizer canvas
            Canvas {
                id: visualizerCanvas
                anchors.fill: parent
                
                property var bars: []
                
                onPaint: {
                    var ctx = getContext("2d")
                    ctx.clearRect(0, 0, width, height)
                    
                    if (!isPlaying) return
                    
                    var barCount = 64
                    var barWidth = width / barCount
                    
                    for (var i = 0; i < barCount; i++) {
                        var barHeight = bars[i] || Math.random() * height * 0.8
                        
                        var gradient = ctx.createLinearGradient(0, height, 0, height - barHeight)
                        gradient.addColorStop(0, Theme.accentFlame.toString())
                        gradient.addColorStop(1, Theme.accentMagma.toString())
                        
                        ctx.fillStyle = gradient
                        ctx.fillRect(i * barWidth + 1, height - barHeight, barWidth - 2, barHeight)
                    }
                }
                
                Timer {
                    running: isPlaying
                    interval: 50
                    repeat: true
                    onTriggered: {
                        // Generate random bars for demo
                        var newBars = []
                        for (var i = 0; i < 64; i++) {
                            var prev = visualizerCanvas.bars[i] || 0
                            var target = Math.random() * visualizerCanvas.height * 0.8
                            newBars.push(prev + (target - prev) * 0.3)
                        }
                        visualizerCanvas.bars = newBars
                        visualizerCanvas.requestPaint()
                    }
                }
            }
            
            // Visualizer type selector
            Row {
                anchors.bottom: parent.bottom
                anchors.horizontalCenter: parent.horizontalCenter
                anchors.bottomMargin: Theme.spacingLarge
                spacing: Theme.spacingSmall
                
                Repeater {
                    model: ["Bars", "Wave", "Particles", "Spectrum"]
                    
                    Rectangle {
                        width: 80
                        height: 32
                        radius: Theme.radiusSmall
                        color: neonApp.visualizerType === index ? Theme.accentFlame : Theme.glassPanelDock
                        
                        Text {
                            anchors.centerIn: parent
                            text: modelData
                            font.family: Theme.fontBody
                            font.pixelSize: Theme.fontSizeSmall
                            color: neonApp.visualizerType === index ? Theme.voidBlack : Theme.textSecondary
                        }
                        
                        MouseArea {
                            anchors.fill: parent
                            cursorShape: Qt.PointingHandCursor
                            onClicked: neonApp.visualizerType = index
                        }
                    }
                }
            }
        }
    }
    
    // ========================================================================
    // FUNCTIONS
    // ========================================================================
    
    function formatTime(ms) {
        var seconds = Math.floor(ms / 1000)
        var minutes = Math.floor(seconds / 60)
        seconds = seconds % 60
        return minutes + ":" + (seconds < 10 ? "0" : "") + seconds
    }
    
    function togglePlayback() {
        isPlaying = !isPlaying
    }
    
    function playMedia(media) {
        currentMedia = media
        isPlaying = true
        currentPosition = 0
        duration = media.duration || 180000  // Default 3 min
    }
    
    function nextTrack() {
        if (playlist.length > 0) {
            playlistIndex = (playlistIndex + 1) % playlist.length
            playMedia(playlist[playlistIndex])
        }
    }
    
    function previousTrack() {
        if (playlist.length > 0) {
            playlistIndex = (playlistIndex - 1 + playlist.length) % playlist.length
            playMedia(playlist[playlistIndex])
        }
    }
    
    // ========================================================================
    // DEMO DATA
    // ========================================================================
    
    Component.onCompleted: {
        mediaLibrary = [
            { id: 1, title: "Eternal Flame", artist: "Demiurge", type: "audio", duration: 240000 },
            { id: 2, title: "Digital Abyss", artist: "Cipher", type: "audio", duration: 195000 },
            { id: 3, title: "Void Walker", artist: "Archon", type: "audio", duration: 312000 },
            { id: 4, title: "Genesis", artist: "QOR", type: "audio", duration: 267000 },
            { id: 5, title: "The Awakening", artist: "Unknown", type: "video", duration: 420000 }
        ]
    }
    
    // Playback timer simulation
    Timer {
        running: isPlaying && currentMedia
        interval: 1000
        repeat: true
        onTriggered: {
            currentPosition += 1000
            if (currentPosition >= duration) {
                nextTrack()
            }
        }
    }
}
