#!/bin/sh
# Nightly backup of PostgreSQL + MinIO data. Run from the project directory via host cron:
#   15 2 * * * cd /opt/jobcard && ./scripts/backup.sh >> backups/backup.log 2>&1
# Then copy ./backups OFF this server (rclone/rsync to another provider) — a backup on the same VPS is not a backup.
set -eu
. ./.env
STAMP=$(date +%Y%m%d-%H%M)
DEST=./backups
mkdir -p "$DEST/minio"

docker compose exec -T db pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB" > "$DEST/db-$STAMP.dump"

# Mirror the bucket's files (incremental) from the MinIO volume.
docker run --rm -v "$(basename "$PWD")_miniodata:/data:ro" -v "$PWD/backups/minio:/out" alpine \
  sh -c 'cp -au /data/. /out/'

# Keep 30 days of database dumps.
find "$DEST" -name 'db-*.dump' -mtime +30 -delete
echo "$(date) backup ok: db-$STAMP.dump"
