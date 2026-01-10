import QtQuick
// import QtQuick.Effects  // Not available

import "../components"

/**
 * QDockItem - Individual Dock Icon
 * 
 * A single item in the Q-Dock showing an app icon or system indicator.
 * Features hover glow and running app indicator.
 */
Rectangle {
    id: dockItem
    
    // ========================================================================
    // PUBLIC PROPERTIES
    // ========================================================================
    
    /** Icon (emoji or image source) */
    property string icon: ""
    
    /** Tooltip text */
    property string tooltip: ""
    
    /** Whether to show label below icon */
    property bool showLabel: false
    
    /** Whether this app is running */
    property bool running: false
    
    // ========================================================================
    // SIGNALS
    // ========================================================================
    
    signal clicked()
    
    // ========================================================================
    // VISUAL CONFIGURATION
    // ========================================================================
    
    width: Theme.dockItemSize
    height: Theme.dockItemSize
    radius: Theme.radiusSmall
    color: mouseArea.containsMouse ? Theme.glassPanelWindow : "transparent"
    
    Behavior on color { ColorAnimation { duration: Theme.animFast } }
    
    // ========================================================================
    // ICON
    // ========================================================================
    
    Text {
        anchors.centerIn: parent
        text: dockItem.icon
        font.pixelSize: 24
    }
    
    // ========================================================================
    // RUNNING INDICATOR (Flame underline)
    // ========================================================================
    
    Rectangle {
        visible: running
        anchors.bottom: parent.bottom
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.bottomMargin: 2
        width: parent.width * 0.6
        height: 3
        radius: 1.5
        
        gradient: Gradient {
            orientation: Gradient.Horizontal
            GradientStop { position: 0.0; color: Theme.accentFlame }
            GradientStop { position: 0.5; color: Theme.accentMagma }
            GradientStop { position: 1.0; color: Theme.accentFlame }
        }
        
        // Breathing animation
        SequentialAnimation on opacity {
            running: dockItem.running
            loops: Animation.Infinite
            NumberAnimation { to: 1.0; duration: 1500; easing.type: Easing.InOutSine }
            NumberAnimation { to: 0.6; duration: 1500; easing.type: Easing.InOutSine }
        }
    }
    
    // ========================================================================
    // TOOLTIP
    // ========================================================================
    
    Rectangle {
        id: tooltipBox
        visible: mouseArea.containsMouse && tooltip !== ""
        
        anchors.bottom: parent.top
        anchors.bottomMargin: Theme.spacingSmall
        anchors.horizontalCenter: parent.horizontalCenter
        
        width: tooltipText.implicitWidth + Theme.spacingMedium
        height: tooltipText.implicitHeight + Theme.spacingSmall
        radius: Theme.radiusSmall
        color: Theme.glassPanelPopup
        border.width: 1
        border.color: Theme.panelBorder
        
        Text {
            id: tooltipText
            anchors.centerIn: parent
            text: dockItem.tooltip
            font.family: Theme.fontBody
            font.pixelSize: Theme.fontSizeSmall
            color: Theme.textPrimary
        }
        
        opacity: mouseArea.containsMouse ? 1 : 0
        Behavior on opacity { NumberAnimation { duration: Theme.animFast } }
    }
    
    // ========================================================================
    // MOUSE INTERACTION
    // ========================================================================
    
    MouseArea {
        id: mouseArea
        anchors.fill: parent
        hoverEnabled: true
        cursorShape: Qt.PointingHandCursor
        
        onClicked: dockItem.clicked()
    }
}

