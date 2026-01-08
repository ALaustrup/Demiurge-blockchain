import QtQuick
import QtQuick.Layouts

import "../components"
import "../apps"

/**
 * QWindow - Custom MDI Window
 * 
 * A fully custom window component that exists inside the QØЯ canvas.
 * No OS chrome - completely controlled by the application.
 * 
 * Features:
 *   - Draggable header
 *   - Resizable from edges/corners
 *   - Minimize, maximize, close controls
 *   - Snap to grid in edit mode
 *   - Focus glow effect
 */
Item {
    id: qWindow
    
    // ========================================================================
    // PUBLIC PROPERTIES
    // ========================================================================
    
    /** Unique window identifier */
    property string windowId: ""
    
    /** Application ID */
    property string appId: ""
    
    /** Window title */
    property string title: "Window"
    
    /** Window icon (emoji) */
    property string icon: ""
    
    /** Whether window is focused */
    property bool focused: false
    
    /** Whether window is maximized */
    property bool maximized: false
    
    /** Stored geometry for restore from maximized */
    property rect normalGeometry: Qt.rect(x, y, width, height)
    
    // ========================================================================
    // SIGNALS
    // ========================================================================
    
    signal closed()
    signal minimized()
    signal focusRequested()
    
    // Alias for focus request
    signal focused()
    
    // ========================================================================
    // DIMENSIONS
    // ========================================================================
    
    width: 800
    height: 600
    
    // Minimum size
    property int minWidth: Theme.windowMinWidth
    property int minHeight: Theme.windowMinHeight
    
    // ========================================================================
    // WINDOW PANEL
    // ========================================================================
    
    GlassPanel {
        id: windowPanel
        anchors.fill: parent
        depthLevel: 2
        showBorder: true
        active: qWindow.focused
        contentMargins: 0
        
        // Focus glow
        glowColor: qWindow.focused ? Theme.cipherCyan : "transparent"
        glowRadius: qWindow.focused ? 4 : 0
        
        ColumnLayout {
            anchors.fill: parent
            spacing: 0
            
            // ============================================================
            // WINDOW HEADER (Title Bar)
            // ============================================================
            
            Rectangle {
                id: header
                Layout.fillWidth: true
                Layout.preferredHeight: Theme.windowHeaderHeight
                color: qWindow.focused ? Theme.glassPanelPopup : Theme.glassPanelWindow
                
                // Drag handler
                MouseArea {
                    id: headerDrag
                    anchors.fill: parent
                    
                    property point pressPos
                    
                    onPressed: {
                        pressPos = Qt.point(mouseX, mouseY)
                        qWindow.focusRequested()
                        qWindow.focused()
                    }
                    
                    onPositionChanged: {
                        if (pressed && !qWindow.maximized) {
                            qWindow.x += mouseX - pressPos.x
                            qWindow.y += mouseY - pressPos.y
                        }
                    }
                    
                    onDoubleClicked: toggleMaximize()
                }
                
                RowLayout {
                    anchors.fill: parent
                    anchors.leftMargin: Theme.spacingSmall
                    anchors.rightMargin: Theme.spacingSmall
                    spacing: Theme.spacingSmall
                    
                    // Icon
                    Text {
                        text: qWindow.icon || getAppIcon(qWindow.appId)
                        font.pixelSize: 16
                    }
                    
                    // Title
                    Text {
                        Layout.fillWidth: true
                        text: qWindow.title
                        font.family: Theme.fontBody
                        font.pixelSize: Theme.fontSizeSmall
                        font.weight: Font.Medium
                        color: qWindow.focused ? Theme.textPrimary : Theme.textSecondary
                        elide: Text.ElideRight
                    }
                    
                    // Window controls
                    Row {
                        spacing: 2
                        
                        // Minimize
                        WindowButton {
                            icon: "─"
                            onClicked: qWindow.minimized()
                        }
                        
                        // Maximize/Restore
                        WindowButton {
                            icon: qWindow.maximized ? "❐" : "□"
                            onClicked: toggleMaximize()
                        }
                        
                        // Close
                        WindowButton {
                            icon: "✕"
                            isClose: true
                            onClicked: qWindow.closed()
                        }
                    }
                }
            }
            
            // ============================================================
            // WINDOW CONTENT
            // ============================================================
            
            Item {
                id: contentArea
                Layout.fillWidth: true
                Layout.fillHeight: true
                
                // App content would be loaded here
                Loader {
                    anchors.fill: parent
                    source: getAppSource(qWindow.appId)
                    
                    // Fallback content
                    Component.onCompleted: {
                        if (status === Loader.Error) {
                            sourceComponent = placeholderComponent
                        }
                    }
                }
                
                Component {
                    id: placeholderComponent
                    
                    Item {
                        anchors.fill: parent
                        
                        ColumnLayout {
                            anchors.centerIn: parent
                            spacing: Theme.spacingMedium
                            
                            Text {
                                text: getAppIcon(qWindow.appId)
                                font.pixelSize: 64
                                Layout.alignment: Qt.AlignHCenter
                            }
                            
                            Text {
                                text: qWindow.title
                                font.family: Theme.fontHeader
                                font.pixelSize: Theme.fontSizeH3
                                color: Theme.textPrimary
                                Layout.alignment: Qt.AlignHCenter
                            }
                            
                            Text {
                                text: "Application content coming soon"
                                font.family: Theme.fontBody
                                font.pixelSize: Theme.fontSizeBody
                                color: Theme.textSecondary
                                Layout.alignment: Qt.AlignHCenter
                            }
                        }
                    }
                }
            }
        }
    }
    
    // ========================================================================
    // RESIZE HANDLES
    // ========================================================================
    
    // Edges
    ResizeHandle { edge: "left" }
    ResizeHandle { edge: "right" }
    ResizeHandle { edge: "top" }
    ResizeHandle { edge: "bottom" }
    
    // Corners
    ResizeHandle { edge: "topLeft" }
    ResizeHandle { edge: "topRight" }
    ResizeHandle { edge: "bottomLeft" }
    ResizeHandle { edge: "bottomRight" }
    
    // ========================================================================
    // HELPER COMPONENTS
    // ========================================================================
    
    component WindowButton: Rectangle {
        property string icon: ""
        property bool isClose: false
        
        signal clicked()
        
        width: 28
        height: 22
        radius: Theme.radiusSmall
        color: {
            if (buttonMouse.pressed) return isClose ? Theme.error : Theme.glassPanelPopup
            if (buttonMouse.containsMouse) return isClose ? Qt.lighter(Theme.error, 1.2) : Theme.glassPanelWindow
            return "transparent"
        }
        
        Text {
            anchors.centerIn: parent
            text: parent.icon
            font.pixelSize: 12
            color: {
                if (parent.isClose && buttonMouse.containsMouse) return Theme.textPrimary
                return Theme.textSecondary
            }
        }
        
        MouseArea {
            id: buttonMouse
            anchors.fill: parent
            hoverEnabled: true
            onClicked: parent.clicked()
        }
        
        Behavior on color { ColorAnimation { duration: Theme.animFast } }
    }
    
    component ResizeHandle: MouseArea {
        property string edge: ""
        
        readonly property int margin: Theme.windowResizeMargin
        
        // Positioning based on edge
        anchors.left: edge.includes("left") ? parent.left : 
                      edge.includes("right") ? undefined : parent.left
        anchors.right: edge.includes("right") ? parent.right :
                       edge.includes("left") ? undefined : parent.right
        anchors.top: edge.includes("top") ? parent.top :
                     edge.includes("bottom") ? undefined : parent.top
        anchors.bottom: edge.includes("bottom") ? parent.bottom :
                        edge.includes("top") ? undefined : parent.bottom
        
        // Size based on edge type
        width: edge === "left" || edge === "right" ? margin :
               edge.includes("left") || edge.includes("right") ? margin * 2 : undefined
        height: edge === "top" || edge === "bottom" ? margin :
                edge.includes("top") || edge.includes("bottom") ? margin * 2 : undefined
        
        // Corner positioning adjustment
        anchors.leftMargin: edge.includes("Left") && !edge.includes("top") && !edge.includes("bottom") ? 0 : 
                           edge === "left" ? 0 : undefined
        anchors.rightMargin: edge.includes("Right") && !edge.includes("top") && !edge.includes("bottom") ? 0 :
                            edge === "right" ? 0 : undefined
        
        // Cursor
        cursorShape: {
            switch (edge) {
                case "left":
                case "right":
                    return Qt.SizeHorCursor
                case "top":
                case "bottom":
                    return Qt.SizeVerCursor
                case "topLeft":
                case "bottomRight":
                    return Qt.SizeFDiagCursor
                case "topRight":
                case "bottomLeft":
                    return Qt.SizeBDiagCursor
                default:
                    return Qt.ArrowCursor
            }
        }
        
        hoverEnabled: true
        visible: !qWindow.maximized
        
        property point pressPos
        property rect startGeometry
        
        onPressed: {
            pressPos = Qt.point(mouseX, mouseY)
            startGeometry = Qt.rect(qWindow.x, qWindow.y, qWindow.width, qWindow.height)
            qWindow.focusRequested()
        }
        
        onPositionChanged: {
            if (!pressed) return
            
            var dx = mouseX - pressPos.x
            var dy = mouseY - pressPos.y
            
            var newX = startGeometry.x
            var newY = startGeometry.y
            var newW = startGeometry.width
            var newH = startGeometry.height
            
            if (edge.includes("left")) {
                newX = startGeometry.x + dx
                newW = startGeometry.width - dx
            }
            if (edge.includes("right") || edge === "right") {
                newW = startGeometry.width + dx
            }
            if (edge.includes("top") || edge === "top") {
                newY = startGeometry.y + dy
                newH = startGeometry.height - dy
            }
            if (edge.includes("bottom") || edge === "bottom") {
                newH = startGeometry.height + dy
            }
            
            // Apply minimum size
            if (newW >= qWindow.minWidth) {
                qWindow.x = newX
                qWindow.width = newW
            }
            if (newH >= qWindow.minHeight) {
                qWindow.y = newY
                qWindow.height = newH
            }
        }
    }
    
    // ========================================================================
    // HELPER FUNCTIONS
    // ========================================================================
    
    function toggleMaximize() {
        if (maximized) {
            // Restore
            x = normalGeometry.x
            y = normalGeometry.y
            width = normalGeometry.width
            height = normalGeometry.height
            maximized = false
        } else {
            // Save current geometry
            normalGeometry = Qt.rect(x, y, width, height)
            // Maximize
            x = 0
            y = 0
            width = parent.width
            height = parent.height
            maximized = true
        }
    }
    
    function getAppIcon(appId) {
        switch (appId) {
            case "wallet": return "💰"
            case "mining": return "⛏️"
            case "explorer": return "🌐"
            case "neon": return "🎵"
            case "wryt": return "📝"
            case "files": return "📁"
            case "settings": return "⚙️"
            default: return "📦"
        }
    }
    
    function getAppSource(appId) {
        switch (appId) {
            case "wallet": return "../apps/WalletApp.qml"
            case "neon": return "../apps/NeonApp.qml"
            case "wryt": return "../apps/WrytApp.qml"
            default: return ""
        }
    }
    
    // ========================================================================
    // ANIMATIONS
    // ========================================================================
    
    Behavior on x { NumberAnimation { duration: maximized ? Theme.animNormal : 0 } }
    Behavior on y { NumberAnimation { duration: maximized ? Theme.animNormal : 0 } }
    Behavior on width { NumberAnimation { duration: maximized ? Theme.animNormal : 0 } }
    Behavior on height { NumberAnimation { duration: maximized ? Theme.animNormal : 0 } }
}
