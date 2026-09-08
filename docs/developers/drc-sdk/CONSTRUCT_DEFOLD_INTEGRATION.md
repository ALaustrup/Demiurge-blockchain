# DRC-SDK: Construct 3 & Defold Integration Guide

**Build blockchain-connected games with browser-based and lightweight engines**

> *"The Pleroma embraces all forms of creation. In every engine, the flame burns eternal."*

---

## Overview

This guide covers integrating the Demiurge Blockchain into **Construct 3** (JavaScript/Event Sheets) and **Defold** (Lua) projects. Both engines are ideal for 2D games with lightweight builds.

---

# Part A: Construct 3 Integration

Construct 3 allows direct JavaScript scripting. We'll create a bridge that exposes the Demiurge SDK to Event Sheets.

## Project Structure

```
Project/
├── Files/
│   └── demiurge-bridge.js    # Core SDK
├── Layouts/
│   └── Game.json
├── Event sheets/
│   └── Game.json
└── Scripts/
    └── main.js
```

---

## Step 1: Create the SDK Bridge

### demiurge-bridge.js

Add this as a Script file in your Construct 3 project (Project Bar → Scripts → Add script):

```javascript
/**
 * DemiurgeBridge - Construct 3 SDK for Demiurge Blockchain
 * Access via globalThis.Demiurge in Event Sheets
 */

globalThis.Demiurge = {
    // =========================================================================
    // CONFIGURATION
    // =========================================================================
    
    rpcUrl: "https://rpc.demiurge.cloud",
    oracleUrl: "https://api.yourgame.com",
    
    // =========================================================================
    // STATE
    // =========================================================================
    
    walletAddress: null,
    sessionToken: null,
    cachedBalance: { sparks: 0, cgt: 0 },
    cachedEnergy: { current: 0, max: 1000 },
    
    // =========================================================================
    // WALLET & IDENTITY
    // =========================================================================
    
    /**
     * Connect a wallet (MetaMask or manual address)
     */
    connectWallet: async function() {
        // Try MetaMask first
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ 
                    method: 'eth_requestAccounts' 
                });
                this.walletAddress = accounts[0];
                console.log("[Demiurge] Wallet connected:", this.walletAddress);
                
                // Update Construct global variable
                if (globalThis.runtime) {
                    globalThis.runtime.globalVars.WalletAddress = this.walletAddress;
                    globalThis.runtime.globalVars.IsWalletConnected = true;
                }
                
                // Auto-fetch balance
                await this.fetchBalance();
                
                return this.walletAddress;
            } catch (error) {
                console.error("[Demiurge] Connection denied:", error);
                return null;
            }
        } else {
            console.warn("[Demiurge] No wallet found. Install MetaMask.");
            return null;
        }
    },
    
    /**
     * Connect with manual address (for testing)
     */
    connectManual: async function(address) {
        this.walletAddress = address;
        
        if (globalThis.runtime) {
            globalThis.runtime.globalVars.WalletAddress = address;
            globalThis.runtime.globalVars.IsWalletConnected = true;
        }
        
        await this.fetchBalance();
        return address;
    },
    
    /**
     * Disconnect wallet
     */
    disconnect: function() {
        this.walletAddress = null;
        this.sessionToken = null;
        this.cachedBalance = { sparks: 0, cgt: 0 };
        
        if (globalThis.runtime) {
            globalThis.runtime.globalVars.WalletAddress = "";
            globalThis.runtime.globalVars.IsWalletConnected = false;
            globalThis.runtime.globalVars.SparksBalance = 0;
            globalThis.runtime.globalVars.CGTBalance = 0;
        }
    },
    
    /**
     * Check if connected
     */
    isConnected: function() {
        return this.walletAddress !== null;
    },
    
    // =========================================================================
    // ECONOMY (CGT & Sparks)
    // =========================================================================
    
    /**
     * Fetch balance from blockchain
     */
    fetchBalance: async function() {
        if (!this.walletAddress) {
            console.warn("[Demiurge] No wallet connected");
            return null;
        }
        
        try {
            const payload = {
                jsonrpc: "2.0",
                method: "balances_getBalance",
                params: [this.walletAddress],
                id: Math.floor(Math.random() * 1000000)
            };
            
            const response = await fetch(this.rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            
            if (data.result) {
                // Balance in Sparks (100 Sparks = 1 CGT)
                const sparks = parseInt(data.result.free || "0");
                const cgt = sparks / 100;
                
                this.cachedBalance = { sparks, cgt };
                
                // Update Construct variables
                if (globalThis.runtime) {
                    globalThis.runtime.globalVars.SparksBalance = sparks;
                    globalThis.runtime.globalVars.CGTBalance = cgt;
                }
                
                console.log("[Demiurge] Balance:", sparks, "Sparks /", cgt, "CGT");
                return this.cachedBalance;
            }
        } catch (error) {
            console.error("[Demiurge] Balance fetch error:", error);
        }
        
        return null;
    },
    
    /**
     * Fetch energy (feeless tx quota)
     */
    fetchEnergy: async function() {
        if (!this.walletAddress) return null;
        
        try {
            const payload = {
                jsonrpc: "2.0",
                method: "energy_getEnergy",
                params: [this.walletAddress],
                id: Math.floor(Math.random() * 1000000)
            };
            
            const response = await fetch(this.rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            
            if (data.result) {
                this.cachedEnergy = {
                    current: data.result.current || 0,
                    max: data.result.max || 1000
                };
                
                if (globalThis.runtime) {
                    globalThis.runtime.globalVars.EnergyCurrent = this.cachedEnergy.current;
                    globalThis.runtime.globalVars.EnergyMax = this.cachedEnergy.max;
                }
                
                return this.cachedEnergy;
            }
        } catch (error) {
            console.error("[Demiurge] Energy fetch error:", error);
        }
        
        return null;
    },
    
    // =========================================================================
    // DRC-369 ASSETS
    // =========================================================================
    
    /**
     * Fetch owned assets
     */
    fetchAssets: async function() {
        if (!this.walletAddress) return [];
        
        try {
            const payload = {
                jsonrpc: "2.0",
                method: "drc369_getAssetsByOwner",
                params: [this.walletAddress],
                id: Math.floor(Math.random() * 1000000)
            };
            
            const response = await fetch(this.rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            return data.result?.assets || [];
        } catch (error) {
            console.error("[Demiurge] Assets fetch error:", error);
            return [];
        }
    },
    
    /**
     * Check if player owns a specific asset
     */
    hasAsset: async function(uuidOrName) {
        const assets = await this.fetchAssets();
        return assets.some(a => a.uuid === uuidOrName || a.name === uuidOrName);
    },
    
    // =========================================================================
    // GAMEPLAY ACTIONS
    // =========================================================================
    
    /**
     * Record gameplay action (sends to Oracle for validation & reward)
     */
    recordAction: async function(actionId, difficulty = 0, metadata = {}) {
        if (!this.walletAddress) {
            console.warn("[Demiurge] No wallet connected");
            return { success: false, error: "No wallet" };
        }
        
        console.log("[Demiurge] Recording action:", actionId);
        
        try {
            const body = {
                player_address: this.walletAddress,
                action: actionId,
                difficulty: difficulty,
                timestamp: new Date().toISOString(),
                metadata: metadata
            };
            
            const response = await fetch(this.oracleUrl + "/api/record-action", {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + (this.sessionToken || '')
                },
                body: JSON.stringify(body)
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Trigger Construct function if exists
                if (globalThis.runtime) {
                    globalThis.runtime.callFunction("OnRewardReceived", result.reward_amount || 0);
                }
                
                // Refresh balance
                await this.fetchBalance();
            }
            
            return result;
        } catch (error) {
            console.error("[Demiurge] Action error:", error);
            return { success: false, error: error.message };
        }
    }
};

console.log("[Demiurge] Bridge loaded for Construct 3");
```

---

## Step 2: Set Up Global Variables

In Construct 3, create these Global Variables (Project Bar → right-click → Add global variable):

| Name | Type | Initial Value |
|------|------|---------------|
| `WalletAddress` | Text | "" |
| `IsWalletConnected` | Boolean | false |
| `SparksBalance` | Number | 0 |
| `CGTBalance` | Number | 0 |
| `EnergyCurrent` | Number | 0 |
| `EnergyMax` | Number | 1000 |

---

## Step 3: Event Sheet Integration

### On Start of Layout

```
+ System: On start of layout
  → Script: Demiurge.connectWallet()
```

### On Enemy Destroyed

```
+ Enemy: On destroyed
  → Script: Demiurge.recordAction("kill_goblin", 10)
  → Text: Set text to "Sparks: " & SparksBalance
```

### Create OnRewardReceived Function

```
+ Functions: On "OnRewardReceived" (amount)
  → Sprite: Flash for 0.5 seconds
  → Text: Create instance at (Player.X, Player.Y - 50)
  → Text: Set text to "+" & amount & " Sparks"
  → Tween: Start tween on Text, property "Y", end value Player.Y - 100, duration 1
  → Wait 1.0 seconds
  → Text: Destroy
```

### Check NFT for VIP Zone

```
+ Player: On collision with VIPDoor
  → Script: 
    (async () => {
      const hasKey = await Demiurge.hasAsset("founders_key");
      if (hasKey) {
        runtime.callFunction("OpenVIPDoor");
      } else {
        runtime.callFunction("ShowLockedMessage");
      }
    })();
```

---

# Part B: Defold Integration

Defold uses Lua. We'll create a Lua module that handles HTTP requests to the Demiurge blockchain.

## Project Structure

```
project/
├── main/
│   ├── demiurge/
│   │   ├── demiurge.lua      # Core SDK module
│   │   └── nft_loader.lua    # NFT texture loading
│   ├── scripts/
│   │   └── player.script
│   └── main.collection
└── game.project
```

---

## Step 1: Core SDK Module

### demiurge.lua

Create at `main/demiurge/demiurge.lua`:

```lua
--- DemiurgeSDK - Defold integration for Demiurge Blockchain
-- @module demiurge

local M = {}

-- =============================================================================
-- CONFIGURATION
-- =============================================================================

M.rpc_url = "https://rpc.demiurge.cloud"
M.oracle_url = "https://api.yourgame.com"

-- =============================================================================
-- STATE
-- =============================================================================

M.wallet_address = nil
M.session_token = nil
M.cached_balance = { sparks = 0, cgt = 0 }
M.cached_energy = { current = 0, max = 1000 }
M.cached_assets = {}

-- =============================================================================
-- CALLBACKS STORAGE
-- =============================================================================

local callbacks = {
    on_balance_updated = nil,
    on_energy_updated = nil,
    on_assets_loaded = nil,
    on_action_recorded = nil,
    on_error = nil
}

-- =============================================================================
-- EVENT REGISTRATION
-- =============================================================================

--- Register callback for balance updates
-- @param fn Callback function(sparks, cgt)
function M.on_balance_updated(fn)
    callbacks.on_balance_updated = fn
end

--- Register callback for energy updates
-- @param fn Callback function(current, max)
function M.on_energy_updated(fn)
    callbacks.on_energy_updated = fn
end

--- Register callback for assets loaded
-- @param fn Callback function(assets)
function M.on_assets_loaded(fn)
    callbacks.on_assets_loaded = fn
end

--- Register callback for action recorded
-- @param fn Callback function(action_id, success, reward)
function M.on_action_recorded(fn)
    callbacks.on_action_recorded = fn
end

--- Register callback for errors
-- @param fn Callback function(message)
function M.on_error(fn)
    callbacks.on_error = fn
end

-- =============================================================================
-- INTERNAL HELPERS
-- =============================================================================

local function emit_error(message)
    print("[DemiurgeSDK] Error:", message)
    if callbacks.on_error then
        callbacks.on_error(message)
    end
end

local function create_rpc_payload(method, params)
    return {
        jsonrpc = "2.0",
        method = method,
        params = params,
        id = math.random(1, 999999)
    }
end

-- =============================================================================
-- WALLET & IDENTITY
-- =============================================================================

--- Connect wallet with address
-- @param address Wallet address (0x...)
function M.connect(address)
    M.wallet_address = address
    print("[DemiurgeSDK] Wallet connected:", address)
    
    -- Auto-fetch balance
    M.fetch_balance()
    M.fetch_energy()
end

--- Disconnect wallet
function M.disconnect()
    M.wallet_address = nil
    M.session_token = nil
    M.cached_balance = { sparks = 0, cgt = 0 }
    M.cached_energy = { current = 0, max = 1000 }
    M.cached_assets = {}
end

--- Check if wallet is connected
-- @return boolean
function M.is_connected()
    return M.wallet_address ~= nil
end

-- =============================================================================
-- ECONOMY (CGT & Sparks)
-- =============================================================================

--- Fetch balance from blockchain
-- @param callback_fn Optional callback function(balance)
function M.fetch_balance(callback_fn)
    if not M.wallet_address then
        emit_error("No wallet connected")
        return
    end
    
    local payload = create_rpc_payload("balances_getBalance", {M.wallet_address})
    local headers = {["Content-Type"] = "application/json"}
    local body = json.encode(payload)
    
    http.request(M.rpc_url, "POST", function(self, id, response)
        if response.status == 200 then
            local data = json.decode(response.response)
            
            if data.result then
                local sparks = tonumber(data.result.free) or 0
                local cgt = sparks / 100  -- 100 Sparks = 1 CGT
                
                M.cached_balance = { sparks = sparks, cgt = cgt }
                
                print("[DemiurgeSDK] Balance:", sparks, "Sparks /", cgt, "CGT")
                
                if callbacks.on_balance_updated then
                    callbacks.on_balance_updated(sparks, cgt)
                end
                
                if callback_fn then
                    callback_fn(M.cached_balance)
                end
            end
        else
            emit_error("Balance request failed: " .. response.status)
        end
    end, headers, body)
end

--- Fetch energy (feeless tx quota)
-- @param callback_fn Optional callback function(energy)
function M.fetch_energy(callback_fn)
    if not M.wallet_address then
        emit_error("No wallet connected")
        return
    end
    
    local payload = create_rpc_payload("energy_getEnergy", {M.wallet_address})
    local headers = {["Content-Type"] = "application/json"}
    local body = json.encode(payload)
    
    http.request(M.rpc_url, "POST", function(self, id, response)
        if response.status == 200 then
            local data = json.decode(response.response)
            
            if data.result then
                M.cached_energy = {
                    current = data.result.current or 0,
                    max = data.result.max or 1000
                }
                
                if callbacks.on_energy_updated then
                    callbacks.on_energy_updated(M.cached_energy.current, M.cached_energy.max)
                end
                
                if callback_fn then
                    callback_fn(M.cached_energy)
                end
            end
        else
            emit_error("Energy request failed: " .. response.status)
        end
    end, headers, body)
end

-- =============================================================================
-- DRC-369 ASSETS
-- =============================================================================

--- Fetch owned assets
-- @param callback_fn Callback function(assets)
function M.fetch_assets(callback_fn)
    if not M.wallet_address then
        emit_error("No wallet connected")
        return
    end
    
    local payload = create_rpc_payload("drc369_getAssetsByOwner", {M.wallet_address})
    local headers = {["Content-Type"] = "application/json"}
    local body = json.encode(payload)
    
    http.request(M.rpc_url, "POST", function(self, id, response)
        if response.status == 200 then
            local data = json.decode(response.response)
            
            if data.result and data.result.assets then
                M.cached_assets = data.result.assets
                
                if callbacks.on_assets_loaded then
                    callbacks.on_assets_loaded(M.cached_assets)
                end
                
                if callback_fn then
                    callback_fn(M.cached_assets)
                end
            end
        else
            emit_error("Assets request failed: " .. response.status)
        end
    end, headers, body)
end

--- Check if player owns a specific asset
-- @param uuid_or_name Asset UUID or name
-- @param callback_fn Callback function(has_asset)
function M.has_asset(uuid_or_name, callback_fn)
    M.fetch_assets(function(assets)
        local has = false
        for _, asset in ipairs(assets) do
            if asset.uuid == uuid_or_name or asset.name == uuid_or_name then
                has = true
                break
            end
        end
        callback_fn(has)
    end)
end

--- Get resource URL for a specific context
-- @param asset Asset dictionary
-- @param context Context string ("game", "marketplace", "vr")
-- @return Resource URL or nil
function M.get_resource_for_context(asset, context)
    if not asset or not asset.resources then
        return nil
    end
    
    local best_resource = nil
    local best_priority = -1
    
    for _, res in ipairs(asset.resources) do
        local contexts = res.context or {}
        for _, ctx in ipairs(contexts) do
            if ctx == context and (res.priority or 0) > best_priority then
                best_resource = res
                best_priority = res.priority or 0
            end
        end
    end
    
    return best_resource and best_resource.uri or nil
end

-- =============================================================================
-- GAMEPLAY ACTIONS
-- =============================================================================

--- Record gameplay action (sends to Oracle)
-- @param action_id Action identifier
-- @param difficulty Difficulty rating
-- @param metadata Optional metadata table
function M.record_action(action_id, difficulty, metadata)
    if not M.wallet_address then
        emit_error("No wallet connected")
        if callbacks.on_action_recorded then
            callbacks.on_action_recorded(action_id, false, 0)
        end
        return
    end
    
    print("[DemiurgeSDK] Recording action:", action_id)
    
    local body = {
        player_address = M.wallet_address,
        action = action_id,
        difficulty = difficulty or 0,
        timestamp = os.date("!%Y-%m-%dT%H:%M:%SZ"),
        metadata = metadata or {}
    }
    
    local headers = {
        ["Content-Type"] = "application/json",
        ["Authorization"] = "Bearer " .. (M.session_token or "")
    }
    
    http.request(M.oracle_url .. "/api/record-action", "POST", function(self, id, response)
        if response.status == 200 then
            local data = json.decode(response.response)
            local success = data.success or false
            local reward = data.reward_amount or 0
            
            if callbacks.on_action_recorded then
                callbacks.on_action_recorded(action_id, success, reward)
            end
            
            -- Refresh balance on success
            if success then
                M.fetch_balance()
            end
        else
            emit_error("Action request failed: " .. response.status)
            if callbacks.on_action_recorded then
                callbacks.on_action_recorded(action_id, false, 0)
            end
        end
    end, headers, json.encode(body))
end

-- =============================================================================
-- NFT TEXTURE LOADING
-- =============================================================================

--- Load NFT texture from URL
-- @param url Image URL
-- @param callback_fn Callback function(texture_id) or nil on failure
function M.load_nft_texture(url, callback_fn)
    http.request(url, "GET", function(self, id, response)
        if response.status == 200 then
            local img = image.load(response.response)
            
            if img then
                -- Create texture resource
                local texture_id = "nft_" .. tostring(math.random(100000, 999999))
                -- Note: Actual texture creation in Defold requires more setup
                -- This is simplified - you'd use resource.set_texture or similar
                
                print("[DemiurgeSDK] NFT texture loaded:", url)
                
                if callback_fn then
                    callback_fn(img)
                end
            else
                emit_error("Failed to decode image")
                if callback_fn then
                    callback_fn(nil)
                end
            end
        else
            emit_error("Texture download failed: " .. response.status)
            if callback_fn then
                callback_fn(nil)
            end
        end
    end)
end

return M
```

---

## Step 2: Player Script Integration

### player.script

```lua
local demiurge = require "main.demiurge.demiurge"

function init(self)
    -- Set up Demiurge callbacks
    demiurge.on_balance_updated(function(sparks, cgt)
        -- Update UI
        msg.post("/hud#gui", "update_balance", { sparks = sparks, cgt = cgt })
    end)
    
    demiurge.on_action_recorded(function(action_id, success, reward)
        if success and reward > 0 then
            -- Show reward popup
            msg.post("/effects#popup", "show_reward", { amount = reward })
        end
    end)
    
    demiurge.on_error(function(message)
        print("Demiurge error:", message)
    end)
    
    -- Connect wallet (in production, get from Qor ID)
    demiurge.connect("0xYourWalletAddress")
end

function on_message(self, message_id, message, sender)
    if message_id == hash("enemy_killed") then
        -- Record kill action
        demiurge.record_action("kill_goblin", message.difficulty or 10, {
            enemy_type = message.enemy_type or "goblin"
        })
    elseif message_id == hash("check_vip_access") then
        -- Check for NFT ownership
        demiurge.has_asset("founders_key", function(has_key)
            if has_key then
                msg.post(sender, "vip_access_granted")
            else
                msg.post(sender, "vip_access_denied")
            end
        end)
    end
end
```

### Enemy Script

```lua
local demiurge = require "main.demiurge.demiurge"

go.property("action_id", "kill_goblin")
go.property("difficulty", 10)

function on_message(self, message_id, message, sender)
    if message_id == hash("die") then
        -- Play death animation
        sprite.play_flipbook("#sprite", "death")
        
        -- Record action on blockchain
        demiurge.record_action(self.action_id, self.difficulty, {
            position = go.get_position()
        })
        
        -- Delete after animation
        timer.delay(1.0, false, function()
            go.delete()
        end)
    end
end
```

---

## Step 3: GUI Script for HUD

### hud.gui_script

```lua
local demiurge = require "main.demiurge.demiurge"

function init(self)
    self.sparks = 0
    self.cgt = 0
end

function on_message(self, message_id, message, sender)
    if message_id == hash("update_balance") then
        self.sparks = message.sparks
        self.cgt = message.cgt
        
        -- Update UI nodes
        gui.set_text(gui.get_node("sparks_label"), "Sparks: " .. tostring(self.sparks))
        gui.set_text(gui.get_node("cgt_label"), string.format("CGT: %.2f", self.cgt))
    end
end

function on_input(self, action_id, action)
    if action_id == hash("click") and action.pressed then
        local connect_btn = gui.get_node("connect_button")
        if gui.pick_node(connect_btn, action.x, action.y) then
            -- Show wallet input dialog or trigger MetaMask
            -- For testing, connect with hardcoded address
            demiurge.connect("0xTestAddress")
        end
    end
end
```

---

## Security Notes (Both Engines)

### Browser Security (Construct 3)

- **Source code is visible**: Players can see your JavaScript in browser dev tools
- **Never store private keys** in client code
- **Route all rewards through Oracle**: Client reports actions, Oracle validates and mints

### Defold Security

- **Lua can be decompiled**: Don't store secrets in scripts
- **Use HTTPS always**: Defold's http module supports TLS
- **Validate server-side**: Same Oracle pattern as other engines

---

## CORS Configuration

Both engines run in environments that need CORS headers from your Oracle backend:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## Next Steps

1. **[Oracle Backend Guide](./ORACLE_BACKEND.md)** - Set up your secure game server
2. **[DRC-369 Deep Dive](../creators/drc369-complete-guide.md)** - Advanced NFT features
3. **[Phaser.js Guide](../PHASER_INTEGRATION.md)** - Browser game integration

---

**The Pleroma embraces all forms of creation. The code serves the will.**

---

*Last Updated: January 26, 2026*  
*Document Version: 1.0*  
*Maintainer: Alaustrup*
