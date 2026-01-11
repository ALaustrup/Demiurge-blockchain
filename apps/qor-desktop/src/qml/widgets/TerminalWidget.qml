// TerminalWidget.qml - Embedded Shell Terminal
import QtQuick
import QtQuick.Controls

BaseWidget {
    id: widget
    
    widgetName: "Terminal"
    widgetIcon: "⚡"
    
    width: 600
    height: 450
    
    property color promptColor: Theme.primaryAccent
    property color outputColor: Theme.textPrimary
    property color errorColor: Theme.errorRed
    
    content: Item {
        anchors.fill: parent
        
        Column {
            anchors.fill: parent
            spacing: 0
            
            // ============================================
            // TERMINAL HEADER
            // ============================================
            
            Rectangle {
                width: parent.width
                height: 35
                color: Qt.rgba(0.08, 0.08, 0.08, 0.8)
                radius: Theme.borderRadiusSmall
                
                Row {
                    anchors {
                        left: parent.left
                        leftMargin: Theme.spacingMedium
                        verticalCenter: parent.verticalCenter
                    }
                    spacing: Theme.spacingMedium
                    
                    Text {
                        text: "QOR Shell"
                        font.family: Theme.fontFamilyMono
                        font.pixelSize: Theme.fontSizeSmall
                        font.weight: Font.Bold
                        color: Theme.primaryAccent
                    }
                    
                    Text {
                        text: "|"
                        font.family: Theme.fontFamily
                        font.pixelSize: Theme.fontSizeSmall
                        color: Theme.textMuted
                    }
                    
                    Text {
                        text: "~/"
                        font.family: Theme.fontFamilyMono
                        font.pixelSize: Theme.fontSizeSmall
                        color: Theme.textSecondary
                    }
                }
                
                // Terminal controls
                Row {
                    anchors {
                        right: parent.right
                        rightMargin: Theme.spacingSmall
                        verticalCenter: parent.verticalCenter
                    }
                    spacing: Theme.spacingXS
                    
                    Rectangle {
                        width: 20
                        height: 20
                        radius: 3
                        color: clearArea.containsMouse ? Qt.rgba(0.3, 0.3, 0.3, 0.8) : "transparent"
                        
                        Text {
                            anchors.centerIn: parent
                            text: "🗑️"
                            font.pixelSize: 10
                        }
                        
                        MouseArea {
                            id: clearArea
                            anchors.fill: parent
                            hoverEnabled: true
                            onClicked: terminalOutput.text = ""
                        }
                        
                        ToolTip {
                            visible: clearArea.containsMouse
                            text: "Clear"
                            delay: 500
                        }
                    }
                }
            }
            
            // ============================================
            // TERMINAL OUTPUT AREA
            // ============================================
            
            Rectangle {
                width: parent.width
                height: parent.height - 70
                color: Qt.rgba(0.02, 0.02, 0.02, 0.95)
                
                Flickable {
                    id: flickable
                    anchors {
                        fill: parent
                        margins: Theme.spacingMedium
                    }
                    
                    contentWidth: terminalOutput.paintedWidth
                    contentHeight: terminalOutput.paintedHeight
                    
                    clip: true
                    
                    ScrollBar.vertical: ScrollBar {
                        policy: ScrollBar.AsNeeded
                    }
                    
                    TextEdit {
                        id: terminalOutput
                        width: flickable.width
                        
                        font.family: Theme.fontFamilyMono
                        font.pixelSize: Theme.fontSizeSmall
                        color: widget.outputColor
                        
                        readOnly: true
                        selectByMouse: true
                        wrapMode: TextEdit.Wrap
                        
                        text: "QOR Shell v1.0.0 - Demiurge Desktop Terminal\n" +
                              "Type 'help' for available commands\n\n"
                        
                        // Auto-scroll to bottom when text changes
                        onTextChanged: {
                            flickable.contentY = Math.max(0, contentHeight - flickable.height)
                        }
                    }
                }
            }
            
            // ============================================
            // COMMAND INPUT
            // ============================================
            
            Rectangle {
                width: parent.width
                height: 35
                color: Qt.rgba(0.05, 0.05, 0.05, 0.9)
                
                Row {
                    anchors {
                        fill: parent
                        margins: Theme.spacingSmall
                    }
                    spacing: Theme.spacingSmall
                    
                    Text {
                        text: ">"
                        font.family: Theme.fontFamilyMono
                        font.pixelSize: Theme.fontSizeNormal
                        font.weight: Font.Bold
                        color: widget.promptColor
                        anchors.verticalCenter: parent.verticalCenter
                    }
                    
                    TextField {
                        id: commandInput
                        width: parent.width - 30
                        height: parent.height
                        
                        font.family: Theme.fontFamilyMono
                        font.pixelSize: Theme.fontSizeNormal
                        color: Theme.textPrimary
                        
                        background: Rectangle {
                            color: "transparent"
                        }
                        
                        placeholderText: "Enter command..."
                        placeholderTextColor: Theme.textMuted
                        
                        Keys.onReturnPressed: executeCommand()
                        Keys.onEnterPressed: executeCommand()
                        
                        Component.onCompleted: forceActiveFocus()
                    }
                }
            }
        }
        
        // ============================================
        // COMMAND HISTORY
        // ============================================
        
        property var commandHistory: []
        property int historyIndex: -1
        
        function executeCommand() {
            var cmd = commandInput.text.trim()
            
            if (cmd === "") return
            
            // Add to history
            commandHistory.push(cmd)
            historyIndex = commandHistory.length
            
            // Display command
            terminalOutput.text += widget.promptColor + "> " + cmd + "\n"
            
            // Execute command
            processCommand(cmd)
            
            // Clear input
            commandInput.text = ""
        }
        
        function processCommand(cmd) {
            var parts = cmd.split(" ")
            var command = parts[0].toLowerCase()
            var args = parts.slice(1)
            
            switch(command) {
                case "help":
                    terminalOutput.text += 
                        "Available commands:\n" +
                        "  help              - Show this help message\n" +
                        "  clear             - Clear terminal\n" +
                        "  echo <text>       - Print text\n" +
                        "  sysinfo           - Display system information\n" +
                        "  time              - Show current time\n" +
                        "  date              - Show current date\n" +
                        "  qor               - QOR Desktop info\n" +
                        "  theme             - Current theme colors\n" +
                        "  audio             - Audio reactivity status\n" +
                        "  calc <expr>       - Simple calculator\n\n"
                    break
                
                case "clear":
                    terminalOutput.text = ""
                    break
                
                case "echo":
                    terminalOutput.text += args.join(" ") + "\n\n"
                    break
                
                case "sysinfo":
                    terminalOutput.text += 
                        "System Information:\n" +
                        "  CPU: " + SystemMonitor.cpuName + "\n" +
                        "  Cores: " + SystemMonitor.cpuCores + "\n" +
                        "  CPU Usage: " + SystemMonitor.cpuUsage.toFixed(1) + "%\n" +
                        "  RAM: " + (SystemMonitor.totalMemoryMB / 1024).toFixed(1) + " GB\n" +
                        "  RAM Usage: " + SystemMonitor.memoryUsage.toFixed(1) + "%\n" +
                        "  Disk: " + SystemMonitor.totalDiskGB + " GB\n" +
                        "  Disk Usage: " + SystemMonitor.diskUsage.toFixed(1) + "%\n\n"
                    break
                
                case "time":
                    var now = new Date()
                    terminalOutput.text += Qt.formatTime(now, "hh:mm:ss") + "\n\n"
                    break
                
                case "date":
                    var today = new Date()
                    terminalOutput.text += Qt.formatDate(today, "dddd, MMMM d, yyyy") + "\n\n"
                    break
                
                case "qor":
                    terminalOutput.text += 
                        "QOR Desktop Environment\n" +
                        "  Version: Glass Engine v1.0.0 - Phase 4\n" +
                        "  Theme: Ancient Code Meets Ethereal Glass\n" +
                        "  Framework: Qt Quick + C++ Backend\n" +
                        "  Features: Liquid physics, Audio reactivity, System integration\n\n"
                    break
                
                case "theme":
                    terminalOutput.text += 
                        "Current Theme Colors:\n" +
                        "  Primary: " + Theme.primaryAccent + "\n" +
                        "  Secondary: " + Theme.secondaryAccent + "\n" +
                        "  Tertiary: " + Theme.tertiaryAccent + "\n" +
                        "  Audio Reactive: " + (typeof AudioColors !== 'undefined' ? "Yes" : "No") + "\n\n"
                    break
                
                case "audio":
                    if (typeof AudioColors !== 'undefined') {
                        terminalOutput.text += 
                            "Audio Reactivity Status:\n" +
                            "  Enabled: " + AudioColors.enabled + "\n" +
                            "  Sensitivity: " + AudioColors.sensitivity.toFixed(1) + "x\n" +
                            "  Bass Level: " + (AudioColors.bassLevel * 100).toFixed(1) + "%\n" +
                            "  Mid Level: " + (AudioColors.midLevel * 100).toFixed(1) + "%\n" +
                            "  Treble Level: " + (AudioColors.trebleLevel * 100).toFixed(1) + "%\n\n"
                    } else {
                        terminalOutput.text += "Audio reactivity not available\n\n"
                    }
                    break
                
                case "calc":
                    if (args.length === 0) {
                        terminalOutput.text += "Usage: calc <expression>\nExample: calc 2 + 2\n\n"
                    } else {
                        try {
                            var expr = args.join(" ")
                            var result = eval(expr)
                            terminalOutput.text += result + "\n\n"
                        } catch(e) {
                            terminalOutput.text += widget.errorColor + "Error: Invalid expression\n\n"
                        }
                    }
                    break
                
                default:
                    terminalOutput.text += widget.errorColor + "Unknown command: " + command + "\n"
                    terminalOutput.text += "Type 'help' for available commands\n\n"
            }
        }
    }
    
    Component.onCompleted: {
        console.log("⚡ Terminal Widget initialized")
    }
}
