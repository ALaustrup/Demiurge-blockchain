cmake_minimum_required(VERSION 3.21)
project(GenesisLauncher VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
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
    Multimedia
)

# Optional: RemoteObjects for advanced IPC
find_package(Qt6 QUIET COMPONENTS RemoteObjects)

# Application metadata
set(APP_NAME "GenesisLauncher")
set(APP_VERSION "1.0.0")
set(APP_ORGANIZATION "Demiurge")
set(APP_DOMAIN "demiurge.cloud")
set(APP_IDENTIFIER "com.demiurge.genesis")

add_compile_definitions(
    APP_NAME="${APP_NAME}"
    APP_VERSION="${APP_VERSION}"
    APP_ORGANIZATION="${APP_ORGANIZATION}"
    APP_DOMAIN="${APP_DOMAIN}"
    APP_IDENTIFIER="${APP_IDENTIFIER}"
)

# Enable RemoteObjects if found
if(Qt6RemoteObjects_FOUND)
    add_compile_definitions(GENESIS_REMOTEOBJECTS_ENABLED)
    message(STATUS "Qt RemoteObjects found - Advanced IPC enabled")
endif()

# ============================================================================
# GENESIS LAUNCHER (Main Application)
# ============================================================================

set(LAUNCHER_SOURCES
    src/main.cpp
    src/core/LauncherCore.cpp
    src/core/LauncherCore.h
    src/core/ProcessManager.cpp
    src/core/ProcessManager.h
    src/core/SystemTrayManager.cpp
    src/core/SystemTrayManager.h
    src/auth/AuthManager.cpp
    src/auth/AuthManager.h
    src/auth/KeyVault.cpp
    src/auth/KeyVault.h
    src/auth/SessionToken.cpp
    src/auth/SessionToken.h
    src/ipc/IPCServer.cpp
    src/ipc/IPCServer.h
    src/ipc/SharedSession.h
    src/updater/UpdateEngine.cpp
    src/updater/UpdateEngine.h
    src/updater/ManifestParser.cpp
    src/updater/ManifestParser.h
    src/updater/DeltaPatcher.cpp
    src/updater/DeltaPatcher.h
)

# QML resources
set(QML_RESOURCES
    src/qml/qml.qrc
)

# Static resources (icons, textures, fonts)
set(STATIC_RESOURCES
    src/resources/resources.qrc
)

# Windows resource file
if(WIN32)
    set(WIN_RESOURCES src/resources/launcher.rc)
endif()

# Main executable
add_executable(${APP_NAME} WIN32
    ${LAUNCHER_SOURCES}
    ${QML_RESOURCES}
    ${STATIC_RESOURCES}
    ${WIN_RESOURCES}
)

target_include_directories(${APP_NAME} PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/src
)

target_link_libraries(${APP_NAME} PRIVATE
    Qt6::Core
    Qt6::Gui
    Qt6::Qml
    Qt6::Quick
    Qt6::QuickControls2
    Qt6::Network
    Qt6::Concurrent
    Qt6::Widgets
    Qt6::Multimedia
)

if(Qt6RemoteObjects_FOUND)
    target_link_libraries(${APP_NAME} PRIVATE Qt6::RemoteObjects)
endif()

# Platform-specific libraries
if(WIN32)
    target_link_libraries(${APP_NAME} PRIVATE
        crypt32  # For DPAPI encryption
        bcrypt   # Modern crypto
    )
elseif(APPLE)
    find_library(SECURITY_FRAMEWORK Security)
    find_library(COREFOUNDATION_FRAMEWORK CoreFoundation)
    target_link_libraries(${APP_NAME} PRIVATE
        ${SECURITY_FRAMEWORK}
        ${COREFOUNDATION_FRAMEWORK}
    )
endif()

# ============================================================================
# BOOTSTRAP INSTALLER (The Seed)
# ============================================================================

add_executable(GenesisSeed WIN32
    bootstrap/src/main.cpp
    bootstrap/src/Downloader.cpp
    bootstrap/src/Downloader.h
    bootstrap/src/SeedWindow.cpp
    bootstrap/src/SeedWindow.h
)

target_link_libraries(GenesisSeed PRIVATE
    Qt6::Core
    Qt6::Gui
    Qt6::Widgets
    Qt6::Network
)

# ============================================================================
# MINER DAEMON (Lightweight process)
# ============================================================================

add_executable(DemiurgeMiner WIN32
    src/miner/main.cpp
    src/miner/MinerDaemon.cpp
    src/miner/MinerDaemon.h
    src/ipc/IPCClient.cpp
    src/ipc/IPCClient.h
)

target_include_directories(DemiurgeMiner PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/src
)

target_link_libraries(DemiurgeMiner PRIVATE
    Qt6::Core
    Qt6::Gui
    Qt6::Widgets
    Qt6::Network
    Qt6::Concurrent
)

# ============================================================================
# Installation / Deployment
# ============================================================================

install(TARGETS ${APP_NAME} GenesisSeed DemiurgeMiner
    RUNTIME DESTINATION bin
    BUNDLE DESTINATION .
)

# Copy Qt DLLs on Windows
if(WIN32)
    add_custom_command(TARGET ${APP_NAME} POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E echo "Run windeployqt manually for full deployment"
    )
endif()
