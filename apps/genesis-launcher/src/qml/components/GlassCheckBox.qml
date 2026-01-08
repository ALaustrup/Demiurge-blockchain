/**
 * GlassCheckBox.qml - Dark Theme Checkbox
 */
import QtQuick
import QtQuick.Controls

CheckBox {
    id: root
    
    indicator: Rectangle {
        implicitWidth: 20
        implicitHeight: 20
        x: root.leftPadding
        y: (root.height - height) / 2
        radius: 4
        color: "#0F0F0F"
        border.color: root.checked ? "#FF3D00" : "#333333"
        border.width: 1
        
        Rectangle {
            anchors.centerIn: parent
            width: 10
            height: 10
            radius: 2
            color: "#FF3D00"
            visible: root.checked
        }
    }
    
    contentItem: Text {
        text: root.text
        font.family: "Rajdhani"
        font.pixelSize: 14
        color: "#7A7A7A"
        verticalAlignment: Text.AlignVCenter
        leftPadding: root.indicator.width + root.spacing
    }
}
