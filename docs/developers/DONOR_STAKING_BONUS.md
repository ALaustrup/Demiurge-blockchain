# Donor Staking Bonus Integration

This document specifies how to integrate donor staking bonuses into the Demiurge blockchain consensus engine.

## Overview

Donors receive staking reward bonuses based on their donation tier:
- **Tier 1 (Supporter)**: +2% staking rewards (200 bps)
- **Tier 2 (Champion)**: +4% staking rewards (400 bps)
- **Tier 3 (Guardian)**: +6% staking rewards (600 bps)
- **Tier 4 (Archon)**: +8% staking rewards (800 bps)
- **Tier 5 (Godsent)**: +10% staking rewards (1000 bps)

Subscribers at any tier get the perks of the next tier up (capped at Tier 5).

## Implementation Location

The staking bonus should be applied in the consensus/reward calculation logic:

```
framework/consensus/src/engine.rs
```

## Data Source

Donor badges are DRC-369 NFTs with dynamic state. The staking bonus is stored in the NFT's dynamic state:

```rust
// In pallet-drc369, query the donor badge for the staking account
let badge_uuid = get_donor_badge_for_account(staker_account);
if let Some(uuid) = badge_uuid {
    let badge_state = Drc369::get_dynamic_state(uuid);
    if let Some(state) = badge_state {
        // staking_bonus_bps is stored as an integer (e.g., 200 = 2%)
        let bonus_bps = state.get("staking_bonus_bps").unwrap_or(0);
        return bonus_bps;
    }
}
```

## Reward Calculation Modification

In the reward distribution logic, apply the bonus:

```rust
/// Calculate staking reward with donor bonus
fn calculate_reward_with_bonus(
    base_reward: Balance,
    staker: &AccountId,
) -> Balance {
    // Get donor badge bonus (returns 0 if no badge or no bonus)
    let bonus_bps = get_staking_bonus_bps(staker);
    
    if bonus_bps > 0 {
        // Apply bonus: reward * (1 + bonus_bps / 10000)
        // e.g., 1000 tokens * (1 + 200/10000) = 1000 * 1.02 = 1020 tokens
        let bonus = base_reward
            .saturating_mul(bonus_bps.into())
            .saturating_div(10000u128.into());
        
        base_reward.saturating_add(bonus)
    } else {
        base_reward
    }
}
```

## Badge Lookup Function

Add a helper function to query donor badges:

```rust
/// Get staking bonus basis points for an account
/// Returns 0 if account has no donor badge or badge has no bonus
fn get_staking_bonus_bps(account: &AccountId) -> u32 {
    // Query DRC-369 pallet for donor badges owned by this account
    // Donor badges have a specific class_id or are identified by metadata
    
    let owned_assets = Drc369::owner_items(account);
    
    for uuid in owned_assets {
        if let Some(asset) = Drc369::assets(uuid) {
            // Check if this is a donor badge (by name or class)
            if asset.name.starts_with(b"Donor Badge") || 
               asset.class_id == DONOR_BADGE_CLASS_ID {
                // Get dynamic state
                if let Some(state) = Drc369::dynamic_states(uuid) {
                    // Parse staking_bonus_bps from state
                    if let Some(bonus) = state.get("staking_bonus_bps") {
                        return bonus.as_u32().unwrap_or(0);
                    }
                }
            }
        }
    }
    
    0
}
```

## Constants

Add these constants to the consensus module:

```rust
/// Class ID for donor badge NFTs
pub const DONOR_BADGE_CLASS_ID: u32 = 1000;

/// Maximum staking bonus in basis points (10%)
pub const MAX_STAKING_BONUS_BPS: u32 = 1000;
```

## Event Emission

Optionally emit an event when bonus is applied:

```rust
Self::deposit_event(Event::StakingBonusApplied {
    staker: staker.clone(),
    base_reward,
    bonus_bps,
    final_reward,
});
```

## Testing

Test scenarios:
1. Staker with no donor badge receives base rewards
2. Tier 1 donor receives +2% bonus
3. Tier 5 donor receives +10% bonus (max)
4. Subscriber with Tier 1 sub receives Tier 2 bonus (+4%)
5. Bonus is correctly applied on era payout
6. Multiple stakers with different tiers receive correct bonuses

## Integration Points

1. **Era Payout**: Apply bonus in `payout_stakers` function
2. **Reward Calculation**: Modify `calculate_era_reward` 
3. **Validator Commission**: Bonus applies to nominator rewards, not validator commission

## Security Considerations

1. **Overflow Protection**: Use `saturating_mul` and `saturating_add`
2. **Rate Limiting**: Cache badge lookups per era to avoid excessive queries
3. **Badge Verification**: Ensure badge is valid and not expired
4. **Max Bonus Cap**: Enforce MAX_STAKING_BONUS_BPS to prevent excessive rewards
