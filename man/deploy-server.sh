#!/usr/bin/env bash
# ============================================================
#  Musterly / LabourRecord — Linux server deploy (git + pm2)
# ============================================================
#  Workflow: implement locally -> push to GitHub -> on the server
#    git pull && bash man/deploy-server.sh [PORT]
#  Node 20+, npm, pm2 and git are assumed already present.
# ============================================================
set -euo pipefail

PORT="${1:-3000}"
APP_NAME="${APP_NAME:-musterly}"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info() { echo -e "${GREEN}[✔]${NC} $1"; }
step() { echo -e "\n${YELLOW}── $1 ──${NC}"; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/../labour-record-app" && pwd)"
cd "$APP_DIR"
info "App dir: $APP_DIR  |  port: $PORT  |  pm2 name: $APP_NAME"

step "1/5  .env"
if [[ ! -f .env ]]; then
  # Absolute path avoids any CWD ambiguity between the Prisma CLI and the
  # running Next server (both must resolve to the same SQLite file).
  printf 'DATABASE_URL="file:%s/prisma/dev.db"\n' "$APP_DIR" > .env
  info ".env created -> $APP_DIR/prisma/dev.db"
else
  info ".env already present — left untouched"
fi

step "2/5  npm ci"
npm ci

step "3/5  database (migrate + generate; seed only when DB is new)"
FRESH=0
[[ -f prisma/dev.db ]] || FRESH=1
npx prisma migrate deploy
npx prisma generate
if [[ "$FRESH" -eq 1 ]]; then
  npx tsx prisma/seed.ts
  info "Fresh DB — demo data seeded"
else
  info "Existing DB — seed skipped (data preserved)"
fi

step "4/5  build"
# Stop a running instance first: `next build` replaces .next, and a live
# `next start` reading it mid-build crashes with "Could not find a production
# build" until it's restarted. Brief downtime during build is the safe trade.
EXISTING=0
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then EXISTING=1; pm2 stop "$APP_NAME" >/dev/null 2>&1 || true; fi
npm run build

step "5/5  pm2 start/restart"
if [[ "$EXISTING" -eq 1 ]]; then
  PORT="$PORT" pm2 restart "$APP_NAME" --update-env
  info "Restarted $APP_NAME"
else
  PORT="$PORT" pm2 start npm --name "$APP_NAME" -- start
  info "Started $APP_NAME"
fi
pm2 save
info "Deployed: http://$(hostname -I | awk '{print $1}'):$PORT"
