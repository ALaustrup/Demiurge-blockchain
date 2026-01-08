/**
 * MinimizeButton.qml - Window Minimize Button
 */
import QtQuick

Rectangle {
    id: root
    
    signal clicked()
    
    width: 24
    height: 24
    radius: 12
    color: mouseArea.containsMouse ? "#333333" : "transparent"
    
    Behavior on color {
        ColorAnimation { duration: 150 }
    }
    
    // Minimize icon
    Rectangle {
        anchors.centerIn: parent
        width: 10
        height: 2
        color: mouseArea.containsMouse ? "#FFFFFF" : "#666666"
    }
    
    MouseArea {
        id: mouseArea
        anchors.fill: parent
        hoverEnabled: true
        cursorShape: Qt.PointingHandCursor
        onClicked: root.clicked()
    }
}
