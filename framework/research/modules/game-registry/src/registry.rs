//! Game registry implementation

use crate::error::GameRegistryError;
use demiurge_storage::StorageBackend;
use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};
use std::collections::HashMap;
use tracing::info;

/// Game categories
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum GameCategory {
    /// Mining/earning games (e.g., clicker miners)
    Miner,
    /// Games with DRC-369 NFT integration
    Drc369,
    /// Casual games without blockchain rewards
    Casual,
    /// Multiplayer games
    Multiplayer,
    /// Adventure/RPG games
    Adventure,
}

impl GameCategory {
    pub fn from_str(s: &str) -> Result<Self, GameRegistryError> {
        match s.to_lowercase().as_str() {
            "miner" => Ok(GameCategory::Miner),
            "drc369" => Ok(GameCategory::Drc369),
            "casual" => Ok(GameCategory::Casual),
            "multiplayer" => Ok(GameCategory::Multiplayer),
            "adventure" => Ok(GameCategory::Adventure),
            _ => Err(GameRegistryError::InvalidCategory(s.to_string())),
        }
    }
}

/// Supported game engines
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum GameEngine {
    /// Phaser.js
    Phaser,
    /// ScatterTXT (Demiurge native)
    Scattertxt,
    /// Rosebud.ai generated
    Rosebud,
    /// Unity WebGL export
    UnityWebgl,
    /// Unreal Engine HTML5 export
    UnrealWebgl,
    /// Custom/other engine
    Custom,
}

impl GameEngine {
    pub fn from_str(s: &str) -> Result<Self, GameRegistryError> {
        match s.to_lowercase().replace("-", "").replace("_", "").as_str() {
            "phaser" => Ok(GameEngine::Phaser),
            "scattertxt" => Ok(GameEngine::Scattertxt),
            "rosebud" => Ok(GameEngine::Rosebud),
            "unitywebgl" | "unity" => Ok(GameEngine::UnityWebgl),
            "unrealwebgl" | "unreal" => Ok(GameEngine::UnrealWebgl),
            "custom" | "other" => Ok(GameEngine::Custom),
            _ => Err(GameRegistryError::InvalidEngine(s.to_string())),
        }
    }
}

/// Revenue sharing configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RevenueConfig {
    /// Developer share (basis points, 10000 = 100%)
    pub developer_share: u32,
    /// Treasury share (basis points)
    pub treasury_share: u32,
    /// Staker share (basis points)
    pub staker_share: u32,
}

impl Default for RevenueConfig {
    fn default() -> Self {
        Self {
            developer_share: 7000, // 70%
            treasury_share: 2000,  // 20%
            staker_share: 1000,    // 10%
        }
    }
}

/// Game registration entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameRegistration {
    /// Unique game ID (hash of metadata)
    pub game_id: [u8; 32],
    /// Owner's QOR ID
    pub owner: String,
    /// Game title
    pub title: String,
    /// Game description
    pub description: String,
    /// URL to game files (IPFS or server)
    pub game_url: String,
    /// URL to metadata JSON
    pub metadata_url: String,
    /// Stake deposited (CGT in smallest units)
    pub stake: u128,
    /// Whether game is approved
    pub approved: bool,
    /// Whether game is active/visible
    pub active: bool,
    /// Game category
    pub category: GameCategory,
    /// Game engine used
    pub engine: GameEngine,
    /// Engine version (if applicable)
    pub engine_version: Option<String>,
    /// Revenue sharing configuration
    pub revenue_config: RevenueConfig,
    /// Registration timestamp
    pub registered_at: u64,
    /// Approval timestamp (if approved)
    pub approved_at: Option<u64>,
    /// Total plays count
    pub total_plays: u64,
    /// Total CGT earned by players
    pub total_cgt_earned: u128,
}

/// Minimum stake required to register a game (in smallest CGT units)
pub const MINIMUM_STAKE: u128 = 100_000; // 1000 CGT

/// Game Registry
pub struct GameRegistry<S: demiurge_storage::Storage> {
    storage: S,
    /// In-memory cache of registered games
    games: HashMap<[u8; 32], GameRegistration>,
}

impl<S: demiurge_storage::Storage> GameRegistry<S> {
    /// Create a new game registry
    pub fn new(storage: S) -> Self {
        Self {
            storage,
            games: HashMap::new(),
        }
    }

    /// Load games from storage
    pub fn load(&mut self) -> Result<(), GameRegistryError> {
        let data = self.storage.get(b"game_registry_index")
            .map_err(|e| GameRegistryError::StorageError(e.to_string()))?;
        
        if let Some(bytes) = data {
            let game_ids: Vec<[u8; 32]> = serde_json::from_slice(&bytes)?;
            
            for game_id in game_ids {
                let key = format!("game:{}", hex::encode(game_id));
                if let Some(game_data) = self.storage.get(key.as_bytes())
                    .map_err(|e| GameRegistryError::StorageError(e.to_string()))? 
                {
                    let game: GameRegistration = serde_json::from_slice(&game_data)?;
                    self.games.insert(game_id, game);
                }
            }
        }
        
        info!("Loaded {} games from registry", self.games.len());
        Ok(())
    }

    /// Save games to storage
    fn save(&self) -> Result<(), GameRegistryError> {
        // Save index
        let game_ids: Vec<[u8; 32]> = self.games.keys().cloned().collect();
        let index_data = serde_json::to_vec(&game_ids)?;
        self.storage.put(b"game_registry_index", &index_data)
            .map_err(|e| GameRegistryError::StorageError(e.to_string()))?;
        
        // Save each game
        for (game_id, game) in &self.games {
            let key = format!("game:{}", hex::encode(game_id));
            let game_data = serde_json::to_vec(game)?;
            self.storage.put(key.as_bytes(), &game_data)
                .map_err(|e| GameRegistryError::StorageError(e.to_string()))?;
        }
        
        Ok(())
    }

    /// Register a new game
    pub fn register_game(
        &mut self,
        owner: String,
        title: String,
        description: String,
        game_url: String,
        metadata_url: String,
        stake: u128,
        category: GameCategory,
        engine: GameEngine,
        engine_version: Option<String>,
        timestamp: u64,
    ) -> Result<[u8; 32], GameRegistryError> {
        // Validate stake
        if stake < MINIMUM_STAKE {
            return Err(GameRegistryError::InsufficientStake {
                required: MINIMUM_STAKE,
                provided: stake,
            });
        }

        // Generate game ID from metadata
        let mut hasher = Sha256::new();
        hasher.update(owner.as_bytes());
        hasher.update(title.as_bytes());
        hasher.update(game_url.as_bytes());
        hasher.update(&timestamp.to_le_bytes());
        let game_id: [u8; 32] = hasher.finalize().into();

        // Check if already exists
        if self.games.contains_key(&game_id) {
            return Err(GameRegistryError::GameAlreadyExists(hex::encode(game_id)));
        }

        let registration = GameRegistration {
            game_id,
            owner,
            title,
            description,
            game_url,
            metadata_url,
            stake,
            approved: false,
            active: false,
            category,
            engine,
            engine_version,
            revenue_config: RevenueConfig::default(),
            registered_at: timestamp,
            approved_at: None,
            total_plays: 0,
            total_cgt_earned: 0,
        };

        self.games.insert(game_id, registration);
        self.save()?;

        info!("Game registered: {} ({})", hex::encode(game_id), title);
        Ok(game_id)
    }

    /// Approve a game (admin only)
    pub fn approve_game(
        &mut self,
        game_id: [u8; 32],
        approver: &str,
        timestamp: u64,
    ) -> Result<(), GameRegistryError> {
        let game = self.games.get_mut(&game_id)
            .ok_or_else(|| GameRegistryError::GameNotFound(hex::encode(game_id)))?;

        game.approved = true;
        game.active = true;
        game.approved_at = Some(timestamp);

        self.save()?;

        info!("Game approved: {} by {}", hex::encode(game_id), approver);
        Ok(())
    }

    /// Reject/deactivate a game
    pub fn reject_game(
        &mut self,
        game_id: [u8; 32],
        _reason: &str,
    ) -> Result<(), GameRegistryError> {
        let game = self.games.get_mut(&game_id)
            .ok_or_else(|| GameRegistryError::GameNotFound(hex::encode(game_id)))?;

        game.approved = false;
        game.active = false;

        self.save()?;

        info!("Game rejected: {}", hex::encode(game_id));
        Ok(())
    }

    /// Get a game by ID
    pub fn get_game(&self, game_id: [u8; 32]) -> Option<&GameRegistration> {
        self.games.get(&game_id)
    }

    /// Get all games (optionally filtered by category)
    pub fn get_games(&self, category: Option<GameCategory>, approved_only: bool) -> Vec<&GameRegistration> {
        self.games.values()
            .filter(|g| {
                let cat_match = category.map_or(true, |c| g.category == c);
                let approved_match = !approved_only || g.approved;
                cat_match && approved_match
            })
            .collect()
    }

    /// Get games by owner
    pub fn get_games_by_owner(&self, owner: &str) -> Vec<&GameRegistration> {
        self.games.values()
            .filter(|g| g.owner == owner)
            .collect()
    }

    /// Record a game play
    pub fn record_play(&mut self, game_id: [u8; 32], cgt_earned: u128) -> Result<(), GameRegistryError> {
        let game = self.games.get_mut(&game_id)
            .ok_or_else(|| GameRegistryError::GameNotFound(hex::encode(game_id)))?;

        game.total_plays += 1;
        game.total_cgt_earned += cgt_earned;

        // Save periodically (every 100 plays)
        if game.total_plays % 100 == 0 {
            self.save()?;
        }

        Ok(())
    }

    /// Update revenue configuration
    pub fn update_revenue_config(
        &mut self,
        game_id: [u8; 32],
        owner: &str,
        config: RevenueConfig,
    ) -> Result<(), GameRegistryError> {
        let game = self.games.get_mut(&game_id)
            .ok_or_else(|| GameRegistryError::GameNotFound(hex::encode(game_id)))?;

        if game.owner != owner {
            return Err(GameRegistryError::NotAuthorized(
                "Only the owner can update revenue config".to_string()
            ));
        }

        // Validate shares add up to 100%
        let total = config.developer_share + config.treasury_share + config.staker_share;
        if total != 10000 {
            return Err(GameRegistryError::InvalidMetadata(
                format!("Revenue shares must add up to 10000, got {}", total)
            ));
        }

        game.revenue_config = config;
        self.save()?;

        Ok(())
    }

    /// Withdraw stake (after game is removed)
    pub fn withdraw_stake(
        &mut self,
        game_id: [u8; 32],
        owner: &str,
    ) -> Result<u128, GameRegistryError> {
        let game = self.games.get(&game_id)
            .ok_or_else(|| GameRegistryError::GameNotFound(hex::encode(game_id)))?;

        if game.owner != owner {
            return Err(GameRegistryError::NotAuthorized(
                "Only the owner can withdraw stake".to_string()
            ));
        }

        if game.active {
            return Err(GameRegistryError::NotAuthorized(
                "Cannot withdraw stake from active game".to_string()
            ));
        }

        let stake = game.stake;
        self.games.remove(&game_id);
        self.save()?;

        info!("Stake withdrawn for game {}: {} CGT", hex::encode(game_id), stake);
        Ok(stake)
    }

    /// Get registry statistics
    pub fn get_stats(&self) -> RegistryStats {
        let total_games = self.games.len();
        let approved_games = self.games.values().filter(|g| g.approved).count();
        let total_stake: u128 = self.games.values().map(|g| g.stake).sum();
        let total_plays: u64 = self.games.values().map(|g| g.total_plays).sum();
        let total_cgt_earned: u128 = self.games.values().map(|g| g.total_cgt_earned).sum();

        let mut by_category = HashMap::new();
        for game in self.games.values() {
            *by_category.entry(game.category).or_insert(0) += 1;
        }

        let mut by_engine = HashMap::new();
        for game in self.games.values() {
            *by_engine.entry(game.engine).or_insert(0) += 1;
        }

        RegistryStats {
            total_games,
            approved_games,
            pending_games: total_games - approved_games,
            total_stake,
            total_plays,
            total_cgt_earned,
            by_category,
            by_engine,
        }
    }
}

/// Registry statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegistryStats {
    pub total_games: usize,
    pub approved_games: usize,
    pub pending_games: usize,
    pub total_stake: u128,
    pub total_plays: u64,
    pub total_cgt_earned: u128,
    pub by_category: HashMap<GameCategory, usize>,
    pub by_engine: HashMap<GameEngine, usize>,
}
