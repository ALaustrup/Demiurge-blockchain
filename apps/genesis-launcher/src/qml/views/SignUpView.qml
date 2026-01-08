/**
 * SignUpView.qml - AbyssID Creation Flow
 * 
 * Allows users to create a new AbyssID with real-time username availability check.
 * Supports offline account creation with automatic sync when online.
 */
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Effects

import "../components"

Item {
    id: root
    
    signal signUpSuccess()
    signal backToLogin()
    
    // Theme colors
    readonly property color textPrimary: "#E0E0E0"
    readonly property color textSecondary: "#7A7A7A"
    readonly property color flameOrange: "#FF3D00"
    readonly property color flameYellow: "#FF9100"
    readonly property color cipherCyan: "#00FFC8"
    readonly property color successGreen: "#00FF88"
    readonly property color errorRed: "#FF4444"
    readonly property color glassColor: "#0A0A0A"
    
    // State machine for signup flow
    property string signUpState: "input"  // input, checking, taken, available, creating, complete
    property string checkedUsername: ""
    property string generatedPublicKey: ""
    property string generatedSeedPhrase: ""
    
    ColumnLayout {
        anchors.centerIn: parent
        spacing: 24
        width: 400
        
        // Logo / Title
        Item {
            Layout.alignment: Qt.AlignHCenter
            Layout.preferredWidth: 200
            Layout.preferredHeight: 80
            
            Text {
                anchors.centerIn: parent
                text: "GENESIS"
                font.family: "Orbitron"
                font.pixelSize: 32
                font.weight: Font.Bold
                color: textPrimary
                
                layer.enabled: true
                layer.effect: MultiEffect {
                    blurEnabled: true
                    blur: 0.3
                    blurMax: 16
                    colorization: 1.0
                    colorizationColor: flameOrange
                }
            }
        }
        
        // State-dependent content
        Loader {
            Layout.fillWidth: true
            Layout.preferredHeight: item ? item.implicitHeight : 300
            sourceComponent: {
                switch (signUpState) {
                    case "input":
                    case "checking":
                    case "taken":
                        return inputComponent
                    case "available":
                        return availableComponent
                    case "creating":
                        return creatingComponent
                    case "complete":
                        return completeComponent
                    default:
                        return inputComponent
                }
            }
        }
        
        // Back to login link
        Text {
            Layout.alignment: Qt.AlignHCenter
            text: signUpState === "complete" ? "" : "← Back to Login"
            color: textSecondary
            font.family: "Rajdhani"
            font.pixelSize: 13
            visible: text.length > 0
            
            MouseArea {
                anchors.fill: parent
                cursorShape: Qt.PointingHandCursor
                hoverEnabled: true
                onEntered: parent.color = textPrimary
                onExited: parent.color = textSecondary
                onClicked: root.backToLogin()
            }
        }
    }
    
    // ==================== INPUT STATE ====================
    Component {
        id: inputComponent
        
        ColumnLayout {
            spacing: 20
            
            Text {
                Layout.alignment: Qt.AlignHCenter
                text: "Create Your AbyssID"
                color: textPrimary
                font.family: "Orbitron"
                font.pixelSize: 18
            }
            
            Text {
                Layout.alignment: Qt.AlignHCenter
                text: "Choose a unique identity for the Demiurge ecosystem"
                color: textSecondary
                font.family: "Rajdhani"
                font.pixelSize: 13
                wrapMode: Text.WordWrap
            }
            
            // Username input with status indicator
            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 56
                color: "#0D0D0D"
                radius: 8
                border.width: 2
                border.color: {
                    if (signUpState === "checking") return cipherCyan
                    if (signUpState === "taken") return errorRed
                    if (usernameInput.activeFocus) return flameOrange
                    return "#252525"
                }
                
                Behavior on border.color {
                    ColorAnimation { duration: 200 }
                }
                
                RowLayout {
                    anchors.fill: parent
                    anchors.margins: 12
                    spacing: 10
                    
                    TextInput {
                        id: usernameInput
                        Layout.fillWidth: true
                        Layout.fillHeight: true
                        color: textPrimary
                        font.family: "JetBrains Mono"
                        font.pixelSize: 16
                        verticalAlignment: Text.AlignVCenter
                        clip: true
                        
                        property string placeholderText: "Enter desired username..."
                        
                        Text {
                            anchors.fill: parent
                            anchors.verticalCenter: parent.verticalCenter
                            text: usernameInput.placeholderText
                            color: "#555555"
                            font: usernameInput.font
                            verticalAlignment: Text.AlignVCenter
                            visible: !usernameInput.text && !usernameInput.activeFocus
                        }
                        
                        onTextChanged: {
                            signUpState = "input"
                            checkTimer.restart()
                        }
                        
                        Keys.onReturnPressed: {
                            if (text.length >= 3) {
                                AuthManager.checkUsernameAvailability(text)
                                signUpState = "checking"
                            }
                        }
                    }
                    
                    // Status indicator
                    Item {
                        Layout.preferredWidth: 24
                        Layout.preferredHeight: 24
                        visible: signUpState === "checking" || signUpState === "taken"
                        
                        // Loading spinner
                        Rectangle {
                            anchors.centerIn: parent
                            width: 20
                            height: 20
                            radius: 10
                            color: "transparent"
                            border.width: 2
                            border.color: cipherCyan
                            visible: signUpState === "checking"
                            
                            RotationAnimation on rotation {
                                from: 0
                                to: 360
                                duration: 1000
                                loops: Animation.Infinite
                                running: signUpState === "checking"
                            }
                        }
                        
                        // Error X
                        Text {
                            anchors.centerIn: parent
                            text: "✕"
                            color: errorRed
                            font.pixelSize: 18
                            font.bold: true
                            visible: signUpState === "taken"
                        }
                    }
                }
            }
            
            // Error message for taken username
            Text {
                Layout.fillWidth: true
                text: signUpState === "taken" ? "This identity is already claimed. Try another." : ""
                color: errorRed
                font.family: "Rajdhani"
                font.pixelSize: 12
                horizontalAlignment: Text.AlignHCenter
                visible: signUpState === "taken"
            }
            
            // Username requirements
            Text {
                Layout.fillWidth: true
                text: "• 3-24 characters • Letters, numbers, underscores only"
                color: textSecondary
                font.family: "Rajdhani"
                font.pixelSize: 11
                horizontalAlignment: Text.AlignCenter
            }
            
            // Check availability button
            FlameButton {
                Layout.fillWidth: true
                Layout.preferredHeight: 48
                text: signUpState === "checking" ? "CHECKING..." : "CHECK AVAILABILITY"
                enabled: usernameInput.text.length >= 3 && 
                         signUpState !== "checking" &&
                         /^[a-zA-Z0-9_]+$/.test(usernameInput.text)
                
                onClicked: {
                    checkedUsername = usernameInput.text
                    AuthManager.checkUsernameAvailability(usernameInput.text)
                    signUpState = "checking"
                }
            }
        }
    }
    
    // ==================== AVAILABLE STATE ====================
    Component {
        id: availableComponent
        
        ColumnLayout {
            spacing: 20
            
            // Success icon
            Rectangle {
                Layout.alignment: Qt.AlignHCenter
                Layout.preferredWidth: 64
                Layout.preferredHeight: 64
                radius: 32
                color: Qt.rgba(0, 1, 0.53, 0.15)
                border.width: 2
                border.color: successGreen
                
                Text {
                    anchors.centerIn: parent
                    text: "✓"
                    color: successGreen
                    font.pixelSize: 32
                    font.bold: true
                }
            }
            
            Text {
                Layout.alignment: Qt.AlignHCenter
                text: '"' + checkedUsername + '"'
                color: successGreen
                font.family: "JetBrains Mono"
                font.pixelSize: 20
            }
            
            Text {
                Layout.alignment: Qt.AlignHCenter
                text: "This identity is available!"
                color: textPrimary
                font.family: "Rajdhani"
                font.pixelSize: 16
            }
            
            Text {
                Layout.alignment: Qt.AlignHCenter
                Layout.preferredWidth: parent.width * 0.9
                text: "Proceeding will generate your cryptographic keys and bind this identity to the Demiurge ecosystem."
                color: textSecondary
                font.family: "Rajdhani"
                font.pixelSize: 13
                wrapMode: Text.WordWrap
                horizontalAlignment: Text.AlignHCenter
            }
            
            FlameButton {
                Layout.fillWidth: true
                Layout.preferredHeight: 50
                text: "PROCEED"
                
                onClicked: {
                    signUpState = "creating"
                    AuthManager.createAccount(checkedUsername)
                }
            }
            
            // Change username option
            Text {
                Layout.alignment: Qt.AlignHCenter
                text: "Choose a different name"
                color: textSecondary
                font.family: "Rajdhani"
                font.pixelSize: 12
                
                MouseArea {
                    anchors.fill: parent
                    cursorShape: Qt.PointingHandCursor
                    onClicked: signUpState = "input"
                }
            }
        }
    }
    
    // ==================== CREATING STATE ====================
    Component {
        id: creatingComponent
        
        ColumnLayout {
            spacing: 24
            
            Text {
                Layout.alignment: Qt.AlignHCenter
                text: "FORGING YOUR IDENTITY"
                color: flameOrange
                font.family: "Orbitron"
                font.pixelSize: 18
            }
            
            // Animated flame
            Item {
                Layout.alignment: Qt.AlignHCenter
                Layout.preferredWidth: 80
                Layout.preferredHeight: 80
                
                Rectangle {
                    anchors.centerIn: parent
                    width: 60
                    height: 60
                    radius: 30
                    color: "transparent"
                    
                    SequentialAnimation on scale {
                        loops: Animation.Infinite
                        NumberAnimation { to: 1.2; duration: 500; easing.type: Easing.InOutSine }
                        NumberAnimation { to: 1.0; duration: 500; easing.type: Easing.InOutSine }
                    }
                    
                    Rectangle {
                        anchors.fill: parent
                        radius: parent.radius
                        gradient: Gradient {
                            GradientStop { position: 0.0; color: flameYellow }
                            GradientStop { position: 1.0; color: flameOrange }
                        }
                        opacity: 0.8
                    }
                }
            }
            
            Text {
                Layout.alignment: Qt.AlignHCenter
                text: "Generating cryptographic keys..."
                color: textSecondary
                font.family: "Rajdhani"
                font.pixelSize: 14
                
                SequentialAnimation on opacity {
                    loops: Animation.Infinite
                    NumberAnimation { to: 0.5; duration: 800 }
                    NumberAnimation { to: 1.0; duration: 800 }
                }
            }
        }
    }
    
    // ==================== COMPLETE STATE ====================
    Component {
        id: completeComponent
        
        ColumnLayout {
            spacing: 20
            
            Text {
                Layout.alignment: Qt.AlignHCenter
                text: "IDENTITY FORGED"
                color: successGreen
                font.family: "Orbitron"
                font.pixelSize: 18
            }
            
            Text {
                Layout.alignment: Qt.AlignHCenter
                text: "Welcome, " + checkedUsername
                color: textPrimary
                font.family: "Rajdhani"
                font.pixelSize: 16
            }
            
            // Public Key display
            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: keyColumn.implicitHeight + 24
                color: "#0A0A0A"
                radius: 8
                border.width: 1
                border.color: "#252525"
                
                ColumnLayout {
                    id: keyColumn
                    anchors.fill: parent
                    anchors.margins: 12
                    spacing: 8
                    
                    Text {
                        text: "YOUR PUBLIC KEY"
                        color: textSecondary
                        font.family: "Rajdhani"
                        font.pixelSize: 11
                        font.letterSpacing: 2
                    }
                    
                    Text {
                        Layout.fillWidth: true
                        text: generatedPublicKey || AuthManager.publicKey
                        color: cipherCyan
                        font.family: "JetBrains Mono"
                        font.pixelSize: 11
                        wrapMode: Text.WrapAnywhere
                        
                        MouseArea {
                            anchors.fill: parent
                            cursorShape: Qt.PointingHandCursor
                            onClicked: {
                                // Copy to clipboard
                                AuthManager.copyToClipboard(parent.text)
                            }
                        }
                    }
                    
                    Text {
                        text: "Click to copy"
                        color: textSecondary
                        font.family: "Rajdhani"
                        font.pixelSize: 10
                    }
                }
            }
            
            // Security phrase (if generated)
            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: phraseColumn.implicitHeight + 24
                color: "#0D0808"
                radius: 8
                border.width: 1
                border.color: flameOrange
                visible: (generatedSeedPhrase || AuthManager.seedPhrase).length > 0
                
                ColumnLayout {
                    id: phraseColumn
                    anchors.fill: parent
                    anchors.margins: 12
                    spacing: 8
                    
                    Text {
                        text: "⚠ SAVE THESE WORDS - YOU WILL NEED THEM TO RECOVER YOUR ACCOUNT"
                        color: flameOrange
                        font.family: "Rajdhani"
                        font.pixelSize: 11
                        font.bold: true
                        wrapMode: Text.WordWrap
                    }
                    
                    Text {
                        Layout.fillWidth: true
                        text: generatedSeedPhrase || AuthManager.seedPhrase
                        color: textPrimary
                        font.family: "JetBrains Mono"
                        font.pixelSize: 13
                        wrapMode: Text.WordWrap
                        lineHeight: 1.4
                    }
                }
            }
            
            // Offline notice
            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 40
                color: Qt.rgba(0, 1, 0.78, 0.1)
                radius: 6
                visible: !AuthManager.isOnline
                
                RowLayout {
                    anchors.centerIn: parent
                    spacing: 8
                    
                    Text {
                        text: "⏳"
                        font.pixelSize: 14
                    }
                    
                    Text {
                        text: "Account created locally. Will sync when online."
                        color: cipherCyan
                        font.family: "Rajdhani"
                        font.pixelSize: 12
                    }
                }
            }
            
            FlameButton {
                Layout.fillWidth: true
                Layout.preferredHeight: 50
                text: "ENTER THE ABYSS"
                
                onClicked: {
                    root.signUpSuccess()
                }
            }
        }
    }
    
    // Timer for debounced username check
    Timer {
        id: checkTimer
        interval: 500
        repeat: false
        onTriggered: {
            if (usernameInput && usernameInput.text.length >= 3) {
                // Auto-check availability after typing stops
            }
        }
    }
    
    // Handle AuthManager signals
    Connections {
        target: AuthManager
        
        function onUsernameAvailable(username) {
            if (username === checkedUsername) {
                signUpState = "available"
            }
        }
        
        function onUsernameTaken(username) {
            if (signUpState === "checking") {
                signUpState = "taken"
            }
        }
        
        function onAccountCreated(username, publicKey, seedPhrase) {
            generatedPublicKey = publicKey
            generatedSeedPhrase = seedPhrase
            signUpState = "complete"
        }
        
        function onAccountCreationFailed(error) {
            signUpState = "input"
            // Show error
        }
    }
    
    // Reference for external access
    property alias usernameField: usernameInput
}
