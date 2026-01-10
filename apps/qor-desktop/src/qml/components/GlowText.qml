import QtQuick
// import QtQuick.Effects  // Not available
import ".."

/**
 * GlowText - Text with optional flame glow effect
 * 
 * Used for headers, active items, and emphasis.
 * The glow color animates through the flame gradient when active.
 */
Item {
    id: glowText
    
    // ========================================================================
    // PUBLIC PROPERTIES
    // ========================================================================
    
    /** The text to display */
    property string text: ""
    
    /** Font family */
    property string fontFamily: Theme.fontBody
    
    /** Font size in pixels */
    property int fontSize: Theme.fontSizeBody
    
    /** Font weight */
    property int fontWeight: Font.Normal
    
    /** Text color */
    property color textColor: Theme.textPrimary
    
    /** Whether to show the glow */
    property bool glowing: false
    
    /** Glow color (defaults to flame accent) */
    property color glowColor: Theme.accentFlame
    
    /** Glow radius */
    property int glowRadius: Theme.glowRadiusSmall
    
    /** Text alignment */
    property int horizontalAlignment: Text.AlignLeft
    property int verticalAlignment: Text.AlignVCenter
    
    /** Elide mode */
    property int elide: Text.ElideRight
    
    // Size based on text
    implicitWidth: mainText.implicitWidth
    implicitHeight: mainText.implicitHeight
    
    // ========================================================================
    // GLOW LAYER (Behind text)
    // ========================================================================
    
    Text {
        id: glowLayer
        anchors.fill: parent
        text: glowText.text
        font.family: glowText.fontFamily
        font.pixelSize: glowText.fontSize
        font.weight: glowText.fontWeight
        color: glowText.glowColor
        horizontalAlignment: glowText.horizontalAlignment
        verticalAlignment: glowText.verticalAlignment
        elide: glowText.elide
        
        visible: glowText.glowing
        
        // layer.enabled: glowText.glowing
        // layer.effect: MultiEffect {
        //     blurEnabled: true
        //     blur: 0.5
        //     blurMax: 32
        // }
        
        opacity: glowText.glowing ? 0.7 : 0
        
        Behavior on opacity {
            NumberAnimation { duration: Theme.animNormal }
        }
    }
    
    // ========================================================================
    // MAIN TEXT (On top)
    // ========================================================================
    
    Text {
        id: mainText
        anchors.fill: parent
        text: glowText.text
        font.family: glowText.fontFamily
        font.pixelSize: glowText.fontSize
        font.weight: glowText.fontWeight
        color: glowText.textColor
        horizontalAlignment: glowText.horizontalAlignment
        verticalAlignment: glowText.verticalAlignment
        elide: glowText.elide
    }
}
