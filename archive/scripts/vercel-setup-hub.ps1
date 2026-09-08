# Phase 2 — Vercel Hub project setup

$scope = "astramatrix"

Write-Host @"

Create or configure project: demiurge-hub
  https://vercel.com/new (import same Git repo)

  Root Directory: apps/hub
  Include source files outside Root Directory: ON

  Install Command:  npm install
  Build Command:    npm run vercel:build:hub

  Environment variables: see apps/hub/.env.vercel.example

  Link CLI (from repo root):
    vercel link --scope $scope --project demiurge-hub

  Deploy:
    vercel deploy --prod --yes --scope $scope

"@ -ForegroundColor Cyan
