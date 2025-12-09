#!/usr/bin/env bash
# Make all shell scripts executable
# Run this script to ensure all deployment scripts have proper permissions

set -euo pipefail

REPO_DIR="${1:-$(pwd)}"

echo "Making all shell scripts executable in: $REPO_DIR"

find "$REPO_DIR" -type f -name "*.sh" -exec chmod +x {} \;

echo "✅ All shell scripts are now executable"
