#!/usr/bin/env bash
# Verify deployment structure and readiness for Ubuntu 24.04 LTS

set -euo pipefail

REPO_DIR="${REPO_DIR:-/opt/demiurge}"
ERRORS=0

echo "=== Verifying Demiurge Deployment Structure ==="
echo ""

# Check 1: Directory structure
echo "[1/8] Checking directory structure..."
REQUIRED_DIRS=(
    "${REPO_DIR}"
    "${REPO_DIR}/chain"
    "${REPO_DIR}/runtime"
    "${REPO_DIR}/apps"
    "${REPO_DIR}/sdk"
    "${REPO_DIR}/indexer"
    "${REPO_DIR}/deploy"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "  ✅ $dir"
    else
        echo "  ❌ $dir (missing)"
        ((ERRORS++))
    fi
done

# Check 2: Required binaries
echo ""
echo "[2/8] Checking required binaries..."
REQUIRED_BINS=("node" "npm" "pnpm" "cargo" "rustc" "git" "nginx")
for bin in "${REQUIRED_BINS[@]}"; do
    if command -v "$bin" &> /dev/null; then
        VERSION=$($bin --version 2>/dev/null | head -1 || echo "installed")
        echo "  ✅ $bin ($VERSION)"
    else
        echo "  ❌ $bin (not found)"
        ((ERRORS++))
    fi
done

# Check 3: Node.js version
echo ""
echo "[3/8] Checking Node.js version..."
if command -v node &> /dev/null; then
    NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VER" -ge 20 ]; then
        echo "  ✅ Node.js $(node -v) (>= 20.x)"
    else
        echo "  ⚠️  Node.js $(node -v) (should be >= 20.x)"
    fi
else
    echo "  ❌ Node.js not installed"
    ((ERRORS++))
fi

# Check 4: pnpm version
echo ""
echo "[4/8] Checking pnpm version..."
if command -v pnpm &> /dev/null; then
    PNPM_VER=$(pnpm -v)
    echo "  ✅ pnpm $PNPM_VER"
else
    echo "  ❌ pnpm not installed"
    ((ERRORS++))
fi

# Check 5: Rust toolchain
echo ""
echo "[5/8] Checking Rust toolchain..."
if command -v rustc &> /dev/null && command -v cargo &> /dev/null; then
    echo "  ✅ Rust $(rustc --version)"
    echo "  ✅ Cargo $(cargo --version)"
else
    echo "  ❌ Rust toolchain not installed"
    ((ERRORS++))
fi

# Check 6: Systemd service files
echo ""
echo "[6/8] Checking systemd service files..."
if [ -d "${REPO_DIR}/deploy/systemd" ]; then
    SERVICE_COUNT=$(find "${REPO_DIR}/deploy/systemd" -name "*.service" | wc -l)
    echo "  ✅ Found $SERVICE_COUNT service files"
    
    # Check if services are installed
    for service in demiurge-chain abyssid dns-service abyss-gateway; do
        if systemctl list-unit-files | grep -q "^${service}.service"; then
            echo "  ✅ $service.service installed"
        else
            echo "  ⚠️  $service.service not installed (run setup_systemd.sh)"
        fi
    done
else
    echo "  ❌ deploy/systemd directory not found"
    ((ERRORS++))
fi

# Check 7: NGINX configuration
echo ""
echo "[7/8] Checking NGINX configuration..."
if command -v nginx &> /dev/null; then
    if [ -f "/etc/nginx/sites-available/demiurge.cloud" ] || [ -f "/etc/nginx/sites-enabled/demiurge.cloud" ]; then
        echo "  ✅ NGINX config found"
        if sudo nginx -t 2>&1 | grep -q "successful"; then
            echo "  ✅ NGINX configuration is valid"
        else
            echo "  ⚠️  NGINX configuration has errors"
        fi
    else
        echo "  ⚠️  NGINX config not found (run phase2_nginx.sh)"
    fi
else
    echo "  ❌ NGINX not installed"
    ((ERRORS++))
fi

# Check 8: Project dependencies
echo ""
echo "[8/8] Checking project dependencies..."
if [ -d "${REPO_DIR}/node_modules" ]; then
    echo "  ✅ node_modules exists"
else
    echo "  ⚠️  node_modules not found (run pnpm install)"
fi

if [ -f "${REPO_DIR}/chain/target/release/demiurge-chain" ]; then
    echo "  ✅ Chain binary built"
else
    echo "  ⚠️  Chain binary not built (run cargo build --release)"
fi

# Summary
echo ""
echo "=== Verification Summary ==="
if [ $ERRORS -eq 0 ]; then
    echo "✅ All critical checks passed!"
    exit 0
else
    echo "❌ Found $ERRORS critical issues"
    exit 1
fi
