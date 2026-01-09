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
    Quick3D
    Quick3DRuntime
    Quick3DAssetImport
    Network
    OpenGL
    OpenGLWidgets
    Multimedia
    Gamepad
)

# Source files
set(SOURCES
    src/main.cpp
    src/recursion_world.cpp
    src/RecursionEngine.cpp
    src/BlockchainRPC.cpp
    src/EntityManager.cpp
    src/GameRenderer.cpp
)

# Header files
set(HEADERS
    src/recursion_world.h
    src/RecursionEngine.h
    src/BlockchainRPC.h
    src/EntityManager.h
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
    Qt6::Quick3D
    Qt6::Quick3DRuntime
    Qt6::Quick3DAssetImport
    Qt6::Network
    Qt6::OpenGL
    Qt6::OpenGLWidgets
    Qt6::Multimedia
    Qt6::Gamepad
)

# Include directories
target_include_directories(recursion PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/src
)

# Compiler options
target_compile_options(recursion PRIVATE
    -Wall
    -Wextra
    -Wpedantic
)

# Windows-specific
if(WIN32)
    set_target_properties(recursion PROPERTIES
        WIN32_EXECUTABLE TRUE
    )
endif()
