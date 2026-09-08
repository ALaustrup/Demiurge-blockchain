# Physics Integration

DRC-369 NFTs can include physics properties for game engine integration.

---

## Overview

Physics metadata allows NFTs to behave consistently across different games:
- Same sword has same weight in all games
- Objects bounce, slide, and collide predictably
- Cross-game item interoperability

---

## Physics Properties

```rust
pub struct PhysicsProperties {
    // Rigid Body Properties
    pub mass: f32,              // kilograms
    pub friction: f32,          // 0.0 - 1.0
    pub restitution: f32,       // 0.0 - 1.0 (bounciness)
    pub linear_damping: f32,    // air resistance
    pub angular_damping: f32,   // rotational resistance
    
    // Material Properties
    pub density: f32,           // kg/m³
    pub hardness: f32,          // 0.0 - 1.0
    
    // Collision
    pub collision_shape: CollisionShape,
    
    // Behavior Flags
    pub is_static: bool,        // immovable
    pub gravity_enabled: bool,  // affected by gravity
    pub is_trigger: bool,       // collision detection only
}
```

### Collision Shapes

```rust
pub enum CollisionShape {
    /// Axis-aligned bounding box
    Box {
        half_extents: [f32; 3], // x, y, z half-sizes
    },
    
    /// Sphere collider
    Sphere {
        radius: f32,
    },
    
    /// Capsule (cylinder with hemispherical ends)
    Capsule {
        radius: f32,
        half_height: f32,
    },
    
    /// Convex hull from vertices
    ConvexHull {
        vertices: Vec<[f32; 3]>,
    },
    
    /// Triangle mesh (static objects only)
    Mesh {
        vertices: Vec<[f32; 3]>,
        indices: Vec<[u32; 3]>,
    },
}
```

---

## Setting Physics

### Via RPC

```bash
curl -X POST https://rpc.demiurge.cloud:9944 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "drc369_setPhysics",
    "params": [
      "TOKEN_ID_HEX",
      "{\"mass\":5.0,\"friction\":0.6,\"restitution\":0.2,\"linear_damping\":0.1,\"angular_damping\":0.1,\"is_static\":false,\"gravity_enabled\":true}",
      "SIGNATURE_HEX"
    ]
  }'
```

### Via SDK

```typescript
import { DRC369Client } from '@demiurge/drc369-sdk';

const client = new DRC369Client({
  rpcUrl: 'https://rpc.demiurge.cloud:9944'
});

await client.setPhysics({
  tokenId: '0x...',
  physics: {
    mass: 5.0,
    friction: 0.6,
    restitution: 0.2,
    linearDamping: 0.1,
    angularDamping: 0.1,
    collisionShape: {
      type: 'box',
      halfExtents: [0.5, 0.5, 0.5]
    },
    isStatic: false,
    gravityEnabled: true
  },
  wallet: ownerWallet
});
```

---

## Querying Physics

### Via RPC

```bash
curl -X POST https://rpc.demiurge.cloud:9944 \
  -d '{"jsonrpc":"2.0","id":1,"method":"drc369_getPhysics","params":["TOKEN_ID_HEX"]}'
```

Response:
```json
{
  "jsonrpc": "2.0",
  "result": {
    "token_id": "0x...",
    "has_physics": true,
    "physics": {
      "mass": 5.0,
      "friction": 0.6,
      "restitution": 0.2,
      "linear_damping": 0.1,
      "angular_damping": 0.1,
      "is_static": false,
      "gravity_enabled": true
    },
    "simulation_ready": true
  },
  "id": 1
}
```

### Check Physics Existence

```bash
curl -X POST https://rpc.demiurge.cloud:9944 \
  -d '{"jsonrpc":"2.0","id":1,"method":"drc369_hasPhysics","params":["TOKEN_ID_HEX"]}'
```

---

## Game Engine Integration

### Unreal Engine 5

```cpp
#include "DemiurgeSDK.h"
#include "PhysicsEngine/BodyInstance.h"

void AMyActor::ApplyDRC369Physics(const FString& TokenId)
{
    // Fetch physics from chain
    FDemiurgePhysics Physics;
    if (!DemiurgeClient->GetPhysics(TokenId, Physics))
    {
        UE_LOG(LogTemp, Warning, TEXT("No physics for token"));
        return;
    }
    
    // Get primitive component
    UPrimitiveComponent* PrimComp = FindComponentByClass<UPrimitiveComponent>();
    if (!PrimComp) return;
    
    // Apply mass
    PrimComp->SetMassOverrideInKg(NAME_None, Physics.Mass, true);
    
    // Apply damping
    PrimComp->SetLinearDamping(Physics.LinearDamping);
    PrimComp->SetAngularDamping(Physics.AngularDamping);
    
    // Apply material properties
    if (UPhysicalMaterial* PhysMat = NewObject<UPhysicalMaterial>())
    {
        PhysMat->Friction = Physics.Friction;
        PhysMat->Restitution = Physics.Restitution;
        PrimComp->SetPhysMaterialOverride(PhysMat);
    }
    
    // Set simulation
    PrimComp->SetSimulatePhysics(!Physics.IsStatic);
    PrimComp->SetEnableGravity(Physics.GravityEnabled);
}
```

### Unity

```csharp
using Demiurge.SDK;
using UnityEngine;

public class DRC369PhysicsLoader : MonoBehaviour
{
    public string tokenId;
    
    async void Start()
    {
        var client = new DemiurgeClient("https://rpc.demiurge.cloud:9944");
        var physics = await client.GetPhysics(tokenId);
        
        if (!physics.HasPhysics) return;
        
        var rb = GetComponent<Rigidbody>();
        if (rb == null) rb = gameObject.AddComponent<Rigidbody>();
        
        // Apply properties
        rb.mass = physics.Mass;
        rb.drag = physics.LinearDamping;
        rb.angularDrag = physics.AngularDamping;
        rb.isKinematic = physics.IsStatic;
        rb.useGravity = physics.GravityEnabled;
        
        // Apply material
        var collider = GetComponent<Collider>();
        if (collider != null)
        {
            var material = new PhysicMaterial();
            material.dynamicFriction = physics.Friction;
            material.staticFriction = physics.Friction;
            material.bounciness = physics.Restitution;
            collider.material = material;
        }
    }
}
```

### Godot

```gdscript
extends RigidBody3D

var token_id: String

func _ready():
    var client = DemiurgeClient.new()
    client.connect("https://rpc.demiurge.cloud:9944")
    
    var physics = await client.get_physics(token_id)
    if not physics.has_physics:
        return
    
    # Apply properties
    mass = physics.mass
    linear_damp = physics.linear_damping
    angular_damp = physics.angular_damping
    gravity_scale = 1.0 if physics.gravity_enabled else 0.0
    
    # Apply material
    var material = PhysicsMaterial.new()
    material.friction = physics.friction
    material.bounce = physics.restitution
    physics_material_override = material
```

---

## Validation Rules

Physics properties are validated before storage:

| Property | Valid Range | Default |
|----------|-------------|---------|
| `mass` | > 0 | 1.0 |
| `friction` | 0.0 - 1.0 | 0.5 |
| `restitution` | 0.0 - 1.0 | 0.3 |
| `linear_damping` | >= 0 | 0.0 |
| `angular_damping` | >= 0 | 0.0 |
| `density` | > 0 | 1000.0 |
| `hardness` | 0.0 - 1.0 | 0.5 |

Invalid values will be rejected with an error.

---

## Common Presets

### Sword/Weapon

```json
{
  "mass": 3.0,
  "friction": 0.4,
  "restitution": 0.1,
  "linear_damping": 0.1,
  "angular_damping": 0.1,
  "collision_shape": { "type": "box", "half_extents": [0.05, 0.5, 0.1] }
}
```

### Ball/Sphere

```json
{
  "mass": 0.5,
  "friction": 0.6,
  "restitution": 0.8,
  "linear_damping": 0.05,
  "angular_damping": 0.05,
  "collision_shape": { "type": "sphere", "radius": 0.15 }
}
```

### Crate/Box

```json
{
  "mass": 20.0,
  "friction": 0.7,
  "restitution": 0.2,
  "linear_damping": 0.2,
  "angular_damping": 0.2,
  "collision_shape": { "type": "box", "half_extents": [0.5, 0.5, 0.5] }
}
```

### Character Capsule

```json
{
  "mass": 70.0,
  "friction": 0.5,
  "restitution": 0.0,
  "linear_damping": 0.3,
  "angular_damping": 0.9,
  "collision_shape": { "type": "capsule", "radius": 0.3, "half_height": 0.8 }
}
```

---

## Best Practices

1. **Use realistic values** - Physics engines work best with real-world scales
2. **Keep mass reasonable** - 0.1 - 1000 kg typical range
3. **Test in target engines** - Behavior may vary slightly
4. **Document units** - Always specify kg, m, s
5. **Version your physics** - Update state when changing physics

---

## Storage

Physics data stored at:
```
DRC369:Physics:{token_id}
```

Serialized as JSON for flexibility and readability.

---

## Further Reading

- [DRC-369 Specification](./drc369.md)
- [Unreal Integration](../developers/game-engines/unreal.md)
- [Unity Integration](../developers/game-engines/unity.md)
