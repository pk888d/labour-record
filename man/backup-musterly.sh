#!/usr/bin/env bash
# Nightly SQLite backup for Musterly (TEC-32).
#
# Uses the app's own better-sqlite3 online-backup API (the server has no
# sqlite3 CLI) — safe against concurrent writes/WAL, no downtime. Writes a
# gzipped, integrity-checked snapshot to a DIFFERENT filesystem (/home is a
# separate LVM volume from /database), keeps the newest $KEEP copies.
#
# Install (as praveen on 192.168.0.91):
#   mkdir -p ~/backups/bin && cp man/backup-musterly.sh ~/backups/bin/
#   crontab -e   →   0 2 * * * bash /home/praveen/backups/bin/backup-musterly.sh >> /home/praveen/backups/musterly/cron.log 2>&1
#
# Restore: see man/backup-restore.md
#
# NOTE: /home and /database are different LVM volumes on the SAME physical
# disk — this protects against volume corruption and bad migrations, not a
# full disk failure. Add an off-machine copy (rsync/rclone) when possible.
set -euo pipefail

# Prefixed override vars: the server's login env already exports generic names
# like DB=/database, which silently hijacked ${DB:-...} defaults.
APP_DIR="${MUSTERLY_APP_DIR:-/database/web/musterly/labour-record-app}"
DB="${MUSTERLY_DB:-$APP_DIR/prisma/dev.db}"
DEST="${MUSTERLY_BACKUP_DEST:-$HOME/backups/musterly}"
KEEP="${MUSTERLY_BACKUP_KEEP:-14}"

mkdir -p "$DEST"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$DEST/dev-$STAMP.db"

# Run from the app dir so node resolves the app's better-sqlite3.
cd "$APP_DIR"
node -e '
const Database = require("better-sqlite3");
const [src, dst] = process.argv.slice(1);
// NOTE: source opened read-write — a readonly open raises SQLITE_IOERR_READ
// on the target server filesystem; the backup() API is online-safe from a rw
// handle and performs no writes to the source. (No apostrophes in these
// comments: the whole program sits inside bash single quotes.)
const db = new Database(src, { fileMustExist: true });
db.backup(dst)
  .then(() => {
    const check = new Database(dst, { readonly: true });
    const result = check.pragma("integrity_check");
    check.close();
    const ok = JSON.stringify(result).toLowerCase().includes("ok");
    if (!ok) { console.error("INTEGRITY_FAIL", JSON.stringify(result)); process.exit(1); }
    console.log("BACKUP_OK", dst);
  })
  .catch((e) => { console.error("BACKUP_FAIL", e.message); process.exit(1); });
' "$DB" "$OUT"

gzip -f "$OUT"

# Rotate: keep the newest $KEEP archives.
ls -1t "$DEST"/dev-*.db.gz 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f

echo "$(date -Is) backup ok: $OUT.gz ($(du -h "$OUT.gz" | cut -f1))" >> "$DEST/backup.log"
