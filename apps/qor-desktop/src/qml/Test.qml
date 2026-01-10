import QtQuick
import QtQuick.Window

Window {
    visible: true
    width: 800
    height: 600
    title: "QOR Desktop Test"
    color: "#0A0A0F"
    
    Text {
        anchors.centerIn: parent
        text: "QOR Desktop is Running!"
        font.pixelSize: 48
        color: "white"
    }
    
    Rectangle {
        x: 100
        y: 100
        width: 200
        height: 100
        color: "#FF6B35"
        radius: 10
        
        Text {
            anchors.centerIn: parent
            text: "Test Panel"
            color: "white"
            font.pixelSize: 24
        }
    }
}
