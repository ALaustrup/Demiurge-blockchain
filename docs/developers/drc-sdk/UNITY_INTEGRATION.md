# DRC-SDK: Unity 6 Integration Guide

**Build blockchain-connected games with Unity 6 and Unity 2022 LTS+**

> *"The Aeons weave threads of creation. In Unity, your scripts become those threads."*

---

## Overview

This guide covers integrating the Demiurge Blockchain into Unity projects using a lightweight C# Singleton Manager with async/await patterns. The architecture ensures your game runs at 60+ FPS while querying the blockchain in the background.

### Features

- **Native C# async/await**: Non-blocking HTTP calls using `UnityWebRequest`
- **Singleton Pattern**: Persists across scene transitions via `DontDestroyOnLoad`
- **Event-Driven**: Subscribe to blockchain events from any script
- **Zero Dependencies**: Uses Unity's built-in networking (no third-party DLLs)

### Requirements

- Unity 6 (or Unity 2022.3 LTS+)
- .NET Standard 2.1 or .NET 6+
- Newtonsoft.Json (via Package Manager, optional but recommended)

---

## Project Structure

```
Assets/
└── Scripts/
    └── DemiurgeSDK/
        ├── DemiurgeManager.cs      # Core singleton
        ├── DemiurgeTypes.cs        # Data structures
        ├── DemiurgeEvents.cs       # Event definitions
        └── Utilities/
            ├── NFTTextureLoader.cs  # Runtime texture loading
            └── JsonRpcClient.cs     # HTTP helper
```

---

## Step 1: Type Definitions

### DemiurgeTypes.cs

```csharp
using System;
using System.Collections.Generic;
using UnityEngine;

namespace DemiurgeSDK
{
    /// <summary>
    /// DRC-369 Resource Type
    /// </summary>
    public enum ResourceType
    {
        Image,
        Model3D,
        ModelVR,
        Sound,
        Video,
        Document
    }

    /// <summary>
    /// DRC-369 Resource Entry
    /// </summary>
    [Serializable]
    public class DemiurgeResource
    {
        public ResourceType type;
        public string uri;
        public int priority;
        public List<string> context;
    }

    /// <summary>
    /// DRC-369 Asset Data
    /// </summary>
    [Serializable]
    public class DemiurgeAsset
    {
        public string uuid;
        public string name;
        public string owner;
        public List<DemiurgeResource> resources;
        public long experience_points;
        public int level;
        public int durability;
        public int kill_count;
        public List<string> children_uuids;
        public Dictionary<string, string> custom_state;
        
        /// <summary>
        /// Get the best resource for a given context (game, marketplace, vr)
        /// </summary>
        public DemiurgeResource GetResourceForContext(string contextName)
        {
            DemiurgeResource best = null;
            int bestPriority = -1;
            
            foreach (var res in resources)
            {
                if (res.context.Contains(contextName) && res.priority > bestPriority)
                {
                    best = res;
                    bestPriority = res.priority;
                }
            }
            
            return best;
        }
    }

    /// <summary>
    /// CGT Balance Data (100 Sparks = 1 CGT)
    /// </summary>
    [Serializable]
    public class DemiurgeBalance
    {
        public long free_sparks;
        public long reserved_sparks;
        public long frozen_sparks;
        
        /// <summary>
        /// Free balance in CGT (computed from Sparks)
        /// </summary>
        public float FreeCGT => free_sparks / 100f;
        
        /// <summary>
        /// Total balance in CGT
        /// </summary>
        public float TotalCGT => (free_sparks + reserved_sparks) / 100f;
    }

    /// <summary>
    /// Energy Data (Feeless Transaction Quota)
    /// </summary>
    [Serializable]
    public class DemiurgeEnergy
    {
        public int current;
        public int max;
        
        public float Percentage => max > 0 ? (current * 100f / max) : 0f;
    }

    /// <summary>
    /// Delegation/Rental Info
    /// </summary>
    [Serializable]
    public class DelegationInfo
    {
        public string delegated_user;
        public long expires_at_block;
        public long delegated_at_block;
    }

    /// <summary>
    /// Gameplay Action Result
    /// </summary>
    [Serializable]
    public class ActionResult
    {
        public bool success;
        public string tx_hash;
        public float reward_amount;
        public string error;
    }
}
```

---

## Step 2: The Core Manager

### DemiurgeManager.cs

```csharp
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace DemiurgeSDK
{
    /// <summary>
    /// DemiurgeManager - Core SDK for Demiurge Blockchain integration.
    /// Singleton that persists across scenes.
    /// </summary>
    public class DemiurgeManager : MonoBehaviour
    {
        // ====================================================================
        // SINGLETON
        // ====================================================================
        
        public static DemiurgeManager Instance { get; private set; }

        // ====================================================================
        // CONFIGURATION
        // ====================================================================
        
        [Header("Demiurge Configuration")]
        [SerializeField] private string rpcUrl = "https://rpc.demiurge.cloud";
        [SerializeField] private string oracleUrl = "https://api.yourgame.com";
        
        public string RpcUrl => rpcUrl;
        public string OracleUrl => oracleUrl;

        // ====================================================================
        // STATE
        // ====================================================================
        
        private string _walletAddress;
        private string _sessionToken;
        private DemiurgeBalance _cachedBalance;
        private DemiurgeEnergy _cachedEnergy;
        private Dictionary<string, DemiurgeAsset> _cachedAssets = new();
        
        public string WalletAddress => _walletAddress;
        public bool IsConnected => !string.IsNullOrEmpty(_walletAddress);
        public DemiurgeBalance CachedBalance => _cachedBalance;
        public DemiurgeEnergy CachedEnergy => _cachedEnergy;

        // ====================================================================
        // EVENTS
        // ====================================================================
        
        /// <summary>Fired when wallet is connected</summary>
        public event Action<string> OnWalletConnected;
        
        /// <summary>Fired when wallet is disconnected</summary>
        public event Action OnWalletDisconnected;
        
        /// <summary>Fired when balance is updated (Sparks, CGT)</summary>
        public event Action<DemiurgeBalance> OnBalanceUpdated;
        
        /// <summary>Fired when energy is updated</summary>
        public event Action<DemiurgeEnergy> OnEnergyUpdated;
        
        /// <summary>Fired when a single asset is loaded</summary>
        public event Action<DemiurgeAsset> OnAssetLoaded;
        
        /// <summary>Fired when asset list is loaded</summary>
        public event Action<List<DemiurgeAsset>> OnAssetsListLoaded;
        
        /// <summary>Fired when gameplay action is recorded</summary>
        public event Action<string, ActionResult> OnActionRecorded;
        
        /// <summary>Fired on any error</summary>
        public event Action<string> OnError;

        // ====================================================================
        // LIFECYCLE
        // ====================================================================
        
        private void Awake()
        {
            // Singleton enforcement
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            
            Instance = this;
            DontDestroyOnLoad(gameObject);
            
            Debug.Log($"[DemiurgeSDK] Initialized - RPC: {rpcUrl}");
        }

        // ====================================================================
        // WALLET & IDENTITY
        // ====================================================================
        
        /// <summary>
        /// Connect a wallet address (from Qor ID login or manual entry)
        /// </summary>
        public void ConnectWallet(string address, string sessionToken = null)
        {
            _walletAddress = address;
            _sessionToken = sessionToken;
            
            Debug.Log($"[DemiurgeSDK] Wallet connected: {address}");
            OnWalletConnected?.Invoke(address);
            
            // Auto-fetch balance and energy on connect
            _ = FetchBalanceAsync();
            _ = FetchEnergyAsync();
        }

        /// <summary>
        /// Disconnect current wallet
        /// </summary>
        public void DisconnectWallet()
        {
            _walletAddress = null;
            _sessionToken = null;
            _cachedBalance = null;
            _cachedEnergy = null;
            _cachedAssets.Clear();
            
            OnWalletDisconnected?.Invoke();
        }

        // ====================================================================
        // ECONOMY (CGT & Sparks)
        // ====================================================================
        
        /// <summary>
        /// Fetch CGT/Sparks balance for connected wallet
        /// </summary>
        public async Task<DemiurgeBalance> FetchBalanceAsync()
        {
            if (!IsConnected)
            {
                OnError?.Invoke("No wallet connected");
                return null;
            }

            try
            {
                var result = await SendRpcRequestAsync("balances_getBalance", new object[] { _walletAddress });
                
                _cachedBalance = new DemiurgeBalance
                {
                    free_sparks = long.Parse(result["free"]?.ToString() ?? "0"),
                    reserved_sparks = long.Parse(result["reserved"]?.ToString() ?? "0"),
                    frozen_sparks = long.Parse(result["frozen"]?.ToString() ?? "0")
                };
                
                OnBalanceUpdated?.Invoke(_cachedBalance);
                return _cachedBalance;
            }
            catch (Exception e)
            {
                OnError?.Invoke($"Failed to fetch balance: {e.Message}");
                return null;
            }
        }

        /// <summary>
        /// Fetch energy for connected wallet (feeless transaction quota)
        /// </summary>
        public async Task<DemiurgeEnergy> FetchEnergyAsync()
        {
            if (!IsConnected)
            {
                OnError?.Invoke("No wallet connected");
                return null;
            }

            try
            {
                var result = await SendRpcRequestAsync("energy_getEnergy", new object[] { _walletAddress });
                
                _cachedEnergy = new DemiurgeEnergy
                {
                    current = int.Parse(result["current"]?.ToString() ?? "0"),
                    max = int.Parse(result["max"]?.ToString() ?? "1000")
                };
                
                OnEnergyUpdated?.Invoke(_cachedEnergy);
                return _cachedEnergy;
            }
            catch (Exception e)
            {
                OnError?.Invoke($"Failed to fetch energy: {e.Message}");
                return null;
            }
        }

        /// <summary>
        /// Non-async version for Unity event callbacks
        /// </summary>
        public async void FetchBalance() => await FetchBalanceAsync();
        public async void FetchEnergy() => await FetchEnergyAsync();

        // ====================================================================
        // DRC-369 ASSETS
        // ====================================================================
        
        /// <summary>
        /// Fetch a single DRC-369 asset by UUID
        /// </summary>
        public async Task<DemiurgeAsset> FetchAssetAsync(string uuid)
        {
            try
            {
                var result = await SendRpcRequestAsync("drc369_getAsset", new object[] { uuid });
                var asset = ParseAsset(result);
                
                _cachedAssets[uuid] = asset;
                OnAssetLoaded?.Invoke(asset);
                
                return asset;
            }
            catch (Exception e)
            {
                OnError?.Invoke($"Failed to fetch asset {uuid}: {e.Message}");
                return null;
            }
        }

        /// <summary>
        /// Fetch all assets owned by connected wallet
        /// </summary>
        public async Task<List<DemiurgeAsset>> FetchOwnedAssetsAsync()
        {
            if (!IsConnected)
            {
                OnError?.Invoke("No wallet connected");
                return null;
            }

            try
            {
                var result = await SendRpcRequestAsync("drc369_getAssetsByOwner", new object[] { _walletAddress });
                var assets = ParseAssetList(result);
                
                foreach (var asset in assets)
                {
                    _cachedAssets[asset.uuid] = asset;
                }
                
                OnAssetsListLoaded?.Invoke(assets);
                return assets;
            }
            catch (Exception e)
            {
                OnError?.Invoke($"Failed to fetch owned assets: {e.Message}");
                return null;
            }
        }

        /// <summary>
        /// Fetch all assets delegated to connected wallet (rentals)
        /// </summary>
        public async Task<List<DemiurgeAsset>> FetchDelegatedAssetsAsync()
        {
            if (!IsConnected)
            {
                OnError?.Invoke("No wallet connected");
                return null;
            }

            try
            {
                var result = await SendRpcRequestAsync("drc369_getAssetsByUser", new object[] { _walletAddress });
                var assets = ParseAssetList(result);
                
                OnAssetsListLoaded?.Invoke(assets);
                return assets;
            }
            catch (Exception e)
            {
                OnError?.Invoke($"Failed to fetch delegated assets: {e.Message}");
                return null;
            }
        }

        /// <summary>
        /// Get cached asset (call FetchAssetAsync first if not cached)
        /// </summary>
        public DemiurgeAsset GetCachedAsset(string uuid)
        {
            return _cachedAssets.TryGetValue(uuid, out var asset) ? asset : null;
        }

        // ====================================================================
        // GAMEPLAY ACTIONS
        // ====================================================================
        
        /// <summary>
        /// Record a gameplay action (sends to Oracle for validation & reward)
        /// </summary>
        public async Task<ActionResult> RecordGameplayActionAsync(string actionId, int difficulty, 
            Dictionary<string, string> metadata = null)
        {
            if (!IsConnected)
            {
                OnError?.Invoke("No wallet connected");
                return new ActionResult { success = false, error = "No wallet connected" };
            }

            try
            {
                var body = new Dictionary<string, object>
                {
                    ["player_address"] = _walletAddress,
                    ["action"] = actionId,
                    ["difficulty"] = difficulty,
                    ["timestamp"] = DateTime.UtcNow.ToString("O"),
                    ["metadata"] = metadata ?? new Dictionary<string, string>()
                };

                var result = await SendOracleRequestAsync("/api/record-action", body);
                
                var actionResult = new ActionResult
                {
                    success = result["success"]?.ToObject<bool>() ?? false,
                    tx_hash = result["tx_hash"]?.ToString(),
                    reward_amount = result["reward_amount"]?.ToObject<float>() ?? 0f,
                    error = result["error"]?.ToString()
                };
                
                OnActionRecorded?.Invoke(actionId, actionResult);
                
                // Refresh balance after successful action
                if (actionResult.success)
                {
                    _ = FetchBalanceAsync();
                }
                
                return actionResult;
            }
            catch (Exception e)
            {
                var errorResult = new ActionResult { success = false, error = e.Message };
                OnActionRecorded?.Invoke(actionId, errorResult);
                return errorResult;
            }
        }

        /// <summary>
        /// Non-async version for Unity event callbacks
        /// </summary>
        public async void RecordGameplayAction(string actionId, int difficulty)
        {
            await RecordGameplayActionAsync(actionId, difficulty);
        }

        // ====================================================================
        // INTERNAL HTTP METHODS
        // ====================================================================
        
        private async Task<JObject> SendRpcRequestAsync(string method, object[] parameters)
        {
            var payload = new
            {
                jsonrpc = "2.0",
                method = method,
                @params = parameters,
                id = UnityEngine.Random.Range(1, 1000000)
            };

            string json = JsonConvert.SerializeObject(payload);
            
            using var request = new UnityWebRequest(rpcUrl, "POST");
            byte[] bodyRaw = Encoding.UTF8.GetBytes(json);
            request.uploadHandler = new UploadHandlerRaw(bodyRaw);
            request.downloadHandler = new DownloadHandlerBuffer();
            request.SetRequestHeader("Content-Type", "application/json");

            var operation = request.SendWebRequest();
            
            while (!operation.isDone)
                await Task.Yield();

            if (request.result != UnityWebRequest.Result.Success)
            {
                throw new Exception($"RPC Error: {request.error}");
            }

            var response = JObject.Parse(request.downloadHandler.text);
            
            if (response["error"] != null)
            {
                throw new Exception($"RPC Error: {response["error"]["message"]}");
            }

            return response["result"] as JObject;
        }

        private async Task<JObject> SendOracleRequestAsync(string endpoint, Dictionary<string, object> body)
        {
            string json = JsonConvert.SerializeObject(body);
            
            using var request = new UnityWebRequest(oracleUrl + endpoint, "POST");
            byte[] bodyRaw = Encoding.UTF8.GetBytes(json);
            request.uploadHandler = new UploadHandlerRaw(bodyRaw);
            request.downloadHandler = new DownloadHandlerBuffer();
            request.SetRequestHeader("Content-Type", "application/json");
            
            if (!string.IsNullOrEmpty(_sessionToken))
            {
                request.SetRequestHeader("Authorization", $"Bearer {_sessionToken}");
            }

            var operation = request.SendWebRequest();
            
            while (!operation.isDone)
                await Task.Yield();

            if (request.result != UnityWebRequest.Result.Success)
            {
                throw new Exception($"Oracle Error: {request.error}");
            }

            return JObject.Parse(request.downloadHandler.text);
        }

        // ====================================================================
        // PARSING HELPERS
        // ====================================================================
        
        private DemiurgeAsset ParseAsset(JObject data)
        {
            var asset = new DemiurgeAsset
            {
                uuid = data["uuid"]?.ToString(),
                name = data["name"]?.ToString(),
                owner = data["owner"]?.ToString(),
                experience_points = data["experience_points"]?.ToObject<long>() ?? 0,
                level = data["level"]?.ToObject<int>() ?? 1,
                durability = data["durability"]?.ToObject<int>() ?? 100,
                kill_count = data["kill_count"]?.ToObject<int>() ?? 0,
                resources = new List<DemiurgeResource>(),
                children_uuids = new List<string>(),
                custom_state = new Dictionary<string, string>()
            };

            // Parse resources
            if (data["resources"] is JArray resourcesArray)
            {
                foreach (JObject res in resourcesArray)
                {
                    var resource = new DemiurgeResource
                    {
                        uri = res["uri"]?.ToString(),
                        priority = res["priority"]?.ToObject<int>() ?? 0,
                        context = res["context"]?.ToObject<List<string>>() ?? new List<string>()
                    };
                    
                    var typeStr = res["type"]?.ToString();
                    resource.type = typeStr switch
                    {
                        "Image" => ResourceType.Image,
                        "3D_Model" => ResourceType.Model3D,
                        "VR_Model" => ResourceType.ModelVR,
                        "Sound" => ResourceType.Sound,
                        _ => ResourceType.Image
                    };
                    
                    asset.resources.Add(resource);
                }
            }

            // Parse children
            if (data["children_uuids"] is JArray childrenArray)
            {
                foreach (var child in childrenArray)
                {
                    asset.children_uuids.Add(child.ToString());
                }
            }

            // Parse custom state
            if (data["custom_state"] is JObject customState)
            {
                foreach (var prop in customState.Properties())
                {
                    asset.custom_state[prop.Name] = prop.Value.ToString();
                }
            }

            return asset;
        }

        private List<DemiurgeAsset> ParseAssetList(JObject data)
        {
            var assets = new List<DemiurgeAsset>();
            
            if (data["assets"] is JArray assetsArray)
            {
                foreach (JObject assetData in assetsArray)
                {
                    assets.Add(ParseAsset(assetData));
                }
            }
            
            return assets;
        }
    }
}
```

---

## Step 3: NFT Texture Loader

### NFTTextureLoader.cs

```csharp
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;

namespace DemiurgeSDK
{
    /// <summary>
    /// Utility for loading NFT textures at runtime and applying to materials
    /// </summary>
    public class NFTTextureLoader : MonoBehaviour
    {
        [Header("Configuration")]
        [SerializeField] private string assetUUID;
        [SerializeField] private string resourceContext = "game";
        [SerializeField] private Renderer targetRenderer;
        [SerializeField] private int materialIndex = 0;
        [SerializeField] private string textureProperty = "_MainTex";
        
        [Header("Options")]
        [SerializeField] private bool loadOnStart = true;
        [SerializeField] private bool createMaterialInstance = true;

        private Material _materialInstance;
        
        /// <summary>
        /// Event fired when texture is loaded
        /// </summary>
        public event System.Action<Texture2D> OnTextureLoaded;

        private async void Start()
        {
            if (loadOnStart && !string.IsNullOrEmpty(assetUUID))
            {
                await LoadAssetTexture(assetUUID, resourceContext);
            }
        }

        /// <summary>
        /// Load texture for a DRC-369 asset
        /// </summary>
        public async Task<Texture2D> LoadAssetTexture(string uuid, string context = "game")
        {
            // Get asset from cache or fetch
            var asset = DemiurgeManager.Instance.GetCachedAsset(uuid);
            if (asset == null)
            {
                asset = await DemiurgeManager.Instance.FetchAssetAsync(uuid);
            }
            
            if (asset == null) return null;
            
            // Get resource URL for context
            var resource = asset.GetResourceForContext(context);
            if (resource == null || string.IsNullOrEmpty(resource.uri))
            {
                Debug.LogWarning($"[NFTTextureLoader] No {context} resource found for asset {uuid}");
                return null;
            }
            
            return await LoadTextureFromURL(resource.uri);
        }

        /// <summary>
        /// Load texture directly from URL
        /// </summary>
        public async Task<Texture2D> LoadTextureFromURL(string url)
        {
            Debug.Log($"[NFTTextureLoader] Loading texture from: {url}");
            
            using var request = UnityWebRequestTexture.GetTexture(url);
            
            var operation = request.SendWebRequest();
            
            while (!operation.isDone)
                await Task.Yield();

            if (request.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError($"[NFTTextureLoader] Failed to load texture: {request.error}");
                return null;
            }

            var texture = DownloadHandlerTexture.GetContent(request);
            
            // Apply to renderer if configured
            if (targetRenderer != null && texture != null)
            {
                ApplyTexture(texture);
            }
            
            OnTextureLoaded?.Invoke(texture);
            return texture;
        }

        /// <summary>
        /// Apply texture to the target renderer
        /// </summary>
        public void ApplyTexture(Texture2D texture)
        {
            if (targetRenderer == null) return;

            if (createMaterialInstance && _materialInstance == null)
            {
                // Create a material instance to avoid modifying shared materials
                _materialInstance = new Material(targetRenderer.materials[materialIndex]);
                var materials = targetRenderer.materials;
                materials[materialIndex] = _materialInstance;
                targetRenderer.materials = materials;
            }

            var mat = _materialInstance ?? targetRenderer.materials[materialIndex];
            mat.SetTexture(textureProperty, texture);
            
            Debug.Log($"[NFTTextureLoader] Texture applied to {targetRenderer.gameObject.name}");
        }

        private void OnDestroy()
        {
            // Clean up material instance
            if (_materialInstance != null)
            {
                Destroy(_materialInstance);
            }
        }
    }
}
```

---

## Step 4: Gameplay Integration

### Player HUD Controller

```csharp
using UnityEngine;
using TMPro;
using DemiurgeSDK;

public class PlayerHUD : MonoBehaviour
{
    [Header("UI References")]
    [SerializeField] private TextMeshProUGUI balanceText;
    [SerializeField] private TextMeshProUGUI energyText;
    [SerializeField] private UnityEngine.UI.Slider energyBar;
    [SerializeField] private GameObject connectionPanel;

    private void Start()
    {
        // Subscribe to Demiurge events
        DemiurgeManager.Instance.OnWalletConnected += OnWalletConnected;
        DemiurgeManager.Instance.OnWalletDisconnected += OnWalletDisconnected;
        DemiurgeManager.Instance.OnBalanceUpdated += OnBalanceUpdated;
        DemiurgeManager.Instance.OnEnergyUpdated += OnEnergyUpdated;
        DemiurgeManager.Instance.OnError += OnError;
        
        // Update UI based on current state
        if (DemiurgeManager.Instance.IsConnected)
        {
            OnWalletConnected(DemiurgeManager.Instance.WalletAddress);
        }
    }

    private void OnDestroy()
    {
        // Always unsubscribe to prevent memory leaks
        if (DemiurgeManager.Instance != null)
        {
            DemiurgeManager.Instance.OnWalletConnected -= OnWalletConnected;
            DemiurgeManager.Instance.OnWalletDisconnected -= OnWalletDisconnected;
            DemiurgeManager.Instance.OnBalanceUpdated -= OnBalanceUpdated;
            DemiurgeManager.Instance.OnEnergyUpdated -= OnEnergyUpdated;
            DemiurgeManager.Instance.OnError -= OnError;
        }
    }

    private void OnWalletConnected(string address)
    {
        connectionPanel?.SetActive(false);
        Debug.Log($"Connected: {address}");
    }

    private void OnWalletDisconnected()
    {
        connectionPanel?.SetActive(true);
        balanceText.text = "-- CGT";
    }

    private void OnBalanceUpdated(DemiurgeBalance balance)
    {
        balanceText.text = $"{balance.FreeCGT:F2} CGT";
    }

    private void OnEnergyUpdated(DemiurgeEnergy energy)
    {
        energyText.text = $"{energy.current}/{energy.max}";
        energyBar.value = energy.Percentage / 100f;
    }

    private void OnError(string message)
    {
        Debug.LogError($"[Demiurge] {message}");
        // Show error toast/notification
    }

    // Called from UI Button
    public void OnConnectButtonClicked(string address)
    {
        DemiurgeManager.Instance.ConnectWallet(address);
    }
}
```

### Enemy Loot Source

```csharp
using UnityEngine;
using System.Collections.Generic;
using DemiurgeSDK;

public class EnemyLootSource : MonoBehaviour
{
    [Header("Loot Configuration")]
    [SerializeField] private string actionId = "kill_enemy_elite";
    [SerializeField] private int difficultyRating = 50;
    [SerializeField] private string enemyType = "Elite Goblin";
    
    [Header("Visual Feedback")]
    [SerializeField] private GameObject rewardPopupPrefab;

    /// <summary>
    /// Called when enemy is defeated
    /// </summary>
    public async void OnDefeated()
    {
        // Play death animation, particles, etc.
        Debug.Log($"Enemy {enemyType} defeated!");
        
        // Record action on blockchain via Oracle
        var metadata = new Dictionary<string, string>
        {
            ["enemy_type"] = enemyType,
            ["position_x"] = transform.position.x.ToString(),
            ["position_y"] = transform.position.y.ToString()
        };
        
        var result = await DemiurgeManager.Instance.RecordGameplayActionAsync(
            actionId, 
            difficultyRating, 
            metadata
        );
        
        if (result.success)
        {
            // Show reward popup
            ShowRewardPopup(result.reward_amount);
        }
        
        // Destroy enemy
        Destroy(gameObject, 0.5f);
    }

    private void ShowRewardPopup(float amount)
    {
        if (rewardPopupPrefab != null)
        {
            var popup = Instantiate(rewardPopupPrefab, transform.position + Vector3.up, Quaternion.identity);
            // Configure popup text to show "+X Sparks" or "+X CGT"
            var text = popup.GetComponentInChildren<TextMeshPro>();
            if (text != null)
            {
                text.text = $"+{amount} Sparks";
            }
            Destroy(popup, 2f);
        }
    }
}
```

### NFT-Gated Door

```csharp
using UnityEngine;
using DemiurgeSDK;

public class NFTGatedDoor : MonoBehaviour
{
    [Header("Gate Configuration")]
    [SerializeField] private string requiredAssetUUID;
    [SerializeField] private string requiredAssetName = "Founder's Key";
    
    [Header("References")]
    [SerializeField] private Animator doorAnimator;
    [SerializeField] private AudioSource lockedSound;
    [SerializeField] private AudioSource unlockSound;
    [SerializeField] private GameObject lockedUI;
    
    private bool _isUnlocked = false;

    private async void OnTriggerEnter(Collider other)
    {
        if (!other.CompareTag("Player") || _isUnlocked) return;
        
        // Check if player owns the required NFT
        var assets = await DemiurgeManager.Instance.FetchOwnedAssetsAsync();
        
        bool hasKey = false;
        foreach (var asset in assets)
        {
            if (asset.uuid == requiredAssetUUID || asset.name == requiredAssetName)
            {
                hasKey = true;
                break;
            }
        }
        
        if (hasKey)
        {
            UnlockDoor();
        }
        else
        {
            ShowLockedMessage();
        }
    }

    private void UnlockDoor()
    {
        _isUnlocked = true;
        unlockSound?.Play();
        doorAnimator?.SetTrigger("Open");
        Debug.Log("Door unlocked! Player has the required NFT.");
    }

    private void ShowLockedMessage()
    {
        lockedSound?.Play();
        lockedUI?.SetActive(true);
        Debug.Log($"Door locked. Requires: {requiredAssetName}");
    }
}
```

---

## Step 5: WebGL Considerations

For Unity WebGL builds, you may want to integrate with browser wallets (MetaMask):

### WebGLWalletBridge.jslib

```javascript
mergeInto(LibraryManager.library, {
    
    DemiurgeConnectWallet: function() {
        if (typeof window.ethereum !== 'undefined') {
            window.ethereum.request({ method: 'eth_requestAccounts' })
                .then(function(accounts) {
                    // Send address back to Unity
                    SendMessage('DemiurgeManager', 'OnWebGLWalletConnected', accounts[0]);
                })
                .catch(function(error) {
                    SendMessage('DemiurgeManager', 'OnWebGLWalletError', error.message);
                });
        } else {
            SendMessage('DemiurgeManager', 'OnWebGLWalletError', 'No wallet found');
        }
    },
    
    DemiurgeGetBalance: function(addressPtr) {
        var address = UTF8ToString(addressPtr);
        // Additional browser-side logic if needed
    }
});
```

### Add to DemiurgeManager.cs

```csharp
#if UNITY_WEBGL && !UNITY_EDITOR
[System.Runtime.InteropServices.DllImport("__Internal")]
private static extern void DemiurgeConnectWallet();

public void ConnectWalletWebGL()
{
    DemiurgeConnectWallet();
}

// Called from JavaScript
public void OnWebGLWalletConnected(string address)
{
    ConnectWallet(address);
}

public void OnWebGLWalletError(string error)
{
    OnError?.Invoke(error);
}
#endif
```

---

## Economy Strategy

### Sparks (Soft Currency) - Optimistic Updates

For high-frequency rewards, use client-side prediction:

```csharp
public class SparksManager : MonoBehaviour
{
    private long _pendingSparks = 0;
    private float _lastSyncTime = 0f;
    private const float SYNC_INTERVAL = 30f; // Batch sync every 30 seconds

    public void AddPendingSparks(long amount)
    {
        _pendingSparks += amount;
        // Update UI immediately (optimistic)
        UpdateUI(_pendingSparks);
    }

    private void Update()
    {
        if (Time.time - _lastSyncTime > SYNC_INTERVAL && _pendingSparks > 0)
        {
            SyncToOracle();
            _lastSyncTime = Time.time;
        }
    }

    private async void SyncToOracle()
    {
        var result = await DemiurgeManager.Instance.RecordGameplayActionAsync(
            "batch_sparks_claim",
            0,
            new Dictionary<string, string> { ["amount"] = _pendingSparks.ToString() }
        );
        
        if (result.success)
        {
            _pendingSparks = 0;
        }
    }
}
```

---

## Security Checklist

- [ ] Never store private keys in C# code
- [ ] Always validate actions server-side (Oracle)
- [ ] Use HTTPS for all RPC calls
- [ ] Implement rate limiting on Oracle endpoints
- [ ] Don't trust client-reported scores or kills
- [ ] Cache RPC responses to reduce network traffic
- [ ] Handle network failures gracefully (offline mode)
- [ ] For WebGL: Handle CORS properly on your Oracle backend

---

## Troubleshooting

### "JsonConvert not found"

Install Newtonsoft.Json via Package Manager:
```
Window → Package Manager → Add package by name → com.unity.nuget.newtonsoft-json
```

### Async/await not working

Ensure your project uses .NET Standard 2.1 or .NET 6+:
```
Edit → Project Settings → Player → Api Compatibility Level → .NET Standard 2.1
```

### CORS errors in WebGL

Your Oracle backend must return proper CORS headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### Balance showing 0

Check wallet address format (0x-prefixed hex). Verify RPC endpoint is accessible.

---

## Next Steps

1. **[Oracle Backend Guide](./ORACLE_BACKEND.md)** - Set up your secure game server
2. **[DRC-369 Deep Dive](../creators/drc369-complete-guide.md)** - Advanced NFT features
3. **[WebGL Deployment](./UNITY_WEBGL_INTEGRATION.md)** - Browser-specific considerations

---

**The Aeons weave threads of creation. The code serves the will.**

---

*Last Updated: January 26, 2026*  
*Document Version: 1.0*  
*Maintainer: Alaustrup*
