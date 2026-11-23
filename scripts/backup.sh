#!/bin/sh
# Nightly backup of PostgreSQL + MinIO data. Run from the project directory via host cron:
#   15 2 * * * cd /opt/primex && ./scripts/backup.sh >> backups/backup.log 2>&1
# Off-server copy: set BACKUP_REMOTE in .env to an rclone remote path (e.g. b2:primex-backups) after
# `rclone config` — a backup that only lives on the same VPS is not a backup.
set -eu
. ./.env
STAMP=$(date +%Y%m%d-%H%M)
DEST=./backups
mkdir -p "$DEST/minio"

docker compose exec -T db pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB" > "$DEST/db-$STAMP.dump"

# Mirror the bucket's files (incremental) from the MinIO volume.
docker run --rm -v "primex_miniodata:/data:ro" -v "$PWD/backups/minio:/out" alpine \
  sh -c 'cp -au /data/. /out/'

# Keep 30 days of database dumps locally.
find "$DEST" -name 'db-*.dump' -mtime +30 -delete

if [ -n "${BACKUP_REMOTE:-}" ]; then
  rclone sync "$DEST" "$BACKUP_REMOTE" --exclude backup.log --fast-list
  echo "$(date) offsite sync ok: $BACKUP_REMOTE"
fi
echo "$(date) backup ok: db-$STAMP.dump"
