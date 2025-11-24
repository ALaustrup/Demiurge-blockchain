/**
 * Demiurge Game Engine Template
 * 
 * Lightweight game client with Demiurge integration.
 */

#include "raylib.h"
#include "demo_scene.h"
#include "urgeid.h"
#include <iostream>

int main() {
    const int screenWidth = 800;
    const int screenHeight = 600;

    InitWindow(screenWidth, screenHeight, "Demiurge Game Template");
    SetTargetFPS(60);

    // Initialize Demiurge connection
    const char* rpc_url = "http://127.0.0.1:8545/rpc";
    std::string address = "0x" + std::string(64, 'a'); // Placeholder

    // Load UrgeID profile
    UrgeIDProfile profile = loadUrgeIDProfile(rpc_url, address);

    // Initialize demo scene
    DemoScene scene;
    scene.init();

    while (!WindowShouldClose()) {
        BeginDrawing();
        ClearBackground(BLACK);

        // Draw scene
        scene.update();
        scene.render();

        // Draw UI
        DrawText("Demiurge Game Template", 10, 10, 20, WHITE);
        if (!profile.username.empty()) {
            DrawText(("User: @" + profile.username).c_str(), 10, 40, 16, GRAY);
        }

        EndDrawing();
    }

    CloseWindow();
    return 0;
}

