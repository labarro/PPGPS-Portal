#!/usr/bin/env bash
# Restauração de backup em banco ISOLADO e verificação de sanidade (planejamento 24.5; ADR-0012).
#
#   scripts/backup/restore.sh <arquivo.dump.age> <manifesto.json>
#
# - Descriptografa com a chave PRIVADA (arquivo em BACKUP_AGE_IDENTITY_FILE) direto para o
#   pg_restore: o dump em claro nunca é gravado em disco.
# - Restaura em TARGET_DATABASE_URL, que deve ser um banco VAZIO e temporário. Recusa a branch
#   `production`, `staging`, `seed` e qualquer banco que já tenha tabelas.
# - Compara a contagem de linhas por tabela com o manifesto e registra o tempo total.
# Requer: pg_restore/psql 18, age, jq.
set -euo pipefail

DUMP="${1:?informe o arquivo .dump.age}"
MANIFEST="${2:?informe o manifesto .json}"
: "${TARGET_DATABASE_URL:?}" "${BACKUP_AGE_IDENTITY_FILE:?}"

[[ -s "$BACKUP_AGE_IDENTITY_FILE" ]] || { echo "::error::chave privada ausente"; exit 1; }
if [[ "${TARGET_BRANCH_NAME:-}" =~ ^(production|staging|seed|main)$ ]]; then
  echo "::error::Restauração recusada na branch ${TARGET_BRANCH_NAME}."; exit 1
fi

expected_sha=$(jq -r .sha256 "$MANIFEST")
actual_sha=$(sha256sum "$DUMP" | cut -d' ' -f1)
[[ "$expected_sha" == "$actual_sha" ]] || { echo "::error::SHA-256 do backup não confere com o manifesto"; exit 1; }

existing=$(psql "$TARGET_DATABASE_URL" -X -At -c \
  "select count(*) from information_schema.tables where table_schema='public'")
[[ "$existing" == "0" ]] || { echo "::error::Banco de destino não está vazio (${existing} tabelas). Restauração recusada."; exit 1; }

started=$(date +%s)
age --decrypt --identity "$BACKUP_AGE_IDENTITY_FILE" "$DUMP" \
  | pg_restore --no-owner --no-privileges --exit-on-error --single-transaction -d "$TARGET_DATABASE_URL"
restore_seconds=$(( $(date +%s) - started ))

# Sanidade: mesmas tabelas e mesmas contagens do manifesto; migrations registradas.
mismatches=0
report=""
while IFS=$'\t' read -r table expected; do
  actual=$(psql "$TARGET_DATABASE_URL" -X -At -c "select count(*) from public.\"${table}\"" 2>/dev/null || echo "ausente")
  status="OK"
  if [[ "$actual" != "$expected" ]]; then status="DIVERGENTE"; mismatches=$((mismatches + 1)); fi
  report+="| ${table} | ${expected} | ${actual} | ${status} |"$'\n'
done < <(jq -r '.rowCounts | to_entries[] | "\(.key)\t\(.value)"' "$MANIFEST")

migrations=$(psql "$TARGET_DATABASE_URL" -X -At -c "select count(*) from payload_migrations where batch > 0")
fk_invalid=$(psql "$TARGET_DATABASE_URL" -X -At -c "select count(*) from pg_constraint where contype='f' and not convalidated")
total_seconds=$(( $(date +%s) - started ))

summary="### Restauração de backup ($(jq -r .file "$MANIFEST"))

- Origem: \`$(jq -r .label "$MANIFEST")\`, criado em $(jq -r .createdAt "$MANIFEST") (PostgreSQL $(jq -r .serverVersion "$MANIFEST"))
- Destino: banco temporário isolado${TARGET_BRANCH_NAME:+ (branch Neon \`${TARGET_BRANCH_NAME}\`)}
- **Tempo de restauração: ${restore_seconds} s** (total com verificações: ${total_seconds} s)
- Migrations registradas: ${migrations}; chaves estrangeiras não validadas: ${fk_invalid}
- Tabelas divergentes: ${mismatches}

| Tabela | Linhas no backup | Linhas restauradas | Situação |
|---|---|---|---|
${report}"

echo "$summary"
[[ -n "${GITHUB_STEP_SUMMARY:-}" ]] && echo "$summary" >> "$GITHUB_STEP_SUMMARY"
echo "restore_seconds=${restore_seconds}" >> "${GITHUB_OUTPUT:-/dev/null}"

if (( mismatches > 0 )) || [[ "$migrations" == "0" ]] || [[ "$fk_invalid" != "0" ]]; then
  echo "::error::Verificação de sanidade falhou."; exit 1
fi
echo "Restauração verificada com sucesso em ${restore_seconds}s."
