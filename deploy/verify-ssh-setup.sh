#!/usr/bin/env bash
# Verify SSH Key Setup for Demiurge Server
# Server IP: 51.210.209.112

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SERVER_IP="51.210.209.112"
SERVER_USER="${SERVER_USER:-ubuntu}"
KEY_NAME="Node0"
KEY_PATH_WIN="$USERPROFILE/.ssh/$KEY_NAME"
KEY_PATH_LINUX="$HOME/.ssh/$KEY_NAME"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  SSH Key Setup Verification${NC}"
echo -e "${BLUE}  Server: ${SERVER_USER}@${SERVER_IP}${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Detect OS and set key path
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || -n "$WINDIR" ]]; then
    KEY_PATH="$KEY_PATH_WIN"
    IS_WINDOWS=true
else
    KEY_PATH="$KEY_PATH_LINUX"
    IS_WINDOWS=false
fi

# Check 1: Verify key exists locally
echo -e "${BLUE}[1/5]${NC} Checking for SSH key locally..."
if [ -f "$KEY_PATH" ]; then
    echo -e "${GREEN}✅ Key found: $KEY_PATH${NC}"
    KEY_SIZE=$(stat -f%z "$KEY_PATH" 2>/dev/null || stat -c%s "$KEY_PATH" 2>/dev/null || echo "unknown")
    echo -e "   Size: $KEY_SIZE bytes"
else
    echo -e "${RED}❌ Key not found: $KEY_PATH${NC}"
    echo -e "${YELLOW}   Generate key with:${NC}"
    if [ "$IS_WINDOWS" = true ]; then
        echo -e "   ssh-keygen -t ed25519 -C \"Node0@\$(hostname)\" -f \"$KEY_PATH\""
    else
        echo -e "   ssh-keygen -t ed25519 -C \"Node0@\$(hostname)\" -f $KEY_PATH"
    fi
    exit 1
fi

# Check 2: Display public key
echo ""
echo -e "${BLUE}[2/5]${NC} Your public key:"
echo -e "${YELLOW}========================================${NC}"
if [ -f "${KEY_PATH}.pub" ]; then
    cat "${KEY_PATH}.pub"
else
    echo -e "${RED}❌ Public key not found${NC}"
    exit 1
fi
echo -e "${YELLOW}========================================${NC}"
echo ""
echo -e "${YELLOW}⚠️  Copy the above public key if needed${NC}"
echo ""

# Check 3: Test SSH connection
echo -e "${BLUE}[3/5]${NC} Testing SSH connection..."
if ssh -i "$KEY_PATH" -o ConnectTimeout=5 -o StrictHostKeyChecking=no "${SERVER_USER}@${SERVER_IP}" "echo 'SSH connection successful'" 2>/dev/null; then
    echo -e "${GREEN}✅ SSH connection successful${NC}"
    CONNECTION_OK=true
else
    echo -e "${YELLOW}⚠️  SSH connection failed or key not authorized${NC}"
    CONNECTION_OK=false
fi

# Check 4: Verify key on server (if connection works)
if [ "$CONNECTION_OK" = true ]; then
    echo ""
    echo -e "${BLUE}[4/5]${NC} Verifying key on server..."
    SERVER_KEY=$(ssh -i "$KEY_PATH" "${SERVER_USER}@${SERVER_IP}" "cat ~/.ssh/authorized_keys 2>/dev/null | grep -F '$(cat ${KEY_PATH}.pub | cut -d' ' -f1-2)' || echo 'NOT_FOUND'" 2>/dev/null)
    
    if [ "$SERVER_KEY" != "NOT_FOUND" ]; then
        echo -e "${GREEN}✅ Key found in server's authorized_keys${NC}"
    else
        echo -e "${YELLOW}⚠️  Key not found in server's authorized_keys${NC}"
        echo -e "${YELLOW}   You may need to add it manually${NC}"
    fi
    
    # Check permissions
    PERMS=$(ssh -i "$KEY_PATH" "${SERVER_USER}@${SERVER_IP}" "stat -c '%a' ~/.ssh/authorized_keys 2>/dev/null || echo '000'" 2>/dev/null)
    if [ "$PERMS" = "600" ] || [ "$PERMS" = "644" ]; then
        echo -e "${GREEN}✅ Server authorized_keys permissions: $PERMS (correct)${NC}"
    else
        echo -e "${YELLOW}⚠️  Server authorized_keys permissions: $PERMS (should be 600)${NC}"
    fi
else
    echo ""
    echo -e "${BLUE}[4/5]${NC} Skipping server verification (connection failed)"
fi

# Check 5: Test SSH config
echo ""
echo -e "${BLUE}[5/5]${NC} Checking SSH config..."
SSH_CONFIG_PATH="$HOME/.ssh/config"
if [ "$IS_WINDOWS" = true ]; then
    SSH_CONFIG_PATH="$USERPROFILE/.ssh/config"
fi

if [ -f "$SSH_CONFIG_PATH" ] && grep -q "$SERVER_IP" "$SSH_CONFIG_PATH" 2>/dev/null; then
    echo -e "${GREEN}✅ SSH config found with server entry${NC}"
    grep -A 5 "$SERVER_IP" "$SSH_CONFIG_PATH" | head -6
else
    echo -e "${YELLOW}⚠️  SSH config not found or server not configured${NC}"
    echo -e "${YELLOW}   Consider adding:${NC}"
    echo ""
    echo "Host demiurge-node0"
    echo "    HostName $SERVER_IP"
    echo "    User $SERVER_USER"
    echo "    IdentityFile $KEY_PATH"
    echo "    IdentitiesOnly yes"
    echo ""
fi

# Summary
echo ""
echo -e "${GREEN}========================================${NC}"
if [ "$CONNECTION_OK" = true ]; then
    echo -e "${GREEN}  ✅ SSH Setup Verified!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}Connection command:${NC}"
    echo -e "  ssh -i $KEY_PATH ${SERVER_USER}@${SERVER_IP}"
    echo ""
    if [ -f "$SSH_CONFIG_PATH" ] && grep -q "$SERVER_IP" "$SSH_CONFIG_PATH"; then
        HOST_NAME=$(grep -B 1 "$SERVER_IP" "$SSH_CONFIG_PATH" | grep "^Host" | awk '{print $2}' | head -1)
        if [ -n "$HOST_NAME" ]; then
            echo -e "${BLUE}Or using SSH config:${NC}"
            echo -e "  ssh $HOST_NAME"
        fi
    fi
    exit 0
else
    echo -e "${YELLOW}  ⚠️  SSH Setup Needs Attention${NC}"
    echo -e "${YELLOW}========================================${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "  1. Ensure your public key is added to the server:"
    echo "     ssh-copy-id -i ${KEY_PATH}.pub ${SERVER_USER}@${SERVER_IP}"
    echo ""
    echo "  2. Or manually add to server:"
    echo "     ssh ${SERVER_USER}@${SERVER_IP}"
    echo "     mkdir -p ~/.ssh"
    echo "     chmod 700 ~/.ssh"
    echo "     echo '$(cat ${KEY_PATH}.pub)' >> ~/.ssh/authorized_keys"
    echo "     chmod 600 ~/.ssh/authorized_keys"
    echo ""
    exit 1
fi
