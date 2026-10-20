#!/usr/bin/env bash
# Deploy controlado pelo pipeline (ADR-0009): build no runner e envio do artefato pré-compilado.
# O deploy automático por Git está desativado em vercel.json (git.deploymentEnabled=false).
#
# Uso: scripts/ci/vercel-deploy.sh preview|production
# Variáveis obrigatórias: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID, APP_ENV,
#   DATABASE_URL, PAYLOAD_SECRET. Para APP_ENV preview/staging: BASIC_AUTH_USER, BASIC_AUTH_PASSWORD.
# Saída: URL do deploy em $GITHUB_OUTPUT (deployment_url) e no stdout.
set -euo pipefail

TARGET="${1:?informe preview ou production}"
VERCEL="pnpm dlx vercel@64.7.0"

: "${VERCEL_TOKEN:?}" "${VERCEL_ORG_ID:?}" "${VERCEL_PROJECT_ID:?}"
: "${APP_ENV:?}" "${DATABASE_URL:?}" "${PAYLOAD_SECRET:?}"

prod_flag=()
if [[ "$TARGET" == "production" ]]; then
  [[ "$APP_ENV" == "production" ]] || { echo "::error::Deploy de produção exige APP_ENV=production"; exit 1; }
  prod_flag=(--prod)
else
  [[ "$APP_ENV" != "production" ]] || { echo "::error::APP_ENV=production só em deploy de produção"; exit 1; }
  : "${BASIC_AUTH_USER:?}" "${BASIC_AUTH_PASSWORD:?}"
fi

$VERCEL pull --yes --environment="$TARGET" --token="$VERCEL_TOKEN" >/dev/null

# APP_ENV é lido também em tempo de build (cabeçalhos em next.config.ts).
APP_ENV="$APP_ENV" $VERCEL build "${prod_flag[@]}" --token="$VERCEL_TOKEN"

runtime_env=(
  --env "APP_ENV=${APP_ENV}"
  --env "DATABASE_URL=${DATABASE_URL}"
  --env "PAYLOAD_SECRET=${PAYLOAD_SECRET}"
)
if [[ "$TARGET" != "production" ]]; then
  runtime_env+=(
    --env "BASIC_AUTH_USER=${BASIC_AUTH_USER}"
    --env "BASIC_AUTH_PASSWORD=${BASIC_AUTH_PASSWORD}"
  )
fi

url=$($VERCEL deploy --prebuilt "${prod_flag[@]}" --token="$VERCEL_TOKEN" "${runtime_env[@]}")
url="$(echo "$url" | tail -n 1)"

echo "deployment_url=${url}" >> "${GITHUB_OUTPUT:-/dev/null}"
echo "$url"
