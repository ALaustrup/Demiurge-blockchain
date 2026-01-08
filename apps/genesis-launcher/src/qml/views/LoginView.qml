/**
 * LoginView.qml - AbyssID Authentication
 */
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Effects

import "../components"

Item {
    id: root
    
    signal loginSuccess()
    
    // Theme colors (inherit from parent)
    readonly property color textPrimary: "#E0E0E0"
    readonly property color textSecondary: "#7A7A7A"
    readonly property color flameOrange: "#FF3D00"
    readonly property color glassColor: "#0A0A0A"
    
    ColumnLayout {
        anchors.centerIn: parent
        spacing: 30
        width: 360
        
        // Logo / Title
        Item {
            Layout.alignment: Qt.AlignHCenter
            Layout.preferredWidth: 200
            Layout.preferredHeight: 100
            
            // Genesis logo
            Text {
                anchors.centerIn: parent
                text: "GENESIS"
                font.family: "Orbitron"
                font.pixelSize: 36
                font.weight: Font.Bold
                color: textPrimary
                
                // Glow effect
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
        
        // Subtitle
        Text {
            Layout.alignment: Qt.AlignHCenter
            text: "Enter your AbyssID credentials"
            color: textSecondary
            font.family: "Rajdhani"
            font.pixelSize: 14
        }
        
        // Username field
        GlassTextField {
            id: usernameField
            Layout.fillWidth: true
            placeholderText: "Username"
            
            onAccepted: passwordField.forceActiveFocus()
        }
        
        // Password field
        GlassTextField {
            id: passwordField
            Layout.fillWidth: true
            placeholderText: "Password"
            echoMode: TextInput.Password
            
            onAccepted: loginButton.clicked()
        }
        
        // Error message
        Text {
            Layout.fillWidth: true
            text: AuthManager.errorMessage
            color: "#FF4444"
            font.pixelSize: 12
            visible: AuthManager.errorMessage.length > 0
            horizontalAlignment: Text.AlignHCenter
        }
        
        // Remember me checkbox
        GlassCheckBox {
            Layout.alignment: Qt.AlignHCenter
            text: "Remember me"
            checked: true
        }
        
        // Login button
        FlameButton {
            id: loginButton
            Layout.fillWidth: true
            Layout.preferredHeight: 50
            text: AuthManager.isLoading ? "AUTHENTICATING..." : "AUTHENTICATE"
            enabled: !AuthManager.isLoading && 
                     usernameField.text.length > 0 && 
                     passwordField.text.length > 0
            
            onClicked: {
                AuthManager.login(usernameField.text, passwordField.text)
            }
        }
        
        // Divider
        Rectangle {
            Layout.fillWidth: true
            height: 1
            color: Qt.rgba(1, 1, 1, 0.1)
        }
        
        // Offline mode option
        Text {
            Layout.alignment: Qt.AlignHCenter
            text: "Continue Offline"
            color: textSecondary
            font.family: "Rajdhani"
            font.pixelSize: 12
            
            MouseArea {
                anchors.fill: parent
                cursorShape: Qt.PointingHandCursor
                onClicked: {
                    // Try auto-login with saved session
                    if (AuthManager.tryAutoLogin()) {
                        root.loginSuccess()
                    }
                }
            }
        }
    }
    
    // Listen for successful authentication
    Connections {
        target: AuthManager
        function onAuthenticated(sessionId) {
            root.loginSuccess()
        }
    }
    
    // Auto-login on load if session exists
    Component.onCompleted: {
        if (AuthManager.hasSavedSession()) {
            if (AuthManager.tryAutoLogin()) {
                root.loginSuccess()
            }
        }
        usernameField.forceActiveFocus()
    }
}
