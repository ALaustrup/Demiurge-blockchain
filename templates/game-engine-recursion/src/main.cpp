#include "recursion_world.h"
#include <iostream>
#include <fstream>
#include <string>
#include <chrono>
#include <thread>

using namespace recursion;

/**
 * Simple config parser (reads from JSON-like format or command-line args).
 * For now, uses hardcoded values; in future, will read from config file or chain.
 */
RecursionWorldConfig parseConfig(int argc, char* argv[]) {
    RecursionWorldConfig config;
    
    // Default values (in production, these would come from chain or config file)
    config.world_id = "default_world";
    config.owner_address = "0000000000000000000000000000000000000000";
    config.title = "Default Recursion World";
    config.description = "A minimal Recursion Engine world";
    config.fabric_root_hash = "";
    config.created_at = std::chrono::duration_cast<std::chrono::seconds>(
        std::chrono::system_clock::now().time_since_epoch()
    ).count();
    
    // Simple argument parsing (can be extended)
    for (int i = 1; i < argc; i++) {
        std::string arg = argv[i];
        if (arg == "--world-id" && i + 1 < argc) {
            config.world_id = argv[++i];
        } else if (arg == "--owner" && i + 1 < argc) {
            config.owner_address = argv[++i];
        } else if (arg == "--title" && i + 1 < argc) {
            config.title = argv[++i];
        }
    }
    
    return config;
}

int main(int argc, char* argv[]) {
    std::cout << "Recursion Engine v0.1.0" << std::endl;
    std::cout << "========================" << std::endl;
    
    RecursionWorldConfig config = parseConfig(argc, argv);
    
    std::cout << "Initializing world: " << config.title << std::endl;
    std::cout << "World ID: " << config.world_id << std::endl;
    std::cout << "Owner: " << config.owner_address << std::endl;
    
    RecursionWorld world(config);
    
    std::cout << "\nStarting tick loop (60 TPS)...\n" << std::endl;
    
    const double target_delta = 1.0 / 60.0;  // 60 ticks per second
    auto last_time = std::chrono::high_resolution_clock::now();
    uint64_t frame_count = 0;
    
    // Main game loop
    while (true) {
        auto current_time = std::chrono::high_resolution_clock::now();
        auto delta_chrono = std::chrono::duration_cast<std::chrono::microseconds>(
            current_time - last_time
        );
        double delta_time = delta_chrono.count() / 1'000'000.0;
        
        // Cap delta time to prevent large jumps
        if (delta_time > 0.1) {
            delta_time = 0.1;
        }
        
        // Process tick
        world.tick(delta_time);
        
        // Print state every 60 ticks (1 second at 60 TPS)
        frame_count++;
        if (frame_count % 60 == 0) {
            std::string snapshot = world.exportStateSnapshot();
            std::cout << "State: " << snapshot << std::endl;
        }
        
        last_time = current_time;
        
        // Sleep to maintain target tick rate
        auto sleep_duration = std::chrono::microseconds(
            static_cast<long long>((target_delta - delta_time) * 1'000'000)
        );
        if (sleep_duration.count() > 0) {
            std::this_thread::sleep_for(sleep_duration);
        }
    }
    
    return 0;
}

