# Demiurge SDK for Unreal Engine 5

Connect your Unreal Engine game to the Demiurge Protocol - the Sovereign Creative Substrate for the Open Metaverse.

## Features

- **QOR ID Integration** - Universal player identity across all Demiurge-powered games
- **DRC-369 Assets** - Stateful NFTs that level up, gain XP, and remember their history
- **Physics-Ready** - On-chain physics properties map directly to UE5 components
- **Optimistic Updates** - Real-time gameplay with background chain confirmation
- **Royalty Tracking** - Automatic usage reporting for creator economics
- **Quantum-Safe** - Support for Dilithium3 signatures

## Installation

1. Copy the `DemiurgeSDK` folder to your project's `Plugins` directory
2. Enable the plugin in your project settings
3. Regenerate project files

```
YourProject/
├── Plugins/
│   └── DemiurgeSDK/
│       ├── DemiurgeSDK.uplugin
│       └── Source/
```

## Quick Start

### Connect to Demiurge

```cpp
// In your GameMode or PlayerController
UDemiurgeClient* Client = GetGameInstance()->GetSubsystem<UDemiurgeClient>();
Client->Connect(TEXT("https://rpc.demiurge.cloud"));
```

### Authenticate with QOR ID

```cpp
Client->OnIdentityReady.AddDynamic(this, &AMyGameMode::OnIdentityReady);
Client->Login(TEXT("alice"), TEXT("1234"));

void AMyGameMode::OnIdentityReady(const FQorIdentity& Identity)
{
    UE_LOG(LogTemp, Log, TEXT("Welcome, %s!"), *Identity.Handle);
}
```

### Load Player Assets

```cpp
Client->OnAssetsLoaded.AddDynamic(this, &AMyGameMode::OnAssetsLoaded);
Client->GetOwnedAssets();

void AMyGameMode::OnAssetsLoaded(const TArray<FDrc369Asset>& Assets)
{
    for (const FDrc369Asset& Asset : Assets)
    {
        UE_LOG(LogTemp, Log, TEXT("Asset: %s (Level %d)"), *Asset.Name, Asset.Level);
        
        // Apply physics to spawned actor
        if (AActor* Spawned = SpawnAssetActor(Asset))
        {
            UDemiurgeBlueprintLibrary::ApplyDrc369Physics(
                Spawned->FindComponentByClass<UPrimitiveComponent>(),
                Asset.Physics
            );
        }
    }
}
```

### Add XP to Assets

```cpp
// Award XP for defeating an enemy
Client->AddAssetXP(WeaponTokenId, 50);

// Listen for level ups
Client->OnAssetLevelUp.AddDynamic(this, &AMyGameMode::OnLevelUp);

void AMyGameMode::OnLevelUp(const FString& TokenId, int32 NewLevel)
{
    // Play level up VFX, show notification, etc.
}
```

### Track Usage for Royalties

```cpp
// In your Tick or when asset is rendered
void AMyCharacter::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);
    
    // Report that equipped weapon was rendered this frame
    if (UDemiurgeClient* Client = UDemiurgeBlueprintLibrary::GetDemiurgeClient(this))
    {
        Client->ReportAssetUsage(EquippedWeaponTokenId, true, false);
    }
}
```

## Blueprint Usage

The SDK is fully Blueprint-compatible:

1. **Get Demiurge Client**: Use `Get Demiurge Client` node
2. **Connect**: Call `Connect` with RPC URL
3. **Login**: Call `Login` with handle and PIN
4. **Bind Events**: Use `Bind Event to On Identity Ready`, `On Assets Loaded`, etc.

### Blueprint Nodes

| Node | Description |
|------|-------------|
| `Get Demiurge Client` | Get the client subsystem |
| `Connect` | Connect to RPC endpoint |
| `Login` / `Logout` | Authenticate with QOR ID |
| `Get Owned Assets` | Fetch player's DRC-369 assets |
| `Add Asset XP` | Award XP to an asset |
| `Transfer Asset` | Send asset to another player |
| `Get XP For Level` | Calculate XP required for a level |
| `Get Level From XP` | Calculate level from XP |
| `Get Rarity Color` | Get UI color for rarity |
| `Apply DRC369 Physics` | Apply on-chain physics to component |

## Asset Integration

### Multi-Resource Assets

DRC-369 assets can have multiple resource variants:

```cpp
FDrc369Resource Resource;
if (UDemiurgeBlueprintLibrary::GetResourceByType(Asset, TEXT("unreal_asset"), Resource))
{
    // Load the UE5-specific asset
    UObject* LoadedAsset = StaticLoadObject(UObject::StaticClass(), nullptr, *Resource.Uri);
}
```

### Physics Properties

On-chain physics properties map to UE5:

| DRC-369 | UE5 |
|---------|-----|
| `MassKg` | `SetMassOverrideInKg` |
| `Friction` | `UPhysicalMaterial::Friction` |
| `Restitution` | `UPhysicalMaterial::Restitution` |
| `Durability` | Custom damage system |

## Optimistic Updates

For responsive gameplay, optimistic updates are enabled by default:

```cpp
// UI updates immediately
Client->AddAssetXP(TokenId, 100);

// Get optimistic state (includes pending changes)
FDrc369Asset OptimisticState;
Client->GetOptimisticAssetState(TokenId, OptimisticState);

// When transaction confirms, optimistic state is cleared
// and real state is fetched from chain
```

Disable if you need strict consistency:

```cpp
Client->EnableOptimisticUpdates(false);
```

## Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `OnIdentityReady` | `FQorIdentity` | Login successful |
| `OnAssetLoaded` | `FDrc369Asset` | Single asset loaded |
| `OnAssetsLoaded` | `TArray<FDrc369Asset>` | All assets loaded |
| `OnTransactionComplete` | `FDemiurgeTransactionResult` | Chain transaction finished |
| `OnConnectionStateChanged` | `EDemiurgeConnectionState` | Connection state changed |
| `OnChainStatusUpdated` | `FDemiurgeChainStatus` | Chain status updated |
| `OnAssetXPGained` | `TokenId, NewXP` | Asset gained XP |
| `OnAssetLevelUp` | `TokenId, NewLevel` | Asset leveled up |

## Configuration

### Custom RPC Endpoint

For development/testnet:

```cpp
Client->Connect(TEXT("https://testnet.demiurge.cloud"));
```

### WebSocket for Real-Time Updates

```cpp
Client->Connect(
    TEXT("https://rpc.demiurge.cloud"),
    TEXT("wss://ws.demiurge.cloud")
);
```

## Security

- Session tokens are stored in memory only
- Quantum-safe signatures supported (Dilithium3)
- PIN-based authentication with on-chain verification

## Support

- Documentation: https://docs.demiurge.cloud/sdk/unreal
- Discord: https://discord.gg/demiurge
- GitHub: https://github.com/Alaustrup/Demiurge-Blockchain

## License

MIT License - See LICENSE file for details.
