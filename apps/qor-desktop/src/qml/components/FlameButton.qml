import QtQuick
// import QtQuick.Effects  // Not available
import ".."

/**
 * FlameButton - Interactive button with flame glow on hover/press
 * 
 * A glass-style button that ignites with the eternal flame
 * gradient when hovered or pressed.
 */
Rectangle {
    id: flameButton
    
    // ========================================================================
    // PUBLIC PROPERTIES
    // ========================================================================
    
    /** Button text */
    property string text: ""
    
    /** Icon source (optional) */
    property string iconSource: ""
    
    /** Icon size */
    property int iconSize: 24
    
    /** Whether button is enabled */
    property bool enabled: true
    
    /** Whether this is a primary (flame) or secondary (glass) button */
    property bool primary: false
    
    // ========================================================================
    // SIGNALS
    // ========================================================================
    
    signal clicked()
    signal pressed()
    signal released()
    
    // ========================================================================
    // VISUAL CONFIGURATION
    // ========================================================================
    
    implicitWidth: contentRow.implicitWidth + Theme.spacingLarge * 2
    implicitHeight: 44
    
    radius: Theme.radiusMedium
    
    // Background color based on state
    color: {
        if (!enabled) return Theme.glassPanelDock
        if (mouseArea.pressed) return primary ? Theme.accentEmber : Theme.glassPanelPopup
        if (mouseArea.containsMouse) return primary ? Theme.accentFlame : Theme.glassPanelWindow
        return primary ? Theme.accentFlame : Theme.glassPanelDock
    }
    
    opacity: enabled ? 1.0 : 0.5
    
    border.width: 1
    border.color: {
        if (!enabled) return Theme.panelBorder
        if (mouseArea.containsMouse || mouseArea.pressed) {
            return primary ? Theme.accentMagma : Theme.panelBorderActive
        }
        return primary ? Theme.accentEmber : Theme.panelBorder
    }
    
    Behavior on color { ColorAnimation { duration: Theme.animFast } }
    Behavior on border.color { ColorAnimation { duration: Theme.animFast } }
    
    // ========================================================================
    // GLOW EFFECT
    // ========================================================================
    
    // layer.enabled: mouseArea.containsMouse && enabled
    // layer.effect: MultiEffect {
    //     shadowEnabled: true
    //     shadowColor: primary ? Theme.accentFlame : Theme.cipherCyan
    //     shadowBlur: 0.5
    //     shadowVerticalOffset: 0
    //     shadowHorizontalOffset: 0
    // }
    
    // ========================================================================
    // CONTENT
    // ========================================================================
    
    Row {
        id: contentRow
        anchors.centerIn: parent
        spacing: Theme.spacingSmall
        
        // Icon
        Image {
            id: iconImage
            source: flameButton.iconSource
            width: flameButton.iconSize
            height: flameButton.iconSize
            visible: flameButton.iconSource !== ""
            anchors.verticalCenter: parent.verticalCenter
            
            // Tint icon to match text
            // layer.enabled: true
            // layer.effect: MultiEffect {
            //     colorization: 1.0
            //     colorizationColor: buttonText.color
            // }
        }
        
        // Text
        Text {
            id: buttonText
            text: flameButton.text
            font.family: Theme.fontBody
            font.pixelSize: Theme.fontSizeBody
            font.weight: Font.Medium
            color: {
                if (!flameButton.enabled) return Theme.textDisabled
                if (primary) return Theme.voidBlack
                return Theme.textPrimary
            }
            anchors.verticalCenter: parent.verticalCenter
            visible: flameButton.text !== ""
        }
    }
    
    // ========================================================================
    // MOUSE INTERACTION
    // ========================================================================
    
    MouseArea {
        id: mouseArea
        anchors.fill: parent
        hoverEnabled: true
        cursorShape: flameButton.enabled ? Qt.PointingHandCursor : Qt.ArrowCursor
        
        onClicked: if (flameButton.enabled) flameButton.clicked()
        onPressed: if (flameButton.enabled) flameButton.pressed()
        onReleased: if (flameButton.enabled) flameButton.released()
    }
}

