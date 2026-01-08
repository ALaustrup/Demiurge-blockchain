/**
 * DEMIURGE QOR - Installation Script
 * 
 * This script handles the installation logic for the QOR Launcher.
 * It's executed at various points during installation/uninstallation.
 */

function Component() {
    // Constructor
    console.log("QOR Launcher component loaded");
}

Component.prototype.createOperations = function() {
    try {
        // Call default implementation
        component.createOperations();
        
        // Get installation directory
        var installDir = installer.value("TargetDir");
        var executable = "DemiurgeQOR";
        
        // Platform-specific operations
        if (systemInfo.kernelType === "winnt") {
            // Windows
            executable += ".exe";
            
            // Create Start Menu shortcuts
            component.addOperation("CreateShortcut",
                "@TargetDir@/" + executable,
                "@StartMenuDir@/QOR Launcher.lnk",
                "workingDirectory=@TargetDir@",
                "iconPath=@TargetDir@/qor.ico",
                "description=Launch DEMIURGE QOR"
            );
            
            // Create Desktop shortcut (optional)
            component.addOperation("CreateShortcut",
                "@TargetDir@/" + executable,
                "@DesktopDir@/DEMIURGE QOR.lnk",
                "workingDirectory=@TargetDir@",
                "iconPath=@TargetDir@/qor.ico",
                "description=Launch DEMIURGE QOR"
            );
            
            // Add to Windows PATH
            component.addOperation("EnvironmentVariable",
                "PATH",
                "@TargetDir@",
                true,  // Append
                ";"    // Separator
            );
            
            // Registry entries for uninstaller
            component.addOperation("RegisterFileType",
                "qorid",
                "@TargetDir@/" + executable + " '%1'",
                "QOR Identity File",
                "application/qorid",
                "@TargetDir@/qor.ico"
            );
            
        } else if (systemInfo.kernelType === "darwin") {
            // macOS
            // Create symlink in /Applications
            component.addOperation("Execute",
                "ln", "-sf",
                "@TargetDir@/DemiurgeQOR.app",
                "/Applications/DEMIURGE QOR.app",
                "UNDOEXECUTE",
                "rm", "-f", "/Applications/DEMIURGE QOR.app"
            );
            
        } else {
            // Linux
            // Create desktop entry
            var desktopFile = installer.value("HomeDir") + "/.local/share/applications/demiurge-qor.desktop";
            component.addOperation("CreateDesktopEntry",
                desktopFile,
                "Type=Application\n" +
                "Name=DEMIURGE QOR\n" +
                "Comment=Gateway to the Demiurge Blockchain\n" +
                "Exec=@TargetDir@/" + executable + "\n" +
                "Icon=@TargetDir@/qor.png\n" +
                "Terminal=false\n" +
                "Categories=Network;Blockchain;Qt;\n"
            );
            
            // Make executable
            component.addOperation("Execute",
                "chmod", "+x", "@TargetDir@/" + executable
            );
        }
        
        console.log("QOR Launcher operations created successfully");
        
    } catch (e) {
        console.log("Error creating operations: " + e);
    }
}

Component.prototype.createOperationsForArchive = function(archive) {
    // Called for each archive being extracted
    component.createOperationsForArchive(archive);
}

// Post-installation
Component.prototype.installationFinished = function() {
    try {
        console.log("QOR Launcher installation finished");
        
        // Show launch option on finish page
        if (installer.isInstaller()) {
            installer.setValue("FinishedPage.CheckBox", "Launch DEMIURGE QOR");
            installer.setValue("FinishedPage.CheckBox.value", "true");
        }
        
    } catch (e) {
        console.log("Error in installationFinished: " + e);
    }
}

// Pre-uninstallation
Component.prototype.beginUninstallation = function() {
    try {
        console.log("QOR Launcher uninstallation starting");
        
        // Stop any running instances
        if (systemInfo.kernelType === "winnt") {
            component.addOperation("Execute",
                "taskkill", "/F", "/IM", "DemiurgeQOR.exe",
                "UNDOEXECUTE", "echo", "Process was running"
            );
        } else {
            component.addOperation("Execute",
                "killall", "DemiurgeQOR",
                "UNDOEXECUTE", "echo", "Process was running"
            );
        }
        
    } catch (e) {
        console.log("Error in beginUninstallation: " + e);
    }
}
