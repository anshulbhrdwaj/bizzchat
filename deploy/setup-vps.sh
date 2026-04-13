#!/bin/bash
set -euo pipefail

# === BizChat VPS Setup Script ===
# Run as: lonewolf@45.56.120.47
# Usage: bash setup-vps.sh

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}[+]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[x]${NC} $1"; exit 1; }

APP_DIR="$HOME/apps/bizchat"
# Secrets are passed as env vars from caller
DB_URL="postgresql://lonewolf:lonewolf01@localhost:5432/anyflix?schema=bizchat"
JWT_SECRET="${BIZCHAT_JWT_SECRET:-}"
REFRESH_SECRET="${BIZCHAT_REFRESH_SECRET:-}"

[ -z "$JWT_SECRET" ]     && err "BIZCHAT_JWT_SECRET not set"
[ -z "$REFRESH_SECRET" ] && err "BIZCHAT_REFRESH_SECRET not set"

# --- 1. App directory ---
log "Creating app directory $APP_DIR..."
mkdir -p "$APP_DIR"
mkdir -p /var/log/pm2 2>/dev/null || mkdir -p ~/logs/pm2

# --- 2. Write production .env ---
log "Writing production .env..."
mkdir -p "$APP_DIR/apps/server"
cat > "$APP_DIR/apps/server/.env.production" <<EOF
DATABASE_URL="${DB_URL}"
JWT_SECRET=${JWT_SECRET}
REFRESH_TOKEN_SECRET=${REFRESH_SECRET}
PORT=4001
NODE_ENV=production
ALLOWED_ORIGINS=https://bizchat.anyflix.fun,capacitor://localhost
UPLOAD_DIR=./uploads
EOF
chmod 600 "$APP_DIR/apps/server/.env.production"
log ".env.production written (chmod 600)"

# --- 3. PM2 ecosystem ---
log "Writing PM2 ecosystem config..."
cat > "$APP_DIR/ecosystem.config.cjs" <<'EOF'
module.exports = {
  apps: [{
    name: 'bizchat-api',
    script: 'dist/index.js',
    cwd: process.env.HOME + '/apps/bizchat/apps/server',
    instances: 1,
    exec_mode: 'fork',
    env_production: {
      NODE_ENV: 'production',
    },
    max_memory_restart: '220M',
    error_file: process.env.HOME + '/logs/pm2/bizchat-error.log',
    out_file:   process.env.HOME + '/logs/pm2/bizchat-out.log',
    merge_logs: true,
    watch: false,
    restart_delay: 3000,
    exp_backoff_restart_delay: 100,
  }]
}
EOF

log "Setup script complete. Next: rsync code, install deps, build, run prisma, start PM2."
