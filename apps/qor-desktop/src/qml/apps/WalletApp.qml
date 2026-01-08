import QtQuick
import QtQuick.Layouts
import QtQuick.Controls

import "../components"

/**
 * WalletApp - Abyss Wallet Application
 * 
 * The native CGT wallet interface for QØЯ desktop.
 * Displays balance, transaction history, and provides
 * send/receive functionality.
 */
Item {
    id: walletApp
    
    // ========================================================================
    // PUBLIC PROPERTIES
    // ========================================================================
    
    /** Connected AbyssID */
    property string abyssId: ""
    
    /** Current CGT balance (in smallest units) */
    property real balance: 0
    
    /** Pending balance */
    property real pendingBalance: 0
    
    /** Staked amount */
    property real stakedAmount: 0
    
    /** Transaction history */
    property var transactions: []
    
    /** Loading state */
    property bool loading: true
    
    // ========================================================================
    // SIGNALS
    // ========================================================================
    
    signal sendRequested(string recipient, real amount)
    signal refreshRequested()
    signal stakeRequested(real amount)
    signal unstakeRequested(real amount)
    
    // ========================================================================
    // MAIN LAYOUT
    // ========================================================================
    
    ColumnLayout {
        anchors.fill: parent
        anchors.margins: Theme.spacingLarge
        spacing: Theme.spacingLarge
        
        // ================================================================
        // BALANCE CARD
        // ================================================================
        
        GlassPanel {
            Layout.fillWidth: true
            Layout.preferredHeight: 180
            depthLevel: 2
            
            ColumnLayout {
                anchors.fill: parent
                anchors.margins: Theme.spacingLarge
                spacing: Theme.spacingMedium
                
                Text {
                    text: "Total Balance"
                    font.family: Theme.fontBody
                    font.pixelSize: Theme.fontSizeSmall
                    color: Theme.textSecondary
                }
                
                RowLayout {
                    spacing: Theme.spacingSmall
                    
                    GlowText {
                        text: formatCGT(balance)
                        fontFamily: Theme.fontHeader
                        fontSize: Theme.fontSizeHuge
                        fontWeight: Font.Bold
                        glowing: true
                        glowColor: Theme.accentFlame
                    }
                    
                    Text {
                        text: "CGT"
                        font.family: Theme.fontHeader
                        font.pixelSize: Theme.fontSizeH2
                        color: Theme.textSecondary
                        Layout.alignment: Qt.AlignBottom
                        Layout.bottomMargin: 8
                    }
                }
                
                RowLayout {
                    spacing: Theme.spacingLarge
                    
                    // Staked
                    ColumnLayout {
                        spacing: 2
                        
                        Text {
                            text: "Staked"
                            font.family: Theme.fontBody
                            font.pixelSize: Theme.fontSizeTiny
                            color: Theme.textMuted
                        }
                        
                        Text {
                            text: formatCGT(stakedAmount) + " CGT"
                            font.family: Theme.fontCode
                            font.pixelSize: Theme.fontSizeSmall
                            color: Theme.cipherCyan
                        }
                    }
                    
                    // Pending
                    ColumnLayout {
                        spacing: 2
                        
                        Text {
                            text: "Pending"
                            font.family: Theme.fontBody
                            font.pixelSize: Theme.fontSizeTiny
                            color: Theme.textMuted
                        }
                        
                        Text {
                            text: formatCGT(pendingBalance) + " CGT"
                            font.family: Theme.fontCode
                            font.pixelSize: Theme.fontSizeSmall
                            color: Theme.warning
                        }
                    }
                }
                
                Item { Layout.fillHeight: true }
            }
        }
        
        // ================================================================
        // ACTION BUTTONS
        // ================================================================
        
        RowLayout {
            Layout.fillWidth: true
            spacing: Theme.spacingMedium
            
            FlameButton {
                Layout.fillWidth: true
                text: "Send"
                primary: true
                iconSource: ""
                
                onClicked: sendDialog.open()
            }
            
            FlameButton {
                Layout.fillWidth: true
                text: "Receive"
                
                onClicked: receiveDialog.open()
            }
            
            FlameButton {
                Layout.fillWidth: true
                text: "Stake"
                
                onClicked: stakeDialog.open()
            }
        }
        
        // ================================================================
        // TRANSACTION HISTORY
        // ================================================================
        
        GlassPanel {
            Layout.fillWidth: true
            Layout.fillHeight: true
            depthLevel: 2
            
            ColumnLayout {
                anchors.fill: parent
                anchors.margins: Theme.spacingMedium
                spacing: Theme.spacingMedium
                
                RowLayout {
                    Layout.fillWidth: true
                    
                    Text {
                        text: "Recent Transactions"
                        font.family: Theme.fontBody
                        font.pixelSize: Theme.fontSizeBody
                        font.weight: Font.Medium
                        color: Theme.textPrimary
                    }
                    
                    Item { Layout.fillWidth: true }
                    
                    FlameButton {
                        text: "Refresh"
                        implicitHeight: 32
                        implicitWidth: 80
                        
                        onClicked: refreshRequested()
                    }
                }
                
                // Transaction list
                ListView {
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    clip: true
                    spacing: Theme.spacingSmall
                    
                    model: transactions
                    
                    delegate: Rectangle {
                        width: ListView.view.width
                        height: 60
                        radius: Theme.radiusSmall
                        color: mouseArea.containsMouse ? Theme.glassPanelWindow : "transparent"
                        
                        RowLayout {
                            anchors.fill: parent
                            anchors.margins: Theme.spacingSmall
                            spacing: Theme.spacingMedium
                            
                            // Direction indicator
                            Rectangle {
                                width: 40
                                height: 40
                                radius: 20
                                color: modelData.type === "receive" ? 
                                       Qt.rgba(Theme.success.r, Theme.success.g, Theme.success.b, 0.2) :
                                       Qt.rgba(Theme.error.r, Theme.error.g, Theme.error.b, 0.2)
                                
                                Text {
                                    anchors.centerIn: parent
                                    text: modelData.type === "receive" ? "↓" : "↑"
                                    font.pixelSize: 20
                                    color: modelData.type === "receive" ? Theme.success : Theme.error
                                }
                            }
                            
                            // Details
                            ColumnLayout {
                                Layout.fillWidth: true
                                spacing: 2
                                
                                Text {
                                    text: modelData.type === "receive" ? "Received" : "Sent"
                                    font.family: Theme.fontBody
                                    font.pixelSize: Theme.fontSizeSmall
                                    font.weight: Font.Medium
                                    color: Theme.textPrimary
                                }
                                
                                Text {
                                    text: modelData.address ? truncateAddress(modelData.address) : "Unknown"
                                    font.family: Theme.fontCode
                                    font.pixelSize: Theme.fontSizeTiny
                                    color: Theme.textSecondary
                                }
                            }
                            
                            // Amount
                            ColumnLayout {
                                spacing: 2
                                
                                Text {
                                    text: (modelData.type === "receive" ? "+" : "-") + formatCGT(modelData.amount) + " CGT"
                                    font.family: Theme.fontCode
                                    font.pixelSize: Theme.fontSizeSmall
                                    font.weight: Font.Medium
                                    color: modelData.type === "receive" ? Theme.success : Theme.error
                                    Layout.alignment: Qt.AlignRight
                                }
                                
                                Text {
                                    text: modelData.timestamp ? formatTimestamp(modelData.timestamp) : ""
                                    font.family: Theme.fontBody
                                    font.pixelSize: Theme.fontSizeTiny
                                    color: Theme.textMuted
                                    Layout.alignment: Qt.AlignRight
                                }
                            }
                        }
                        
                        MouseArea {
                            id: mouseArea
                            anchors.fill: parent
                            hoverEnabled: true
                        }
                    }
                    
                    // Empty state
                    Text {
                        anchors.centerIn: parent
                        text: loading ? "Loading..." : "No transactions yet"
                        font.family: Theme.fontBody
                        font.pixelSize: Theme.fontSizeBody
                        color: Theme.textMuted
                        visible: transactions.length === 0
                    }
                }
            }
        }
    }
    
    // ========================================================================
    // DIALOGS
    // ========================================================================
    
    // Send Dialog
    Popup {
        id: sendDialog
        anchors.centerIn: parent
        width: 400
        height: 300
        modal: true
        
        background: GlassPanel {
            depthLevel: 3
        }
        
        ColumnLayout {
            anchors.fill: parent
            anchors.margins: Theme.spacingLarge
            spacing: Theme.spacingMedium
            
            Text {
                text: "Send CGT"
                font.family: Theme.fontHeader
                font.pixelSize: Theme.fontSizeH3
                color: Theme.textPrimary
            }
            
            // Recipient
            ColumnLayout {
                Layout.fillWidth: true
                spacing: Theme.spacingTiny
                
                Text {
                    text: "Recipient Address"
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
                    border.color: recipientInput.activeFocus ? Theme.accentFlame : Theme.panelBorder
                    
                    TextInput {
                        id: recipientInput
                        anchors.fill: parent
                        anchors.margins: Theme.spacingSmall
                        font.family: Theme.fontCode
                        font.pixelSize: Theme.fontSizeSmall
                        color: Theme.textPrimary
                        clip: true
                    }
                }
            }
            
            // Amount
            ColumnLayout {
                Layout.fillWidth: true
                spacing: Theme.spacingTiny
                
                Text {
                    text: "Amount (CGT)"
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
                    border.color: amountInput.activeFocus ? Theme.accentFlame : Theme.panelBorder
                    
                    TextInput {
                        id: amountInput
                        anchors.fill: parent
                        anchors.margins: Theme.spacingSmall
                        font.family: Theme.fontCode
                        font.pixelSize: Theme.fontSizeSmall
                        color: Theme.textPrimary
                        clip: true
                        inputMethodHints: Qt.ImhFormattedNumbersOnly
                    }
                }
            }
            
            Item { Layout.fillHeight: true }
            
            RowLayout {
                Layout.fillWidth: true
                spacing: Theme.spacingSmall
                
                FlameButton {
                    Layout.fillWidth: true
                    text: "Cancel"
                    onClicked: sendDialog.close()
                }
                
                FlameButton {
                    Layout.fillWidth: true
                    text: "Send"
                    primary: true
                    enabled: recipientInput.text.length > 0 && amountInput.text.length > 0
                    
                    onClicked: {
                        sendRequested(recipientInput.text, parseFloat(amountInput.text))
                        sendDialog.close()
                    }
                }
            }
        }
    }
    
    // Receive Dialog
    Popup {
        id: receiveDialog
        anchors.centerIn: parent
        width: 400
        height: 280
        modal: true
        
        background: GlassPanel {
            depthLevel: 3
        }
        
        ColumnLayout {
            anchors.fill: parent
            anchors.margins: Theme.spacingLarge
            spacing: Theme.spacingMedium
            
            Text {
                text: "Receive CGT"
                font.family: Theme.fontHeader
                font.pixelSize: Theme.fontSizeH3
                color: Theme.textPrimary
            }
            
            Text {
                text: "Your Address"
                font.family: Theme.fontBody
                font.pixelSize: Theme.fontSizeLabel
                color: Theme.textSecondary
            }
            
            Rectangle {
                Layout.fillWidth: true
                height: 60
                color: Theme.glassPanelDock
                radius: Theme.radiusSmall
                
                Text {
                    anchors.centerIn: parent
                    text: abyssId || "Not connected"
                    font.family: Theme.fontCode
                    font.pixelSize: Theme.fontSizeSmall
                    color: Theme.textPrimary
                }
            }
            
            Item { Layout.fillHeight: true }
            
            FlameButton {
                Layout.fillWidth: true
                text: "Copy Address"
                primary: true
                
                onClicked: {
                    // Would copy to clipboard
                    receiveDialog.close()
                }
            }
        }
    }
    
    // Stake Dialog
    Popup {
        id: stakeDialog
        anchors.centerIn: parent
        width: 400
        height: 280
        modal: true
        
        background: GlassPanel {
            depthLevel: 3
        }
        
        ColumnLayout {
            anchors.fill: parent
            anchors.margins: Theme.spacingLarge
            spacing: Theme.spacingMedium
            
            Text {
                text: "Stake CGT"
                font.family: Theme.fontHeader
                font.pixelSize: Theme.fontSizeH3
                color: Theme.textPrimary
            }
            
            Text {
                text: "Earn 5% APY by staking your CGT"
                font.family: Theme.fontBody
                font.pixelSize: Theme.fontSizeSmall
                color: Theme.textSecondary
            }
            
            // Stake Amount
            ColumnLayout {
                Layout.fillWidth: true
                spacing: Theme.spacingTiny
                
                Text {
                    text: "Amount to Stake (CGT)"
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
                    border.color: stakeAmountInput.activeFocus ? Theme.accentFlame : Theme.panelBorder
                    
                    TextInput {
                        id: stakeAmountInput
                        anchors.fill: parent
                        anchors.margins: Theme.spacingSmall
                        font.family: Theme.fontCode
                        font.pixelSize: Theme.fontSizeSmall
                        color: Theme.textPrimary
                        clip: true
                        inputMethodHints: Qt.ImhFormattedNumbersOnly
                    }
                }
            }
            
            Item { Layout.fillHeight: true }
            
            RowLayout {
                Layout.fillWidth: true
                spacing: Theme.spacingSmall
                
                FlameButton {
                    Layout.fillWidth: true
                    text: "Cancel"
                    onClicked: stakeDialog.close()
                }
                
                FlameButton {
                    Layout.fillWidth: true
                    text: "Stake"
                    primary: true
                    enabled: stakeAmountInput.text.length > 0
                    
                    onClicked: {
                        stakeRequested(parseFloat(stakeAmountInput.text))
                        stakeDialog.close()
                    }
                }
            }
        }
    }
    
    // ========================================================================
    // HELPER FUNCTIONS
    // ========================================================================
    
    function formatCGT(amount) {
        // Convert from smallest units (10^-8) to CGT
        var cgt = amount / 100000000
        return cgt.toLocaleString(Qt.locale(), 'f', 2)
    }
    
    function truncateAddress(address) {
        if (address.length <= 16) return address
        return address.substring(0, 8) + "..." + address.substring(address.length - 8)
    }
    
    function formatTimestamp(ts) {
        var date = new Date(ts * 1000)
        return date.toLocaleDateString() + " " + date.toLocaleTimeString()
    }
    
    // ========================================================================
    // INITIALIZATION
    // ========================================================================
    
    Component.onCompleted: {
        // Simulate loading
        loadingTimer.start()
    }
    
    Timer {
        id: loadingTimer
        interval: 1000
        onTriggered: {
            loading = false
            // Demo data
            balance = 15420_50000000  // 15,420.50 CGT
            stakedAmount = 5000_00000000  // 5,000 CGT
            pendingBalance = 0
            transactions = [
                { type: "receive", amount: 1000_00000000, address: "0x1234567890abcdef1234567890abcdef12345678", timestamp: Date.now() / 1000 - 3600 },
                { type: "send", amount: 250_00000000, address: "0xabcdef1234567890abcdef1234567890abcdef12", timestamp: Date.now() / 1000 - 86400 },
                { type: "receive", amount: 5000_00000000, address: "0x9876543210fedcba9876543210fedcba98765432", timestamp: Date.now() / 1000 - 172800 }
            ]
        }
    }
}
