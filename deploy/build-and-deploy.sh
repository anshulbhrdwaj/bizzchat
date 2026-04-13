#!/bin/bash
set -euo pipefail

# === BizChat Build + Deploy (runs on VPS inside ~/apps/bizchat) ===

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[+]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }

# Load nvm so Node 20 is used
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20 2>/dev/null || true
log "Node: $(node --version) | pnpm: $(pnpm --version)"

APP_DIR="$HOME/apps/bizchat"
cd "$APP_DIR"

# Copy production env
log "Setting up production environment..."
cp apps/server/.env.production apps/server/.env

# Approve build scripts (needed for prisma, sharp, etc)
log "Approving build scripts..."
pnpm approve-builds --yes 2>/dev/null || true

# Install all deps
log "Installing dependencies..."
pnpm install --frozen-lockfile

# Generate Prisma client
log "Generating Prisma client..."
cd apps/server
npx prisma generate
cd "$APP_DIR"

# Build shared package first
log "Building shared package..."
pnpm --filter @bizchat/shared build 2>/dev/null || warn "Shared package has no build output (TS source, ok)"

# Build server
log "Building server (TypeScript)..."
pnpm --filter server build

# Build web frontend
log "Building web frontend..."
pnpm --filter web build

# Run Prisma DB push (create/update schema) - Prisma 7 has no --skip-generate
log "Running Prisma DB push..."
cd apps/server
NODE_ENV=production npx prisma db push
cd "$APP_DIR"

# Create uploads directory
mkdir -p apps/server/uploads
chmod 755 apps/server/uploads

# Start/restart PM2
log "Starting PM2 process..."
if pm2 describe bizchat-api > /dev/null 2>&1; then
  pm2 reload ecosystem.config.cjs --env production
  warn "bizchat-api reloaded"
else
  pm2 start ecosystem.config.cjs --env production
  log "bizchat-api started"
fi

pm2 save
log "PM2 config saved."

# Quick health check
sleep 2
if curl -sf http://localhost:4001/api/health > /dev/null 2>&1; then
  log "✅ Health check passed — API is up at :4001"
else
  warn "Health check endpoint not responding (may not be implemented yet)"
  log "Checking if port 4001 is listening..."
  ss -tlnp | grep 4001 && log "Port 4001 is open." || warn "Port 4001 NOT open — check pm2 logs"
fi

log "=== Build & Deploy complete ==="
log "Run: pm2 logs bizchat-api  to view logs"
