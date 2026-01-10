# Fix all broken hook imports in QLOUD OS
$ErrorActionPreference = "Stop"

Write-Host "=== Fixing Hook Imports ===" -ForegroundColor Cyan

$files = @(
    "src/hooks/useAbyssIDIdentity.ts",
    "src/components/desktop/apps/WrytApp.tsx",
    "src/components/desktop/apps/VYBSocialApp.tsx",
    "src/components/desktop/apps/QorWalletApp.tsx",
    "src/components/desktop/apps/QorExplorerApp.tsx",
    "src/components/desktop/apps/OnChainFilesApp.tsx",
    "src/components/desktop/apps/MiningAccountingApp.tsx",
    "src/components/desktop/apps/MinerApp.tsx",
    "src/components/desktop/apps/DocumentEditorApp.tsx",
    "src/components/desktop/apps/DRC369StudioApp.tsx",
    "src/components/desktop/apps/CraftApp.tsx",
    "src/components/desktop/apps/ArchonAIAssistantApp.tsx",
    "src/components/desktop/apps/AppMarketplaceApp.tsx",
    "src/components/desktop/apps/AbyssTorrentApp.tsx",
    "src/components/desktop/apps/AbyssShellApp.tsx",
    "src/components/desktop/apps/AbyssRuntimeApp.tsx",
    "src/components/desktop/apps/AbyssBrowserApp.tsx",
    "src/components/desktop/StatusBar.tsx",
    "src/components/desktop/FileDropZone.tsx",
    "src/components/desktop/AppStoreMenu.tsx",
    "src/components/auth/QorIDSignupModal.tsx",
    "src/components/auth/QorIDLoginForm.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Fixing: $file" -ForegroundColor Yellow
        
        $content = Get-Content $file -Raw
        
        # Fix useQorID imports
        $content = $content -replace "from\s+['\`"]\.\.\/\.\.\/\.\.\/hooks\/useQorID['\`"]", "from '../../../hooks/useAbyssID'"
        $content = $content -replace "from\s+['\`"]\.\.\/\.\.\/hooks\/useQorID['\`"]", "from '../../hooks/useAbyssID'"
        $content = $content -replace "from\s+['\`"]\.\.\/hooks\/useQorID['\`"]", "from '../hooks/useAbyssID'"
        $content = $content -replace "from\s+['\`"]\.\/useQorID['\`"]", "from './useAbyssID'"
        
        # Fix useQorIDIdentity imports
        $content = $content -replace "from\s+['\`"]\.\.\/\.\.\/\.\.\/hooks\/useQorIDIdentity['\`"]", "from '../../../hooks/useAbyssIDIdentity'"
        $content = $content -replace "from\s+['\`"]\.\.\/\.\.\/hooks\/useQorIDIdentity['\`"]", "from '../../hooks/useAbyssIDIdentity'"
        $content = $content -replace "from\s+['\`"]\.\.\/hooks\/useQorIDIdentity['\`"]", "from '../hooks/useAbyssIDIdentity'"
        $content = $content -replace "from\s+['\`"]\.\/useQorIDIdentity['\`"]", "from './useAbyssIDIdentity'"
        
        Set-Content $file $content -NoNewline
        Write-Host "  ✓ Fixed" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✅ All imports fixed!" -ForegroundColor Green
