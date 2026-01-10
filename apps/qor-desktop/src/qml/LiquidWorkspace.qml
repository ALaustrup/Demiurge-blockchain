// LiquidWorkspace.qml - Physics-Based Widget Layout
import QtQuick
import QtQuick.Controls

Item {
    id: workspace
    
    // ============================================
    // PROPERTIES
    // ============================================
    
    property alias widgets: widgetContainer.children
    property int gridSize: 100
    property bool liquidMotion: true
    property bool showGrid: false
    
    // ============================================
    // WORKSPACE CONTAINER
    // ============================================
    
    // Grid overlay (optional)
    Canvas {
        id: gridCanvas
        anchors.fill: parent
        visible: workspace.showGrid
        opacity: 0.1
        
        onPaint: {
            var ctx = getContext("2d")
            ctx.strokeStyle = Theme.primaryAccent
            ctx.lineWidth = 1
            
            // Vertical lines
            for (var x = 0; x < width; x += workspace.gridSize) {
                ctx.beginPath()
                ctx.moveTo(x, 0)
                ctx.lineTo(x, height)
                ctx.stroke()
            }
            
            // Horizontal lines
            for (var y = 0; y < height; y += workspace.gridSize) {
                ctx.beginPath()
                ctx.moveTo(0, y)
                ctx.lineTo(width, y)
                ctx.stroke()
            }
        }
    }
    
    // Widget container
    Item {
        id: widgetContainer
        anchors.fill: parent
    }
    
    // ============================================
    // COLLISION DETECTION & LIQUID MOTION
    // ============================================
    
    Timer {
        id: physicsTimer
        interval: 16  // ~60 FPS
        running: workspace.liquidMotion
        repeat: true
        
        onTriggered: workspace.updatePhysics()
    }
    
    function updatePhysics() {
        if (!liquidMotion) return
        
        var widgets = widgetContainer.children
        
        for (var i = 0; i < widgets.length; i++) {
            var widgetA = widgets[i]
            
            // Skip if widget is being dragged
            if (widgetA.dragging || widgetA.resizing) continue
            
            // Check collisions with other widgets
            for (var j = i + 1; j < widgets.length; j++) {
                var widgetB = widgets[j]
                
                if (widgetB.dragging || widgetB.resizing) continue
                
                if (checkCollision(widgetA, widgetB)) {
                    resolveCollision(widgetA, widgetB)
                }
            }
            
            // Constrain to bounds
            constrainToBounds(widgetA)
        }
    }
    
    function checkCollision(a, b) {
        // AABB collision detection
        return !(a.x + a.width < b.x ||
                 b.x + b.width < a.x ||
                 a.y + a.height < b.y ||
                 b.y + b.height < a.y)
    }
    
    function resolveCollision(a, b) {
        // Calculate centers
        var centerAX = a.x + a.width / 2
        var centerAY = a.y + a.height / 2
        var centerBX = b.x + b.width / 2
        var centerBY = b.y + b.height / 2
        
        // Calculate push direction
        var dx = centerBX - centerAX
        var dy = centerBY - centerAY
        var distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance > 0) {
            // Normalize direction
            dx /= distance
            dy /= distance
            
            // Push strength (softer = more gentle)
            var pushStrength = 8
            
            // Push B away from A
            b.x += dx * pushStrength
            b.y += dy * pushStrength
            
            // Optional: also push A away from B (for more balanced feel)
            // a.x -= dx * pushStrength * 0.5
            // a.y -= dy * pushStrength * 0.5
        }
    }
    
    function constrainToBounds(widget) {
        // Keep widgets within workspace bounds
        var margin = 10
        
        if (widget.x < margin) {
            widget.x = margin
        }
        
        if (widget.y < margin) {
            widget.y = margin
        }
        
        if (widget.x + widget.width > workspace.width - margin) {
            widget.x = workspace.width - widget.width - margin
        }
        
        if (widget.y + widget.height > workspace.height - margin) {
            widget.y = workspace.height - widget.height - margin
        }
    }
    
    // ============================================
    // WIDGET MANAGEMENT
    // ============================================
    
    function createWidget(widgetType, x, y) {
        var component
        
        switch(widgetType) {
            case "terminal":
                component = Qt.createComponent("widgets/TerminalWidget.qml")
                break
            case "wallet":
                component = Qt.createComponent("widgets/WalletWidget.qml")
                break
            case "settings":
                component = Qt.createComponent("widgets/SettingsWidget.qml")
                break
            case "system":
                component = Qt.createComponent("widgets/SystemMonitorWidget.qml")
                break
            default:
                component = Qt.createComponent("BaseWidget.qml")
        }
        
        if (component.status === Component.Ready) {
            var widget = component.createObject(widgetContainer, {
                "x": x || workspace.width / 2 - 200,
                "y": y || workspace.height / 2 - 150,
                "widgetName": widgetType.charAt(0).toUpperCase() + widgetType.slice(1)
            })
            
            if (widget) {
                console.log("Widget created:", widgetType, "at", widget.x, widget.y)
                return widget
            }
        } else if (component.status === Component.Error) {
            console.error("Error creating widget:", component.errorString())
            
            // Fallback to BaseWidget
            component = Qt.createComponent("BaseWidget.qml")
            if (component.status === Component.Ready) {
                var fallbackWidget = component.createObject(widgetContainer, {
                    "x": x || workspace.width / 2 - 200,
                    "y": y || workspace.height / 2 - 150,
                    "widgetName": widgetType.charAt(0).toUpperCase() + widgetType.slice(1)
                })
                return fallbackWidget
            }
        }
        
        return null
    }
    
    function clearAllWidgets() {
        var widgets = widgetContainer.children
        for (var i = widgets.length - 1; i >= 0; i--) {
            widgets[i].destroy()
        }
    }
    
    function findWidgetAt(x, y) {
        var widgets = widgetContainer.children
        
        // Check from top to bottom (reverse order)
        for (var i = widgets.length - 1; i >= 0; i--) {
            var widget = widgets[i]
            
            if (x >= widget.x && x <= widget.x + widget.width &&
                y >= widget.y && y <= widget.y + widget.height) {
                return widget
            }
        }
        
        return null
    }
    
    // ============================================
    // CONTEXT MENU
    // ============================================
    
    MouseArea {
        anchors.fill: parent
        acceptedButtons: Qt.RightButton
        propagateComposedEvents: true
        
        onClicked: (mouse) => {
            if (mouse.button === Qt.RightButton) {
                // Check if clicked on empty space
                var widget = workspace.findWidgetAt(mouse.x, mouse.y)
                
                if (!widget) {
                    workspaceContextMenu.x = mouse.x
                    workspaceContextMenu.y = mouse.y
                    workspaceContextMenu.popup()
                }
            }
        }
    }
    
    Menu {
        id: workspaceContextMenu
        
        background: GlassPane {
            implicitWidth: 200
            implicitHeight: 40
            blurRadius: Theme.blurRadiusSubtle
            tintColor: Theme.glassTintDark
            radius: Theme.borderRadiusSmall
        }
        
        MenuItem {
            text: "Add Widget"
            onTriggered: widgetBrowserPopup.open()
        }
        
        MenuItem {
            text: "Change Wallpaper"
            onTriggered: console.log("Change wallpaper")
        }
        
        MenuSeparator { }
        
        Menu {
            title: "Grid"
            
            MenuItem {
                text: "Show Grid"
                checkable: true
                checked: workspace.showGrid
                onTriggered: workspace.showGrid = !workspace.showGrid
            }
            
            MenuItem {
                text: "Snap to Grid"
                checkable: true
                checked: workspace.snapToGrid
                onTriggered: workspace.snapToGrid = !workspace.snapToGrid
            }
        }
        
        MenuSeparator { }
        
        MenuItem {
            text: "Monad Settings"
            onTriggered: console.log("Open Monad Settings")
        }
    }
    
    // ============================================
    // WIDGET BROWSER POPUP
    // ============================================
    
    Popup {
        id: widgetBrowserPopup
        
        anchors.centerIn: parent
        width: 500
        height: 400
        modal: true
        
        background: GlassPane {
            blurRadius: Theme.blurRadiusStrong
            tintColor: Theme.glassTintDark
            borderGlow: Theme.glowIntensityHigh
            glowColor: Theme.primaryAccent
            radius: Theme.borderRadiusLarge
        }
        
        Column {
            anchors {
                fill: parent
                margins: Theme.spacingLarge
            }
            spacing: Theme.spacingMedium
            
            Text {
                text: "Add Widget"
                font.family: Theme.fontFamilyDisplay
                font.pixelSize: Theme.fontSizeLarge
                font.weight: Font.Bold
                color: Theme.textPrimary
            }
            
            GridView {
                width: parent.width
                height: parent.height - 100
                cellWidth: 120
                cellHeight: 120
                
                model: ListModel {
                    ListElement { name: "System Monitor"; icon: "📊"; type: "system" }
                    ListElement { name: "Terminal"; icon: "⚡"; type: "terminal" }
                    ListElement { name: "Wallet"; icon: "💰"; type: "wallet" }
                    ListElement { name: "Settings"; icon: "⚙️"; type: "settings" }
                    ListElement { name: "Explorer"; icon: "🔮"; type: "explorer" }
                }
                
                delegate: Rectangle {
                    width: 100
                    height: 100
                    radius: Theme.borderRadiusMedium
                    color: Qt.rgba(0.15, 0.15, 0.15, 0.5)
                    border.width: mouseArea.containsMouse ? 2 : 0
                    border.color: Theme.primaryAccent
                    
                    Column {
                        anchors.centerIn: parent
                        spacing: Theme.spacingSmall
                        
                        Text {
                            text: model.icon
                            font.pixelSize: 32
                            anchors.horizontalCenter: parent.horizontalCenter
                        }
                        
                        Text {
                            text: model.name
                            font.family: Theme.fontFamily
                            font.pixelSize: Theme.fontSizeSmall
                            color: Theme.textPrimary
                            anchors.horizontalCenter: parent.horizontalCenter
                        }
                    }
                    
                    MouseArea {
                        id: mouseArea
                        anchors.fill: parent
                        hoverEnabled: true
                        
                        onClicked: {
                            workspace.createWidget(model.type)
                            widgetBrowserPopup.close()
                        }
                    }
                }
            }
            
            Button {
                text: "Cancel"
                anchors.horizontalCenter: parent.horizontalCenter
                onClicked: widgetBrowserPopup.close()
                
                background: Rectangle {
                    radius: Theme.borderRadiusMedium
                    color: parent.hovered ? Qt.rgba(0.3, 0.3, 0.3, 0.8) : Qt.rgba(0.2, 0.2, 0.2, 0.6)
                }
                
                contentItem: Text {
                    text: parent.text
                    font.family: Theme.fontFamily
                    font.pixelSize: Theme.fontSizeNormal
                    color: Theme.textPrimary
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                }
            }
        }
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    Component.onCompleted: {
        console.log("🎯 LiquidWorkspace initialized")
        console.log("   Grid size:", gridSize)
        console.log("   Liquid motion:", liquidMotion)
        
        // Create demo System Monitor widget
        createWidget("system", 100, 100)
    }
}
