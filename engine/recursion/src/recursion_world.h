#ifndef RECURSION_WORLD_H
#define RECURSION_WORLD_H

#include <string>
#include <cstdint>
#include <vector>
#include <memory>

namespace recursion {

/**
 * Configuration for a Recursion World.
 */
struct RecursionWorldConfig {
    std::string world_id;
    std::string owner_address;
    std::string title;
    std::string description;
    std::string fabric_root_hash;  // Pointer to Fabric asset
    uint64_t created_at;
};

/**
 * RecursionWorld represents a chain-native game world.
 * 
 * This is a minimal skeleton that will be extended in future milestones
 * to include full game engine capabilities, physics, rendering, etc.
 */
class RecursionWorld {
public:
    RecursionWorld(const RecursionWorldConfig& config);
    ~RecursionWorld() = default;

    // Getters
    const std::string& getWorldId() const { return config_.world_id; }
    const std::string& getOwner() const { return config_.owner_address; }
    const std::string& getTitle() const { return config_.title; }
    const std::string& getDescription() const { return config_.description; }
    const std::string& getFabricRootHash() const { return config_.fabric_root_hash; }
    uint64_t getCreatedAt() const { return config_.created_at; }

    /**
     * Process a single game tick.
     * 
     * @param delta_time Time elapsed since last tick (in seconds)
     */
    void tick(double delta_time);

    /**
     * Apply a chain event to the world state.
     * 
     * @param event_type Type of event (e.g., "nft_mint", "cgt_transfer")
     * @param event_data JSON-encoded event data
     */
    void applyChainEvent(const std::string& event_type, const std::string& event_data);

    /**
     * Export current world state as a snapshot (for persistence/checkpointing).
     * 
     * @return JSON-encoded state snapshot
     */
    std::string exportStateSnapshot() const;

private:
    RecursionWorldConfig config_;
    uint64_t tick_count_;
    double accumulated_time_;
    
    // Placeholder for world state
    std::vector<std::string> event_history_;
};

} // namespace recursion

#endif // RECURSION_WORLD_H

