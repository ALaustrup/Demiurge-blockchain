#include "urgeid.h"
#include "rpc.h"
#include <iostream>

UrgeIDProfile loadUrgeIDProfile(const char* rpc_url, const std::string& address) {
    UrgeIDProfile profile;
    profile.address = address;
    
    // Call RPC to get profile
    // This is a placeholder - implement actual RPC call
    std::string response = callRpc(rpc_url, "urgeid_getProfile", 
        "{\"address\":\"" + address + "\"}");
    
    // Parse response (simplified)
    profile.username = "player";
    profile.level = 1;
    profile.syzygy_score = 0;
    
    return profile;
}

