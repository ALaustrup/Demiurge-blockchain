# Unity WebGL Integration Guide

Export your Unity game to WebGL and integrate it with the Demiurge blockchain for CGT rewards and DRC-369 NFTs.

## Prerequisites

- Unity 2021.3 LTS or newer
- WebGL Build Support module installed
- Basic understanding of JavaScript interop

## Build Settings

### 1. Configure WebGL Build

In Unity, go to **File > Build Settings**:

1. Select **WebGL** platform
2. Click **Switch Platform**
3. Click **Player Settings**

### 2. Player Settings

Configure these settings for optimal Demiurge integration:

```
Resolution and Presentation:
- Default Canvas Width: 1920
- Default Canvas Height: 1080
- Run In Background: ✓

Publishing Settings:
- Compression Format: Gzip
- Decompression Fallback: ✓
- Data Caching: ✓

Other Settings:
- Color Space: Linear (recommended)
- API Compatibility Level: .NET Standard 2.1
```

### 3. Memory Settings

For games with large assets:

```
Publishing Settings:
- Memory Size: 512 (MB) - adjust as needed
```

## JavaScript Interop

### Create a JavaScript Plugin

Create `Assets/Plugins/WebGL/DemiurgePlugin.jslib`:

```javascript
mergeInto(LibraryManager.library, {
  
  DemiurgeInit: function() {
    if (window.DemiurgeHUD && window.DemiurgeHUD.isAvailable) {
      window.DemiurgeHUD.init({
        position: 'top-right',
        compact: false
      });
      return 1;
    }
    return 0;
  },
  
  DemiurgeEarnCGT: function(amount, reasonPtr) {
    var reason = UTF8ToString(reasonPtr);
    if (window.DemiurgeHUD && window.DemiurgeHUD.isAvailable) {
      window.DemiurgeHUD.earnCGT(amount, reason);
      return 1;
    }
    return 0;
  },
  
  DemiurgeGetBalance: function() {
    if (window.DemiurgeHUD && window.DemiurgeHUD.isAvailable) {
      // This is async, so we use a callback pattern
      window.DemiurgeHUD.getBalance().then(function(balance) {
        window.unityInstance.SendMessage('DemiurgeManager', 'OnBalanceReceived', balance);
      });
    }
  },
  
  DemiurgeGetAssets: function(typePtr) {
    var assetType = UTF8ToString(typePtr);
    if (window.DemiurgeHUD && window.DemiurgeHUD.isAvailable) {
      window.DemiurgeHUD.getAssets(assetType).then(function(assets) {
        var json = JSON.stringify(assets);
        window.unityInstance.SendMessage('DemiurgeManager', 'OnAssetsReceived', json);
      });
    }
  },
  
  DemiurgeSaveData: function(keyPtr, dataPtr) {
    var key = UTF8ToString(keyPtr);
    var data = UTF8ToString(dataPtr);
    if (window.DemiurgeHUD && window.DemiurgeHUD.isAvailable) {
      window.DemiurgeHUD.saveGameData(key, data).then(function(success) {
        window.unityInstance.SendMessage('DemiurgeManager', 'OnDataSaved', success ? '1' : '0');
      });
    }
  },
  
  DemiurgeLoadData: function(keyPtr) {
    var key = UTF8ToString(keyPtr);
    if (window.DemiurgeHUD && window.DemiurgeHUD.isAvailable) {
      window.DemiurgeHUD.loadGameData(key).then(function(data) {
        window.unityInstance.SendMessage('DemiurgeManager', 'OnDataLoaded', data || '');
      });
    }
  }
  
});
```

### Create C# Wrapper

Create `Assets/Scripts/DemiurgeManager.cs`:

```csharp
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using UnityEngine;

public class DemiurgeManager : MonoBehaviour
{
    public static DemiurgeManager Instance { get; private set; }
    
    public bool IsAvailable { get; private set; }
    public string CurrentBalance { get; private set; }
    
    public event Action<string> OnBalanceUpdated;
    public event Action<List<NFTAsset>> OnAssetsLoaded;
    public event Action<bool> OnDataSaved;
    public event Action<string> OnDataLoaded;
    
    #if UNITY_WEBGL && !UNITY_EDITOR
    [DllImport("__Internal")]
    private static extern int DemiurgeInit();
    
    [DllImport("__Internal")]
    private static extern int DemiurgeEarnCGT(int amount, string reason);
    
    [DllImport("__Internal")]
    private static extern void DemiurgeGetBalance();
    
    [DllImport("__Internal")]
    private static extern void DemiurgeGetAssets(string assetType);
    
    [DllImport("__Internal")]
    private static extern void DemiurgeSaveData(string key, string data);
    
    [DllImport("__Internal")]
    private static extern void DemiurgeLoadData(string key);
    #endif
    
    void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
            Initialize();
        }
        else
        {
            Destroy(gameObject);
        }
    }
    
    void Initialize()
    {
        #if UNITY_WEBGL && !UNITY_EDITOR
        IsAvailable = DemiurgeInit() == 1;
        if (IsAvailable)
        {
            Debug.Log("Demiurge HUD initialized");
            RefreshBalance();
        }
        else
        {
            Debug.Log("Running in standalone mode");
        }
        #else
        IsAvailable = false;
        Debug.Log("Demiurge not available in editor");
        #endif
    }
    
    public void EarnCGT(int amount, string reason = "gameplay")
    {
        #if UNITY_WEBGL && !UNITY_EDITOR
        if (IsAvailable)
        {
            DemiurgeEarnCGT(amount, reason);
        }
        #endif
        
        // Always update local tracking
        Debug.Log($"Earned {amount} CGT ({reason})");
    }
    
    public void RefreshBalance()
    {
        #if UNITY_WEBGL && !UNITY_EDITOR
        if (IsAvailable)
        {
            DemiurgeGetBalance();
        }
        #endif
    }
    
    public void LoadAssets(string assetType)
    {
        #if UNITY_WEBGL && !UNITY_EDITOR
        if (IsAvailable)
        {
            DemiurgeGetAssets(assetType);
        }
        #endif
    }
    
    public void SaveGameData(string key, string data)
    {
        #if UNITY_WEBGL && !UNITY_EDITOR
        if (IsAvailable)
        {
            DemiurgeSaveData(key, data);
        }
        #endif
    }
    
    public void LoadGameData(string key)
    {
        #if UNITY_WEBGL && !UNITY_EDITOR
        if (IsAvailable)
        {
            DemiurgeLoadData(key);
        }
        #endif
    }
    
    // Callbacks from JavaScript
    public void OnBalanceReceived(string balance)
    {
        CurrentBalance = balance;
        OnBalanceUpdated?.Invoke(balance);
    }
    
    public void OnAssetsReceived(string json)
    {
        var assets = JsonUtility.FromJson<NFTAssetList>(json);
        OnAssetsLoaded?.Invoke(assets.items);
    }
    
    public void OnDataSavedCallback(string success)
    {
        OnDataSaved?.Invoke(success == "1");
    }
    
    public void OnDataLoadedCallback(string data)
    {
        OnDataLoaded?.Invoke(data);
    }
}

[Serializable]
public class NFTAsset
{
    public string id;
    public string name;
    public string image;
    public string collection;
}

[Serializable]
public class NFTAssetList
{
    public List<NFTAsset> items;
}
```

### Usage in Your Game

```csharp
public class GameController : MonoBehaviour
{
    void Start()
    {
        // Subscribe to events
        DemiurgeManager.Instance.OnBalanceUpdated += OnBalanceUpdated;
        DemiurgeManager.Instance.OnAssetsLoaded += OnAssetsLoaded;
    }
    
    void OnBalanceUpdated(string balance)
    {
        Debug.Log($"Balance: {balance} CGT");
        // Update UI
    }
    
    void OnAssetsLoaded(List<NFTAsset> assets)
    {
        foreach (var asset in assets)
        {
            Debug.Log($"Asset: {asset.name} ({asset.id})");
            // Apply to game
        }
    }
    
    public void OnEnemyDefeated(Enemy enemy)
    {
        int reward = enemy.IsBoss ? 50 : 1;
        DemiurgeManager.Instance.EarnCGT(reward, "enemy_kill");
    }
    
    public void SaveProgress()
    {
        var saveData = JsonUtility.ToJson(new SaveData {
            level = currentLevel,
            score = score
        });
        DemiurgeManager.Instance.SaveGameData("progress", saveData);
    }
}
```

## Build and Deploy

### 1. Build WebGL

1. Go to **File > Build Settings**
2. Click **Build**
3. Select output folder
4. Wait for build to complete

### 2. Modify index.html

After build, modify the generated `index.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Unity Game</title>
  <link rel="stylesheet" href="TemplateData/style.css">
</head>
<body>
  <div id="unity-container">
    <canvas id="unity-canvas"></canvas>
  </div>
  
  <!-- Demiurge HUD - Add this BEFORE Unity scripts -->
  <script src="/inject-hud.js"></script>
  
  <script src="Build/UnityLoader.js"></script>
  <script>
    var unityInstance = UnityLoader.instantiate("unity-container", "Build/Build.json", {
      onProgress: function(gameInstance, progress) {
        // Show loading progress
      }
    });
    
    // Make instance available for JavaScript interop
    window.unityInstance = unityInstance;
  </script>
</body>
</html>
```

### 3. Upload to IPFS or Server

```bash
# Using IPFS
ipfs add -r Build/

# Or upload to your server
scp -r Build/ user@server:/var/www/game/
```

### 4. Submit to Demiurge

1. Go to [demiurge.cloud/games/submit](https://demiurge.cloud/games/submit)
2. Enter your game URL
3. Select "Unity WebGL" as engine
4. Complete submission

## Optimization Tips

### Reduce Build Size
- Enable "Strip Engine Code"
- Use Compression (Gzip or Brotli)
- Optimize textures and audio
- Remove unused assets

### Improve Load Time
- Enable Data Caching
- Use AssetBundles for large content
- Implement a loading screen

### Memory Management
- Avoid memory leaks
- Use object pooling
- Profile with Unity Profiler

## Troubleshooting

### Game Won't Load
- Check browser console for errors
- Ensure CORS headers are set on your server
- Verify all build files are accessible

### Interop Not Working
- Check that DemiurgePlugin.jslib is in Plugins/WebGL/
- Verify JavaScript console for errors
- Test HUD availability before calling methods

### Performance Issues
- Lower resolution or quality settings
- Reduce physics complexity
- Optimize shaders for WebGL

## Support

- **Unity Forum**: [forum.unity.com](https://forum.unity.com)
- **Discord**: [discord.gg/demiurge](https://discord.gg/demiurge)
- **Documentation**: [docs.demiurge.cloud](https://docs.demiurge.cloud)
