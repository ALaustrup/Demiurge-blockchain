# DRC-SDK: Godot 4 Integration Guide

**Build blockchain-connected games with Godot 4.2+**

> *"The Syzygies dance in pairs, creating harmony. In Godot, your signals become that dance."*

---

## Overview

This guide covers integrating the Demiurge Blockchain into Godot 4 projects using a native GDScript Autoload singleton. The architecture leverages Godot's powerful Signal system and `await` coroutines for clean, non-blocking blockchain communication.

### Features

- **100% GDScript**: No external plugins or GDNative required
- **Signal-Driven**: Event-based architecture fits Godot's design philosophy
- **Autoload Singleton**: Persists across scenes via Project Settings
- **Async HTTP**: Non-blocking network calls using `await`

### Requirements

- Godot 4.2 or later
- HTTP access enabled in export settings

---

## Project Structure

```
res://
├── scripts/
│   └── demiurge_sdk/
│       ├── demiurge_global.gd    # Core autoload singleton
│       ├── demiurge_types.gd     # Type definitions (optional class_name)
│       └── nft_texture_loader.gd # Runtime texture loading
├── scenes/
│   └── ...
└── project.godot
```

---

## Step 1: Setup Autoload

### demiurge_global.gd

Create this file at `res://scripts/demiurge_sdk/demiurge_global.gd`:

```gdscript
extends Node

## DemiurgeGlobal - Core SDK for Demiurge Blockchain integration.
## Add this as an Autoload in Project Settings → Globals → Autoload.
## Name it "Demiurge" for easy access: Demiurge.fetch_balance()

# =============================================================================
# CONFIGURATION
# =============================================================================

const RPC_URL: String = "https://rpc.demiurge.cloud"
const ORACLE_URL: String = "https://api.yourgame.com"

# =============================================================================
# STATE
# =============================================================================

var wallet_address: String = ""
var session_token: String = ""
var cached_balance: Dictionary = {}
var cached_energy: Dictionary = {}
var cached_assets: Dictionary = {}  # UUID -> Asset data

# =============================================================================
# SIGNALS
# =============================================================================

## Emitted when wallet is connected
signal wallet_connected(address: String)

## Emitted when wallet is disconnected
signal wallet_disconnected()

## Emitted when balance is updated (Sparks, CGT)
signal balance_updated(sparks: int, cgt: float)

## Emitted when energy is updated
signal energy_updated(current: int, max_energy: int, percentage: float)

## Emitted when a single asset is loaded
signal asset_loaded(asset: Dictionary)

## Emitted when asset list is loaded
signal assets_list_loaded(assets: Array)

## Emitted when gameplay action is recorded
signal action_recorded(action_id: String, success: bool, reward: float)

## Emitted on NFT texture loaded
signal nft_texture_loaded(key: String, texture: ImageTexture)

## Emitted on any error
signal error_occurred(message: String)

# =============================================================================
# INTERNAL NODES
# =============================================================================

var _http_request: HTTPRequest

# =============================================================================
# LIFECYCLE
# =============================================================================

func _ready() -> void:
	# Create persistent HTTPRequest node for RPC calls
	_http_request = HTTPRequest.new()
	_http_request.timeout = 30.0
	add_child(_http_request)
	
	# Try to load saved wallet
	_load_saved_wallet()
	
	print("[DemiurgeSDK] Initialized - RPC: ", RPC_URL)


# =============================================================================
# WALLET & IDENTITY
# =============================================================================

## Connect a wallet address (from Qor ID login or manual entry)
func connect_wallet(address: String, token: String = "") -> void:
	wallet_address = address
	session_token = token
	
	_save_wallet(address)
	
	print("[DemiurgeSDK] Wallet connected: ", address)
	wallet_connected.emit(address)
	
	# Auto-fetch balance and energy on connect
	fetch_balance()
	fetch_energy()


## Disconnect current wallet
func disconnect_wallet() -> void:
	wallet_address = ""
	session_token = ""
	cached_balance = {}
	cached_energy = {}
	cached_assets = {}
	
	# Delete saved wallet
	if FileAccess.file_exists("user://demiurge.save"):
		DirAccess.remove_absolute("user://demiurge.save")
	
	wallet_disconnected.emit()


## Check if wallet is connected
func is_connected() -> bool:
	return not wallet_address.is_empty()


# =============================================================================
# ECONOMY (CGT & Sparks)
# =============================================================================

## Fetch CGT/Sparks balance for connected wallet
func fetch_balance() -> void:
	if wallet_address.is_empty():
		error_occurred.emit("No wallet connected")
		return
	
	var payload = _create_rpc_payload("balances_getBalance", [wallet_address])
	var json_string = JSON.stringify(payload)
	var headers = ["Content-Type: application/json"]
	
	var error = _http_request.request(RPC_URL, headers, HTTPClient.METHOD_POST, json_string)
	
	if error != OK:
		error_occurred.emit("Failed to start balance request")
		return
	
	var response = await _http_request.request_completed
	_handle_balance_response(response)


## Fetch energy for connected wallet (feeless transaction quota)
func fetch_energy() -> void:
	if wallet_address.is_empty():
		error_occurred.emit("No wallet connected")
		return
	
	var payload = _create_rpc_payload("energy_getEnergy", [wallet_address])
	var json_string = JSON.stringify(payload)
	var headers = ["Content-Type: application/json"]
	
	# Use a separate HTTPRequest for parallel calls
	var http = HTTPRequest.new()
	add_child(http)
	
	var error = http.request(RPC_URL, headers, HTTPClient.METHOD_POST, json_string)
	
	if error != OK:
		http.queue_free()
		error_occurred.emit("Failed to start energy request")
		return
	
	var response = await http.request_completed
	http.queue_free()
	_handle_energy_response(response)


func _handle_balance_response(response_data: Array) -> void:
	var body = response_data[3] as PackedByteArray
	var json = JSON.new()
	var parse_result = json.parse(body.get_string_from_utf8())
	
	if parse_result != OK:
		error_occurred.emit("Failed to parse balance response")
		return
	
	var data = json.get_data()
	
	if data.has("error"):
		error_occurred.emit(data["error"]["message"])
		return
	
	if data.has("result"):
		var result = data["result"]
		# Balance is in Sparks (smallest unit). 100 Sparks = 1 CGT
		var free_sparks = int(result.get("free", "0"))
		var reserved_sparks = int(result.get("reserved", "0"))
		var frozen_sparks = int(result.get("frozen", "0"))
		
		cached_balance = {
			"free_sparks": free_sparks,
			"reserved_sparks": reserved_sparks,
			"frozen_sparks": frozen_sparks,
			"free_cgt": free_sparks / 100.0,
			"total_cgt": (free_sparks + reserved_sparks) / 100.0
		}
		
		balance_updated.emit(free_sparks, cached_balance["free_cgt"])


func _handle_energy_response(response_data: Array) -> void:
	var body = response_data[3] as PackedByteArray
	var json = JSON.new()
	var parse_result = json.parse(body.get_string_from_utf8())
	
	if parse_result != OK:
		error_occurred.emit("Failed to parse energy response")
		return
	
	var data = json.get_data()
	
	if data.has("error"):
		error_occurred.emit(data["error"]["message"])
		return
	
	if data.has("result"):
		var result = data["result"]
		var current = int(result.get("current", 0))
		var max_energy = int(result.get("max", 1000))
		var percentage = (float(current) / float(max_energy)) * 100.0 if max_energy > 0 else 0.0
		
		cached_energy = {
			"current": current,
			"max": max_energy,
			"percentage": percentage
		}
		
		energy_updated.emit(current, max_energy, percentage)


# =============================================================================
# DRC-369 ASSETS
# =============================================================================

## Fetch a single DRC-369 asset by UUID
func fetch_asset(uuid: String) -> void:
	var payload = _create_rpc_payload("drc369_getAsset", [uuid])
	var json_string = JSON.stringify(payload)
	var headers = ["Content-Type: application/json"]
	
	var http = HTTPRequest.new()
	add_child(http)
	
	var error = http.request(RPC_URL, headers, HTTPClient.METHOD_POST, json_string)
	
	if error != OK:
		http.queue_free()
		error_occurred.emit("Failed to start asset request")
		return
	
	var response = await http.request_completed
	http.queue_free()
	_handle_asset_response(response)


## Fetch all assets owned by connected wallet
func fetch_owned_assets() -> void:
	if wallet_address.is_empty():
		error_occurred.emit("No wallet connected")
		return
	
	var payload = _create_rpc_payload("drc369_getAssetsByOwner", [wallet_address])
	var json_string = JSON.stringify(payload)
	var headers = ["Content-Type: application/json"]
	
	var http = HTTPRequest.new()
	add_child(http)
	
	var error = http.request(RPC_URL, headers, HTTPClient.METHOD_POST, json_string)
	
	if error != OK:
		http.queue_free()
		error_occurred.emit("Failed to start assets request")
		return
	
	var response = await http.request_completed
	http.queue_free()
	_handle_assets_list_response(response)


## Fetch all assets delegated to connected wallet (rentals)
func fetch_delegated_assets() -> void:
	if wallet_address.is_empty():
		error_occurred.emit("No wallet connected")
		return
	
	var payload = _create_rpc_payload("drc369_getAssetsByUser", [wallet_address])
	var json_string = JSON.stringify(payload)
	var headers = ["Content-Type: application/json"]
	
	var http = HTTPRequest.new()
	add_child(http)
	
	var error = http.request(RPC_URL, headers, HTTPClient.METHOD_POST, json_string)
	
	if error != OK:
		http.queue_free()
		error_occurred.emit("Failed to start delegated assets request")
		return
	
	var response = await http.request_completed
	http.queue_free()
	_handle_assets_list_response(response)


func _handle_asset_response(response_data: Array) -> void:
	var body = response_data[3] as PackedByteArray
	var json = JSON.new()
	var parse_result = json.parse(body.get_string_from_utf8())
	
	if parse_result != OK:
		error_occurred.emit("Failed to parse asset response")
		return
	
	var data = json.get_data()
	
	if data.has("error"):
		error_occurred.emit(data["error"]["message"])
		return
	
	if data.has("result"):
		var asset = _parse_asset(data["result"])
		cached_assets[asset["uuid"]] = asset
		asset_loaded.emit(asset)


func _handle_assets_list_response(response_data: Array) -> void:
	var body = response_data[3] as PackedByteArray
	var json = JSON.new()
	var parse_result = json.parse(body.get_string_from_utf8())
	
	if parse_result != OK:
		error_occurred.emit("Failed to parse assets list response")
		return
	
	var data = json.get_data()
	
	if data.has("error"):
		error_occurred.emit(data["error"]["message"])
		return
	
	if data.has("result"):
		var assets_data = data["result"].get("assets", [])
		var assets: Array = []
		
		for asset_data in assets_data:
			var asset = _parse_asset(asset_data)
			cached_assets[asset["uuid"]] = asset
			assets.append(asset)
		
		assets_list_loaded.emit(assets)


func _parse_asset(data: Dictionary) -> Dictionary:
	var asset = {
		"uuid": data.get("uuid", ""),
		"name": data.get("name", ""),
		"owner": data.get("owner", ""),
		"experience_points": int(data.get("experience_points", 0)),
		"level": int(data.get("level", 1)),
		"durability": int(data.get("durability", 100)),
		"kill_count": int(data.get("kill_count", 0)),
		"resources": data.get("resources", []),
		"children_uuids": data.get("children_uuids", []),
		"custom_state": data.get("custom_state", {})
	}
	return asset


## Get resource URL for a specific context (game, marketplace, vr)
func get_resource_for_context(asset: Dictionary, context: String) -> String:
	var best_resource: Dictionary = {}
	var best_priority: int = -1
	
	for res in asset.get("resources", []):
		var contexts = res.get("context", [])
		if context in contexts and res.get("priority", 0) > best_priority:
			best_resource = res
			best_priority = res.get("priority", 0)
	
	return best_resource.get("uri", "")


## Get cached asset (call fetch_asset first if not cached)
func get_cached_asset(uuid: String) -> Dictionary:
	return cached_assets.get(uuid, {})


# =============================================================================
# GAMEPLAY ACTIONS
# =============================================================================

## Record a gameplay action (sends to Oracle for validation & reward)
func record_gameplay_action(action_id: String, difficulty: int, metadata: Dictionary = {}) -> void:
	if wallet_address.is_empty():
		error_occurred.emit("No wallet connected")
		action_recorded.emit(action_id, false, 0.0)
		return
	
	print("[DemiurgeSDK] Recording action: ", action_id)
	
	var body = {
		"player_address": wallet_address,
		"action": action_id,
		"difficulty": difficulty,
		"timestamp": Time.get_datetime_string_from_system(true),
		"metadata": metadata
	}
	
	var json_string = JSON.stringify(body)
	var headers = [
		"Content-Type: application/json",
		"Authorization: Bearer " + session_token
	]
	
	var http = HTTPRequest.new()
	add_child(http)
	
	var error = http.request(ORACLE_URL + "/api/record-action", headers, HTTPClient.METHOD_POST, json_string)
	
	if error != OK:
		http.queue_free()
		error_occurred.emit("Failed to start action request")
		action_recorded.emit(action_id, false, 0.0)
		return
	
	var response = await http.request_completed
	http.queue_free()
	_handle_action_response(response, action_id)


func _handle_action_response(response_data: Array, action_id: String) -> void:
	var status_code = response_data[1] as int
	var body = response_data[3] as PackedByteArray
	
	if status_code != 200:
		error_occurred.emit("Action failed with status: " + str(status_code))
		action_recorded.emit(action_id, false, 0.0)
		return
	
	var json = JSON.new()
	var parse_result = json.parse(body.get_string_from_utf8())
	
	if parse_result != OK:
		error_occurred.emit("Failed to parse action response")
		action_recorded.emit(action_id, false, 0.0)
		return
	
	var data = json.get_data()
	var success = data.get("success", false)
	var reward = float(data.get("reward_amount", 0.0))
	
	action_recorded.emit(action_id, success, reward)
	
	# Refresh balance after successful action
	if success:
		fetch_balance()


# =============================================================================
# NFT TEXTURE LOADING
# =============================================================================

## Load NFT texture from URL and apply to a MeshInstance3D
func load_nft_texture(url: String, target_mesh: MeshInstance3D = null, key: String = "") -> void:
	if key.is_empty():
		key = url.get_file()
	
	var http = HTTPRequest.new()
	add_child(http)
	
	var error = http.request(url)
	
	if error != OK:
		http.queue_free()
		error_occurred.emit("Failed to start texture download")
		return
	
	var response = await http.request_completed
	http.queue_free()
	
	var status_code = response[1] as int
	var body = response[3] as PackedByteArray
	
	if status_code != 200:
		error_occurred.emit("Failed to download texture: HTTP " + str(status_code))
		return
	
	# Create Image from data
	var image = Image.new()
	var image_error: Error
	
	# Detect format from URL
	if url.ends_with(".png"):
		image_error = image.load_png_from_buffer(body)
	elif url.ends_with(".jpg") or url.ends_with(".jpeg"):
		image_error = image.load_jpg_from_buffer(body)
	elif url.ends_with(".webp"):
		image_error = image.load_webp_from_buffer(body)
	else:
		# Try PNG by default
		image_error = image.load_png_from_buffer(body)
	
	if image_error != OK:
		error_occurred.emit("Failed to parse image data")
		return
	
	# Create texture
	var texture = ImageTexture.create_from_image(image)
	
	# Apply to mesh if provided
	if target_mesh != null:
		var mat = target_mesh.get_active_material(0)
		if mat == null:
			mat = StandardMaterial3D.new()
			target_mesh.set_surface_override_material(0, mat)
		else:
			mat = mat.duplicate()
			target_mesh.set_surface_override_material(0, mat)
		
		if mat is StandardMaterial3D:
			mat.albedo_texture = texture
	
	print("[DemiurgeSDK] NFT texture loaded: ", key)
	nft_texture_loaded.emit(key, texture)


# =============================================================================
# INTERNAL HELPERS
# =============================================================================

func _create_rpc_payload(method: String, params: Array) -> Dictionary:
	return {
		"jsonrpc": "2.0",
		"method": method,
		"params": params,
		"id": randi() % 1000000
	}


func _save_wallet(address: String) -> void:
	var file = FileAccess.open("user://demiurge.save", FileAccess.WRITE)
	if file:
		file.store_string(address)
		file.close()


func _load_saved_wallet() -> void:
	if FileAccess.file_exists("user://demiurge.save"):
		var file = FileAccess.open("user://demiurge.save", FileAccess.READ)
		if file:
			var saved_address = file.get_as_text().strip_edges()
			file.close()
			
			if not saved_address.is_empty():
				wallet_address = saved_address
				print("[DemiurgeSDK] Auto-loaded wallet: ", saved_address)
```

### Register as Autoload

1. Go to **Project → Project Settings → Globals → Autoload**
2. Click the folder icon and select `res://scripts/demiurge_sdk/demiurge_global.gd`
3. Set the **Node Name** to `Demiurge`
4. Click **Add**

Now you can access `Demiurge` from any script!

---

## Step 2: Gameplay Integration

### HUD Manager

Create a script for your HUD Control node:

```gdscript
extends Control

@onready var sparks_label: Label = $HBoxContainer/SparksLabel
@onready var cgt_label: Label = $HBoxContainer/CGTLabel
@onready var energy_bar: ProgressBar = $EnergyBar
@onready var connect_button: Button = $ConnectButton
@onready var wallet_input: LineEdit = $WalletInput

func _ready() -> void:
	# Connect to Demiurge signals
	Demiurge.balance_updated.connect(_on_balance_updated)
	Demiurge.energy_updated.connect(_on_energy_updated)
	Demiurge.wallet_connected.connect(_on_wallet_connected)
	Demiurge.wallet_disconnected.connect(_on_wallet_disconnected)
	Demiurge.error_occurred.connect(_on_error)
	
	# Update UI based on current state
	if Demiurge.is_connected():
		_on_wallet_connected(Demiurge.wallet_address)
	
	# Connect button
	connect_button.pressed.connect(_on_connect_pressed)


func _on_balance_updated(sparks: int, cgt: float) -> void:
	sparks_label.text = "Sparks: %d" % sparks
	cgt_label.text = "CGT: %.2f" % cgt


func _on_energy_updated(current: int, max_energy: int, percentage: float) -> void:
	energy_bar.value = percentage
	energy_bar.tooltip_text = "%d / %d" % [current, max_energy]


func _on_wallet_connected(address: String) -> void:
	connect_button.visible = false
	wallet_input.visible = false
	print("Wallet connected: ", address)


func _on_wallet_disconnected() -> void:
	connect_button.visible = true
	wallet_input.visible = true
	sparks_label.text = "Sparks: --"
	cgt_label.text = "CGT: --"


func _on_connect_pressed() -> void:
	var address = wallet_input.text.strip_edges()
	if not address.is_empty():
		Demiurge.connect_wallet(address)


func _on_error(message: String) -> void:
	push_error("[Demiurge] " + message)
	# Show error toast/notification
```

### Enemy Loot Source

Attach this to your Enemy scenes:

```gdscript
extends Node3D
class_name DemiurgeLootSource

@export var action_id: String = "kill_elite_mob"
@export var difficulty_rating: int = 50
@export var enemy_type: String = "Elite Goblin"

@export var reward_popup_scene: PackedScene

## Called when enemy is defeated
func die() -> void:
	# Play death animation
	if has_node("AnimationPlayer"):
		$AnimationPlayer.play("death")
	
	# Record action on blockchain
	var metadata = {
		"enemy_type": enemy_type,
		"position": str(global_position)
	}
	
	Demiurge.record_gameplay_action(action_id, difficulty_rating, metadata)
	
	# Listen for result
	Demiurge.action_recorded.connect(_on_action_recorded, CONNECT_ONE_SHOT)
	
	# Clean up after animation
	await get_tree().create_timer(1.0).timeout
	queue_free()


func _on_action_recorded(recorded_action_id: String, success: bool, reward: float) -> void:
	if recorded_action_id != action_id:
		return
	
	if success and reward > 0:
		_show_reward_popup(reward)


func _show_reward_popup(amount: float) -> void:
	if reward_popup_scene:
		var popup = reward_popup_scene.instantiate()
		popup.global_position = global_position + Vector3.UP * 2
		get_tree().current_scene.add_child(popup)
		
		# Set text (assuming popup has a Label3D)
		var label = popup.get_node_or_null("Label3D")
		if label:
			label.text = "+%.0f Sparks" % amount
```

### NFT-Gated Door

```gdscript
extends Node3D

@export var required_asset_uuid: String
@export var required_asset_name: String = "Founder's Key"

@onready var door_animator: AnimationPlayer = $AnimationPlayer
@onready var locked_sound: AudioStreamPlayer3D = $LockedSound
@onready var unlock_sound: AudioStreamPlayer3D = $UnlockSound
@onready var locked_ui: Control = $LockedUI

var _is_unlocked: bool = false

func _on_area_body_entered(body: Node3D) -> void:
	if not body.is_in_group("player") or _is_unlocked:
		return
	
	# Check if player owns the required NFT
	Demiurge.fetch_owned_assets()
	
	# Wait for response
	var assets = await Demiurge.assets_list_loaded
	
	var has_key = false
	for asset in assets:
		if asset["uuid"] == required_asset_uuid or asset["name"] == required_asset_name:
			has_key = true
			break
	
	if has_key:
		_unlock_door()
	else:
		_show_locked_message()


func _unlock_door() -> void:
	_is_unlocked = true
	unlock_sound.play()
	door_animator.play("open")
	print("Door unlocked! Player has the required NFT.")


func _show_locked_message() -> void:
	locked_sound.play()
	locked_ui.visible = true
	print("Door locked. Requires: ", required_asset_name)
	
	# Hide message after delay
	await get_tree().create_timer(3.0).timeout
	locked_ui.visible = false
```

### NFT Skin Loader Component

Attach to any MeshInstance3D to auto-load NFT textures:

```gdscript
extends MeshInstance3D

@export var asset_uuid: String
@export var resource_context: String = "game"
@export var load_on_ready: bool = true

func _ready() -> void:
	if load_on_ready and not asset_uuid.is_empty():
		load_nft_skin()


func load_nft_skin() -> void:
	# Get asset data
	var asset = Demiurge.get_cached_asset(asset_uuid)
	
	if asset.is_empty():
		# Fetch if not cached
		Demiurge.fetch_asset(asset_uuid)
		asset = await Demiurge.asset_loaded
	
	# Get resource URL for context
	var url = Demiurge.get_resource_for_context(asset, resource_context)
	
	if url.is_empty():
		push_warning("No %s resource found for asset %s" % [resource_context, asset_uuid])
		return
	
	# Load texture
	Demiurge.load_nft_texture(url, self, asset_uuid)
```

---

## Step 3: Economy Strategy

### Soft Currency Manager (Off-Chain Sparks)

For high-frequency rewards, track locally and batch-sync:

```gdscript
extends Node

var pending_sparks: int = 0
var last_sync_time: float = 0.0
const SYNC_INTERVAL: float = 30.0  # Batch sync every 30 seconds

signal sparks_changed(total: int)

func add_pending_sparks(amount: int) -> void:
	pending_sparks += amount
	sparks_changed.emit(pending_sparks)
	
	# Show immediate feedback (optimistic UI)
	print("+%d Sparks (pending)" % amount)


func _process(delta: float) -> void:
	last_sync_time += delta
	
	if last_sync_time >= SYNC_INTERVAL and pending_sparks > 0:
		_sync_to_oracle()
		last_sync_time = 0.0


func _sync_to_oracle() -> void:
	var metadata = {"amount": str(pending_sparks)}
	Demiurge.record_gameplay_action("batch_sparks_claim", 0, metadata)
	
	Demiurge.action_recorded.connect(func(action_id, success, reward):
		if action_id == "batch_sparks_claim" and success:
			pending_sparks = 0
	, CONNECT_ONE_SHOT)


func force_sync() -> void:
	if pending_sparks > 0:
		_sync_to_oracle()
```

---

## Step 4: Web Export Considerations

For Godot Web exports, HTTP requests work but may need CORS handling on your Oracle backend.

### project.godot additions

```ini
[application]
config/features=PackedStringArray("4.2", "Forward Plus")

[network]
limits/tcp/connect_timeout_seconds=30
```

### Oracle CORS Headers

Your Oracle backend must return:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## Security Checklist

- [ ] Never store private keys in GDScript
- [ ] Always validate actions server-side (Oracle)
- [ ] Use HTTPS for all RPC calls
- [ ] Don't trust client-reported scores or kills
- [ ] Cache RPC responses to reduce network traffic
- [ ] Handle network failures gracefully (offline mode)
- [ ] Use `user://` path for saves (persists across sessions)

---

## Troubleshooting

### "No wallet connected" errors

Ensure `Demiurge.connect_wallet()` is called before fetching data. Check if the Autoload is registered correctly.

### HTTP requests failing

1. Check Project Settings → Network → Limits
2. Verify HTTPS is working (SSL certificates)
3. For Web exports, check CORS headers on your server

### Textures not loading

1. Verify the URL is accessible
2. Check if CORS allows the image domain
3. Try different image formats (PNG vs JPG)

### Signals not being received

Always connect signals before triggering the action:

```gdscript
# Wrong - signal might fire before connection
Demiurge.fetch_balance()
Demiurge.balance_updated.connect(_on_balance)

# Correct
Demiurge.balance_updated.connect(_on_balance)
Demiurge.fetch_balance()
```

---

## Next Steps

1. **[Oracle Backend Guide](./ORACLE_BACKEND.md)** - Set up your secure game server
2. **[DRC-369 Deep Dive](../creators/drc369-complete-guide.md)** - Advanced NFT features
3. **[Session Keys](../developers/session-keys-integration.md)** - Seamless authentication

---

**The Syzygies dance in pairs. The code serves the will.**

---

*Last Updated: January 26, 2026*  
*Document Version: 1.0*  
*Maintainer: Alaustrup*
