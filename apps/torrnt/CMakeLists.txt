cmake_minimum_required(VERSION 3.21)
project(TORRNT VERSION 1.0.0 LANGUAGES CXX)

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
    QuickControls2
    Network
    Concurrent
    Widgets
)

# Find libtorrent
find_package(PkgConfig QUIET)
if(PkgConfig_FOUND)
    pkg_check_modules(LIBTORRENT QUIET libtorrent-rasterbar)
endif()

# Try to find libtorrent manually if pkg-config didn't work
if(NOT LIBTORRENT_FOUND)
    find_path(LIBTORRENT_INCLUDE_DIR
        NAMES libtorrent/session.hpp
        PATHS
            /usr/include
            /usr/local/include
            C:/vcpkg/installed/x64-windows/include
            ${CMAKE_SOURCE_DIR}/third_party/libtorrent/include
    )
    
    find_library(LIBTORRENT_LIBRARY
        NAMES torrent-rasterbar torrent
        PATHS
            /usr/lib
            /usr/local/lib
            C:/vcpkg/installed/x64-windows/lib
            ${CMAKE_SOURCE_DIR}/third_party/libtorrent/lib
    )
    
    if(LIBTORRENT_INCLUDE_DIR AND LIBTORRENT_LIBRARY)
        set(LIBTORRENT_FOUND TRUE)
        set(LIBTORRENT_INCLUDE_DIRS ${LIBTORRENT_INCLUDE_DIR})
        set(LIBTORRENT_LIBRARIES ${LIBTORRENT_LIBRARY})
    endif()
endif()

if(LIBTORRENT_FOUND)
    message(STATUS "libtorrent found - Torrenting enabled")
    add_compile_definitions(TORRNT_LIBTORRENT_ENABLED)
else()
    message(WARNING "libtorrent not found - Building without torrent support")
    message(STATUS "Install libtorrent-rasterbar for full functionality")
    message(STATUS "  Windows: vcpkg install libtorrent:x64-windows")
    message(STATUS "  Linux: sudo apt-get install libtorrent-rasterbar-dev")
    message(STATUS "  macOS: brew install libtorrent-rasterbar")
endif()

# Application metadata
set(APP_NAME "TORRNT")
set(APP_VERSION "1.0.0")
set(APP_ORGANIZATION "Demiurge")
set(APP_DOMAIN "demiurge.cloud")
set(APP_IDENTIFIER "com.demiurge.torrnt")

add_compile_definitions(
    APP_NAME="${APP_NAME}"
    APP_VERSION="${APP_VERSION}"
    APP_ORGANIZATION="${APP_ORGANIZATION}"
    APP_DOMAIN="${APP_DOMAIN}"
    APP_IDENTIFIER="${APP_IDENTIFIER}"
)

# Source files
set(SOURCES
    src/main.cpp
    src/TorrentManager.cpp
    src/blockchain/BlockchainTorrentBridge.cpp
    src/blockchain/TorrentRegistry.cpp
)

# Header files
set(HEADERS
    src/TorrentManager.h
    src/blockchain/BlockchainTorrentBridge.h
    src/blockchain/TorrentRegistry.h
)

# QML resources
set(QML_RESOURCES
    src/qml/qml.qrc
)

# Create executable
add_executable(torrnt ${SOURCES} ${HEADERS} ${QML_RESOURCES})

# Include directories
target_include_directories(torrnt PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/src
)

if(LIBTORRENT_FOUND)
    target_include_directories(torrnt PRIVATE ${LIBTORRENT_INCLUDE_DIRS})
endif()

# Link Qt libraries
target_link_libraries(torrnt PRIVATE
    Qt6::Core
    Qt6::Gui
    Qt6::Qml
    Qt6::Quick
    Qt6::QuickControls2
    Qt6::Network
    Qt6::Concurrent
    Qt6::Widgets
)

# Link libtorrent if found
if(LIBTORRENT_FOUND)
    target_link_libraries(torrnt PRIVATE ${LIBTORRENT_LIBRARIES})
    # Link additional dependencies on Windows
    if(WIN32)
        target_link_libraries(torrnt PRIVATE ws2_32 iphlpapi)
    endif()
endif()

# Compiler options
if(MSVC)
    target_compile_options(torrnt PRIVATE
        /W4
        /permissive-
    )
else()
    target_compile_options(torrnt PRIVATE
        -Wall
        -Wextra
        -Wpedantic
    )
endif()

# Windows-specific
if(WIN32)
    set_target_properties(torrnt PROPERTIES
        WIN32_EXECUTABLE TRUE
    )
endif()
