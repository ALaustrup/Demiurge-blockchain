/**
 * TorrentRegistry - On-chain torrent registry module interface
 * 
 * This header defines the interface for the on-chain torrent registry module.
 * The actual implementation would be in the chain runtime.
 */

#ifndef TORRENT_REGISTRY_H
#define TORRENT_REGISTRY_H

// This is a placeholder for the on-chain module interface
// The actual implementation would be in the Demiurge chain runtime

namespace TorrentRegistry {
    // Module name
    constexpr const char* MODULE_NAME = "torrent_registry";
    
    // Methods
    namespace Methods {
        constexpr const char* REGISTER_TORRENT = "register_torrent";
        constexpr const char* SEARCH_TORRENTS = "search_torrents";
        constexpr const char* GET_TORRENT = "get_torrent";
        constexpr const char* REPORT_PEER_ACTIVITY = "report_peer_activity";
        constexpr const char* GET_PEER_REPUTATION = "get_peer_reputation";
    }
}

#endif // TORRENT_REGISTRY_H
