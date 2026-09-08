# DRC-SDK: Unreal Engine 5 Integration Guide

**Build blockchain-connected games with Unreal Engine 5.3+**

> *"The Archons shape reality through divine will. In UE5, your Blueprints become that will."*

---

## Overview

This guide covers integrating the Demiurge Blockchain into Unreal Engine 5 projects using a lightweight C++ plugin with full Blueprint support. The architecture uses a `GameInstanceSubsystem` that persists across level transitions.

### Features

- **JSON-RPC over HTTP**: No heavy dependencies, uses UE5's built-in HTTP module
- **Blueprint Exposed**: All functions callable from Blueprints
- **Async Operations**: Non-blocking network calls with delegate callbacks
- **Persistent State**: Subsystem survives level changes

### Requirements

- Unreal Engine 5.3 or later
- C++ project (Blueprint-only projects need C++ enabled)
- Visual Studio 2022 or Rider

---

## Plugin Structure

Create the plugin in your project's `Plugins/` folder:

```
Plugins/
└── DemiurgeSDK/
    ├── DemiurgeSDK.uplugin
    ├── Source/
    │   └── DemiurgeSDK/
    │       ├── DemiurgeSDK.Build.cs
    │       ├── Public/
    │       │   ├── DemiurgeSDK.h
    │       │   ├── DemiurgeSubsystem.h
    │       │   └── DemiurgeTypes.h
    │       └── Private/
    │           ├── DemiurgeSDK.cpp
    │           └── DemiurgeSubsystem.cpp
    └── Resources/
        └── Icon128.png
```

---

## Step 1: Plugin Definition

### DemiurgeSDK.uplugin

```json
{
    "FileVersion": 3,
    "Version": 1,
    "VersionName": "1.0",
    "FriendlyName": "Demiurge SDK",
    "Description": "Integrate Demiurge Blockchain (DRC-369, CGT) into UE5 games",
    "Category": "Blockchain",
    "CreatedBy": "Demiurge Network",
    "CreatedByURL": "https://demiurge.cloud",
    "DocsURL": "https://docs.demiurge.cloud/drc-sdk/unreal",
    "MarketplaceURL": "",
    "SupportURL": "https://discord.gg/demiurge",
    "CanContainContent": false,
    "IsBetaVersion": false,
    "IsExperimentalVersion": false,
    "Installed": false,
    "Modules": [
        {
            "Name": "DemiurgeSDK",
            "Type": "Runtime",
            "LoadingPhase": "PreDefault"
        }
    ]
}
```

### DemiurgeSDK.Build.cs

```csharp
using UnrealBuildTool;

public class DemiurgeSDK : ModuleRules
{
    public DemiurgeSDK(ReadOnlyTargetRules Target) : base(Target)
    {
        PCHUsage = ModuleRules.PCHUsageMode.UseExplicitOrSharedPCHs;

        PublicDependencyModuleNames.AddRange(new string[] {
            "Core",
            "CoreUObject",
            "Engine",
            "HTTP",
            "Json",
            "JsonUtilities"
        });

        PrivateDependencyModuleNames.AddRange(new string[] {
            "Slate",
            "SlateCore"
        });
    }
}
```

---

## Step 2: Type Definitions

### DemiurgeTypes.h

```cpp
#pragma once

#include "CoreMinimal.h"
#include "DemiurgeTypes.generated.h"

/**
 * DRC-369 Resource Type
 */
UENUM(BlueprintType)
enum class EDemiurgeResourceType : uint8
{
    Image       UMETA(DisplayName = "Image"),
    Model3D     UMETA(DisplayName = "3D Model"),
    ModelVR     UMETA(DisplayName = "VR Model"),
    Sound       UMETA(DisplayName = "Sound"),
    Video       UMETA(DisplayName = "Video"),
    Document    UMETA(DisplayName = "Document")
};

/**
 * DRC-369 Resource Entry
 */
USTRUCT(BlueprintType)
struct DEMIURGESDK_API FDemiurgeResource
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Resource")
    EDemiurgeResourceType Type;

    UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Resource")
    FString URI;

    UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Resource")
    int32 Priority;

    UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Resource")
    TArray<FString> Contexts;
};

/**
 * DRC-369 Asset Data
 */
USTRUCT(BlueprintType)
struct DEMIURGESDK_API FDemiurgeAsset
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Asset")
    FString UUID;

    UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Asset")
    FString Name;

    UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Asset")
    FString Owner;

    UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Asset")
    TArray<FDemiurgeResource> Resources;

    UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Asset")
    int64 ExperiencePoints;

    UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Asset")
    int32 Level;

    UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Asset")
    int32 Durability;

    UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Asset")
    int32 KillCount;

    UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Asset")
    TArray<FString> ChildrenUUIDs;

    UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Asset")
    TMap<FString, FString> CustomState;
};

/**
 * CGT Balance Data (100 Sparks = 1 CGT)
 */
USTRUCT(BlueprintType)
struct DEMIURGESDK_API FDemiurgeBalance
{
    GENERATED_BODY()

    /** Free balance in Sparks (divide by 100 for CGT) */
    UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Balance")
    int64 FreeSparks;

    /** Reserved balance in Sparks */
    UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Balance")
    int64 ReservedSparks;

    /** Frozen balance in Sparks */
    UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Balance")
    int64 FrozenSparks;

    /** Free balance in CGT (computed) */
    UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Balance")
    float FreeCGT;
};

/**
 * Energy Data (Feeless Transaction Quota)
 */
USTRUCT(BlueprintType)
struct DEMIURGESDK_API FDemiurgeEnergy
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Energy")
    int32 Current;

    UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Energy")
    int32 Max;

    UPROPERTY(BlueprintReadOnly, Category = "Demiurge|Energy")
    float Percentage;
};
```

---

## Step 3: The Subsystem (Core SDK)

### DemiurgeSubsystem.h

```cpp
#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "Interfaces/IHttpRequest.h"
#include "DemiurgeTypes.h"
#include "DemiurgeSubsystem.generated.h"

// ============================================================================
// DELEGATES - For Blueprint Event Binding
// ============================================================================

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnWalletConnected, const FString&, WalletAddress);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnBalanceReceived, const FDemiurgeBalance&, Balance);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnEnergyReceived, const FDemiurgeEnergy&, Energy);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnAssetReceived, const FDemiurgeAsset&, Asset);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnAssetsListReceived, const TArray<FDemiurgeAsset>&, Assets);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnActionRecorded, const FString&, ActionID, bool, bSuccess);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnTextureLoaded, const FString&, Key, UTexture2D*, Texture);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnError, const FString&, ErrorMessage);

/**
 * UDemiurgeSubsystem
 * 
 * Core SDK for Demiurge Blockchain integration.
 * Persists across level transitions as a GameInstanceSubsystem.
 * All functions are Blueprint-callable with async delegate callbacks.
 */
UCLASS()
class DEMIURGESDK_API UDemiurgeSubsystem : public UGameInstanceSubsystem
{
    GENERATED_BODY()

public:
    // ========================================================================
    // LIFECYCLE
    // ========================================================================
    
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;
    virtual void Deinitialize() override;

    // ========================================================================
    // CONFIGURATION
    // ========================================================================
    
    /** RPC Endpoint URL */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Demiurge|Config")
    FString RPC_URL = TEXT("https://rpc.demiurge.cloud");

    /** Oracle Backend URL (your game server) */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Demiurge|Config")
    FString Oracle_URL = TEXT("https://api.yourgame.com");

    // ========================================================================
    // WALLET & IDENTITY
    // ========================================================================
    
    /** Connect a wallet address (from Qor ID or manual entry) */
    UFUNCTION(BlueprintCallable, Category = "Demiurge|Wallet")
    void ConnectWallet(const FString& WalletAddress);

    /** Disconnect current wallet */
    UFUNCTION(BlueprintCallable, Category = "Demiurge|Wallet")
    void DisconnectWallet();

    /** Get currently connected wallet address */
    UFUNCTION(BlueprintPure, Category = "Demiurge|Wallet")
    FString GetWalletAddress() const { return UserWalletAddress; }

    /** Check if wallet is connected */
    UFUNCTION(BlueprintPure, Category = "Demiurge|Wallet")
    bool IsWalletConnected() const { return !UserWalletAddress.IsEmpty(); }

    // ========================================================================
    // ECONOMY (CGT & Sparks)
    // ========================================================================
    
    /** Fetch CGT/Sparks balance for connected wallet */
    UFUNCTION(BlueprintCallable, Category = "Demiurge|Economy")
    void FetchBalance();

    /** Fetch energy for connected wallet */
    UFUNCTION(BlueprintCallable, Category = "Demiurge|Economy")
    void FetchEnergy();

    /** Get cached balance (call FetchBalance first) */
    UFUNCTION(BlueprintPure, Category = "Demiurge|Economy")
    FDemiurgeBalance GetCachedBalance() const { return CachedBalance; }

    // ========================================================================
    // DRC-369 ASSETS
    // ========================================================================
    
    /** Fetch a single DRC-369 asset by UUID */
    UFUNCTION(BlueprintCallable, Category = "Demiurge|Assets")
    void FetchAsset(const FString& UUID);

    /** Fetch all assets owned by connected wallet */
    UFUNCTION(BlueprintCallable, Category = "Demiurge|Assets")
    void FetchOwnedAssets();

    /** Fetch all assets delegated to connected wallet (rentals) */
    UFUNCTION(BlueprintCallable, Category = "Demiurge|Assets")
    void FetchDelegatedAssets();

    /** Get resource URL for a specific context (game, marketplace, vr) */
    UFUNCTION(BlueprintCallable, Category = "Demiurge|Assets")
    FString GetResourceForContext(const FDemiurgeAsset& Asset, const FString& Context);

    // ========================================================================
    // GAMEPLAY ACTIONS
    // ========================================================================
    
    /** Record a gameplay action (sends to Oracle for validation & reward) */
    UFUNCTION(BlueprintCallable, Category = "Demiurge|Gameplay")
    void RecordGameplayAction(const FString& ActionID, int32 Difficulty, const TMap<FString, FString>& Metadata);

    // ========================================================================
    // ASSET LOADING
    // ========================================================================
    
    /** Load texture from URL (for NFT skins) */
    UFUNCTION(BlueprintCallable, Category = "Demiurge|Loading")
    void LoadTextureFromURL(const FString& Key, const FString& URL);

    // ========================================================================
    // EVENTS (Blueprint Bindable)
    // ========================================================================
    
    UPROPERTY(BlueprintAssignable, Category = "Demiurge|Events")
    FOnWalletConnected OnWalletConnected;

    UPROPERTY(BlueprintAssignable, Category = "Demiurge|Events")
    FOnBalanceReceived OnBalanceReceived;

    UPROPERTY(BlueprintAssignable, Category = "Demiurge|Events")
    FOnEnergyReceived OnEnergyReceived;

    UPROPERTY(BlueprintAssignable, Category = "Demiurge|Events")
    FOnAssetReceived OnAssetReceived;

    UPROPERTY(BlueprintAssignable, Category = "Demiurge|Events")
    FOnAssetsListReceived OnAssetsListReceived;

    UPROPERTY(BlueprintAssignable, Category = "Demiurge|Events")
    FOnActionRecorded OnActionRecorded;

    UPROPERTY(BlueprintAssignable, Category = "Demiurge|Events")
    FOnTextureLoaded OnTextureLoaded;

    UPROPERTY(BlueprintAssignable, Category = "Demiurge|Events")
    FOnError OnError;

private:
    // ========================================================================
    // STATE
    // ========================================================================
    
    FString UserWalletAddress;
    FString SessionToken;
    FDemiurgeBalance CachedBalance;
    TMap<FString, FDemiurgeAsset> CachedAssets;

    // ========================================================================
    // INTERNAL METHODS
    // ========================================================================
    
    void SendRPCRequest(const FString& Method, const TArray<TSharedPtr<FJsonValue>>& Params, 
                        TFunction<void(TSharedPtr<FJsonObject>)> OnSuccess);
    
    void SendOracleRequest(const FString& Endpoint, const TSharedPtr<FJsonObject>& Body,
                           TFunction<void(TSharedPtr<FJsonObject>)> OnSuccess);

    // Response Handlers
    void OnBalanceResponse(TSharedPtr<FJsonObject> Result);
    void OnEnergyResponse(TSharedPtr<FJsonObject> Result);
    void OnAssetResponse(TSharedPtr<FJsonObject> Result);
    void OnAssetsListResponse(TSharedPtr<FJsonObject> Result);
    void OnActionResponse(TSharedPtr<FJsonObject> Result, const FString& ActionID);
    void OnTextureDownloaded(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bSuccess, FString Key);
};
```

### DemiurgeSubsystem.cpp

```cpp
#include "DemiurgeSubsystem.h"
#include "HttpModule.h"
#include "Interfaces/IHttpResponse.h"
#include "Dom/JsonObject.h"
#include "Serialization/JsonSerializer.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonWriter.h"
#include "IImageWrapperModule.h"
#include "IImageWrapper.h"
#include "Engine/Texture2D.h"

void UDemiurgeSubsystem::Initialize(FSubsystemCollectionBase& Collection)
{
    Super::Initialize(Collection);
    UE_LOG(LogTemp, Log, TEXT("Demiurge SDK Initialized - RPC: %s"), *RPC_URL);
}

void UDemiurgeSubsystem::Deinitialize()
{
    Super::Deinitialize();
}

// ============================================================================
// WALLET
// ============================================================================

void UDemiurgeSubsystem::ConnectWallet(const FString& WalletAddress)
{
    UserWalletAddress = WalletAddress;
    UE_LOG(LogTemp, Log, TEXT("Demiurge: Wallet connected - %s"), *WalletAddress);
    
    OnWalletConnected.Broadcast(WalletAddress);
    
    // Auto-fetch balance on connect
    FetchBalance();
    FetchEnergy();
}

void UDemiurgeSubsystem::DisconnectWallet()
{
    UserWalletAddress.Empty();
    SessionToken.Empty();
    CachedBalance = FDemiurgeBalance();
    CachedAssets.Empty();
}

// ============================================================================
// ECONOMY
// ============================================================================

void UDemiurgeSubsystem::FetchBalance()
{
    if (UserWalletAddress.IsEmpty())
    {
        OnError.Broadcast(TEXT("No wallet connected"));
        return;
    }

    TArray<TSharedPtr<FJsonValue>> Params;
    Params.Add(MakeShareable(new FJsonValueString(UserWalletAddress)));

    SendRPCRequest(TEXT("balances_getBalance"), Params, [this](TSharedPtr<FJsonObject> Result) {
        OnBalanceResponse(Result);
    });
}

void UDemiurgeSubsystem::OnBalanceResponse(TSharedPtr<FJsonObject> Result)
{
    if (!Result.IsValid()) return;

    // Parse balance (in Sparks)
    int64 FreeSparks = FCString::Atoi64(*Result->GetStringField(TEXT("free")));
    int64 ReservedSparks = FCString::Atoi64(*Result->GetStringField(TEXT("reserved")));
    int64 FrozenSparks = FCString::Atoi64(*Result->GetStringField(TEXT("frozen")));

    CachedBalance.FreeSparks = FreeSparks;
    CachedBalance.ReservedSparks = ReservedSparks;
    CachedBalance.FrozenSparks = FrozenSparks;
    CachedBalance.FreeCGT = FreeSparks / 100.0f; // 100 Sparks = 1 CGT

    OnBalanceReceived.Broadcast(CachedBalance);
}

void UDemiurgeSubsystem::FetchEnergy()
{
    if (UserWalletAddress.IsEmpty())
    {
        OnError.Broadcast(TEXT("No wallet connected"));
        return;
    }

    TArray<TSharedPtr<FJsonValue>> Params;
    Params.Add(MakeShareable(new FJsonValueString(UserWalletAddress)));

    SendRPCRequest(TEXT("energy_getEnergy"), Params, [this](TSharedPtr<FJsonObject> Result) {
        OnEnergyResponse(Result);
    });
}

void UDemiurgeSubsystem::OnEnergyResponse(TSharedPtr<FJsonObject> Result)
{
    if (!Result.IsValid()) return;

    FDemiurgeEnergy Energy;
    Energy.Current = Result->GetIntegerField(TEXT("current"));
    Energy.Max = Result->GetIntegerField(TEXT("max"));
    Energy.Percentage = Energy.Max > 0 ? (Energy.Current * 100.0f / Energy.Max) : 0.0f;

    OnEnergyReceived.Broadcast(Energy);
}

// ============================================================================
// DRC-369 ASSETS
// ============================================================================

void UDemiurgeSubsystem::FetchAsset(const FString& UUID)
{
    TArray<TSharedPtr<FJsonValue>> Params;
    Params.Add(MakeShareable(new FJsonValueString(UUID)));

    SendRPCRequest(TEXT("drc369_getAsset"), Params, [this](TSharedPtr<FJsonObject> Result) {
        OnAssetResponse(Result);
    });
}

void UDemiurgeSubsystem::OnAssetResponse(TSharedPtr<FJsonObject> Result)
{
    if (!Result.IsValid()) return;

    FDemiurgeAsset Asset;
    Asset.UUID = Result->GetStringField(TEXT("uuid"));
    Asset.Name = Result->GetStringField(TEXT("name"));
    Asset.Owner = Result->GetStringField(TEXT("owner"));
    Asset.ExperiencePoints = FCString::Atoi64(*Result->GetStringField(TEXT("experience_points")));
    Asset.Level = Result->GetIntegerField(TEXT("level"));
    Asset.Durability = Result->GetIntegerField(TEXT("durability"));
    Asset.KillCount = Result->GetIntegerField(TEXT("kill_count"));

    // Parse resources
    const TArray<TSharedPtr<FJsonValue>>* ResourcesArray;
    if (Result->TryGetArrayField(TEXT("resources"), ResourcesArray))
    {
        for (const auto& ResVal : *ResourcesArray)
        {
            TSharedPtr<FJsonObject> ResObj = ResVal->AsObject();
            FDemiurgeResource Resource;
            
            FString TypeStr = ResObj->GetStringField(TEXT("type"));
            if (TypeStr == TEXT("Image")) Resource.Type = EDemiurgeResourceType::Image;
            else if (TypeStr == TEXT("3D_Model")) Resource.Type = EDemiurgeResourceType::Model3D;
            else if (TypeStr == TEXT("VR_Model")) Resource.Type = EDemiurgeResourceType::ModelVR;
            else if (TypeStr == TEXT("Sound")) Resource.Type = EDemiurgeResourceType::Sound;
            
            Resource.URI = ResObj->GetStringField(TEXT("uri"));
            Resource.Priority = ResObj->GetIntegerField(TEXT("priority"));
            
            const TArray<TSharedPtr<FJsonValue>>* ContextsArray;
            if (ResObj->TryGetArrayField(TEXT("context"), ContextsArray))
            {
                for (const auto& CtxVal : *ContextsArray)
                {
                    Resource.Contexts.Add(CtxVal->AsString());
                }
            }
            
            Asset.Resources.Add(Resource);
        }
    }

    // Parse children UUIDs
    const TArray<TSharedPtr<FJsonValue>>* ChildrenArray;
    if (Result->TryGetArrayField(TEXT("children_uuids"), ChildrenArray))
    {
        for (const auto& ChildVal : *ChildrenArray)
        {
            Asset.ChildrenUUIDs.Add(ChildVal->AsString());
        }
    }

    // Cache and broadcast
    CachedAssets.Add(Asset.UUID, Asset);
    OnAssetReceived.Broadcast(Asset);
}

void UDemiurgeSubsystem::FetchOwnedAssets()
{
    if (UserWalletAddress.IsEmpty())
    {
        OnError.Broadcast(TEXT("No wallet connected"));
        return;
    }

    TArray<TSharedPtr<FJsonValue>> Params;
    Params.Add(MakeShareable(new FJsonValueString(UserWalletAddress)));

    SendRPCRequest(TEXT("drc369_getAssetsByOwner"), Params, [this](TSharedPtr<FJsonObject> Result) {
        OnAssetsListResponse(Result);
    });
}

void UDemiurgeSubsystem::FetchDelegatedAssets()
{
    if (UserWalletAddress.IsEmpty())
    {
        OnError.Broadcast(TEXT("No wallet connected"));
        return;
    }

    TArray<TSharedPtr<FJsonValue>> Params;
    Params.Add(MakeShareable(new FJsonValueString(UserWalletAddress)));

    SendRPCRequest(TEXT("drc369_getAssetsByUser"), Params, [this](TSharedPtr<FJsonObject> Result) {
        OnAssetsListResponse(Result);
    });
}

void UDemiurgeSubsystem::OnAssetsListResponse(TSharedPtr<FJsonObject> Result)
{
    // Parse array of assets (simplified - would iterate full parse)
    TArray<FDemiurgeAsset> Assets;
    // ... parse each asset ...
    OnAssetsListReceived.Broadcast(Assets);
}

FString UDemiurgeSubsystem::GetResourceForContext(const FDemiurgeAsset& Asset, const FString& Context)
{
    // Find highest priority resource matching context
    FDemiurgeResource* BestResource = nullptr;
    int32 BestPriority = -1;

    for (const FDemiurgeResource& Res : Asset.Resources)
    {
        if (Res.Contexts.Contains(Context) && Res.Priority > BestPriority)
        {
            BestPriority = Res.Priority;
            BestResource = const_cast<FDemiurgeResource*>(&Res);
        }
    }

    return BestResource ? BestResource->URI : FString();
}

// ============================================================================
// GAMEPLAY ACTIONS
// ============================================================================

void UDemiurgeSubsystem::RecordGameplayAction(const FString& ActionID, int32 Difficulty, 
                                               const TMap<FString, FString>& Metadata)
{
    if (UserWalletAddress.IsEmpty())
    {
        OnError.Broadcast(TEXT("No wallet connected"));
        return;
    }

    TSharedPtr<FJsonObject> Body = MakeShareable(new FJsonObject());
    Body->SetStringField(TEXT("player_address"), UserWalletAddress);
    Body->SetStringField(TEXT("action"), ActionID);
    Body->SetNumberField(TEXT("difficulty"), Difficulty);
    Body->SetStringField(TEXT("timestamp"), FDateTime::UtcNow().ToIso8601());

    // Add metadata
    TSharedPtr<FJsonObject> MetaObj = MakeShareable(new FJsonObject());
    for (const auto& Pair : Metadata)
    {
        MetaObj->SetStringField(Pair.Key, Pair.Value);
    }
    Body->SetObjectField(TEXT("metadata"), MetaObj);

    SendOracleRequest(TEXT("/api/record-action"), Body, [this, ActionID](TSharedPtr<FJsonObject> Result) {
        OnActionResponse(Result, ActionID);
    });
}

void UDemiurgeSubsystem::OnActionResponse(TSharedPtr<FJsonObject> Result, const FString& ActionID)
{
    if (!Result.IsValid())
    {
        OnActionRecorded.Broadcast(ActionID, false);
        return;
    }

    bool bSuccess = Result->GetBoolField(TEXT("success"));
    OnActionRecorded.Broadcast(ActionID, bSuccess);

    // Optionally refresh balance after successful action
    if (bSuccess)
    {
        FetchBalance();
    }
}

// ============================================================================
// ASSET LOADING
// ============================================================================

void UDemiurgeSubsystem::LoadTextureFromURL(const FString& Key, const FString& URL)
{
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = FHttpModule::Get().CreateRequest();
    Request->SetURL(URL);
    Request->SetVerb(TEXT("GET"));
    
    Request->OnProcessRequestComplete().BindUObject(this, &UDemiurgeSubsystem::OnTextureDownloaded, Key);
    Request->ProcessRequest();
}

void UDemiurgeSubsystem::OnTextureDownloaded(FHttpRequestPtr Request, FHttpResponsePtr Response, 
                                              bool bSuccess, FString Key)
{
    if (!bSuccess || !Response.IsValid())
    {
        OnError.Broadcast(FString::Printf(TEXT("Failed to download texture: %s"), *Key));
        return;
    }

    // Get image data
    TArray<uint8> ImageData = Response->GetContent();
    
    // Determine format from URL
    FString URL = Request->GetURL();
    EImageFormat Format = EImageFormat::PNG;
    if (URL.EndsWith(TEXT(".jpg")) || URL.EndsWith(TEXT(".jpeg")))
    {
        Format = EImageFormat::JPEG;
    }

    // Create texture
    IImageWrapperModule& ImageWrapperModule = FModuleManager::LoadModuleChecked<IImageWrapperModule>(TEXT("ImageWrapper"));
    TSharedPtr<IImageWrapper> ImageWrapper = ImageWrapperModule.CreateImageWrapper(Format);

    if (ImageWrapper.IsValid() && ImageWrapper->SetCompressed(ImageData.GetData(), ImageData.Num()))
    {
        TArray64<uint8> RawData;
        if (ImageWrapper->GetRaw(ERGBFormat::BGRA, 8, RawData))
        {
            UTexture2D* Texture = UTexture2D::CreateTransient(
                ImageWrapper->GetWidth(), 
                ImageWrapper->GetHeight(), 
                PF_B8G8R8A8
            );

            if (Texture)
            {
                void* TextureData = Texture->GetPlatformData()->Mips[0].BulkData.Lock(LOCK_READ_WRITE);
                FMemory::Memcpy(TextureData, RawData.GetData(), RawData.Num());
                Texture->GetPlatformData()->Mips[0].BulkData.Unlock();
                Texture->UpdateResource();

                OnTextureLoaded.Broadcast(Key, Texture);
                return;
            }
        }
    }

    OnError.Broadcast(FString::Printf(TEXT("Failed to process texture: %s"), *Key));
}

// ============================================================================
// INTERNAL HTTP HELPERS
// ============================================================================

void UDemiurgeSubsystem::SendRPCRequest(const FString& Method, const TArray<TSharedPtr<FJsonValue>>& Params,
                                         TFunction<void(TSharedPtr<FJsonObject>)> OnSuccess)
{
    // Build JSON-RPC payload
    TSharedPtr<FJsonObject> Payload = MakeShareable(new FJsonObject());
    Payload->SetStringField(TEXT("jsonrpc"), TEXT("2.0"));
    Payload->SetStringField(TEXT("method"), Method);
    Payload->SetArrayField(TEXT("params"), Params);
    Payload->SetNumberField(TEXT("id"), FMath::RandRange(1, 1000000));

    FString JsonString;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&JsonString);
    FJsonSerializer::Serialize(Payload.ToSharedRef(), Writer);

    // Send request
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = FHttpModule::Get().CreateRequest();
    Request->SetURL(RPC_URL);
    Request->SetVerb(TEXT("POST"));
    Request->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
    Request->SetContentAsString(JsonString);

    Request->OnProcessRequestComplete().BindLambda(
        [OnSuccess, this](FHttpRequestPtr Req, FHttpResponsePtr Res, bool bSuccess) {
            if (!bSuccess || !Res.IsValid())
            {
                OnError.Broadcast(TEXT("RPC request failed"));
                return;
            }

            TSharedPtr<FJsonObject> ResponseObj;
            TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Res->GetContentAsString());
            
            if (FJsonSerializer::Deserialize(Reader, ResponseObj) && ResponseObj.IsValid())
            {
                if (ResponseObj->HasField(TEXT("error")))
                {
                    FString ErrorMsg = ResponseObj->GetObjectField(TEXT("error"))->GetStringField(TEXT("message"));
                    OnError.Broadcast(ErrorMsg);
                    return;
                }

                TSharedPtr<FJsonObject> Result = ResponseObj->GetObjectField(TEXT("result"));
                OnSuccess(Result);
            }
        });

    Request->ProcessRequest();
}

void UDemiurgeSubsystem::SendOracleRequest(const FString& Endpoint, const TSharedPtr<FJsonObject>& Body,
                                            TFunction<void(TSharedPtr<FJsonObject>)> OnSuccess)
{
    FString JsonString;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&JsonString);
    FJsonSerializer::Serialize(Body.ToSharedRef(), Writer);

    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = FHttpModule::Get().CreateRequest();
    Request->SetURL(Oracle_URL + Endpoint);
    Request->SetVerb(TEXT("POST"));
    Request->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
    Request->SetHeader(TEXT("Authorization"), FString::Printf(TEXT("Bearer %s"), *SessionToken));
    Request->SetContentAsString(JsonString);

    Request->OnProcessRequestComplete().BindLambda(
        [OnSuccess, this](FHttpRequestPtr Req, FHttpResponsePtr Res, bool bSuccess) {
            if (!bSuccess || !Res.IsValid())
            {
                OnError.Broadcast(TEXT("Oracle request failed"));
                return;
            }

            TSharedPtr<FJsonObject> ResponseObj;
            TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Res->GetContentAsString());
            
            if (FJsonSerializer::Deserialize(Reader, ResponseObj))
            {
                OnSuccess(ResponseObj);
            }
        });

    Request->ProcessRequest();
}
```

---

## Step 4: Blueprint Integration

### Accessing the Subsystem

In any Blueprint:

```
Get Game Instance → Get Subsystem (Class: DemiurgeSubsystem) → [Your Node]
```

### Example: Main Menu Login

1. Create a Widget Blueprint `WBP_MainMenu`
2. Add a "Connect Wallet" button
3. On Click:
   - Get Demiurge Subsystem
   - Call `ConnectWallet` with address from text input
4. Bind to `OnWalletConnected` event to show balance

### Example: Enemy Death Reward

In your Enemy Blueprint (`BP_Enemy`):

```
Event: On Death
├── Get Demiurge Subsystem
├── Record Gameplay Action
│   ├── ActionID: "kill_enemy_elite"
│   ├── Difficulty: 100
│   └── Metadata: { "enemy_type": "Elite Goblin" }
└── Play Death Animation
```

### Example: NFT Skin Loading

In your Player Blueprint:

```
Event: Begin Play
├── Get Demiurge Subsystem
├── Fetch Owned Assets
└── Bind to OnAssetsListReceived

Event: OnAssetsListReceived
├── For Each Asset:
│   ├── Get Resource For Context (Context: "game")
│   └── If Valid:
│       └── Load Texture From URL
└── Bind to OnTextureLoaded

Event: OnTextureLoaded
├── Create Dynamic Material Instance
├── Set Texture Parameter
└── Set Material on Skeletal Mesh
```

---

## Step 5: Game Economy Strategy

### Sparks (Soft Currency) - Off-Chain First

For high-frequency rewards (enemy kills, coin pickups):

1. Track "Pending Sparks" in a local variable
2. Show UI updates immediately (optimistic)
3. Batch-send to Oracle every 30 seconds or on level complete
4. Allow "Claim" action at Bank NPC to bridge to chain

### CGT (Hard Currency) - On-Chain

For significant transactions (marketplace, crafting):

1. Always verify ownership via RPC before allowing action
2. Route through Oracle for signing
3. Wait for transaction confirmation before delivering item

### NFT Verification (VIP Zones)

```cpp
// Blueprint-callable function to check NFT ownership
UFUNCTION(BlueprintCallable, Category = "Demiurge|Verification")
void VerifyAssetOwnership(const FString& ContractAddress, const FString& TokenID, 
                          FOnOwnershipVerified OnComplete);
```

---

## Security Checklist

- [ ] Never store private keys in C++ or Blueprints
- [ ] Always validate actions server-side (Oracle)
- [ ] Use HTTPS for all RPC calls
- [ ] Implement rate limiting on Oracle endpoints
- [ ] Don't trust client-reported scores or kills
- [ ] Cache RPC responses to reduce network traffic
- [ ] Handle network failures gracefully (offline mode)

---

## Troubleshooting

### "Module not found" on build

Ensure `DemiurgeSDK` is listed in your project's `.uproject` file under `Plugins`.

### HTTP requests timing out

Check firewall settings. The Demiurge RPC endpoint uses standard HTTPS (port 443).

### Textures not loading

Verify the image URL is accessible and returns proper CORS headers. IPFS gateways may need a proxy.

### Balance showing 0

Ensure the wallet address format is correct (0x-prefixed hex string). Check RPC endpoint connectivity.

---

## Next Steps

1. **[Oracle Backend Guide](./ORACLE_BACKEND.md)** - Set up your secure game server
2. **[DRC-369 Deep Dive](../creators/drc369-complete-guide.md)** - Advanced NFT features
3. **[Session Keys](../developers/session-keys-integration.md)** - Seamless authentication

---

**The Archons guard the gates. The code serves the will.**

---

*Last Updated: January 26, 2026*  
*Document Version: 1.0*  
*Maintainer: Alaustrup*
