cmake_minimum_required(VERSION 3.10)
project(DemiurgeGame)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find packages
find_package(raylib REQUIRED)

# Source files
set(SOURCES
    src/main.cpp
    src/demo_scene.cpp
    src/urgeid.cpp
    src/rpc.cpp
)

# Include directories
include_directories(src)

# Create executable
add_executable(demiurge-game ${SOURCES})

# Link libraries
target_link_libraries(demiurge-game raylib)

