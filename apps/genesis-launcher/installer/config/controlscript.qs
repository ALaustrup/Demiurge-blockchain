/**
 * Control Script - Controls installer behavior and custom pages
 * 
 * Provides polished installer experience with custom page text and behavior
 */

function Controller() {
    // Hide component selection (we only have one component)
    installer.setDefaultPageVisible(QInstaller.ComponentSelection, false);
}

Controller.prototype.ComponentSelectionPageCallback = function() {
    // Auto-select the main component if page is shown
    var widget = gui.currentPageWidget();
    if (widget != null) {
        widget.selectAllComponents();
    }
}

Controller.prototype.IntroductionPageCallback = function() {
    // Customize introduction/welcome page
    var widget = gui.currentPageWidget();
    if (widget != null) {
        widget.setTitle("Welcome to DEMIURGE QOR");
        widget.setSubTitle("The Gateway to the Demiurge Blockchain Ecosystem");
    }
}

Controller.prototype.TargetDirectoryPageCallback = function() {
    // Customize target directory page
    var widget = gui.currentPageWidget();
    if (widget != null) {
        widget.setTitle("Choose Installation Location");
        widget.setSubTitle("Select where DEMIURGE QOR should be installed");
    }
}

Controller.prototype.ReadyForInstallationPageCallback = function() {
    // Customize ready page
    var widget = gui.currentPageWidget();
    if (widget != null) {
        widget.setTitle("Ready to Install");
        widget.setSubTitle("DEMIURGE QOR is ready to be installed on your system");
    }
}

Controller.prototype.PerformInstallationPageCallback = function() {
    // Customize installation progress page
    var widget = gui.currentPageWidget();
    if (widget != null) {
        widget.setTitle("Installing DEMIURGE QOR");
        widget.setSubTitle("Please wait while the installation completes...");
    }
}

Controller.prototype.FinishedPageCallback = function() {
    // Customize finish page with launch option
    var widget = gui.currentPageWidget();
    if (widget != null) {
        widget.setTitle("Installation Complete");
        widget.setSubTitle("DEMIURGE QOR has been successfully installed");
        
        // Set launch checkbox
        widget.setRunProgramCheckBoxText("Launch DEMIURGE QOR now");
        widget.setRunProgram("@TargetDir@/GenesisLauncher.exe");
    }
}
