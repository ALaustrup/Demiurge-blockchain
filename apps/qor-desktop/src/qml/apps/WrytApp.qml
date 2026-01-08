import QtQuick
import QtQuick.Layouts
import QtQuick.Controls

import "../components"

/**
 * WrytApp - WRYT Document Editor
 * 
 * The native document editor for QØЯ desktop.
 * Supports multiple document formats, templates,
 * and rich text editing.
 */
Item {
    id: wrytApp
    
    // ========================================================================
    // PROPERTIES
    // ========================================================================
    
    /** Current document */
    property var currentDocument: null
    
    /** Document title */
    property string documentTitle: "Untitled"
    
    /** Document content */
    property string documentContent: ""
    
    /** Is document modified */
    property bool isModified: false
    
    /** Current view (welcome, editor) */
    property string currentView: "welcome"
    
    /** Recent documents */
    property var recentDocuments: []
    
    /** Document templates */
    property var templates: [
        { id: "blank", name: "Blank Document", icon: "📄", description: "Start with a clean slate" },
        { id: "novel", name: "Novel", icon: "📖", description: "Chapter-based novel format" },
        { id: "article", name: "Article", icon: "📰", description: "Blog or news article" },
        { id: "report", name: "Report", icon: "📊", description: "Professional report" },
        { id: "letter", name: "Letter", icon: "✉️", description: "Formal letter template" },
        { id: "journal", name: "Journal", icon: "📔", description: "Personal journal entry" }
    ]
    
    // ========================================================================
    // MAIN LAYOUT
    // ========================================================================
    
    StackLayout {
        anchors.fill: parent
        currentIndex: currentView === "welcome" ? 0 : 1
        
        // ================================================================
        // WELCOME VIEW
        // ================================================================
        
        Item {
            ColumnLayout {
                anchors.centerIn: parent
                spacing: Theme.spacingXLarge
                width: Math.min(parent.width * 0.8, 800)
                
                // Header
                ColumnLayout {
                    Layout.alignment: Qt.AlignHCenter
                    spacing: Theme.spacingSmall
                    
                    GlowText {
                        text: "WRYT"
                        fontFamily: Theme.fontHeader
                        fontSize: Theme.fontSizeHuge
                        glowing: true
                        Layout.alignment: Qt.AlignHCenter
                    }
                    
                    Text {
                        text: "Document Editor"
                        font.family: Theme.fontAncient
                        font.pixelSize: Theme.fontSizeBody
                        color: Theme.textSecondary
                        Layout.alignment: Qt.AlignHCenter
                    }
                }
                
                // Quick actions
                RowLayout {
                    Layout.alignment: Qt.AlignHCenter
                    spacing: Theme.spacingMedium
                    
                    FlameButton {
                        text: "New Document"
                        primary: true
                        onClicked: templateDialog.open()
                    }
                    
                    FlameButton {
                        text: "Open File"
                        onClicked: openDocument()
                    }
                }
                
                // Recent documents
                GlassPanel {
                    Layout.fillWidth: true
                    Layout.preferredHeight: 300
                    depthLevel: 2
                    
                    ColumnLayout {
                        anchors.fill: parent
                        anchors.margins: Theme.spacingLarge
                        spacing: Theme.spacingMedium
                        
                        Text {
                            text: "Recent Documents"
                            font.family: Theme.fontBody
                            font.pixelSize: Theme.fontSizeBody
                            font.weight: Font.Medium
                            color: Theme.textPrimary
                        }
                        
                        ListView {
                            Layout.fillWidth: true
                            Layout.fillHeight: true
                            clip: true
                            spacing: Theme.spacingSmall
                            
                            model: recentDocuments
                            
                            delegate: Rectangle {
                                width: ListView.view.width
                                height: 50
                                radius: Theme.radiusSmall
                                color: mouseArea.containsMouse ? Theme.glassPanelWindow : "transparent"
                                
                                RowLayout {
                                    anchors.fill: parent
                                    anchors.margins: Theme.spacingSmall
                                    spacing: Theme.spacingMedium
                                    
                                    Text {
                                        text: "📄"
                                        font.pixelSize: 24
                                    }
                                    
                                    ColumnLayout {
                                        Layout.fillWidth: true
                                        spacing: 2
                                        
                                        Text {
                                            text: modelData.title
                                            font.family: Theme.fontBody
                                            font.pixelSize: Theme.fontSizeSmall
                                            font.weight: Font.Medium
                                            color: Theme.textPrimary
                                        }
                                        
                                        Text {
                                            text: modelData.lastModified || "Unknown date"
                                            font.family: Theme.fontBody
                                            font.pixelSize: Theme.fontSizeTiny
                                            color: Theme.textMuted
                                        }
                                    }
                                    
                                    Text {
                                        text: modelData.type || "Document"
                                        font.family: Theme.fontCode
                                        font.pixelSize: Theme.fontSizeTiny
                                        color: Theme.textSecondary
                                    }
                                }
                                
                                MouseArea {
                                    id: mouseArea
                                    anchors.fill: parent
                                    hoverEnabled: true
                                    cursorShape: Qt.PointingHandCursor
                                    onDoubleClicked: loadDocument(modelData)
                                }
                            }
                            
                            // Empty state
                            Text {
                                anchors.centerIn: parent
                                text: "No recent documents"
                                font.family: Theme.fontBody
                                font.pixelSize: Theme.fontSizeBody
                                color: Theme.textMuted
                                visible: recentDocuments.length === 0
                            }
                        }
                    }
                }
            }
        }
        
        // ================================================================
        // EDITOR VIEW
        // ================================================================
        
        ColumnLayout {
            spacing: 0
            
            // Toolbar
            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 44
                color: Theme.glassPanelDock
                
                RowLayout {
                    anchors.fill: parent
                    anchors.margins: Theme.spacingSmall
                    spacing: Theme.spacingSmall
                    
                    // File actions
                    ToolButton { icon: "📄"; tooltip: "New"; onClicked: templateDialog.open() }
                    ToolButton { icon: "📂"; tooltip: "Open"; onClicked: openDocument() }
                    ToolButton { icon: "💾"; tooltip: "Save"; onClicked: saveDocument() }
                    
                    Rectangle { width: 1; height: 24; color: Theme.panelBorder }
                    
                    // Edit actions
                    ToolButton { icon: "↩️"; tooltip: "Undo" }
                    ToolButton { icon: "↪️"; tooltip: "Redo" }
                    
                    Rectangle { width: 1; height: 24; color: Theme.panelBorder }
                    
                    // Format actions
                    ToolButton { icon: "B"; tooltip: "Bold"; fontWeight: Font.Bold }
                    ToolButton { icon: "I"; tooltip: "Italic"; fontStyle: Font.StyleItalic }
                    ToolButton { icon: "U̲"; tooltip: "Underline" }
                    
                    Rectangle { width: 1; height: 24; color: Theme.panelBorder }
                    
                    // Alignment
                    ToolButton { icon: "≡"; tooltip: "Align Left" }
                    ToolButton { icon: "≡"; tooltip: "Align Center" }
                    ToolButton { icon: "≡"; tooltip: "Align Right" }
                    
                    Item { Layout.fillWidth: true }
                    
                    // Document info
                    Text {
                        text: documentTitle + (isModified ? " •" : "")
                        font.family: Theme.fontBody
                        font.pixelSize: Theme.fontSizeSmall
                        color: Theme.textSecondary
                    }
                    
                    // Word count
                    Text {
                        text: wordCount + " words"
                        font.family: Theme.fontCode
                        font.pixelSize: Theme.fontSizeTiny
                        color: Theme.textMuted
                    }
                    
                    // Close editor
                    ToolButton { 
                        icon: "✕"
                        tooltip: "Close"
                        onClicked: {
                            if (isModified) {
                                // Would show save dialog
                            }
                            currentView = "welcome"
                        }
                    }
                }
            }
            
            // Editor area
            GlassPanel {
                Layout.fillWidth: true
                Layout.fillHeight: true
                Layout.margins: Theme.spacingMedium
                depthLevel: 2
                
                Flickable {
                    anchors.fill: parent
                    anchors.margins: Theme.spacingLarge
                    contentHeight: editorArea.height
                    clip: true
                    
                    TextArea {
                        id: editorArea
                        width: parent.width
                        wrapMode: TextArea.Wrap
                        font.family: Theme.fontBody
                        font.pixelSize: Theme.fontSizeBody
                        color: Theme.textPrimary
                        placeholderText: "Start writing..."
                        placeholderTextColor: Theme.textMuted
                        background: null
                        
                        text: documentContent
                        
                        onTextChanged: {
                            if (text !== documentContent) {
                                documentContent = text
                                isModified = true
                            }
                        }
                    }
                }
            }
            
            // Status bar
            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 24
                color: Theme.glassPanelDock
                
                RowLayout {
                    anchors.fill: parent
                    anchors.margins: Theme.spacingSmall
                    spacing: Theme.spacingMedium
                    
                    Text {
                        text: "Line " + currentLine + ", Column " + currentColumn
                        font.family: Theme.fontCode
                        font.pixelSize: Theme.fontSizeTiny
                        color: Theme.textMuted
                    }
                    
                    Item { Layout.fillWidth: true }
                    
                    Text {
                        text: characterCount + " characters"
                        font.family: Theme.fontCode
                        font.pixelSize: Theme.fontSizeTiny
                        color: Theme.textMuted
                    }
                }
            }
        }
    }
    
    // ========================================================================
    // HELPER COMPONENTS
    // ========================================================================
    
    component ToolButton: Rectangle {
        property string icon: ""
        property string tooltip: ""
        property int fontWeight: Font.Normal
        property int fontStyle: Font.StyleNormal
        
        signal clicked()
        
        width: 32
        height: 28
        radius: Theme.radiusSmall
        color: toolMouse.containsMouse ? Theme.glassPanelWindow : "transparent"
        
        Text {
            anchors.centerIn: parent
            text: icon
            font.family: Theme.fontBody
            font.pixelSize: 14
            font.weight: fontWeight
            font.italic: fontStyle === Font.StyleItalic
            color: Theme.textPrimary
        }
        
        MouseArea {
            id: toolMouse
            anchors.fill: parent
            hoverEnabled: true
            cursorShape: Qt.PointingHandCursor
            onClicked: parent.clicked()
        }
        
        ToolTip.visible: toolMouse.containsMouse && tooltip
        ToolTip.text: tooltip
        ToolTip.delay: 500
    }
    
    // ========================================================================
    // DIALOGS
    // ========================================================================
    
    Popup {
        id: templateDialog
        anchors.centerIn: parent
        width: 600
        height: 450
        modal: true
        
        background: GlassPanel {
            depthLevel: 3
        }
        
        ColumnLayout {
            anchors.fill: parent
            anchors.margins: Theme.spacingLarge
            spacing: Theme.spacingMedium
            
            Text {
                text: "Choose a Template"
                font.family: Theme.fontHeader
                font.pixelSize: Theme.fontSizeH3
                color: Theme.textPrimary
            }
            
            GridView {
                Layout.fillWidth: true
                Layout.fillHeight: true
                cellWidth: 170
                cellHeight: 140
                clip: true
                
                model: templates
                
                delegate: Item {
                    width: 160
                    height: 130
                    
                    GlassPanel {
                        anchors.fill: parent
                        anchors.margins: 4
                        depthLevel: 2
                        active: templateMouse.containsMouse
                        
                        ColumnLayout {
                            anchors.fill: parent
                            anchors.margins: Theme.spacingSmall
                            spacing: Theme.spacingSmall
                            
                            Text {
                                text: modelData.icon
                                font.pixelSize: 40
                                Layout.alignment: Qt.AlignHCenter
                            }
                            
                            Text {
                                text: modelData.name
                                font.family: Theme.fontBody
                                font.pixelSize: Theme.fontSizeSmall
                                font.weight: Font.Medium
                                color: Theme.textPrimary
                                Layout.alignment: Qt.AlignHCenter
                            }
                            
                            Text {
                                text: modelData.description
                                font.family: Theme.fontBody
                                font.pixelSize: Theme.fontSizeTiny
                                color: Theme.textSecondary
                                wrapMode: Text.WordWrap
                                horizontalAlignment: Text.AlignHCenter
                                Layout.fillWidth: true
                            }
                        }
                        
                        MouseArea {
                            id: templateMouse
                            anchors.fill: parent
                            hoverEnabled: true
                            cursorShape: Qt.PointingHandCursor
                            onClicked: {
                                createFromTemplate(modelData.id)
                                templateDialog.close()
                            }
                        }
                    }
                }
            }
            
            RowLayout {
                Layout.fillWidth: true
                
                Item { Layout.fillWidth: true }
                
                FlameButton {
                    text: "Cancel"
                    onClicked: templateDialog.close()
                }
            }
        }
    }
    
    // ========================================================================
    // COMPUTED PROPERTIES
    // ========================================================================
    
    property int wordCount: documentContent.trim() ? documentContent.trim().split(/\s+/).length : 0
    property int characterCount: documentContent.length
    property int currentLine: 1
    property int currentColumn: 1
    
    // ========================================================================
    // FUNCTIONS
    // ========================================================================
    
    function createFromTemplate(templateId) {
        documentTitle = "Untitled"
        documentContent = ""
        isModified = false
        currentView = "editor"
        
        // Apply template-specific formatting
        switch (templateId) {
            case "novel":
                documentContent = "# Chapter 1\n\n"
                break
            case "article":
                documentContent = "# Article Title\n\n## Introduction\n\n"
                break
            case "report":
                documentContent = "# Report Title\n\n## Executive Summary\n\n## Findings\n\n## Conclusion\n\n"
                break
            case "letter":
                documentContent = "[Your Name]\n[Your Address]\n[Date]\n\n[Recipient Name]\n[Recipient Address]\n\nDear [Name],\n\n\n\nSincerely,\n[Your Name]"
                break
            case "journal":
                documentContent = "# " + new Date().toLocaleDateString() + "\n\n"
                break
        }
    }
    
    function openDocument() {
        // Would open file dialog
        console.log("Open document")
    }
    
    function saveDocument() {
        // Would save to file
        isModified = false
        console.log("Save document:", documentTitle)
    }
    
    function loadDocument(doc) {
        documentTitle = doc.title
        documentContent = doc.content || ""
        isModified = false
        currentView = "editor"
    }
    
    // ========================================================================
    // DEMO DATA
    // ========================================================================
    
    Component.onCompleted: {
        recentDocuments = [
            { title: "Project Notes", lastModified: "Today, 2:30 PM", type: ".md" },
            { title: "Meeting Minutes", lastModified: "Yesterday", type: ".txt" },
            { title: "Story Draft", lastModified: "Jan 5, 2026", type: ".wryt" }
        ]
    }
}
