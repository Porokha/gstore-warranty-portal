#!/bin/bash
# Applies SQL migration files in database/migrations using the running MySQL container
# Usage: ./scripts/run-db-migrations.sh [docker-compose-file]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

COMPOSE_FILE="${1:-${COMPOSE_FILE:-docker-compose.prod.prebuilt.yml}}"

env_file="${PROJECT_ROOT}/.env"
if [[ -f "$env_file" ]]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' "$env_file" | xargs -0)
fi

DB_NAME="${DB_NAME:-gstore_warranty}"
DB_USER="${DB_USER:-gstore}"
DB_PASSWORD="${DB_PASSWORD:-gstore123}"

compose_cmd=(docker compose -f "$COMPOSE_FILE")
mysql_cmd=("${compose_cmd[@]}" exec -T db mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME")

# Ensure the schema_migrations tracking table exists
${mysql_cmd[@]} <<'SQL'
CREATE TABLE IF NOT EXISTS schema_migrations (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_schema_migrations_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
SQL

STATUS=0
MIGRATIONS_DIR="$PROJECT_ROOT/database/migrations"
if [[ ! -d "$MIGRATIONS_DIR" ]]; then
  echo "No migrations directory found at $MIGRATIONS_DIR" >&2
  exit 1
fi

for file in $(ls "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort); do
  name=$(basename "$file")
  already_applied=$(${mysql_cmd[@]} -N -e "SELECT COUNT(*) FROM schema_migrations WHERE name='$name'")
  if [[ "$already_applied" != "0" ]]; then
    echo "Skipping $name (already applied)"
    continue
  fi

  echo "Applying migration $name..."
  if docker compose -f "$COMPOSE_FILE" exec -T db mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$file"; then
    ${mysql_cmd[@]} -e "INSERT INTO schema_migrations (name) VALUES ('$name')"
    echo "Applied $name"
  else
    echo "Failed to apply $name" >&2
    STATUS=1
    break
  fi

done

exit $STATUS
