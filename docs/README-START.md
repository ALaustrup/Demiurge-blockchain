# Starting All Demiurge Servers

## Quick Start

To start all three servers (Chain, Abyss Gateway, and Portal Web) with a single command:

### Option 1: Using PowerShell Script (Recommended)
```powershell
.\start-all.ps1
```

### Option 2: Using pnpm
```powershell
pnpm start:all
```

### Option 3: Using npm
```powershell
npm run start:all
```

## What Gets Started

The script starts three servers in order:

1. **Demiurge Chain** (Rust)
   - RPC endpoint: `http://127.0.0.1:8545/rpc`
   - Waits for server to be ready before continuing

2. **Abyss Gateway** (Node.js/TypeScript)
   - GraphQL endpoint: `http://localhost:4000/graphql`
   - Waits for server to be ready before continuing

3. **Portal Web** (Next.js)
   - Web interface: `http://localhost:3000`
   - Starts immediately after gateway

## Stopping All Servers

To stop all servers:

```powershell
.\stop-all.ps1
```

Or:

```powershell
pnpm stop:all
```

## Manual Control

If you prefer to start servers individually:

### Chain Server
```powershell
cd C:\Repos\DEMIURGE
cargo run -p demiurge-chain --release
```

### Abyss Gateway
```powershell
cd C:\Repos\DEMIURGE\indexer\abyss-gateway
pnpm dev
```

### Portal Web
```powershell
cd C:\Repos\DEMIURGE\apps\portal-web
pnpm dev
```

## Troubleshooting

### Port Already in Use
If you see a warning about ports being in use, you can:
- Stop existing servers: `.\stop-all.ps1`
- Or manually kill processes on ports 8545, 4000, or 3000

### Chain Server Not Starting
- Make sure Rust/Cargo is installed and in PATH
- Check that port 8545 is not in use
- Look for errors in the job output: `Get-Job | Receive-Job`

### Gateway Not Starting
- Make sure Node.js and pnpm are installed
- Check that port 4000 is not in use
- Verify dependencies are installed: `cd indexer/abyss-gateway && pnpm install`

### Portal Not Starting
- Make sure Node.js and pnpm are installed
- Check that port 3000 is not in use
- Verify dependencies are installed: `cd apps/portal-web && pnpm install`

## Viewing Logs

To see output from all running servers:

```powershell
# View all job output
Get-Job | Receive-Job

# View specific job
Get-Job -Name "DemiurgeChain" | Receive-Job
Get-Job -Name "AbyssGateway" | Receive-Job
Get-Job -Name "PortalWeb" | Receive-Job
```

## Background Jobs

The servers run as PowerShell background jobs. To manage them:

```powershell
# List all jobs
Get-Job

# Stop a specific job
Stop-Job -Name "DemiurgeChain"

# Remove a job
Remove-Job -Name "DemiurgeChain"
```

