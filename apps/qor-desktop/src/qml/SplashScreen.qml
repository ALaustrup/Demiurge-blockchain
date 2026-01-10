import QtQuick
// import QtQuick.Effects  // Not available in Qt 6.10.0

import "components"

/**
 * SplashScreen - 3-Stage Intro Animation
 * 
 * The gateway to the Abyss. A cinematic intro sequence that
 * establishes the ancient-tech aesthetic from the first moment.
 * 
 * Stages:
 *   1. Void awakens (particles emerge from darkness)
 *   2. QØЯ sigil materializes (logo fade in with glow)
 *   3. Transition to login (fade out)
 */
Item {
    id: splashScreen
    
    // ========================================================================
    // SIGNALS
    // ========================================================================
    
    signal complete()
    
    // ========================================================================
    // STATE
    // ========================================================================
    
    property int stage: 0
    
    // ========================================================================
    // BACKGROUND
    // ========================================================================
    
    Rectangle {
        anchors.fill: parent
        color: Theme.voidBlack
    }
    
    // ========================================================================
    // STAGE 1: VOID AWAKENS (Particle effect)
    // ========================================================================
    
    Item {
        id: stage1
        anchors.fill: parent
        opacity: splashScreen.stage === 0 ? 1 : 0
        
        Behavior on opacity {
            NumberAnimation { duration: Theme.animSlow }
        }
        
        // Simulated particle field (simplified - would use actual particles in production)
        Repeater {
            model: 50
            
            Rectangle {
                property real angle: Math.random() * Math.PI * 2
                property real distance: Math.random() * 200 + 100
                property real speed: Math.random() * 2 + 1
                
                x: parent.width / 2 + Math.cos(angle) * distance * particleAnim.progress
                y: parent.height / 2 + Math.sin(angle) * distance * particleAnim.progress
                width: 2
                height: 2
                radius: 1
                color: Math.random() > 0.7 ? Theme.accentFlame : Theme.cipherCyan
                opacity: (1 - particleAnim.progress) * 0.8
            }
        }
        
        NumberAnimation {
            id: particleAnim
            property real progress: 0
            target: particleAnim
            property: "progress"
            from: 0
            to: 1
            duration: 2000
            easing.type: Easing.OutCubic
            running: splashScreen.stage === 0
            onFinished: splashScreen.stage = 1
        }
    }
    
    // ========================================================================
    // STAGE 2: QØЯ SIGIL (Logo materialization)
    // ========================================================================
    
    Item {
        id: stage2
        anchors.centerIn: parent
        width: 400
        height: 200
        opacity: splashScreen.stage === 1 ? 1 : 0
        scale: splashScreen.stage === 1 ? 1 : 0.8
        
        Behavior on opacity {
            NumberAnimation { duration: Theme.animVerySlow }
        }
        Behavior on scale {
            NumberAnimation { duration: Theme.animVerySlow; easing.type: Easing.OutBack }
        }
        
        // Breathing glow wrapper
        BreathingGlow {
            anchors.centerIn: parent
            width: logoText.implicitWidth + 40
            height: logoText.implicitHeight + 40
            breathing: splashScreen.stage === 1
            glowRadius: Theme.glowRadiusHuge
            
            // Logo text
            GlowText {
                id: logoText
                anchors.centerIn: parent
                text: "QØЯ"
                fontFamily: Theme.fontHeader
                fontSize: 96
                fontWeight: Font.Bold
                textColor: Theme.textPrimary
                glowing: true
                glowColor: Theme.accentFlame
                glowRadius: Theme.glowRadiusLarge
            }
        }
        
        // Tagline
        Text {
            anchors.top: parent.verticalCenter
            anchors.topMargin: 60
            anchors.horizontalCenter: parent.horizontalCenter
            text: "THE CORE OF DEMIURGE"
            font.family: Theme.fontAncient
            font.pixelSize: Theme.fontSizeSmall
            font.letterSpacing: 8
            color: Theme.textSecondary
            opacity: taglineOpacity.running ? 1 : 0
            
            Behavior on opacity {
                NumberAnimation { duration: Theme.animSlow }
            }
            
            Timer {
                id: taglineOpacity
                interval: 500
                running: splashScreen.stage === 1
            }
        }
    }
    
    // Sigil display timer
    Timer {
        id: sigilTimer
        interval: 3000
        running: splashScreen.stage === 1
        onTriggered: splashScreen.stage = 2
    }
    
    // ========================================================================
    // STAGE 3: TRANSITION
    // ========================================================================
    
    Timer {
        interval: 500
        running: splashScreen.stage === 2
        onTriggered: splashScreen.complete()
    }
    
    // ========================================================================
    // SKIP PROMPT
    // ========================================================================
    
    Text {
        anchors.bottom: parent.bottom
        anchors.bottomMargin: 40
        anchors.horizontalCenter: parent.horizontalCenter
        text: "Press any key to continue"
        font.family: Theme.fontBody
        font.pixelSize: Theme.fontSizeSmall
        color: Theme.textMuted
        opacity: splashScreen.stage >= 1 ? 0.5 : 0
        
        Behavior on opacity {
            NumberAnimation { duration: Theme.animNormal }
        }
        
        SequentialAnimation on opacity {
            running: splashScreen.stage >= 1
            loops: Animation.Infinite
            NumberAnimation { to: 0.8; duration: 1000 }
            NumberAnimation { to: 0.3; duration: 1000 }
        }
    }
    
    // Skip on any key or click
    MouseArea {
        anchors.fill: parent
        onClicked: if (splashScreen.stage >= 1) splashScreen.complete()
    }
    
    Keys.onPressed: if (splashScreen.stage >= 1) splashScreen.complete()
    focus: true
    
    Component.onCompleted: {
        // Start the sequence
        splashScreen.stage = 0
    }
}
