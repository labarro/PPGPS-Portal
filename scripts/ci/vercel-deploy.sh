#!/usr/bin/env bash
# Deploy controlado pelo pipeline (ADR-0009): build no runner e envio do artefato pré-compilado.
# O deploy automático por Git está desativado em vercel.json (git.deploymentEnabled=false).
#
# Uso: scripts/ci/vercel-deploy.sh preview|production
# Variáveis obrigatórias: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID, APP_ENV,
#   DATABASE_URL, PAYLOAD_SECRET. Para APP_ENV preview/staging: BASIC_AUTH_USER,
#   BASIC_AUTH_PASSWORD e o armazenamento S3/R2 (S3_BUCKET, S3_ENDPOINT, S3_ACCESS_KEY_ID,
#   S3_SECRET_ACCESS_KEY) — S02, ADR-0011.
# Opcionais repassados ao runtime (somente servidor, nunca NEXT_PUBLIC_): S3_REGION, S3_PREFIX,
#   S3_FORCE_PATH_STYLE, SERVER_URL, SMTP_*, EMAIL_*, SENTRY_DSN, CRON_SECRET, MAINTENANCE_MODE.
# Storage S3/R2 obrigatório também na produção (S06).
# Opcionais de build (públicos por natureza): NEXT_PUBLIC_SENTRY_DSN, CSP_REPORT_URI.
# Saída: URL do deploy em $GITHUB_OUTPUT (deployment_url) e no stdout. Nenhum valor é impresso.
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
# Storage obrigatório fora do ambiente local, inclusive na produção (ADR-0011; falha fechada).
for var in S3_BUCKET S3_ENDPOINT S3_ACCESS_KEY_ID S3_SECRET_ACCESS_KEY; do
  [[ -n "${!var:-}" ]] || { echo "::error::$var ausente: storage obrigatório fora do ambiente local (ADR-0011)"; exit 1; }
done
[[ "${S3_BUCKET}" != *backup* ]] || { echo "::error::O bucket de backups não pode ser usado pela aplicação"; exit 1; }
if [[ "$TARGET" == "production" ]]; then
  # Produção nunca usa os buckets de preview/homologação.
  [[ "${S3_BUCKET}" != *preview* && "${S3_BUCKET}" != *staging* ]] \
    || { echo "::error::Bucket de outro ambiente na produção"; exit 1; }
fi

$VERCEL pull --yes --environment="$TARGET" --token="$VERCEL_TOKEN" >/dev/null

# APP_ENV e as variáveis públicas são lidas em tempo de build (cabeçalhos/CSP e Sentry do cliente).
APP_ENV="$APP_ENV" \
  NEXT_PUBLIC_SENTRY_DSN="${NEXT_PUBLIC_SENTRY_DSN:-}" \
  CSP_REPORT_URI="${CSP_REPORT_URI:-}" \
  $VERCEL build "${prod_flag[@]}" --token="$VERCEL_TOKEN"

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

optional=(
  S3_ENDPOINT S3_REGION S3_BUCKET S3_ACCESS_KEY_ID S3_SECRET_ACCESS_KEY S3_FORCE_PATH_STYLE S3_PREFIX
  SERVER_URL SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASSWORD SMTP_SECURE EMAIL_SMTP_IS_SANDBOX
  EMAIL_FROM_ADDRESS EMAIL_FROM_NAME SENTRY_DSN CRON_SECRET MAINTENANCE_MODE
)
for var in "${optional[@]}"; do
  if [[ -n "${!var:-}" ]]; then
    runtime_env+=(--env "${var}=${!var}")
  fi
done

url=$($VERCEL deploy --prebuilt "${prod_flag[@]}" --token="$VERCEL_TOKEN" "${runtime_env[@]}")
url="$(echo "$url" | tail -n 1)"

echo "deployment_url=${url}" >> "${GITHUB_OUTPUT:-/dev/null}"
echo "$url"
