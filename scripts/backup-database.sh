#!/bin/bash

# Deepchat Database Backup Script
# Run daily via cron: 0 3 * * * /path/to/backup-database.sh

set -e

# Configuration
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="deepchat_backup_${DATE}.sql"
RETENTION_DAYS=7

# Supabase connection (set via environment variables)
DB_HOST="${SUPABASE_DB_HOST}"
DB_USER="${SUPABASE_DB_USER}"
DB_NAME="${SUPABASE_DB_NAME}"
PGPASSWORD="${SUPABASE_DB_PASSWORD}"

# Create backup directory if not exists
mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting database backup..."

# Dump database
pg_dump -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" \
  --clean --if-exists --no-owner --no-acl \
  --file="${BACKUP_DIR}/${BACKUP_FILE}"

# Compress
gzip "${BACKUP_DIR}/${BACKUP_FILE}"

echo "[$(date)] Backup created: ${BACKUP_FILE}.gz"

# Delete old backups (older than RETENTION_DAYS)
find "${BACKUP_DIR}" -name "deepchat_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

echo "[$(date)] Old backups cleaned (retention: ${RETENTION_DAYS} days)"

# Optional: Upload to S3
if [ -n "${AWS_S3_BUCKET}" ]; then
  aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}.gz" \
    "s3://${AWS_S3_BUCKET}/backups/" \
    --sse AES256
  echo "[$(date)] Backup uploaded to S3"
fi

echo "[$(date)] Backup complete!"














