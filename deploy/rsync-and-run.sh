#!/bin/bash
set -euo pipefail

# === Run this LOCALLY on your Mac ===
# Usage: bash deploy/rsync-and-run.sh

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}[+]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[x]${NC} $1"; exit 1; }

VPS_HOST="lonewolf@45.56.120.47"
VPS_APP_DIR="~/apps/bizchat"
LOCAL_DIR="/Users/lonewolf/Documents/Auralytics/Doank/bizzchat"

# Secrets (set these before running OR export them in your shell)
export BIZCHAT_JWT_SECRET="${BIZCHAT_JWT_SECRET:-51f7000276603c85c6b18a288dfe264023c11f765dbd9368ed028066a3c9b35f}"
export BIZCHAT_REFRESH_SECRET="${BIZCHAT_REFRESH_SECRET:-5106f3a3b667792c76f7b74fa0f7874b808a948b525e93470a0dd40b3c7cae41}"

log "=== BizChat VPS Deploy ==="
log "Target: $VPS_HOST:$VPS_APP_DIR"

# Create app directory on VPS
log "Creating remote directory..."
ssh "$VPS_HOST" "mkdir -p $VPS_APP_DIR"

# Rsync project files (exclude heavy/generated dirs)
log "Rsyncing project files..."
rsync -avz --progress \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.turbo' \
  --exclude='dist' \
  --exclude='*.apk' \
  --exclude='.DS_Store' \
  --exclude='apps/server/uploads' \
  --exclude='apps/server/.env' \
  --exclude='apps/server/prisma/dev.db' \
  --exclude='apps/web/.env' \
  --exclude='deploy/' \
  "$LOCAL_DIR/" \
  "$VPS_HOST:$VPS_APP_DIR/"

# Copy deploy scripts
log "Copying deploy scripts..."
scp "$LOCAL_DIR/deploy/setup-vps.sh"       "$VPS_HOST:/tmp/setup-vps.sh"
scp "$LOCAL_DIR/deploy/build-and-deploy.sh" "$VPS_HOST:/tmp/build-and-deploy.sh"
scp "$LOCAL_DIR/deploy/nginx-bizchat.conf"  "$VPS_HOST:/tmp/nginx-bizchat.conf"

# Run setup script on VPS (.env + PM2 config)
log "Running VPS setup script (env)..."
ssh "$VPS_HOST" "BIZCHAT_JWT_SECRET='$BIZCHAT_JWT_SECRET' BIZCHAT_REFRESH_SECRET='$BIZCHAT_REFRESH_SECRET' bash /tmp/setup-vps.sh"

# Copy build-and-deploy script to app dir and run it
log "Running build + deploy..."
ssh "$VPS_HOST" "bash /tmp/build-and-deploy.sh"

# Set up Nginx config
log "Installing Nginx config..."
ssh "$VPS_HOST" "cp /tmp/nginx-bizchat.conf /etc/nginx/sites-available/bizchat && ln -sf /etc/nginx/sites-available/bizchat /etc/nginx/sites-enabled/bizchat"
ssh "$VPS_HOST" "nginx -t && echo 'Nginx config OK'"

log ""
warn "=== Next manual steps ==="
warn "1. Point DNS: bizchat.anyflix.fun → 45.56.120.47"
warn "2. Once DNS propagates, run on VPS:"
warn "   sudo certbot --nginx -d bizchat.anyflix.fun"
warn "3. Then: sudo systemctl reload nginx"
warn ""
log "=== Rsync + Deploy complete ==="
