/**
 * Finish Page - Custom installer completion page
 * 
 * Provides options to launch the application and view documentation
 */

function Component() {
}

Component.prototype.isDefault = function() {
    return true;
}

Component.prototype.createPage = function() {
    var page = installer.finishPage();
    
    page.setTitle("Installation Complete");
    page.setSubTitle("DEMIURGE QOR has been successfully installed");
    
    // Custom completion message
    var message = "DEMIURGE QOR has been installed successfully!\n\n" +
                  "You can now:\n" +
                  "• Launch DEMIURGE QOR from the Start Menu or Desktop\n" +
                  "• Create or sign in with your QOR ID\n" +
                  "• Access the full Demiurge blockchain ecosystem\n\n" +
                  "Thank you for choosing DEMIURGE!";
    
    page.setMessage(message);
    
    // Add launch checkbox
    page.setRunProgram("@TargetDir@/GenesisLauncher.exe");
    page.setRunProgramDescription("Launch DEMIURGE QOR now");
    
    return page;
}
