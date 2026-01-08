#!/usr/bin/env python3
"""
Genesis Launcher Deployment Script

Builds and packages the Genesis Launcher for Windows, Linux, and macOS.
Uses Qt's deployment tools (windeployqt, macdeployqt, linuxdeployqt).

Usage:
    python deploy.py [--platform windows|linux|macos] [--qt-path /path/to/qt]
"""

import os
import sys
import shutil
import subprocess
import argparse
from pathlib import Path

# Configuration
PROJECT_NAME = "GenesisLauncher"
VERSION = "1.0.0"

class Deployer:
    def __init__(self, qt_path: str, platform: str, build_type: str = "Release"):
        self.qt_path = Path(qt_path)
        self.platform = platform
        self.build_type = build_type
        self.project_dir = Path(__file__).parent.parent
        self.build_dir = self.project_dir / "build" / platform
        self.deploy_dir = self.project_dir / "deploy" / platform
        
    def configure(self):
        """Run CMake configuration"""
        print(f"Configuring for {self.platform}...")
        
        self.build_dir.mkdir(parents=True, exist_ok=True)
        
        cmake_args = [
            "cmake",
            "-S", str(self.project_dir),
            "-B", str(self.build_dir),
            f"-DCMAKE_BUILD_TYPE={self.build_type}",
            f"-DCMAKE_PREFIX_PATH={self.qt_path}",
        ]
        
        if self.platform == "windows":
            cmake_args.extend(["-G", "Ninja"])
        
        subprocess.run(cmake_args, check=True)
        
    def build(self):
        """Build the project"""
        print("Building...")
        
        cmake_args = [
            "cmake",
            "--build", str(self.build_dir),
            "--config", self.build_type,
            "--parallel"
        ]
        
        subprocess.run(cmake_args, check=True)
        
    def deploy_windows(self):
        """Deploy for Windows using windeployqt"""
        print("Deploying for Windows...")
        
        self.deploy_dir.mkdir(parents=True, exist_ok=True)
        
        # Copy executables
        for exe in ["GenesisLauncher.exe", "GenesisSeed.exe", "DemiurgeMiner.exe"]:
            src = self.build_dir / exe
            if src.exists():
                shutil.copy2(src, self.deploy_dir / exe)
        
        # Run windeployqt
        windeployqt = self.qt_path / "bin" / "windeployqt.exe"
        
        for exe in ["GenesisLauncher.exe", "DemiurgeMiner.exe"]:
            exe_path = self.deploy_dir / exe
            if exe_path.exists():
                subprocess.run([
                    str(windeployqt),
                    "--qmldir", str(self.project_dir / "src" / "qml"),
                    "--no-translations",
                    "--release",
                    str(exe_path)
                ], check=True)
        
        # Create installer (using NSIS or similar)
        self.create_windows_installer()
        
    def deploy_linux(self):
        """Deploy for Linux using linuxdeployqt"""
        print("Deploying for Linux...")
        
        self.deploy_dir.mkdir(parents=True, exist_ok=True)
        
        # Copy executables
        for exe in ["GenesisLauncher", "GenesisSeed", "DemiurgeMiner"]:
            src = self.build_dir / exe
            if src.exists():
                shutil.copy2(src, self.deploy_dir / exe)
                os.chmod(self.deploy_dir / exe, 0o755)
        
        # Create AppImage (requires linuxdeployqt)
        # linuxdeployqt GenesisLauncher -qmldir=../src/qml -appimage
        
        # Create desktop file
        desktop_file = self.deploy_dir / "genesis-launcher.desktop"
        desktop_file.write_text(f"""[Desktop Entry]
Type=Application
Name=Genesis Launcher
Comment=Demiurge Blockchain Gateway
Exec=GenesisLauncher
Icon=genesis
Categories=Network;Utility;
""")
        
    def deploy_macos(self):
        """Deploy for macOS using macdeployqt"""
        print("Deploying for macOS...")
        
        self.deploy_dir.mkdir(parents=True, exist_ok=True)
        
        app_bundle = self.build_dir / "GenesisLauncher.app"
        if not app_bundle.exists():
            print("App bundle not found. Building may have failed.")
            return
        
        # Copy app bundle
        dest_bundle = self.deploy_dir / "GenesisLauncher.app"
        if dest_bundle.exists():
            shutil.rmtree(dest_bundle)
        shutil.copytree(app_bundle, dest_bundle)
        
        # Run macdeployqt
        macdeployqt = self.qt_path / "bin" / "macdeployqt"
        
        subprocess.run([
            str(macdeployqt),
            str(dest_bundle),
            f"-qmldir={self.project_dir / 'src' / 'qml'}",
            "-always-overwrite"
        ], check=True)
        
        # Create DMG
        self.create_macos_dmg()
        
    def create_windows_installer(self):
        """Create NSIS installer script"""
        nsis_script = self.deploy_dir / "installer.nsi"
        nsis_script.write_text(f"""
!include "MUI2.nsh"

Name "Genesis Launcher"
OutFile "GenesisLauncher-{VERSION}-Setup.exe"
InstallDir "$PROGRAMFILES64\\Demiurge\\Genesis"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

Section "Install"
    SetOutPath $INSTDIR
    File /r "*.*"
    
    CreateShortCut "$DESKTOP\\Genesis Launcher.lnk" "$INSTDIR\\GenesisLauncher.exe"
    CreateDirectory "$SMPROGRAMS\\Demiurge"
    CreateShortCut "$SMPROGRAMS\\Demiurge\\Genesis Launcher.lnk" "$INSTDIR\\GenesisLauncher.exe"
    
    WriteUninstaller "$INSTDIR\\uninstall.exe"
SectionEnd

Section "Uninstall"
    Delete "$DESKTOP\\Genesis Launcher.lnk"
    Delete "$SMPROGRAMS\\Demiurge\\Genesis Launcher.lnk"
    RMDir "$SMPROGRAMS\\Demiurge"
    RMDir /r "$INSTDIR"
SectionEnd
""")
        print(f"NSIS script created: {nsis_script}")
        print("Run 'makensis installer.nsi' to create the installer")
        
    def create_macos_dmg(self):
        """Create macOS DMG"""
        dmg_path = self.deploy_dir / f"GenesisLauncher-{VERSION}.dmg"
        
        subprocess.run([
            "hdiutil", "create",
            "-volname", "Genesis Launcher",
            "-srcfolder", str(self.deploy_dir / "GenesisLauncher.app"),
            "-ov",
            str(dmg_path)
        ], check=True)
        
        print(f"DMG created: {dmg_path}")
        
    def deploy(self):
        """Run full deployment"""
        self.configure()
        self.build()
        
        if self.platform == "windows":
            self.deploy_windows()
        elif self.platform == "linux":
            self.deploy_linux()
        elif self.platform == "macos":
            self.deploy_macos()
        
        print(f"\n✓ Deployment complete: {self.deploy_dir}")


def main():
    parser = argparse.ArgumentParser(description="Deploy Genesis Launcher")
    parser.add_argument("--platform", choices=["windows", "linux", "macos"],
                       default=detect_platform(), help="Target platform")
    parser.add_argument("--qt-path", default=detect_qt_path(),
                       help="Path to Qt installation")
    parser.add_argument("--build-type", choices=["Debug", "Release"],
                       default="Release", help="Build type")
    
    args = parser.parse_args()
    
    if not args.qt_path:
        print("Error: Qt path not found. Specify with --qt-path")
        sys.exit(1)
    
    deployer = Deployer(args.qt_path, args.platform, args.build_type)
    deployer.deploy()


def detect_platform() -> str:
    """Detect current platform"""
    if sys.platform == "win32":
        return "windows"
    elif sys.platform == "darwin":
        return "macos"
    else:
        return "linux"


def detect_qt_path() -> str:
    """Try to detect Qt installation path"""
    possible_paths = [
        # Windows
        "C:/Qt/6.10.1/mingw_64",
        "C:/Qt/6.10.0/mingw_64",
        # Linux
        "/opt/Qt/6.10.1/gcc_64",
        "~/Qt/6.10.1/gcc_64",
        # macOS
        "/opt/homebrew/opt/qt@6",
        "~/Qt/6.10.1/macos",
    ]
    
    for path in possible_paths:
        expanded = os.path.expanduser(path)
        if os.path.exists(expanded):
            return expanded
    
    # Check environment variable
    return os.environ.get("QT_PATH", "")


if __name__ == "__main__":
    main()
