cmake_minimum_required(VERSION 3.20)
project(RecursionEngine VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)
set(CMAKE_AUTOUIC ON)

# Find Qt6 packages
find_package(Qt6 REQUIRED COMPONENTS
    Core
    Gui
    Qml
    Quick
    Network
    OpenGL
    OpenGLWidgets
    Multimedia
)

# Optional Qt 3D components
find_package(Qt6 QUIET COMPONENTS Quick3D)
if(Qt6Quick3D_FOUND)
    message(STATUS "Qt Quick 3D found - 3D rendering enabled")
    add_compile_definitions(RECURSION_QUICK3D_ENABLED)
else()
    message(WARNING "Qt Quick 3D not found - using basic rendering")
    message(STATUS "Install Qt Quick 3D module for full 3D support")
endif()

# Optional components
find_package(Qt6 QUIET COMPONENTS Gamepad)
if(Qt6Gamepad_FOUND)
    message(STATUS "Qt Gamepad found - gamepad support enabled")
    add_compile_definitions(RECURSION_GAMEPAD_ENABLED)
endif()

# Source files
set(SOURCES
    src/main.cpp
    src/recursion_world.cpp
    src/RecursionEngine.cpp
    src/BlockchainRPC.cpp
    src/EntityManager.cpp
    src/GameEntity.cpp
    src/GameRenderer.cpp
)

# Header files
set(HEADERS
    src/recursion_world.h
    src/RecursionEngine.h
    src/BlockchainRPC.h
    src/EntityManager.h
    src/GameEntity.h
    src/GameRenderer.h
)

# QML resources
set(QML_RESOURCES
    src/qml/qml.qrc
)

# Create executable
add_executable(recursion ${SOURCES} ${HEADERS} ${QML_RESOURCES})

# Link Qt libraries
target_link_libraries(recursion PRIVATE
    Qt6::Core
    Qt6::Gui
    Qt6::Qml
    Qt6::Quick
    Qt6::Network
    Qt6::OpenGL
    Qt6::OpenGLWidgets
    Qt6::Multimedia
)

# Optional Qt 3D
if(Qt6Quick3D_FOUND)
    target_link_libraries(recursion PRIVATE Qt6::Quick3D)
endif()

# Optional gamepad
if(Qt6Gamepad_FOUND)
    target_link_libraries(recursion PRIVATE Qt6::Gamepad)
endif()

# Include directories
target_include_directories(recursion PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/src
)

# Compiler options
if(MSVC)
    target_compile_options(recursion PRIVATE
        /W4
        /permissive-
    )
else()
    target_compile_options(recursion PRIVATE
        -Wall
        -Wextra
        -Wpedantic
    )
endif()

# Windows-specific
if(WIN32)
    set_target_properties(recursion PROPERTIES
        WIN32_EXECUTABLE TRUE
    )
endif()
