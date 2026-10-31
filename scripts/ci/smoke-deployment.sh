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

  # S03: rotas do portal do grupo, sitemap e coleção de redirecionamentos não pública.
  for path in /o-grupo /o-grupo/historico /o-grupo/objetivos /o-grupo/referencias-institucionais /o-grupo/contato /linhas /sitemap.xml /robots.txt; do
    code=$(status "${auth[@]}" "$URL$path")
    [[ "$code" == "200" ]] || fail "$path deveria responder 200 (recebido $code)"
  done
  code=$(status "${auth[@]}" "$URL/api/redirects")
  [[ "$code" == "403" ]] || fail "/api/redirects deveria ser negado ao visitante (recebido $code)"
  # S04: diretório público e consentimentos nunca públicos.
  code=$(status "${auth[@]}" "$URL/integrantes")
  [[ "$code" == "200" ]] || fail "/integrantes deveria responder 200 (recebido $code)"
  code=$(status "${auth[@]}" "$URL/api/consent-records")
  [[ "$code" == "403" ]] || fail "/api/consent-records deveria ser negado ao visitante (recebido $code)"
  people=$(curl -s "${bypass[@]}" "${auth[@]}" "$URL/api/people?limit=100")
  if grep -qE '"consent(PublicProfile|Photo|Email|Status)"' <<<"$people"; then
    fail "/api/people expõe campos de consentimento"
  fi
  # S05: blog público, feeds e endpoints editoriais/fila de jobs nunca abertos ao visitante.
  for path in /blog /blog/rss.xml /blog/atom.xml; do
    code=$(status "${auth[@]}" "$URL$path")
    [[ "$code" == "200" ]] || fail "$path deveria responder 200 (recebido $code)"
  done
  code=$(status "${auth[@]}" "$URL/api/essays/publish-due")
  [[ "$code" == "401" ]] || fail "/api/essays/publish-due deveria exigir autenticação (recebido $code)"
  code=$(status "${auth[@]}" "$URL/api/payload-jobs")
  [[ "$code" == "403" ]] || fail "/api/payload-jobs deveria ser negado ao visitante (recebido $code)"
  essays=$(curl -s "${bypass[@]}" "${auth[@]}" "$URL/api/essays?limit=100&draft=true")
  if grep -qE '"(reviewHistory|internalNotes|checklist|scheduledAt|approvedBy)"' <<<"$essays"; then
    fail "/api/essays expõe campos internos do fluxo editorial"
  fi
  home=$(curl -s "${bypass[@]}" "${auth[@]}" "$URL/")
  [[ "$home" == *"Bioética e Promoção da Saúde"* ]] || fail "Nome do grupo ausente na página inicial"
  if grep -qiE 'laborat(ó|o)rio' <<<"$home"; then fail "Menção a laboratório na página inicial (Q6)"; fi
  # S06: páginas legais e modo de manutenção (escrita anônima: 503 em manutenção, 403 fora dela).
  for path in /privacidade /acessibilidade /sobre-o-portal; do
    code=$(status "${auth[@]}" "$URL$path")
    [[ "$code" == "200" ]] || fail "$path deveria responder 200 (recebido $code)"
  done
  code=$(status "${auth[@]}" -X POST -H 'Content-Type: application/json' -d '{}' "$URL/api/pages")
  if [[ "${EXPECT_MAINTENANCE:-}" == "true" ]]; then
    [[ "$code" == "503" ]] || fail "Manutenção: escrita deveria receber 503 (recebido $code)"
    [[ "$home" == *"data-testid=\"maintenance-notice\""* ]] || fail "Aviso de manutenção ausente"
    echo "Modo de manutenção verificado (escrita 503, aviso no site)."
  else
    [[ "$code" == "403" || "$code" == "401" ]] || fail "Escrita anônima deveria ser negada (recebido $code)"
    if [[ "$home" == *"data-testid=\"maintenance-notice\""* ]]; then fail "Aviso de manutenção ativo sem solicitação"; fi
  fi
else
  # S06: produção pública no domínio oficial (ADR-0014). Sem noindex, CSP aplicada, rotas do M1,
  # páginas legais, APIs administrativas fechadas e cadastro do primeiro usuário bloqueado.
  headers=$(curl -s -D - -o /dev/null "$URL/" | tr -d '\r')
  code=$(awk 'NR==1{print $2}' <<<"$headers")
  [[ "$code" == "200" ]] || fail "Produção: esperado 200 e recebido $code"
  if grep -qi '^x-robots-tag:.*noindex' <<<"$headers"; then fail "Produção com X-Robots-Tag noindex"; fi
  grep -qi "^content-security-policy:.*default-src 'self'" <<<"$headers" || fail "CSP (enforce) ausente"
  grep -qi '^strict-transport-security:' <<<"$headers" || fail "HSTS ausente"
  if grep -qi '^content-security-policy-report-only:' <<<"$headers"; then fail "CSP ainda em report-only"; fi

  for path in /o-grupo /o-grupo/historico /o-grupo/objetivos /o-grupo/referencias-institucionais \
    /o-grupo/contato /linhas /integrantes /blog /blog/rss.xml /blog/atom.xml \
    /privacidade /acessibilidade /sobre-o-portal /sitemap.xml /robots.txt; do
    code=$(status "$URL$path")
    [[ "$code" == "200" ]] || fail "$path deveria responder 200 (recebido $code)"
  done
  code=$(status -L "$URL/admin")
  [[ "$code" == "200" ]] || fail "/admin deveria responder 200 (recebido $code)"

  code=$(status "$URL/api/graphql")
  [[ "$code" == "404" ]] || fail "/api/graphql deveria retornar 404 (recebido $code)"
  for path in /api/users /api/audit-logs /api/consent-records /api/redirects /api/payload-jobs; do
    code=$(status "$URL$path")
    [[ "$code" == "403" || "$code" == "401" ]] || fail "$path deveria ser negado ao visitante (recebido $code)"
  done
  code=$(status "$URL/api/essays/publish-due")
  [[ "$code" == "401" ]] || fail "/api/essays/publish-due deveria exigir autenticação (recebido $code)"
  code=$(status -X POST -H 'Content-Type: application/json' -d '{}' "$URL/api/users/first-register")
  [[ "$code" == "403" ]] || fail "Cadastro do primeiro usuário deveria estar bloqueado (recebido $code)"
  people=$(curl -s "$URL/api/people?limit=100")
  if grep -qE '"consent(PublicProfile|Photo|Email|Status)"' <<<"$people"; then
    fail "/api/people expõe campos de consentimento"
  fi

  robots=$(curl -s "$URL/robots.txt")
  grep -q "Sitemap: ${URL}/sitemap.xml" <<<"$robots" || fail "robots.txt sem o sitemap do domínio oficial"
  if grep -qE '^Disallow: /$' <<<"$robots"; then fail "robots.txt bloqueia todo o site na produção"; fi
  sitemap=$(curl -s "$URL/sitemap.xml")
  grep -q "<loc>${URL}/</loc>" <<<"$sitemap" || fail "sitemap sem a página inicial do domínio oficial"
  if grep -q 'vercel.app' <<<"$sitemap"; then fail "sitemap aponta para vercel.app"; fi

  home=$(curl -s "$URL/")
  [[ "$home" == *"Bioética e Promoção da Saúde"* ]] || fail "Nome do grupo ausente na página inicial"
  [[ "$home" == *"rel=\"canonical\" href=\"${URL}"* ]] || fail "Canônica não aponta para ${URL}"
  if grep -qiE 'laborat(ó|o)rio' <<<"$home"; then fail "Menção a laboratório na página inicial (Q6)"; fi
  if grep -qiE '<img[^>]+(unicesumar|ppgps|cnpq|logo)' <<<"$home"; then fail "Logotipo institucional na página inicial"; fi
  about=$(curl -s "$URL/sobre-o-portal")
  [[ "$about" == *"data-testid=\"responsibility-note\""* ]] || fail "/sobre-o-portal sem a nota de responsabilidade"
  if [[ "${EXPECT_MAINTENANCE:-}" == "true" ]]; then
    [[ "$home" == *"data-testid=\"maintenance-notice\""* ]] || fail "Modo de manutenção não sinalizado"
  elif [[ "$home" == *"data-testid=\"maintenance-notice\""* ]]; then
    fail "Aviso de manutenção ativo sem solicitação"
  fi

  # www → apex (308), quando o domínio da URL for o oficial.
  host="${URL#https://}"
  if [[ "$host" != www.* ]]; then
    loc=$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "https://www.${host}/o-grupo?x=1" || true)
    [[ "$loc" =~ ^30[178]\ https://${host}/o-grupo\?x=1$ ]] || echo "::warning::www.${host} não redireciona para o apex ($loc)"
  fi
fi

echo "Fumaça OK ($MODE): $URL"
