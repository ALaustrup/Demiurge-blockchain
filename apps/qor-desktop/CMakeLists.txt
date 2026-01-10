cmake_minimum_required(VERSION 3.20)

project(QOR VERSION 1.0.0 LANGUAGES CXX)

# QØЯ - Demiurge Blockchain Desktop Client
# The complete native desktop environment for the Demiurge ecosystem

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)
set(CMAKE_AUTOUIC ON)

# Find Qt packages - Core required components
find_package(Qt6 REQUIRED COMPONENTS
    Core
    Gui
    Widgets
    Quick
    QuickControls2
    Network
    Sql
    Multimedia
    MultimediaWidgets
)

# Optional Qt components (may not be available in all builds)
find_package(Qt6 QUIET COMPONENTS
    Quick3D
    Quick3DRuntimeRender
    WebEngineWidgets
    WebChannel
    OpenGL
    ShaderTools
)

# Report optional components
if(Qt6Quick3D_FOUND)
    message(STATUS "Qt Quick3D found - 3D features enabled")
else()
    message(STATUS "Qt Quick3D not found - 3D features disabled")
endif()

if(Qt6WebEngineWidgets_FOUND)
    message(STATUS "Qt WebEngine found - Browser features enabled")
else()
    message(STATUS "Qt WebEngine not found - Browser features disabled")
endif()

# Core application sources
set(CORE_SOURCES
    src/core/Application.cpp
    src/core/Application.h
    src/core/Config.cpp
    src/core/Config.h
    src/core/Logger.cpp
    src/core/Logger.h
)

# Storage sources
set(STORAGE_SOURCES
    src/storage/LocalDatabase.cpp
    src/storage/LocalDatabase.h
    src/storage/SecureVault.cpp
    src/storage/SecureVault.h
)

# Chain integration sources
set(CHAIN_SOURCES
    src/chain/ChainClient.cpp
    src/chain/ChainClient.h
    src/chain/SyncManager.cpp
    src/chain/SyncManager.h
    src/chain/TransactionQueue.cpp
    src/chain/TransactionQueue.h
)

# P2P networking sources
set(P2P_SOURCES
    src/p2p/P2PNode.cpp
    src/p2p/P2PNode.h
)

# Mining engine sources
set(MINING_SOURCES
    src/mining/MiningEngine.cpp
    src/mining/MiningEngine.h
)

# UI sources
set(UI_SOURCES
    src/main.cpp
    src/MainWindow.cpp
    src/MainWindow.h
    src/BrowserView.cpp
    src/BrowserView.h
    src/SystemTray.cpp
    src/SystemTray.h
    src/QorIDManager.cpp
    src/QorIDManager.h
    src/WalletBridge.cpp
    src/WalletBridge.h
    src/wallet/WalletManager.cpp
    src/wallet/WalletManager.h
    src/UpdateManager.cpp
    src/UpdateManager.h
    src/AppLauncher.cpp
    src/AppLauncher.h
)

# All sources combined - Only main.cpp for pure QML interface
set(SOURCES
    src/main.cpp
)

# Resources
set(RESOURCES
    src/resources/resources.qrc
    qml.qrc
)

# Platform-specific configurations
if(WIN32)
    # Windows resource file for icon (optional - only if file exists)
    if(EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/src/resources/app.rc")
        set(APP_ICON_RESOURCE_WINDOWS "${CMAKE_CURRENT_SOURCE_DIR}/src/resources/app.rc")
    endif()
    # Temporarily remove WIN32 flag to see console output
    add_executable(${PROJECT_NAME} ${SOURCES} ${RESOURCES} ${APP_ICON_RESOURCE_WINDOWS})
elseif(APPLE)
    set(MACOSX_BUNDLE_ICON_FILE qor.icns)
    set(APP_ICON_MACOSX "${CMAKE_CURRENT_SOURCE_DIR}/src/resources/icons/qor.icns")
    set_source_files_properties(${APP_ICON_MACOSX} PROPERTIES MACOSX_PACKAGE_LOCATION "Resources")
    add_executable(${PROJECT_NAME} MACOSX_BUNDLE ${SOURCES} ${RESOURCES} ${APP_ICON_MACOSX})
    set_target_properties(${PROJECT_NAME} PROPERTIES
        MACOSX_BUNDLE_GUI_IDENTIFIER "com.demiurge.qor"
        MACOSX_BUNDLE_BUNDLE_VERSION ${PROJECT_VERSION}
        MACOSX_BUNDLE_SHORT_VERSION_STRING ${PROJECT_VERSION_MAJOR}.${PROJECT_VERSION_MINOR}
        MACOSX_BUNDLE_INFO_PLIST "${CMAKE_CURRENT_SOURCE_DIR}/src/resources/Info.plist.in"
        MACOSX_BUNDLE_BUNDLE_NAME "QOR"
    )
else()
    add_executable(${PROJECT_NAME} ${SOURCES} ${RESOURCES})
endif()

# Link Qt libraries - Required
target_link_libraries(${PROJECT_NAME} PRIVATE
    Qt6::Core
    Qt6::Gui
    Qt6::Widgets
    Qt6::Quick
    Qt6::QuickControls2
    Qt6::Network
    Qt6::Sql
    Qt6::Multimedia
    Qt6::MultimediaWidgets
)

# Link optional Qt libraries if available
if(Qt6Quick3D_FOUND)
    target_link_libraries(${PROJECT_NAME} PRIVATE Qt6::Quick3D)
    target_compile_definitions(${PROJECT_NAME} PRIVATE QOR_QUICK3D_ENABLED)
endif()

if(Qt6Quick3DRuntimeRender_FOUND)
    target_link_libraries(${PROJECT_NAME} PRIVATE Qt6::Quick3DRuntimeRender)
endif()

if(Qt6WebEngineWidgets_FOUND)
    target_link_libraries(${PROJECT_NAME} PRIVATE Qt6::WebEngineWidgets)
    target_compile_definitions(${PROJECT_NAME} PRIVATE QOR_WEBENGINE_ENABLED)
endif()

if(Qt6WebChannel_FOUND)
    target_link_libraries(${PROJECT_NAME} PRIVATE Qt6::WebChannel)
endif()

if(Qt6OpenGL_FOUND)
    target_link_libraries(${PROJECT_NAME} PRIVATE Qt6::OpenGL)
endif()

if(Qt6ShaderTools_FOUND)
    target_link_libraries(${PROJECT_NAME} PRIVATE Qt6::ShaderTools)
endif()

# Copy web content to build directory (for Abyss Explorer browser component)
add_custom_command(TARGET ${PROJECT_NAME} POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_directory
    "${CMAKE_CURRENT_SOURCE_DIR}/web"
    "$<TARGET_FILE_DIR:${PROJECT_NAME}>/web"
    COMMENT "Copying Abyss OS web content..."
)

# Version info and branding
target_compile_definitions(${PROJECT_NAME} PRIVATE
    APP_VERSION="${PROJECT_VERSION}"
    APP_NAME="QOR"
    APP_DISPLAY_NAME="QOR - Demiurge Desktop"
    APP_ORGANIZATION="Demiurge"
    APP_DOMAIN="demiurge.cloud"
    APP_IDENTIFIER="com.demiurge.qor"
)

# Install rules
install(TARGETS ${PROJECT_NAME}
    BUNDLE DESTINATION .
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)

# CPack configuration for installers
set(CPACK_PACKAGE_NAME "QOR")
set(CPACK_PACKAGE_VENDOR "Demiurge")
set(CPACK_PACKAGE_DESCRIPTION_SUMMARY "QOR - Demiurge Blockchain Desktop Client")
set(CPACK_PACKAGE_VERSION ${PROJECT_VERSION})
set(CPACK_PACKAGE_INSTALL_DIRECTORY "QOR")
include(CPack)
