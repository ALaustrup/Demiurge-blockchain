cmake_minimum_required(VERSION 3.16)
project(PantheonConsole VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find Qt6
find_package(Qt6 REQUIRED COMPONENTS Core Widgets)

# Enable automatic MOC, UIC, and RCC
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTOUIC ON)
set(CMAKE_AUTORCC ON)

# Source files
set(SOURCES
    src/main.cpp
    src/MainWindow.cpp
)

set(HEADERS
    src/MainWindow.h
)

# Create executable
add_executable(PantheonConsole ${SOURCES} ${HEADERS})

# Link Qt6 libraries
target_link_libraries(PantheonConsole
    Qt6::Core
    Qt6::Widgets
)

# Installation (optional)
install(TARGETS PantheonConsole
    RUNTIME DESTINATION bin
)

