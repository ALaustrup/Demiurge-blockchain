// WalletWidget.qml - CGT Wallet Interface
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

BaseWidget {
    id: widget
    
    widgetName: "Wallet"
    widgetIcon: "💰"
    
    width: 450
    height: 500
    
    content: Item {
        anchors.fill: parent
        
        Column {
            anchors.fill: parent
            spacing: Theme.spacingMedium
            
            // ============================================
            // BALANCE DISPLAY
            // ============================================
            
            Rectangle {
                width: parent.width
                height: 120
                radius: Theme.borderRadiusMedium
                
                gradient: Gradient {
                    GradientStop { position: 0.0; color: Qt.rgba(0.1, 0.1, 0.1, 0.8) }
                    GradientStop { position: 1.0; color: Qt.rgba(0.05, 0.05, 0.05, 0.9) }
                }
                
                border.width: 2
                border.color: Theme.primaryAccent
                
                Column {
                    anchors.centerIn: parent
                    spacing: Theme.spacingSmall
                    
                    Text {
                        anchors.horizontalCenter: parent.horizontalCenter
                        text: "CGT Balance"
                        font.family: Theme.fontFamily
                        font.pixelSize: Theme.fontSizeSmall
                        color: Theme.textSecondary
                    }
                    
                    Text {
                        anchors.horizontalCenter: parent.horizontalCenter
                        text: "1,234.56"
                        font.family: Theme.fontFamilyDisplay
                        font.pixelSize: 36
                        font.weight: Font.Bold
                        color: Theme.primaryAccent
                        
                        // Glow effect
                        layer.enabled: true
                        layer.effect: MultiEffect {
                            blurEnabled: true
                            blur: 0.4
                            blurMax: 10
                        }
                    }
                    
                    Text {
                        anchors.horizontalCenter: parent.horizontalCenter
                        text: "≈ $12,345.60 USD"
                        font.family: Theme.fontFamily
                        font.pixelSize: Theme.fontSizeSmall
                        color: Theme.textMuted
                    }
                }
                
                // Refresh button
                Rectangle {
                    anchors {
                        top: parent.top
                        right: parent.right
                        margins: Theme.spacingSmall
                    }
                    width: 28
                    height: 28
                    radius: 14
                    color: refreshArea.containsMouse ? Qt.rgba(0.3, 0.3, 0.3, 0.8) : "transparent"
                    
                    Text {
                        anchors.centerIn: parent
                        text: "🔄"
                        font.pixelSize: 14
                    }
                    
                    MouseArea {
                        id: refreshArea
                        anchors.fill: parent
                        hoverEnabled: true
                        onClicked: {
                            console.log("Refreshing wallet balance...")
                            // TODO: Integrate with WalletManager.refresh()
                        }
                    }
                }
            }
            
            // ============================================
            // QUICK ACTIONS
            // ============================================
            
            Row {
                width: parent.width
                spacing: Theme.spacingMedium
                
                Button {
                    width: (parent.width - Theme.spacingMedium) / 2
                    height: 50
                    
                    background: Rectangle {
                        radius: Theme.borderRadiusMedium
                        color: parent.hovered ? Qt.rgba(0.2, 0.2, 0.2, 0.9) : Qt.rgba(0.15, 0.15, 0.15, 0.8)
                        border.width: 2
                        border.color: Theme.primaryAccent
                    }
                    
                    contentItem: Row {
                        anchors.centerIn: parent
                        spacing: Theme.spacingSmall
                        
                        Text {
                            text: "📤"
                            font.pixelSize: 20
                        }
                        
                        Text {
                            text: "Send"
                            font.family: Theme.fontFamily
                            font.pixelSize: Theme.fontSizeNormal
                            font.weight: Font.Bold
                            color: Theme.textPrimary
                            anchors.verticalCenter: parent.verticalCenter
                        }
                    }
                    
                    onClicked: sendDialog.open()
                }
                
                Button {
                    width: (parent.width - Theme.spacingMedium) / 2
                    height: 50
                    
                    background: Rectangle {
                        radius: Theme.borderRadiusMedium
                        color: parent.hovered ? Qt.rgba(0.2, 0.2, 0.2, 0.9) : Qt.rgba(0.15, 0.15, 0.15, 0.8)
                        border.width: 2
                        border.color: Theme.secondaryAccent
                    }
                    
                    contentItem: Row {
                        anchors.centerIn: parent
                        spacing: Theme.spacingSmall
                        
                        Text {
                            text: "📥"
                            font.pixelSize: 20
                        }
                        
                        Text {
                            text: "Receive"
                            font.family: Theme.fontFamily
                            font.pixelSize: Theme.fontSizeNormal
                            font.weight: Font.Bold
                            color: Theme.textPrimary
                            anchors.verticalCenter: parent.verticalCenter
                        }
                    }
                    
                    onClicked: receiveDialog.open()
                }
            }
            
            // ============================================
            // RECENT TRANSACTIONS
            // ============================================
            
            Text {
                text: "Recent Transactions"
                font.family: Theme.fontFamily
                font.pixelSize: Theme.fontSizeNormal
                font.weight: Font.Bold
                color: Theme.textPrimary
            }
            
            Rectangle {
                width: parent.width
                height: 200
                radius: Theme.borderRadiusMedium
                color: Qt.rgba(0.08, 0.08, 0.08, 0.8)
                border.width: 1
                border.color: Qt.rgba(0.3, 0.3, 0.3, 0.5)
                
                ListView {
                    id: transactionList
                    anchors {
                        fill: parent
                        margins: Theme.spacingSmall
                    }
                    
                    clip: true
                    spacing: Theme.spacingSmall
                    
                    model: ListModel {
                        ListElement {
                            type: "received"
                            amount: "+100.00 CGT"
                            address: "0xabc...123"
                            time: "2 hours ago"
                            confirmed: true
                        }
                        ListElement {
                            type: "sent"
                            amount: "-50.00 CGT"
                            address: "0x789...xyz"
                            time: "1 day ago"
                            confirmed: true
                        }
                        ListElement {
                            type: "received"
                            amount: "+25.00 CGT"
                            address: "0xdef...456"
                            time: "3 days ago"
                            confirmed: true
                        }
                    }
                    
                    delegate: Rectangle {
                        width: transactionList.width
                        height: 50
                        radius: Theme.borderRadiusSmall
                        color: delegateArea.containsMouse ? Qt.rgba(0.2, 0.2, 0.2, 0.6) : "transparent"
                        
                        Row {
                            anchors {
                                fill: parent
                                margins: Theme.spacingSmall
                            }
                            spacing: Theme.spacingMedium
                            
                            // Icon
                            Rectangle {
                                width: 35
                                height: 35
                                radius: 17.5
                                color: model.type === "received" ? Qt.rgba(0, 1, 0, 0.2) : Qt.rgba(1, 0, 0, 0.2)
                                anchors.verticalCenter: parent.verticalCenter
                                
                                Text {
                                    anchors.centerIn: parent
                                    text: model.type === "received" ? "↓" : "↑"
                                    font.pixelSize: 18
                                    font.weight: Font.Bold
                                    color: model.type === "received" ? Theme.successGreen : Theme.errorRed
                                }
                            }
                            
                            // Details
                            Column {
                                width: parent.width - 45 - Theme.spacingMedium
                                anchors.verticalCenter: parent.verticalCenter
                                spacing: Theme.spacingXS
                                
                                Row {
                                    width: parent.width
                                    
                                    Text {
                                        text: model.type === "received" ? "Received" : "Sent"
                                        font.family: Theme.fontFamily
                                        font.pixelSize: Theme.fontSizeNormal
                                        font.weight: Font.Medium
                                        color: Theme.textPrimary
                                        width: parent.width * 0.5
                                    }
                                    
                                    Text {
                                        text: model.amount
                                        font.family: Theme.fontFamilyMono
                                        font.pixelSize: Theme.fontSizeNormal
                                        font.weight: Font.Bold
                                        color: model.type === "received" ? Theme.successGreen : Theme.errorRed
                                        width: parent.width * 0.5
                                        horizontalAlignment: Text.AlignRight
                                    }
                                }
                                
                                Row {
                                    width: parent.width
                                    
                                    Text {
                                        text: model.address
                                        font.family: Theme.fontFamilyMono
                                        font.pixelSize: Theme.fontSizeXS
                                        color: Theme.textMuted
                                        width: parent.width * 0.6
                                    }
                                    
                                    Text {
                                        text: model.time
                                        font.family: Theme.fontFamily
                                        font.pixelSize: Theme.fontSizeXS
                                        color: Theme.textMuted
                                        width: parent.width * 0.4
                                        horizontalAlignment: Text.AlignRight
                                    }
                                }
                            }
                        }
                        
                        MouseArea {
                            id: delegateArea
                            anchors.fill: parent
                            hoverEnabled: true
                            onClicked: console.log("Transaction details:", model.address)
                        }
                    }
                }
            }
        }
        
        // ============================================
        // SEND DIALOG
        // ============================================
        
        Popup {
            id: sendDialog
            anchors.centerIn: parent
            width: 350
            height: 280
            modal: true
            
            background: GlassPane {
                blurRadius: Theme.blurRadiusStrong
                tintColor: Theme.glassTintDark
                borderGlow: Theme.glowIntensityHigh
                glowColor: Theme.primaryAccent
                radius: Theme.borderRadiusLarge
            }
            
            Column {
                anchors {
                    fill: parent
                    margins: Theme.spacingLarge
                }
                spacing: Theme.spacingMedium
                
                Text {
                    text: "Send CGT"
                    font.family: Theme.fontFamilyDisplay
                    font.pixelSize: Theme.fontSizeLarge
                    font.weight: Font.Bold
                    color: Theme.textPrimary
                    anchors.horizontalCenter: parent.horizontalCenter
                }
                
                Column {
                    width: parent.width
                    spacing: Theme.spacingSmall
                    
                    Text {
                        text: "Recipient Address"
                        font.family: Theme.fontFamily
                        font.pixelSize: Theme.fontSizeSmall
                        color: Theme.textSecondary
                    }
                    
                    TextField {
                        id: recipientInput
                        width: parent.width
                        height: 35
                        
                        font.family: Theme.fontFamilyMono
                        font.pixelSize: Theme.fontSizeSmall
                        color: Theme.textPrimary
                        
                        placeholderText: "0x..."
                        placeholderTextColor: Theme.textMuted
                        
                        background: Rectangle {
                            radius: Theme.borderRadiusSmall
                            color: Qt.rgba(0.1, 0.1, 0.1, 0.8)
                            border.width: 1
                            border.color: recipientInput.activeFocus ? Theme.primaryAccent : Qt.rgba(0.3, 0.3, 0.3, 0.5)
                        }
                    }
                }
                
                Column {
                    width: parent.width
                    spacing: Theme.spacingSmall
                    
                    Text {
                        text: "Amount (CGT)"
                        font.family: Theme.fontFamily
                        font.pixelSize: Theme.fontSizeSmall
                        color: Theme.textSecondary
                    }
                    
                    TextField {
                        id: amountInput
                        width: parent.width
                        height: 35
                        
                        font.family: Theme.fontFamilyMono
                        font.pixelSize: Theme.fontSizeNormal
                        color: Theme.textPrimary
                        
                        placeholderText: "0.00"
                        placeholderTextColor: Theme.textMuted
                        
                        background: Rectangle {
                            radius: Theme.borderRadiusSmall
                            color: Qt.rgba(0.1, 0.1, 0.1, 0.8)
                            border.width: 1
                            border.color: amountInput.activeFocus ? Theme.primaryAccent : Qt.rgba(0.3, 0.3, 0.3, 0.5)
                        }
                    }
                }
                
                Row {
                    width: parent.width
                    spacing: Theme.spacingMedium
                    
                    Button {
                        width: (parent.width - Theme.spacingMedium) / 2
                        height: 40
                        text: "Cancel"
                        
                        background: Rectangle {
                            radius: Theme.borderRadiusMedium
                            color: parent.hovered ? Qt.rgba(0.3, 0.3, 0.3, 0.8) : Qt.rgba(0.2, 0.2, 0.2, 0.6)
                        }
                        
                        contentItem: Text {
                            text: parent.text
                            font.family: Theme.fontFamily
                            font.pixelSize: Theme.fontSizeNormal
                            color: Theme.textPrimary
                            horizontalAlignment: Text.AlignHCenter
                            verticalAlignment: Text.AlignVCenter
                        }
                        
                        onClicked: sendDialog.close()
                    }
                    
                    Button {
                        width: (parent.width - Theme.spacingMedium) / 2
                        height: 40
                        text: "Send"
                        
                        background: Rectangle {
                            radius: Theme.borderRadiusMedium
                            color: parent.hovered ? Theme.primaryAccent : Qt.rgba(0.0, 1.0, 1.0, 0.8)
                            border.width: 2
                            border.color: Theme.primaryAccent
                        }
                        
                        contentItem: Text {
                            text: parent.text
                            font.family: Theme.fontFamily
                            font.pixelSize: Theme.fontSizeNormal
                            font.weight: Font.Bold
                            color: Theme.voidBlack
                            horizontalAlignment: Text.AlignHCenter
                            verticalAlignment: Text.AlignVCenter
                        }
                        
                        onClicked: {
                            console.log("Sending", amountInput.text, "CGT to", recipientInput.text)
                            sendDialog.close()
                            // TODO: Integrate with WalletManager.sendCGT()
                        }
                    }
                }
            }
        }
        
        // ============================================
        // RECEIVE DIALOG
        // ============================================
        
        Popup {
            id: receiveDialog
            anchors.centerIn: parent
            width: 350
            height: 250
            modal: true
            
            background: GlassPane {
                blurRadius: Theme.blurRadiusStrong
                tintColor: Theme.glassTintDark
                borderGlow: Theme.glowIntensityHigh
                glowColor: Theme.secondaryAccent
                radius: Theme.borderRadiusLarge
            }
            
            Column {
                anchors {
                    fill: parent
                    margins: Theme.spacingLarge
                }
                spacing: Theme.spacingMedium
                
                Text {
                    text: "Receive CGT"
                    font.family: Theme.fontFamilyDisplay
                    font.pixelSize: Theme.fontSizeLarge
                    font.weight: Font.Bold
                    color: Theme.textPrimary
                    anchors.horizontalCenter: parent.horizontalCenter
                }
                
                Text {
                    text: "Your Wallet Address"
                    font.family: Theme.fontFamily
                    font.pixelSize: Theme.fontSizeSmall
                    color: Theme.textSecondary
                    anchors.horizontalCenter: parent.horizontalCenter
                }
                
                Rectangle {
                    width: parent.width
                    height: 80
                    radius: Theme.borderRadiusMedium
                    color: Qt.rgba(0.1, 0.1, 0.1, 0.8)
                    border.width: 2
                    border.color: Theme.secondaryAccent
                    
                    Column {
                        anchors.centerIn: parent
                        spacing: Theme.spacingSmall
                        
                        Text {
                            anchors.horizontalCenter: parent.horizontalCenter
                            text: "0xAbCd1234EfGh5678..."
                            font.family: Theme.fontFamilyMono
                            font.pixelSize: Theme.fontSizeSmall
                            color: Theme.primaryAccent
                        }
                        
                        Text {
                            anchors.horizontalCenter: parent.horizontalCenter
                            text: "(Click to copy)"
                            font.family: Theme.fontFamily
                            font.pixelSize: Theme.fontSizeXS
                            color: Theme.textMuted
                        }
                    }
                    
                    MouseArea {
                        anchors.fill: parent
                        onClicked: {
                            console.log("Address copied to clipboard")
                            // TODO: Copy to clipboard
                        }
                    }
                }
                
                Button {
                    width: parent.width
                    height: 40
                    text: "Close"
                    anchors.horizontalCenter: parent.horizontalCenter
                    
                    background: Rectangle {
                        radius: Theme.borderRadiusMedium
                        color: parent.hovered ? Qt.rgba(0.3, 0.3, 0.3, 0.8) : Qt.rgba(0.2, 0.2, 0.2, 0.6)
                    }
                    
                    contentItem: Text {
                        text: parent.text
                        font.family: Theme.fontFamily
                        font.pixelSize: Theme.fontSizeNormal
                        color: Theme.textPrimary
                        horizontalAlignment: Text.AlignHCenter
                        verticalAlignment: Text.AlignVCenter
                    }
                    
                    onClicked: receiveDialog.close()
                }
            }
        }
    }
    
    Component.onCompleted: {
        console.log("💰 Wallet Widget initialized")
    }
}
