#!/usr/bin/env bash
# ============================================================
#  LabourRecord — One-Click Install for macOS (Apple Silicon)
# ============================================================
set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[✔]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✘]${NC} $1"; exit 1; }
step()  { echo -e "\n${YELLOW}──────────────────────────────────────${NC}"; echo -e "  $1"; echo -e "${YELLOW}──────────────────────────────────────${NC}"; }

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║   LabourRecord — Install Script      ║"
echo "  ║   macOS (Apple Silicon / Intel)      ║"
echo "  ╚══════════════════════════════════════╝"
echo ""

# ── 1. Homebrew ─────────────────────────────────────────────
step "1/6  Checking Homebrew"
if ! command -v brew &>/dev/null; then
  warn "Homebrew not found. Installing..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  # Add brew to PATH for Apple Silicon
  if [[ -f /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
  fi
  info "Homebrew installed."
else
  info "Homebrew already installed: $(brew --version | head -1)"
fi

# ── 2. Node.js (via nvm) ────────────────────────────────────
step "2/6  Checking Node.js (requires v20+)"
REQUIRED_NODE=20

install_node_via_nvm() {
  if ! command -v nvm &>/dev/null; then
    warn "nvm not found. Installing nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    # shellcheck disable=SC1091
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  fi
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  nvm install 20
  nvm use 20
  nvm alias default 20
  info "Node.js $(node --version) installed via nvm."
}

if command -v node &>/dev/null; then
  NODE_VER=$(node --version | sed 's/v//' | cut -d. -f1)
  if [[ "$NODE_VER" -ge "$REQUIRED_NODE" ]]; then
    info "Node.js $(node --version) — OK"
  else
    warn "Node.js $(node --version) is too old (need v$REQUIRED_NODE+). Upgrading via nvm..."
    install_node_via_nvm
  fi
else
  warn "Node.js not found."
  install_node_via_nvm
fi

# Verify npm
if ! command -v npm &>/dev/null; then
  error "npm not found after Node install. Please check your PATH and re-run."
fi
info "npm $(npm --version) — OK"

# ── 3. SQLite (CLI for diagnostics) ─────────────────────────
step "3/6  Checking SQLite"
if ! command -v sqlite3 &>/dev/null; then
  warn "sqlite3 CLI not found. Installing via Homebrew..."
  brew install sqlite
fi
info "sqlite3 $(sqlite3 --version | cut -d' ' -f1) — OK"

# ── 4. npm dependencies ──────────────────────────────────────
step "4/6  Installing npm dependencies"

# Resolve the app directory (sibling of the man/ folder this script lives in)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/../labour-record-app" && pwd)"

if [[ ! -d "$APP_DIR" ]]; then
  error "App directory not found at: $APP_DIR\nMake sure 'labour-record-app' and 'man' are sibling folders."
fi

cd "$APP_DIR"
info "Working in: $APP_DIR"

npm install
info "npm packages installed."

# ── 5. Database setup ────────────────────────────────────────
step "5/6  Setting up database"

# Create .env if missing
if [[ ! -f .env ]]; then
  echo 'DATABASE_URL="file:./prisma/dev.db"' > .env
  info ".env created."
else
  info ".env already exists."
fi

# Run migrations
npx prisma migrate deploy
info "Database migrations applied."

# Generate Prisma client
npx prisma generate
info "Prisma client generated."

# Seed demo data (only if DB is empty)
EMPLOYEE_COUNT=$(sqlite3 prisma/dev.db "SELECT COUNT(*) FROM Employee;" 2>/dev/null || echo "0")
if [[ "$EMPLOYEE_COUNT" -eq 0 ]]; then
  warn "Database is empty — loading demo data..."
  npx tsx prisma/seed.ts
  info "Demo data seeded (2 establishments, 6 employees)."
else
  info "Database already has data — skipping seed."
fi

# ── 6. Build check ───────────────────────────────────────────
step "6/6  Verifying build"
npm run build
info "Build successful."

# ── Done ─────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Installation complete!                          ║${NC}"
echo -e "${GREEN}║                                                  ║${NC}"
echo -e "${GREEN}║  To start the application:                       ║${NC}"
echo -e "${GREEN}║    npm run dev          (development mode)       ║${NC}"
echo -e "${GREEN}║    npm start            (production mode)        ║${NC}"
echo -e "${GREEN}║                                                  ║${NC}"
echo -e "${GREEN}║  Then open: http://localhost:3000                ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
