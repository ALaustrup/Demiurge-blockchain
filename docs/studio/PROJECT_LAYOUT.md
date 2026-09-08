# Studio project layout

Each game is a folder under `projects/` at the repo root (or anywhere on disk in a future release).

## Example: `projects/MyRPG/`

```text
MyRPG/
├── project.json       # Studio metadata
├── chain/             # Reserved: per-project node data (Phase B)
├── assets/
│   ├── items/         # DRC-369 JSON / manifests
│   └── worlds/        # World design notes, spawn tables
└── docs/
    └── GDD.md         # Optional design doc
```

## `project.json` (convention)

```json
{
  "name": "MyRPG",
  "displayName": "My RPG",
  "version": "0.1.0",
  "rpcUrl": "http://127.0.0.1:9944",
  "authUrl": "http://127.0.0.1:8080/api/v1",
  "currency": {
    "symbol": "CGT",
    "decimals": 2,
    "sparksPerCgt": 100
  },
  "engine": {
    "primary": "unreal",
    "pluginPath": "sdk/unreal/DemiurgeSDK"
  }
}
```

Phase B will teach the CLI and Hub to read this file and bind the node to `chain/`. Until then, use it as documentation and copy `rpcUrl` into your engine project settings.

## Creating a project today

1. Copy `projects/_template/` to `projects/YourGameName/`.
2. Edit `project.json`.
3. Start the studio stack (`npm run studio:health`).
4. Build items in Hub **Create** or via CLI; store manifests under `assets/items/`.
