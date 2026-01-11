// InfinityDock.qml - Bottom Navigation with Magnification
import QtQuick
import QtQuick.Controls
import QtQuick.Effects

Rectangle {
    id: dock
    
    // ============================================
    // PROPERTIES
    // ============================================
    
    property real maxMagnification: 1.8
    property real magnificationRange: 200  // pixels
    property int itemSize: 50
    property int itemSpacing: 10
    property bool autoHide: false
    
    // Mouse tracking
    property real globalMouseX: 0
    
    // ============================================
    // DOCK CONFIGURATION
    // ============================================
    
    width: parent.width * 0.6
    height: itemSize + Theme.spacingLarge * 2
    radius: height / 2
    
    color: "transparent"
    
    // ============================================
    // GLASS BACKGROUND
    // ============================================
    
    GlassPane {
        id: dockGlass
        anchors.fill: parent
        blurRadius: Theme.blurRadiusLight
        tintColor: Theme.glassTintDark
        borderGlow: Theme.glowIntensityMedium
        glowColor: Theme.primaryAccent
        radius: parent.radius
        
        // Pulse with mouse activity
        pulseIntensity: mouseTracker.containsMouse ? 0.3 : 0.0
        
        Behavior on pulseIntensity {
            NumberAnimation { duration: Theme.animationNormal }
        }
    }
    
    // ============================================
    // DOCK ITEMS CONTAINER
    // ============================================
    
    ListView {
        id: dockView
        anchors {
            centerIn: parent
            verticalCenterOffset: 0
        }
        
        width: contentWidth
        height: dock.itemSize * dock.maxMagnification
        
        orientation: ListView.Horizontal
        spacing: dock.itemSpacing
        interactive: false
        
        model: DockItemsModel { id: dockModel }
        
        delegate: Item {
            id: dockItemDelegate
            
            width: baseSize + (scaleFactor - 1.0) * baseSize
            height: baseSize + (scaleFactor - 1.0) * baseSize
            
            property real baseSize: dock.itemSize
            
            // Calculate distance from mouse to item center
            property real itemCenterX: {
                var listViewX = dockView.mapToItem(dock, x, 0).x
                return listViewX + width / 2
            }
            
            property real distanceFromMouse: {
                return Math.abs(dock.globalMouseX - itemCenterX)
            }
            
            // Calculate scale factor based on distance
            property real scaleFactor: {
                if (distanceFromMouse > dock.magnificationRange) {
                    return 1.0
                }
                
                var normalized = 1.0 - (distanceFromMouse / dock.magnificationRange)
                return 1.0 + (normalized * (dock.maxMagnification - 1.0))
            }
            
            // Smooth animation
            Behavior on scaleFactor {
                SpringAnimation {
                    spring: Theme.springSnappy
                    damping: Theme.dampingSnappy
                    epsilon: 0.01
                }
            }
            
            // Item visual
            Rectangle {
                id: itemVisual
                anchors.centerIn: parent
                width: dockItemDelegate.baseSize
                height: dockItemDelegate.baseSize
                radius: Theme.borderRadiusMedium
                
                scale: dockItemDelegate.scaleFactor
                
                // Glass background
                color: Qt.rgba(0.15, 0.15, 0.15, 0.6)
                
                border.width: 2
                border.color: {
                    if (mouseArea.containsMouse) return Theme.primaryAccent
                    if (model.active) return Theme.successGreen
                    return Qt.rgba(0.3, 0.3, 0.3, 0.5)
                }
                
                // Icon
                Text {
                    anchors.centerIn: parent
                    text: model.icon
                    font.pixelSize: dockItemDelegate.baseSize * 0.5
                    color: Theme.textPrimary
                }
                
                // Active indicator
                Rectangle {
                    visible: model.active
                    anchors {
                        bottom: parent.bottom
                        horizontalCenter: parent.horizontalCenter
                        bottomMargin: -6
                    }
                    width: parent.width * 0.6
                    height: 3
                    radius: 1.5
                    color: Theme.primaryAccent
                    
                    layer.enabled: true
                    layer.effect: MultiEffect {
                        blurEnabled: true
                        blur: 0.8
                        blurMax: 8
                    }
                }
                
                // Hover glow
                Rectangle {
                    anchors.fill: parent
                    radius: parent.radius
                    color: "transparent"
                    border.width: 2
                    border.color: Theme.primaryAccent
                    opacity: mouseArea.containsMouse ? 0.6 : 0.0
                    
                    Behavior on opacity {
                        NumberAnimation { duration: Theme.animationFast }
                    }
                }
                
                // Mouse interaction
                MouseArea {
                    id: mouseArea
                    anchors.fill: parent
                    hoverEnabled: true
                    
                    onClicked: {
                        console.log("Dock item clicked:", model.name)
                        dockModel.activateItem(index)
                        
                        // Emit signal to workspace to create widget
                        if (typeof workspace !== 'undefined') {
                            workspace.createWidget(model.widgetType)
                        }
                    }
                    
                    onPressAndHold: {
                        // Show context menu
                        dockContextMenu.popup(itemVisual)
                    }
                }
                
                // Tooltip
                ToolTip {
                    visible: mouseArea.containsMouse
                    delay: 500
                    text: model.name
                    
                    background: GlassPane {
                        implicitWidth: 100
                        implicitHeight: 30
                        blurRadius: Theme.blurRadiusSubtle
                        tintColor: Theme.glassTintDark
                        radius: Theme.borderRadiusSmall
                    }
                    
                    contentItem: Text {
                        text: parent.text
                        font.family: Theme.fontFamily
                        font.pixelSize: Theme.fontSizeSmall
                        color: Theme.textPrimary
                    }
                }
            }
        }
    }
    
    // ============================================
    // GLOBAL MOUSE TRACKING
    // ============================================
    
    MouseArea {
        id: mouseTracker
        anchors.fill: parent
        hoverEnabled: true
        propagateComposedEvents: true
        
        onPositionChanged: (mouse) => {
            dock.globalMouseX = mouse.x
        }
        
        onExited: {
            // Reset magnification when mouse leaves
            dock.globalMouseX = -1000
        }
    }
    
    // ============================================
    // DOCK CONTEXT MENU
    // ============================================
    
    Menu {
        id: dockContextMenu
        
        background: GlassPane {
            implicitWidth: 200
            implicitHeight: 40
            blurRadius: Theme.blurRadiusSubtle
            tintColor: Theme.glassTintDark
            radius: Theme.borderRadiusSmall
        }
        
        MenuItem {
            text: "Remove from Dock"
            onTriggered: console.log("Remove item")
        }
        
        MenuItem {
            text: "Open at Login"
            checkable: true
        }
        
        MenuSeparator { }
        
        MenuItem {
            text: "Dock Preferences"
            onTriggered: console.log("Dock preferences")
        }
    }
}

// ============================================
// DOCK ITEMS MODEL
// ============================================

ListModel {
    id: dockItemsModelComponent
        
        ListElement {
            name: "System"
            icon: "📊"
            active: false
            widgetType: "system"
        }
        
        ListElement {
            name: "Terminal"
            icon: "⚡"
            active: false
            widgetType: "terminal"
        }
        
        ListElement {
            name: "Wallet"
            icon: "💰"
            active: false
            widgetType: "wallet"
        }
        
        ListElement {
            name: "Settings"
            icon: "⚙️"
            active: true
            widgetType: "settings"
        }
        
        ListElement {
            name: "Explorer"
            icon: "🔮"
            active: false
            widgetType: "explorer"
        }
}

// Model wrapper component
QtObject {
    id: dockModelWrapper
    
    function activateItem(index) {
        // Deactivate all
        for (var i = 0; i < dockItemsModelComponent.count; i++) {
            dockItemsModelComponent.setProperty(i, "active", false)
        }
        // Activate clicked
        dockItemsModelComponent.setProperty(index, "active", true)
        
        // Emit signal to create widget
        var item = dockItemsModelComponent.get(index)
        console.log("Activate:", item.name, "Type:", item.widgetType)
    }
}
