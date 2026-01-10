// BaseWidget.qml - Draggable, Resizable Widget Template
import QtQuick
import QtQuick.Controls

Item {
    id: widget
    
    // ============================================
    // PROPERTIES
    // ============================================
    
    property string widgetName: "Widget"
    property string widgetIcon: "📦"
    property bool dragging: false
    property bool resizing: false
    property bool snapToGrid: false
    property int gridSize: 100
    
    // Target position for smooth physics
    property real targetX: x
    property real targetY: y
    
    // Widget content (override in derived widgets)
    property Component content: Item { }
    
    // Minimum size
    property int minWidth: 300
    property int minHeight: 200
    
    // ============================================
    // DEFAULT SIZE
    // ============================================
    
    width: 400
    height: 300
    
    // ============================================
    // SMOOTH POSITION ANIMATION (Liquid Motion)
    // ============================================
    
    Behavior on x {
        enabled: !dragging && !resizing
        SpringAnimation {
            spring: Theme.springSmooth
            damping: Theme.dampingSmooth
            epsilon: 0.1
        }
    }
    
    Behavior on y {
        enabled: !dragging && !resizing
        SpringAnimation {
            spring: Theme.springSmooth
            damping: Theme.dampingSmooth
            epsilon: 0.1
        }
    }
    
    // ============================================
    // WIDGET FRAME
    // ============================================
    
    GlassPane {
        id: frame
        anchors.fill: parent
        blurRadius: Theme.blurRadiusDefault
        tintColor: Theme.glassTintDark
        borderGlow: titleBar.containsMouse || widget.dragging ? Theme.glowIntensityHigh : Theme.glowIntensityMedium
        glowColor: Theme.primaryAccent
        radius: Theme.borderRadiusLarge
        
        pulseIntensity: widget.dragging ? 0.5 : 0.0
        
        Behavior on borderGlow {
            NumberAnimation { duration: Theme.animationFast }
        }
    }
    
    // ============================================
    // TITLE BAR
    // ============================================
    
    Rectangle {
        id: titleBar
        width: parent.width
        height: 40
        color: Qt.rgba(0.1, 0.1, 0.1, 0.6)
        radius: Theme.borderRadiusLarge
        
        property bool containsMouse: dragArea.containsMouse
        
        // Bottom square corners
        Rectangle {
            anchors {
                left: parent.left
                right: parent.right
                bottom: parent.bottom
            }
            height: parent.height / 2
            color: parent.color
        }
        
        // Title content
        Row {
            anchors {
                left: parent.left
                leftMargin: Theme.spacingMedium
                verticalCenter: parent.verticalCenter
            }
            spacing: Theme.spacingSmall
            
            Text {
                text: widget.widgetIcon
                font.pixelSize: Theme.fontSizeMedium
                color: Theme.primaryAccent
            }
            
            Text {
                text: widget.widgetName
                font.family: Theme.fontFamily
                font.pixelSize: Theme.fontSizeNormal
                font.weight: Font.Medium
                color: Theme.textPrimary
            }
        }
        
        // Control buttons
        Row {
            anchors {
                right: parent.right
                rightMargin: Theme.spacingSmall
                verticalCenter: parent.verticalCenter
            }
            spacing: Theme.spacingXS
            
            // Minimize button
            Rectangle {
                width: 24
                height: 24
                radius: width / 2
                color: minimizeArea.containsMouse ? Qt.rgba(0.3, 0.3, 0.3, 0.8) : "transparent"
                
                Text {
                    anchors.centerIn: parent
                    text: "−"
                    font.pixelSize: Theme.fontSizeMedium
                    color: Theme.textPrimary
                }
                
                MouseArea {
                    id: minimizeArea
                    anchors.fill: parent
                    hoverEnabled: true
                    onClicked: widget.minimize()
                }
            }
            
            // Close button
            Rectangle {
                width: 24
                height: 24
                radius: width / 2
                color: closeArea.containsMouse ? Qt.rgba(1.0, 0.2, 0.2, 0.8) : "transparent"
                
                Text {
                    anchors.centerIn: parent
                    text: "✕"
                    font.pixelSize: Theme.fontSizeMedium
                    color: Theme.textPrimary
                }
                
                MouseArea {
                    id: closeArea
                    anchors.fill: parent
                    hoverEnabled: true
                    onClicked: widget.close()
                }
            }
        }
        
        // Drag handle
        MouseArea {
            id: dragArea
            anchors.fill: parent
            hoverEnabled: true
            cursorShape: Qt.SizeAllCursor
            
            property point startPos
            property point startWidgetPos
            
            onPressed: (mouse) => {
                widget.dragging = true
                startPos = Qt.point(mouse.x, mouse.y)
                startWidgetPos = Qt.point(widget.x, widget.y)
                widget.z = Theme.zIndexWidget + 1  // Bring to front
            }
            
            onPositionChanged: (mouse) => {
                if (pressed) {
                    var dx = mouse.x - startPos.x
                    var dy = mouse.y - startPos.y
                    
                    widget.x = startWidgetPos.x + dx
                    widget.y = startWidgetPos.y + dy
                    
                    // Constrain to parent bounds
                    widget.x = Math.max(0, Math.min(widget.x, widget.parent.width - widget.width))
                    widget.y = Math.max(0, Math.min(widget.y, widget.parent.height - widget.height))
                }
            }
            
            onReleased: {
                widget.dragging = false
                
                // Snap to grid if enabled
                if (widget.snapToGrid) {
                    widget.targetX = Math.round(widget.x / widget.gridSize) * widget.gridSize
                    widget.targetY = Math.round(widget.y / widget.gridSize) * widget.gridSize
                    widget.x = widget.targetX
                    widget.y = widget.targetY
                }
            }
        }
    }
    
    // ============================================
    // CONTENT AREA
    // ============================================
    
    Item {
        id: contentArea
        anchors {
            top: titleBar.bottom
            left: parent.left
            right: parent.right
            bottom: parent.bottom
            margins: Theme.spacingMedium
        }
        
        clip: true
        
        // Load widget-specific content
        Loader {
            id: contentLoader
            anchors.fill: parent
            sourceComponent: widget.content
        }
    }
    
    // ============================================
    // RESIZE HANDLES
    // ============================================
    
    // Bottom-right corner resize
    Rectangle {
        id: resizeHandle
        anchors {
            right: parent.right
            bottom: parent.bottom
            margins: 2
        }
        width: 20
        height: 20
        radius: Theme.borderRadiusSmall
        color: resizeArea.containsMouse ? Theme.primaryAccent : Qt.rgba(0.3, 0.3, 0.3, 0.5)
        
        // Resize icon
        Canvas {
            anchors.fill: parent
            onPaint: {
                var ctx = getContext("2d")
                ctx.strokeStyle = Theme.textPrimary
                ctx.lineWidth = 2
                
                // Draw grip lines
                for (var i = 0; i < 3; i++) {
                    ctx.beginPath()
                    ctx.moveTo(width - (i * 5) - 3, height - 3)
                    ctx.lineTo(width - 3, height - (i * 5) - 3)
                    ctx.stroke()
                }
            }
        }
        
        MouseArea {
            id: resizeArea
            anchors.fill: parent
            hoverEnabled: true
            cursorShape: Qt.SizeFDiagCursor
            
            property point startPos
            property size startSize
            
            onPressed: (mouse) => {
                widget.resizing = true
                startPos = Qt.point(mouse.x, mouse.y)
                startSize = Qt.size(widget.width, widget.height)
            }
            
            onPositionChanged: (mouse) => {
                if (pressed) {
                    var newWidth = startSize.width + mouse.x - startPos.x
                    var newHeight = startSize.height + mouse.y - startPos.y
                    
                    widget.width = Math.max(widget.minWidth, newWidth)
                    widget.height = Math.max(widget.minHeight, newHeight)
                }
            }
            
            onReleased: {
                widget.resizing = false
            }
        }
    }
    
    // Edge resize handles (top, bottom, left, right)
    // Top edge
    MouseArea {
        anchors {
            top: parent.top
            left: parent.left
            right: parent.right
        }
        height: 8
        cursorShape: Qt.SizeVerCursor
        
        property real startY
        property real startHeight
        
        onPressed: (mouse) => {
            widget.resizing = true
            startY = widget.y
            startHeight = widget.height
        }
        
        onPositionChanged: (mouse) => {
            if (pressed) {
                var dy = mouse.y
                var newHeight = startHeight - dy
                
                if (newHeight >= widget.minHeight) {
                    widget.y = startY + dy
                    widget.height = newHeight
                }
            }
        }
        
        onReleased: widget.resizing = false
    }
    
    // ============================================
    // METHODS
    // ============================================
    
    function minimize() {
        widget.visible = false
        console.log("Widget minimized:", widget.widgetName)
    }
    
    function close() {
        // Fade out animation
        widgetCloseAnimation.start()
    }
    
    function openSettings() {
        console.log("Widget settings:", widget.widgetName)
    }
    
    // Close animation
    SequentialAnimation {
        id: widgetCloseAnimation
        
        ParallelAnimation {
            NumberAnimation {
                target: widget
                property: "opacity"
                to: 0
                duration: Theme.animationNormal
            }
            
            NumberAnimation {
                target: widget
                property: "scale"
                to: 0.8
                duration: Theme.animationNormal
                easing.type: Easing.InBack
            }
        }
        
        ScriptAction {
            script: widget.destroy()
        }
    }
    
    // ============================================
    // CONTEXT MENU
    // ============================================
    
    MouseArea {
        anchors.fill: contentArea
        acceptedButtons: Qt.RightButton
        propagateComposedEvents: true
        
        onClicked: (mouse) => {
            if (mouse.button === Qt.RightButton) {
                widgetContextMenu.popup()
            }
        }
    }
    
    Menu {
        id: widgetContextMenu
        
        background: GlassPane {
            implicitWidth: 200
            implicitHeight: 40
            blurRadius: Theme.blurRadiusSubtle
            tintColor: Theme.glassTintDark
            radius: Theme.borderRadiusSmall
        }
        
        MenuItem {
            text: "Configure"
            onTriggered: widget.openSettings()
        }
        
        MenuItem {
            text: "Pin to Dock"
            onTriggered: console.log("Pin to dock:", widget.widgetName)
        }
        
        MenuSeparator { }
        
        MenuItem {
            text: "Close"
            onTriggered: widget.close()
        }
    }
    
    // ============================================
    // STARTUP ANIMATION
    // ============================================
    
    opacity: 0
    scale: 0.8
    
    Component.onCompleted: {
        // Entrance animation
        opacityAnimation.start()
        scaleAnimation.start()
    }
    
    NumberAnimation {
        id: opacityAnimation
        target: widget
        property: "opacity"
        from: 0
        to: 1
        duration: Theme.animationSlow
        easing.type: Easing.OutQuad
    }
    
    NumberAnimation {
        id: scaleAnimation
        target: widget
        property: "scale"
        from: 0.8
        to: 1.0
        duration: Theme.animationSlow
        easing.type: Easing.OutBack
    }
}
