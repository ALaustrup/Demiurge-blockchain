//! Game assets implementation

use demiurge_modules::traits::{Module, ExecutionContext};
use demiurge_storage::Storage;
use codec::{Decode, Encode};
use scale_info::TypeInfo;

/// Game Assets module
pub struct GameAssetsModule;

impl Module for GameAssetsModule {
    fn name(&self) -> &'static str {
        "GameAssets"
    }

    fn version(&self) -> u32 {
        1
    }

    fn execute(
        &self,
        call: Vec<u8>,
        context: &ExecutionContext,
        _storage: &dyn Storage,
    ) -> std::result::Result<(), demiurge_modules::traits::ModuleError> {
        let call_data: AssetCall = Decode::decode(&mut &call[..])
            .map_err(|e| demiurge_modules::traits::ModuleError::InvalidCall(e.to_string()))?;

        let _caller = context.caller;

        match call_data {
            AssetCall::CreateAsset { game_id: _, asset_type: _ } => {
                // TODO: Create asset type (verify caller is game admin)
                Ok(())
            }
            AssetCall::Mint { game_id: _, asset_type: _, to: _, amount: _ } => {
                // TODO: Mint assets (verify caller is game admin)
                Ok(())
            }
            AssetCall::Transfer { game_id: _, asset_type: _, from: _, to: _, amount: _ } => {
                // TODO: Transfer assets (feeless, verify caller owns assets)
                Ok(())
            }
            AssetCall::Burn { game_id: _, asset_type: _, from: _, amount: _ } => {
                // TODO: Burn assets (verify caller owns assets)
                Ok(())
            }
        }
    }
}

/// Asset module calls
#[derive(Clone, Debug, Encode, Decode, TypeInfo)]
pub enum AssetCall {
    /// Create a new asset type
    CreateAsset {
        game_id: u32,
        asset_type: u32,
    },
    /// Mint assets
    Mint {
        game_id: u32,
        asset_type: u32,
        to: [u8; 32],
        amount: u128,
    },
    /// Transfer assets (feeless)
    Transfer {
        game_id: u32,
        asset_type: u32,
        from: [u8; 32],
        to: [u8; 32],
        amount: u128,
    },
    /// Burn assets
    Burn {
        game_id: u32,
        asset_type: u32,
        from: [u8; 32],
        amount: u128,
    },
}
