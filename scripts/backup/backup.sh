#!/usr/bin/env bash
# Backup lógico CRIPTOGRAFADO do banco (planejamento 17.5 e 24.5; ADR-0012).
#
#   scripts/backup/backup.sh <rótulo> <diretório-de-saída>
#
# - `pg_dump` em formato custom, criptografado com `age` ANTES de tocar o disco:
#   o dump em claro nunca é gravado. Só a chave PÚBLICA é usada aqui.
# - Gera também um manifesto (sem dados pessoais) com a contagem de linhas por tabela,
#   usado pela verificação de restauração, e o SHA-256 do arquivo criptografado.
# Requer: pg_dump/psql (mesma versão maior do servidor, 18) e age no PATH.
# Variáveis: DATABASE_URL (origem), BACKUP_AGE_RECIPIENT (chave pública age1...).
# Recusa a branch `production` do Neon nesta fase (backup de produção ativo só na S06).
set -euo pipefail

LABEL="${1:?informe o rótulo (ex.: staging)}"
OUT_DIR="${2:?informe o diretório de saída}"
: "${DATABASE_URL:?}" "${BACKUP_AGE_RECIPIENT:?}"

[[ "$LABEL" =~ ^[a-z0-9-]+$ ]] || { echo "::error::rótulo inválido"; exit 1; }
[[ "$BACKUP_AGE_RECIPIENT" == age1* ]] || { echo "::error::BACKUP_AGE_RECIPIENT não é uma chave pública age"; exit 1; }
if [[ "$LABEL" == production* && "${ALLOW_PRODUCTION_BACKUP:-}" != "true" ]]; then
  echo "::error::Backup de produção ainda não habilitado (S06)."; exit 1
fi

mkdir -p "$OUT_DIR"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
base="${LABEL}-${stamp}"
dump="${OUT_DIR}/${base}.dump.age"
manifest="${OUT_DIR}/${base}.manifest.json"

started=$(date +%s)

# Contagem exata por tabela do schema public (sem conteúdo das linhas).
counts=$(psql "$DATABASE_URL" -X -At -v ON_ERROR_STOP=1 <<'SQL'
SELECT coalesce(json_object_agg(t.table_name, (xpath('/row/c/text()',
  query_to_xml(format('select count(*) as c from %I.%I', t.table_schema, t.table_name), false, true, '')))[1]::text::bigint
  ORDER BY t.table_name), '{}'::json)
FROM information_schema.tables t
WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE';
SQL
)

server_version=$(psql "$DATABASE_URL" -X -At -c 'show server_version')

set -o pipefail
pg_dump "$DATABASE_URL" --format=custom --no-owner --no-privileges --compress=6 \
  | age --encrypt --recipient "$BACKUP_AGE_RECIPIENT" --output "$dump"

size=$(stat -c %s "$dump" 2>/dev/null || stat -f %z "$dump")
sha=$(sha256sum "$dump" | cut -d' ' -f1)
elapsed=$(( $(date +%s) - started ))

cat > "$manifest" <<JSON
{
  "label": "${LABEL}",
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "file": "$(basename "$dump")",
  "sha256": "${sha}",
  "bytes": ${size},
  "serverVersion": "${server_version}",
  "format": "pg_dump custom + age (X25519)",
  "durationSeconds": ${elapsed},
  "rowCounts": ${counts}
}
JSON

echo "Backup criptografado: $(basename "$dump") (${size} bytes, ${elapsed}s, sha256 ${sha:0:12}…)"
echo "dump=${dump}" >> "${GITHUB_OUTPUT:-/dev/null}"
echo "manifest=${manifest}" >> "${GITHUB_OUTPUT:-/dev/null}"
