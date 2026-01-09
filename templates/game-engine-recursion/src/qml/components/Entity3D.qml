/**
 * Entity3D.qml - 3D representation of a game entity
 */

import QtQuick
import QtQuick3D

Model {
    id: entityModel
    
    // Properties bound from C++ entity
    property var entity: null
    property string entityType: entity ? entity.type : ""
    
    // Position/rotation/scale from entity
    position: entity ? Qt.vector3d(entity.position.x, entity.position.y, entity.position.z) : Qt.vector3d(0, 0, 0)
    rotation: entity ? entity.rotation : Qt.quaternion(1, 0, 0, 0)
    scale: entity ? Qt.vector3d(entity.scale.x, entity.scale.y, entity.scale.z) : Qt.vector3d(1, 1, 1)
    
    // Model source based on entity type
    source: {
        switch(entityType) {
            case "nft_object": return "#Sphere"
            case "recursion_object": return "#Cube"
            default: return "#Cube"
        }
    }
    
    // Material based on entity type
    materials: PrincipledMaterial {
        baseColor: {
            switch(entityType) {
                case "nft_object": return "#FF3D00" // Genesis flame
                case "recursion_object": return "#00FFC8" // Cipher cyan
                default: return "#FFFFFF"
            }
        }
        roughness: 0.5
        metalness: 0.3
        emissiveColor: baseColor
        emissiveFactor: 0.2
    }
    
    // Animation
    SequentialAnimation on eulerRotation.y {
        running: true
        loops: Animation.Infinite
        NumberAnimation {
            from: 0
            to: 360
            duration: 5000
        }
    }
}
