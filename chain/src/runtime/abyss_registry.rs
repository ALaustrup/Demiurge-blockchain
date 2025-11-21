//! Abyss registry module for NFT marketplace listings and CGT-based sales with royalties.
//!
//! This module handles:
//! - Creating and canceling NFT listings
//! - Purchasing NFTs with CGT
//! - Royalty distribution to creators

use serde::{Deserialize, Serialize};

use super::bank_cgt::{get_balance_cgt, set_balance_for_module};
use super::nft_dgen::{get_nft, NftDgenModule, NftId, TransferNftParams};
use super::RuntimeModule;
use crate::core::state::State;
use crate::core::transaction::{Address, Transaction};

const PREFIX_LISTING: &[u8] = b"abyss:listing:";
const KEY_LISTING_COUNTER: &[u8] = b"abyss:listing:counter";

/// Listing ID type
pub type ListingId = u64;

/// Marketplace listing
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Listing {
    pub id: ListingId,
    pub token_id: NftId,
    pub seller: Address,
    pub price_cgt: u64,
    pub active: bool,
}

/// Create listing parameters
#[derive(Debug, Serialize, Deserialize)]
pub struct CreateListingParams {
    pub token_id: NftId,
    pub price_cgt: u64,
}

/// Cancel listing parameters
#[derive(Debug, Serialize, Deserialize)]
pub struct CancelListingParams {
    pub listing_id: ListingId,
}

/// Buy listing parameters
#[derive(Debug, Serialize, Deserialize)]
pub struct BuyListingParams {
    pub listing_id: ListingId,
}

/// Helper functions for listing management

fn listing_key(id: ListingId) -> Vec<u8> {
    let mut key = Vec::from(PREFIX_LISTING);
    key.extend_from_slice(&id.to_be_bytes());
    key
}

fn load_listing(state: &State, id: ListingId) -> Option<Listing> {
    state
        .get_raw(&listing_key(id))
        .and_then(|bytes| bincode::deserialize::<Listing>(&bytes).ok())
}

fn store_listing(state: &mut State, listing: &Listing) -> Result<(), String> {
    let bytes = bincode::serialize(listing).map_err(|e| e.to_string())?;
    state
        .put_raw(listing_key(listing.id), bytes)
        .map_err(|e| e.to_string())
}

fn get_next_listing_id(state: &State) -> ListingId {
    state
        .get_raw(KEY_LISTING_COUNTER)
        .and_then(|bytes| bincode::deserialize::<ListingId>(&bytes).ok())
        .unwrap_or(0)
}

fn set_next_listing_id(state: &mut State, next: ListingId) -> Result<(), String> {
    let bytes = bincode::serialize(&next).map_err(|e| e.to_string())?;
    state
        .put_raw(KEY_LISTING_COUNTER.to_vec(), bytes)
        .map_err(|e| e.to_string())
}

/// Public helper for querying listing (for RPC/SDK use).
pub fn get_listing(state: &State, id: ListingId) -> Option<Listing> {
    load_listing(state, id)
}

/// AbyssRegistryModule handles marketplace operations
pub struct AbyssRegistryModule;

impl AbyssRegistryModule {
    pub fn new() -> Self {
        Self
    }
}

impl RuntimeModule for AbyssRegistryModule {
    fn module_id(&self) -> &'static str {
        "abyss_registry"
    }

    fn dispatch(&self, call_id: &str, tx: &Transaction, state: &mut State) -> Result<(), String> {
        match call_id {
            "create_listing" => handle_create_listing(tx, state),
            "cancel_listing" => handle_cancel_listing(tx, state),
            "buy_listing" => handle_buy_listing(tx, state),
            other => Err(format!("abyss_registry: unknown call_id '{}'", other)),
        }
    }
}

fn handle_create_listing(tx: &Transaction, state: &mut State) -> Result<(), String> {
    let params: CreateListingParams =
        bincode::deserialize(&tx.payload).map_err(|e| e.to_string())?;

    // Ensure NFT exists and tx.from is current owner
    let nft = get_nft(state, params.token_id).ok_or_else(|| "NFT not found".to_string())?;

    if nft.owner != tx.from {
        return Err("only the NFT owner may create a listing".into());
    }

    if params.price_cgt == 0 {
        return Err("price must be > 0".into());
    }

    let mut next_id = get_next_listing_id(state);
    let id = next_id;
    next_id = next_id.checked_add(1).ok_or("listing id overflow")?;
    set_next_listing_id(state, next_id)?;

    let listing = Listing {
        id,
        token_id: params.token_id,
        seller: tx.from,
        price_cgt: params.price_cgt,
        active: true,
    };

    store_listing(state, &listing)?;

    Ok(())
}

fn handle_cancel_listing(tx: &Transaction, state: &mut State) -> Result<(), String> {
    let params: CancelListingParams =
        bincode::deserialize(&tx.payload).map_err(|e| e.to_string())?;

    let mut listing =
        load_listing(state, params.listing_id).ok_or_else(|| "Listing not found".to_string())?;

    if listing.seller != tx.from {
        return Err("only the listing seller may cancel it".into());
    }

    if !listing.active {
        return Err("listing is already inactive".into());
    }

    listing.active = false;
    store_listing(state, &listing)?;

    Ok(())
}

fn handle_buy_listing(tx: &Transaction, state: &mut State) -> Result<(), String> {
    let params: BuyListingParams = bincode::deserialize(&tx.payload).map_err(|e| e.to_string())?;

    let mut listing =
        load_listing(state, params.listing_id).ok_or_else(|| "Listing not found".to_string())?;

    if !listing.active {
        return Err("listing is not active".into());
    }

    let buyer = tx.from;
    let seller = listing.seller;
    let price = listing.price_cgt;

    // Load NFT & metadata for royalties
    let nft = get_nft(state, listing.token_id).ok_or_else(|| "NFT not found".to_string())?;

    if nft.owner != seller {
        // listing is stale; can't sell it
        listing.active = false;
        store_listing(state, &listing)?;
        return Err("listing seller is no longer NFT owner".into());
    }

    let buyer_balance = get_balance_cgt(state, &buyer);
    if buyer_balance < price {
        return Err("buyer has insufficient CGT".into());
    }

    // Very simple royalty logic:
    // - if royalty_recipient and royalty_bps are set:
    //     royalty_amount = price * royalty_bps / 10_000
    // - seller gets the rest.

    let (royalty_recipient, royalty_bps) = match (nft.royalty_recipient, nft.royalty_bps) {
        (Some(addr), bps) if bps > 0 => (Some(addr), bps),
        _ => (None, 0),
    };

    let mut royalty_amount = 0u64;
    if royalty_recipient.is_some() {
        royalty_amount = (price as u128)
            .saturating_mul(royalty_bps as u128)
            .checked_div(10_000)
            .unwrap_or(0) as u64;
    }

    if royalty_amount > price {
        royalty_amount = price;
    }

    let seller_amount = price - royalty_amount;

    // Debit buyer
    let new_buyer_balance = buyer_balance - price;
    set_balance_for_module(state, &buyer, new_buyer_balance)?;

    // Credit seller
    let seller_balance = get_balance_cgt(state, &seller);
    let new_seller_balance = seller_balance
        .checked_add(seller_amount)
        .ok_or("overflow crediting seller")?;
    set_balance_for_module(state, &seller, new_seller_balance)?;

    // Credit royalty recipient
    if let Some(recipient) = royalty_recipient {
        let rec_balance = get_balance_cgt(state, &recipient);
        let new_rec_balance = rec_balance
            .checked_add(royalty_amount)
            .ok_or("overflow crediting royalty")?;
        set_balance_for_module(state, &recipient, new_rec_balance)?;
    }

    // Transfer NFT ownership to buyer
    let transfer_params = TransferNftParams {
        token_id: listing.token_id,
        to: buyer,
    };
    let transfer_payload = bincode::serialize(&transfer_params).map_err(|e| e.to_string())?;

    let transfer_tx = Transaction {
        from: seller,
        nonce: 0, // internal/system-level transfer; nonce not used here
        module_id: "nft_dgen".to_string(),
        call_id: "transfer_nft".to_string(),
        payload: transfer_payload,
        fee: 0,
        signature: vec![],
    };

    // We call NFT transfer directly via the module, bypassing Runtime's module lookup.
    NftDgenModule::new().dispatch("transfer_nft", &transfer_tx, state)?;

    // Mark listing inactive
    listing.active = false;
    store_listing(state, &listing)?;

    Ok(())
}
