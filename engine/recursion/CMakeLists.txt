cmake_minimum_required(VERSION 3.20)
project(RecursionEngine VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Source files
set(SOURCES
    src/main.cpp
    src/recursion_world.cpp
)

# Header files
set(HEADERS
    src/recursion_world.h
)

# Create executable
add_executable(recursion ${SOURCES} ${HEADERS})

# Compiler options
target_compile_options(recursion PRIVATE
    -Wall
    -Wextra
    -Wpedantic
)

# Include directories
target_include_directories(recursion PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/src
)

