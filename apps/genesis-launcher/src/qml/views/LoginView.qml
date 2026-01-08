/**
 * LoginView.qml - AbyssID Authentication
 * 
 * Login screen with option to create new accounts.
 * Supports offline login only for previously authenticated users.
 */
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Effects

import "../components"

Item {
    id: root
    
    signal loginSuccess()
    signal createAccount()
    
    // Theme colors
    readonly property color textPrimary: "#E0E0E0"
    readonly property color textSecondary: "#7A7A7A"
    readonly property color flameOrange: "#FF3D00"
    readonly property color cipherCyan: "#00FFC8"
    readonly property color glassColor: "#0A0A0A"
    
    ColumnLayout {
        anchors.centerIn: parent
        spacing: 24
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
        
        // Connection status indicator
        Rectangle {
            Layout.alignment: Qt.AlignHCenter
            Layout.preferredWidth: statusRow.implicitWidth + 20
            Layout.preferredHeight: 28
            radius: 14
            color: AuthManager.isOnline ? Qt.rgba(0, 1, 0.53, 0.15) : Qt.rgba(1, 0.3, 0.3, 0.15)
            border.width: 1
            border.color: AuthManager.isOnline ? cipherCyan : "#FF6666"
            
            RowLayout {
                id: statusRow
                anchors.centerIn: parent
                spacing: 6
                
                Rectangle {
                    width: 8
                    height: 8
                    radius: 4
                    color: AuthManager.isOnline ? cipherCyan : "#FF6666"
                    
                    SequentialAnimation on opacity {
                        loops: Animation.Infinite
                        running: !AuthManager.isOnline
                        NumberAnimation { to: 0.4; duration: 800 }
                        NumberAnimation { to: 1.0; duration: 800 }
                    }
                }
                
                Text {
                    text: AuthManager.isOnline ? "Connected" : "Offline"
                    color: AuthManager.isOnline ? cipherCyan : "#FF6666"
                    font.family: "Rajdhani"
                    font.pixelSize: 12
                }
            }
        }
        
        // Subtitle
        Text {
            Layout.alignment: Qt.AlignHCenter
            text: "Sign in with your AbyssID"
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
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: errorText.implicitHeight + 16
            color: Qt.rgba(1, 0.27, 0.27, 0.1)
            radius: 6
            border.width: 1
            border.color: Qt.rgba(1, 0.27, 0.27, 0.3)
            visible: AuthManager.errorMessage.length > 0
            
            Text {
                id: errorText
                anchors.centerIn: parent
                width: parent.width - 20
                text: AuthManager.errorMessage
                color: "#FF4444"
                font.family: "Rajdhani"
                font.pixelSize: 12
                wrapMode: Text.WordWrap
                horizontalAlignment: Text.AlignHCenter
            }
        }
        
        // Remember me checkbox
        GlassCheckBox {
            id: rememberCheckbox
            Layout.alignment: Qt.AlignHCenter
            text: "Remember me"
            checked: true
        }
        
        // Login button
        FlameButton {
            id: loginButton
            Layout.fillWidth: true
            Layout.preferredHeight: 50
            text: AuthManager.isLoading ? "AUTHENTICATING..." : "SIGN IN"
            enabled: !AuthManager.isLoading && 
                     usernameField.text.length > 0 && 
                     passwordField.text.length > 0
            
            onClicked: {
                AuthManager.login(usernameField.text, passwordField.text)
            }
        }
        
        // Divider with "or"
        RowLayout {
            Layout.fillWidth: true
            spacing: 12
            
            Rectangle {
                Layout.fillWidth: true
                height: 1
                color: Qt.rgba(1, 1, 1, 0.1)
            }
            
            Text {
                text: "or"
                color: textSecondary
                font.family: "Rajdhani"
                font.pixelSize: 12
            }
            
            Rectangle {
                Layout.fillWidth: true
                height: 1
                color: Qt.rgba(1, 1, 1, 0.1)
            }
        }
        
        // Create Account button
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: 48
            color: "transparent"
            radius: 8
            border.width: 1
            border.color: cipherCyan
            
            Text {
                anchors.centerIn: parent
                text: "CREATE NEW ABYSSID"
                color: cipherCyan
                font.family: "Orbitron"
                font.pixelSize: 13
                font.weight: Font.Medium
            }
            
            MouseArea {
                anchors.fill: parent
                cursorShape: Qt.PointingHandCursor
                hoverEnabled: true
                
                onEntered: parent.color = Qt.rgba(0, 1, 0.78, 0.1)
                onExited: parent.color = "transparent"
                onClicked: root.createAccount()
            }
        }
        
        // Continue offline (only if has saved session)
        Text {
            Layout.alignment: Qt.AlignHCenter
            text: "Continue with saved session"
            color: textSecondary
            font.family: "Rajdhani"
            font.pixelSize: 12
            visible: AuthManager.hasSavedSession() && !AuthManager.isOnline
            
            MouseArea {
                anchors.fill: parent
                cursorShape: Qt.PointingHandCursor
                hoverEnabled: true
                onEntered: parent.color = textPrimary
                onExited: parent.color = textSecondary
                onClicked: {
                    if (AuthManager.tryAutoLogin()) {
                        root.loginSuccess()
                    }
                }
            }
        }
        
        // Pending sync notice
        Rectangle {
            Layout.fillWidth: true
            Layout.preferredHeight: 36
            color: Qt.rgba(1, 0.57, 0, 0.1)
            radius: 6
            visible: AuthManager.hasPendingSync
            
            RowLayout {
                anchors.centerIn: parent
                spacing: 8
                
                Text {
                    text: "⏳"
                    font.pixelSize: 14
                }
                
                Text {
                    text: "Account pending sync - will complete when online"
                    color: flameOrange
                    font.family: "Rajdhani"
                    font.pixelSize: 11
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
    
    // Auto-login on load if session exists and online
    Component.onCompleted: {
        // Check connectivity first
        AuthManager.checkConnectivity()
        
        // Try auto-login after a brief delay
        Qt.callLater(function() {
            if (AuthManager.hasSavedSession()) {
                if (AuthManager.tryAutoLogin()) {
                    root.loginSuccess()
                }
            }
        })
        
        usernameField.forceActiveFocus()
    }
}
