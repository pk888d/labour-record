# Musterly SQLite backup & restore (TEC-32)

## What runs
- `~/backups/bin/backup-musterly.sh` on the server (source of truth: `man/backup-musterly.sh` in this repo) takes a nightly online backup of `/database/web/musterly/labour-record-app/prisma/dev.db` at **02:00** via cron.
- Backups land in `/home/praveen/backups/musterly/` as `dev-YYYYMMDD-HHMMSS.db.gz`, integrity-checked (`PRAGMA integrity_check`) before compression, newest **14** kept, log in `backup.log`.
- `/home` is a different LVM volume from `/database` — protects against volume corruption/bad migrations, **not** a full-disk failure. Off-machine copies (rsync to another host) are a recommended follow-up.
- `man/deploy-server.sh` also takes a safety backup automatically **before** `prisma migrate deploy` on every deploy (same script, `pre-deploy-` prefix).

## Restore procedure (tested 2026-07-06)
```bash
# on the server
cd /database/web/musterly/labour-record-app
pm2 stop musterly

# pick the backup to restore
ls -1t ~/backups/musterly/dev-*.db.gz | head
gunzip -k ~/backups/musterly/dev-YYYYMMDD-HHMMSS.db.gz   # leaves .db next to it

# replace the live DB (clear WAL sidecars so SQLite doesn't replay stale WAL)
rm -f prisma/dev.db-wal prisma/dev.db-shm
cp ~/backups/musterly/dev-YYYYMMDD-HHMMSS.db prisma/dev.db

pm2 start musterly
# verify: open http://192.168.0.91:8080/cycles and check the data
```

## Verify a backup without restoring
```bash
cd /database/web/musterly/labour-record-app
gunzip -k ~/backups/musterly/dev-YYYYMMDD-HHMMSS.db.gz
node -e 'const D=require("better-sqlite3");const d=new D(process.argv[1],{readonly:true});console.log(d.pragma("integrity_check"));console.log("employees:",d.prepare("SELECT COUNT(*) c FROM Employee").get().c)' ~/backups/musterly/dev-YYYYMMDD-HHMMSS.db
rm ~/backups/musterly/dev-YYYYMMDD-HHMMSS.db
```
