import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

import "components"

/**
 * LoginView - QorID Authentication
 * 
 * A centered glass-morphic login modal for QorID authentication.
 * Supports both new identity creation and existing identity import.
 */
Item {
    id: loginView
    
    // ========================================================================
    // SIGNALS
    // ========================================================================
    
    signal loginSuccess(string abyssId, int tier)
    
    // ========================================================================
    // STATE
    // ========================================================================
    
    property bool isCreating: false
    property bool isLoading: false
    property string errorMessage: ""
    
    // Username availability states
    property bool checkingUsername: false
    property bool usernameAvailable: true
    property bool networkConnected: true
    property string usernameCheckStatus: "idle" // idle, checking, available, taken, offline
    
    // ========================================================================
    // BACKGROUND OVERLAY
    // ========================================================================
    
    Rectangle {
        anchors.fill: parent
        color: Qt.rgba(Theme.voidBlack.r, Theme.voidBlack.g, Theme.voidBlack.b, 0.7)
    }
    
    // ========================================================================
    // LOGIN PANEL
    // ========================================================================
    
    GlassPanel {
        id: loginPanel
        anchors.centerIn: parent
        width: 420
        height: isCreating ? 500 : 400
        depthLevel: 3
        showBorder: true
        
        Behavior on height {
            NumberAnimation { duration: Theme.animNormal; easing.type: Easing.OutQuad }
        }
        
        ColumnLayout {
            anchors.fill: parent
            anchors.margins: Theme.spacingLarge
            spacing: Theme.spacingLarge
            
            // ================================================================
            // HEADER
            // ================================================================
            
            ColumnLayout {
                Layout.fillWidth: true
                spacing: Theme.spacingSmall
                
                GlowText {
                    text: "QØЯ"
                    fontFamily: Theme.fontHeader
                    fontSize: Theme.fontSizeH1
                    glowing: true
                    Layout.alignment: Qt.AlignHCenter
                }
                
                Text {
                    text: isCreating ? "Create Your QorID" : "Enter the Abyss"
                    font.family: Theme.fontAncient
                    font.pixelSize: Theme.fontSizeBody
                    color: Theme.textSecondary
                    Layout.alignment: Qt.AlignHCenter
                }
            }
            
            // ================================================================
            // INPUT FIELDS
            // ================================================================
            
            ColumnLayout {
                Layout.fillWidth: true
                spacing: Theme.spacingMedium
                
                // Username field
                ColumnLayout {
                    Layout.fillWidth: true
                    spacing: Theme.spacingTiny
                    
                    Text {
                        text: "QorID"
                        font.family: Theme.fontBody
                        font.pixelSize: Theme.fontSizeLabel
                        color: Theme.textSecondary
                    }
                    
                    Rectangle {
                        Layout.fillWidth: true
                        height: 44
                        color: Theme.glassPanelDock
                        radius: Theme.radiusSmall
                        border.width: 1
                        border.color: usernameInput.activeFocus ? Theme.accentFlame : Theme.panelBorder
                        
                        RowLayout {
                            anchors.fill: parent
                            anchors.margins: Theme.spacingSmall
                            spacing: Theme.spacingSmall
                            
                            TextInput {
                                id: usernameInput
                                Layout.fillWidth: true
                                font.family: Theme.fontCode
                                font.pixelSize: Theme.fontSizeBody
                                color: Theme.textPrimary
                                selectionColor: Theme.accentFlame
                                clip: true
                                
                                Text {
                                    anchors.fill: parent
                                    text: "your-qor-id"
                                    font: parent.font
                                    color: Theme.textMuted
                                    visible: !parent.text && !parent.activeFocus
                                }
                                
                                // Trigger availability check on text change (during signup)
                                onTextChanged: {
                                    if (isCreating && text.length > 2) {
                                        usernameCheckTimer.restart()
                                    } else {
                                        usernameCheckStatus = "idle"
                                    }
                                }
                            }
                            
                            // Real-time availability indicator
                            Rectangle {
                                width: 12
                                height: 12
                                radius: 6
                                visible: isCreating && usernameInput.text.length > 2
                                
                                color: {
                                    switch(usernameCheckStatus) {
                                        case "checking": return Theme.textMuted
                                        case "available": return "#00FF88"  // Green
                                        case "taken": return "#FF3D00"      // Red
                                        case "offline": return "#FFC107"    // Yellow
                                        default: return "transparent"
                                    }
                                }
                                
                                // Pulse animation when checking
                                SequentialAnimation on opacity {
                                    running: usernameCheckStatus === "checking"
                                    loops: Animation.Infinite
                                    NumberAnimation { from: 1.0; to: 0.3; duration: 500 }
                                    NumberAnimation { from: 0.3; to: 1.0; duration: 500 }
                                }
                            }
                        }
                    }
                }
                
                // Password field
                ColumnLayout {
                    Layout.fillWidth: true
                    spacing: Theme.spacingTiny
                    
                    Text {
                        text: "Secret Phrase"
                        font.family: Theme.fontBody
                        font.pixelSize: Theme.fontSizeLabel
                        color: Theme.textSecondary
                    }
                    
                    Rectangle {
                        Layout.fillWidth: true
                        height: 44
                        color: Theme.glassPanelDock
                        radius: Theme.radiusSmall
                        border.width: 1
                        border.color: passwordInput.activeFocus ? Theme.accentFlame : Theme.panelBorder
                        
                        TextInput {
                            id: passwordInput
                            anchors.fill: parent
                            anchors.margins: Theme.spacingSmall
                            font.family: Theme.fontCode
                            font.pixelSize: Theme.fontSizeBody
                            color: Theme.textPrimary
                            echoMode: TextInput.Password
                            selectionColor: Theme.accentFlame
                            clip: true
                            
                            Text {
                                anchors.fill: parent
                                text: "Enter your secret phrase"
                                font: parent.font
                                color: Theme.textMuted
                                visible: !parent.text && !parent.activeFocus
                            }
                        }
                    }
                }
                
                // Confirm password (create mode only)
                ColumnLayout {
                    Layout.fillWidth: true
                    spacing: Theme.spacingTiny
                    visible: isCreating
                    
                    Text {
                        text: "Confirm Phrase"
                        font.family: Theme.fontBody
                        font.pixelSize: Theme.fontSizeLabel
                        color: Theme.textSecondary
                    }
                    
                    Rectangle {
                        Layout.fillWidth: true
                        height: 44
                        color: Theme.glassPanelDock
                        radius: Theme.radiusSmall
                        border.width: 1
                        border.color: confirmInput.activeFocus ? Theme.accentFlame : Theme.panelBorder
                        
                        TextInput {
                            id: confirmInput
                            anchors.fill: parent
                            anchors.margins: Theme.spacingSmall
                            font.family: Theme.fontCode
                            font.pixelSize: Theme.fontSizeBody
                            color: Theme.textPrimary
                            echoMode: TextInput.Password
                            selectionColor: Theme.accentFlame
                            clip: true
                        }
                    }
                }
            }
            
            // ================================================================
            // ERROR MESSAGE
            // ================================================================
            
            Text {
                text: errorMessage
                font.family: Theme.fontBody
                font.pixelSize: Theme.fontSizeSmall
                color: Theme.error
                visible: errorMessage !== ""
                Layout.alignment: Qt.AlignHCenter
            }
            
            // ================================================================
            // BUTTONS
            // ================================================================
            
            ColumnLayout {
                Layout.fillWidth: true
                spacing: Theme.spacingSmall
                
                FlameButton {
                    Layout.fillWidth: true
                    text: isCreating ? "Create Identity" : "Authenticate"
                    primary: true
                    enabled: !isLoading && usernameInput.text.length > 0 && passwordInput.text.length > 0
                    
                    onClicked: {
                        if (isCreating && passwordInput.text !== confirmInput.text) {
                            errorMessage = "Phrases do not match"
                            return
                        }
                        
                        isLoading = true
                        errorMessage = ""
                        
                        // Call actual QorIDManager authentication
                        if (isCreating) {
                            console.log("Calling QorIDManager.registerAccount:", usernameInput.text)
                            QorIDManager.registerAccount(usernameInput.text, passwordInput.text)
                        } else {
                            console.log("Calling QorIDManager.loginWithCredentials:", usernameInput.text)
                            QorIDManager.loginWithCredentials(usernameInput.text, passwordInput.text)
                        }
                    }
                }
                
                FlameButton {
                    Layout.fillWidth: true
                    text: isCreating ? "Back to Login" : "Create New Identity"
                    
                    onClicked: {
                        isCreating = !isCreating
                        errorMessage = ""
                    }
                }
            }
            
            // Spacer
            Item { Layout.fillHeight: true }
            
            // ================================================================
            // FOOTER
            // ================================================================
            
            Text {
                text: "QØЯ v1.0.0 • Demiurge Blockchain"
                font.family: Theme.fontBody
                font.pixelSize: Theme.fontSizeTiny
                color: Theme.textMuted
                Layout.alignment: Qt.AlignHCenter
            }
        }
    }
    
    // ========================================================================
    // LOADING OVERLAY
    // ========================================================================
    
    Rectangle {
        anchors.fill: loginPanel
        radius: loginPanel.radius
        color: Qt.rgba(Theme.voidBlack.r, Theme.voidBlack.g, Theme.voidBlack.b, 0.8)
        visible: isLoading
        
        ColumnLayout {
            anchors.centerIn: parent
            spacing: Theme.spacingMedium
            
            // Simple loading spinner
            Rectangle {
                width: 40
                height: 40
                radius: 20
                color: "transparent"
                border.width: 3
                border.color: Theme.accentFlame
                Layout.alignment: Qt.AlignHCenter
                
                RotationAnimation on rotation {
                    from: 0
                    to: 360
                    duration: 1000
                    loops: Animation.Infinite
                    running: isLoading
                }
                
                // Gap in the spinner
                Rectangle {
                    width: 10
                    height: 10
                    radius: 5
                    color: Theme.voidBlack
                    anchors.top: parent.top
                    anchors.horizontalCenter: parent.horizontalCenter
                    anchors.topMargin: -2
                }
            }
            
            Text {
                text: "Authenticating..."
                font.family: Theme.fontBody
                font.pixelSize: Theme.fontSizeSmall
                color: Theme.textSecondary
                Layout.alignment: Qt.AlignHCenter
            }
        }
    }
    
    // ========================================================================
    // QORIDMANAGER SIGNAL CONNECTIONS
    // ========================================================================
    
    Connections {
        target: QorIDManager
        
        function onRegistrationSuccess() {
            console.log("Registration successful!")
            isLoading = false
            errorMessage = ""
            loginSuccess(usernameInput.text, 1)  // Success with tier 1
        }
        
        function onRegistrationFailed(error) {
            console.log("Registration failed:", error)
            isLoading = false
            // Friendly error message for username already taken
            if (error.includes("USERNAME_TAKEN") || error.includes("already taken")) {
                errorMessage = "Uh-oh, looks like that username is already taken. Try something else."
            } else {
                errorMessage = error
            }
        }
        
        function onUsernameAvailable(available) {
            console.log("Username availability check:", available)
            checkingUsername = false
            usernameAvailable = available
            
            if (available) {
                usernameCheckStatus = "available"
            } else {
                usernameCheckStatus = "taken"
            }
        }
        
        function onLoginSuccess() {
            console.log("Login successful!")
            isLoading = false
            errorMessage = ""
            loginSuccess(usernameInput.text, 1)
        }
        
        function onLoginFailed(error) {
            console.log("Login failed:", error)
            isLoading = false
            errorMessage = error
        }
    }
    
    // ========================================================================
    // USERNAME AVAILABILITY CHECKER
    // ========================================================================
    
    Timer {
        id: usernameCheckTimer
        interval: 500  // Wait 500ms after user stops typing
        onTriggered: {
            if (isCreating && usernameInput.text.length > 2) {
                console.log("Checking username availability:", usernameInput.text)
                checkingUsername = true
                usernameCheckStatus = "checking"
                
                // Check network connectivity first
                QorIDManager.checkUsernameAvailability(usernameInput.text)
            }
        }
    }
    
    // ========================================================================
    // AUTH SIMULATION (fallback timer - not used when QorIDManager is available)
    // ========================================================================
    
    Timer {
        id: authTimer
        interval: 1500
        onTriggered: {
            isLoading = false
            // Simulate successful login
            loginSuccess(usernameInput.text, 0)
        }
    }
}
