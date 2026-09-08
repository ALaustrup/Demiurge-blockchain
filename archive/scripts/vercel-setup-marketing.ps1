# One-time Vercel dashboard settings for monorepo marketing deploy (Phase 1)
# Run after: vercel link --scope astramatrix --project marketing-site (from repo root)

$projectId = "prj_fcFG5PaAAPbDjjX6BnTpRBAkprf3"
$scope = "astramatrix"

Write-Host @"

Phase 1 — set these in Vercel (required for npm workspaces):

  https://vercel.com/$scope/marketing-site/settings

  General → Root Directory: apps/marketing-site
  General → Include source files outside Root Directory: ON

  Build & Development:
    Install Command:    npm install
    Build Command:      npm run vercel:build:marketing
    Output Directory:   (default / empty)

  Environment Variables (Production):
    NEXT_PUBLIC_QOR_AUTH_URL = https://auth.demiurge.cloud/api/v1
    NEXT_PUBLIC_RPC_URL        = wss://rpc.demiurge.cloud

  Then deploy from repo root:
    cd X:\REPOZ\DEMIURGE-PROTOCOL-main
    vercel deploy --prod --yes --scope $scope

"@ -ForegroundColor Cyan
