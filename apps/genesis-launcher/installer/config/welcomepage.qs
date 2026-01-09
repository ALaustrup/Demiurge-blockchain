/**
 * Welcome Page - Custom installer welcome page
 * 
 * Provides a polished welcome experience with branding and information
 */

function Component() {
}

Component.prototype.isDefault = function() {
    return true;
}

Component.prototype.createPage = function() {
    var page = installer.welcomePage();
    
    // Set welcome text
    page.setTitle("Welcome to DEMIURGE QOR");
    page.setSubTitle("The Gateway to the Demiurge Blockchain Ecosystem");
    
    // Custom welcome message
    var message = "This wizard will guide you through the installation of DEMIURGE QOR.\n\n" +
                  "DEMIURGE QOR is your gateway to:\n" +
                  "• QOR ID Authentication - Secure blockchain identity\n" +
                  "• QOR Desktop - Full desktop environment\n" +
                  "• Mining & Wallet - Earn and manage CGT tokens\n" +
                  "• Automatic Updates - Always stay up to date\n\n" +
                  "Click Next to continue.";
    
    page.setMessage(message);
    
    return page;
}
