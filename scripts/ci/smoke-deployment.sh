#!/usr/bin/env bash
# Fumaça pós-deploy (S01). Uso:
#   scripts/ci/smoke-deployment.sh <url> protected   # preview/homologação
#   scripts/ci/smoke-deployment.sh <url> production
# Variáveis: BASIC_AUTH_USER, BASIC_AUTH_PASSWORD (protected) e, opcionalmente,
# VERCEL_AUTOMATION_BYPASS_SECRET (se a proteção de deploy da Vercel estiver ativa).
set -euo pipefail

URL="${1:?informe a URL}"
MODE="${2:?informe protected ou production}"
URL="${URL%/}"

bypass=()
if [[ -n "${VERCEL_AUTOMATION_BYPASS_SECRET:-}" ]]; then
  bypass=(-H "x-vercel-protection-bypass: ${VERCEL_AUTOMATION_BYPASS_SECRET}")
fi

status() { curl -s -o /dev/null -w '%{http_code}' "${bypass[@]}" "$@"; }
fail() { echo "::error::$*"; exit 1; }

if [[ "$MODE" == "protected" ]]; then
  : "${BASIC_AUTH_USER:?}" "${BASIC_AUTH_PASSWORD:?}"
  auth=(-u "${BASIC_AUTH_USER}:${BASIC_AUTH_PASSWORD}")

  code=$(status "$URL/")
  [[ "$code" == "401" ]] || fail "Sem credenciais, esperado 401 e recebido $code"

  code=$(status "${auth[@]}" "$URL/")
  [[ "$code" == "200" ]] || fail "Com credenciais, esperado 200 e recebido $code"

  robots=$(curl -s -D - -o /dev/null "${bypass[@]}" "${auth[@]}" "$URL/" | tr -d '\r' | grep -i '^x-robots-tag:' || true)
  [[ "$robots" == *noindex* ]] || fail "X-Robots-Tag: noindex ausente"

  code=$(status "${auth[@]}" "$URL/api/graphql")
  [[ "$code" == "404" ]] || fail "/api/graphql deveria retornar 404 (recebido $code)"

  code=$(status -L "${auth[@]}" "$URL/admin")
  [[ "$code" == "200" ]] || fail "/admin deveria responder 200 (recebido $code)"
else
  code=$(status "$URL/")
  [[ "$code" == "200" ]] || fail "Produção: esperado 200 e recebido $code"
  code=$(status "$URL/api/graphql")
  [[ "$code" == "404" ]] || fail "/api/graphql deveria retornar 404 (recebido $code)"
fi

echo "Fumaça OK ($MODE): $URL"
