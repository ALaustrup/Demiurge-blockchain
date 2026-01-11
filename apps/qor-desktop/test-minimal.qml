// test-minimal.qml - Absolute minimal QML test
import QtQuick
import QtQuick.Window

Window {
    id: root
    width: 800
    height: 600
    visible: true
    title: "QOR - Minimal Test"
    color: "#0A0A0A"
    
    Rectangle {
        anchors.centerIn: parent
        width: 400
        height: 200
        color: "#1A1A1A"
        border.color: "#00FFFF"
        border.width: 2
        radius: 10
        
        Column {
            anchors.centerIn: parent
            spacing: 20
            
            Text {
                anchors.horizontalCenter: parent.horizontalCenter
                text: "QOR DESKTOP"
                font.pixelSize: 48
                font.bold: true
                color: "#00FFFF"
            }
            
            Text {
                anchors.horizontalCenter: parent.horizontalCenter
                text: "✅ Qt is working!"
                font.pixelSize: 24
                color: "#FFFFFF"
            }
        }
    }
    
    Component.onCompleted: {
        console.log("✅ Minimal test successful!")
        console.log("Qt version:", Qt.version)
        console.log("Window created successfully")
    }
}
