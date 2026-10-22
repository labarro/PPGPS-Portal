# PPGPS-Portal

Portal acadêmico do **Grupo de Pesquisa em Bioética e Promoção da Saúde - Unicesumar** (DGP/CNPq), publicado como iniciativa do grupo, com foco em Bioética e Promoção da Saúde. Não é site oficial da UniCesumar nem do PPGPS. O nome do repositório (`PPGPS-Portal`) é apenas técnico.

> Situação: **S00 e S01 concluídas** (22/10/2026); próxima sprint **S02** (ver [`docs/PROGRESS.md`](./docs/PROGRESS.md)). Planejamento **v1.3**.

Stack: Next.js 16 (App Router) + Payload CMS 3 + PostgreSQL 18 (Neon nos ambientes publicados), TypeScript estrito, pnpm. Versões fixadas no [ADR-0007](./docs/adr/0007-versoes-fixadas.md).

## Pré-requisitos

- **Node.js 24 LTS** (`.nvmrc`) — ex.: `nvm use`
- **pnpm 10** — `corepack enable` (usa a versão do `packageManager`) ou `npm i -g pnpm@10`
- **Docker** com Docker Compose (Postgres e MinIO locais)

## Setup local (máquina limpa)

```bash
git clone https://github.com/labarro/PPGPS-Portal.git
cd PPGPS-Portal
pnpm install          # dependências + hooks do Husky
pnpm db:up            # gera .env local (se não existir) e sobe Postgres 18 + MinIO
pnpm migrate          # aplica as migrations versionadas
pnpm dev              # http://localhost:3000
```

1. Acesse <http://localhost:3000/admin> e crie o **primeiro usuário** administrador.
2. Opcional: `pnpm seed` cria a conta **fictícia** `SEED_ADMIN_EMAIL` com a senha `SEED_ADMIN_PASSWORD` do `.env` (rode antes de criar o primeiro usuário se quiser usá-la).

O `.env` local é gerado por `pnpm env:local` (chamado por `pnpm db:up`) a partir de `.env.example`, com senhas e `PAYLOAD_SECRET` aleatórios. Ele nunca é versionado e só aponta para os serviços do Docker — **nunca** use URLs do Neon localmente.

Serviços locais: Postgres em `127.0.0.1:5432` (bancos `ppgps` e `ppgps_test`), MinIO em `127.0.0.1:9000` (console `:9001`; usado pelo storage a partir da S02). Para recriar do zero: `docker compose down -v && pnpm db:up && pnpm migrate`.

## Comandos

| Objetivo | Comando |
|---|---|
| Subir / parar Postgres + MinIO | `pnpm db:up` / `pnpm db:down` |
| Gerar `.env` local | `pnpm env:local` |
| Desenvolvimento | `pnpm dev` |
| Aplicar migrations | `pnpm migrate` |
| Criar migration | `pnpm migrate:create <nome-descritivo>` |
| Situação das migrations | `pnpm migrate:status` |
| Reverter o último lote | `pnpm migrate:down` |
| Verificar *drift* (schema sem migration) | `pnpm migrate:check` |
| Gerar tipos / import map do Payload | `pnpm generate:types` / `pnpm generate:importmap` |
| Seed fictício | `pnpm seed` |
| Lint / formatação / tipos | `pnpm lint` / `pnpm format:check` / `pnpm typecheck` |
| Testes unitários + integração | `pnpm test` (`test:unit`, `test:int`, `test:coverage`) |
| E2E (Playwright + axe) | `pnpm test:e2e` (primeira vez: `pnpm exec playwright install chromium`) |
| Build de produção | `pnpm build` (não acessa o banco nem executa migrations) |

Verificação antes de abrir PR:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build
```

Os testes de integração e E2E usam o banco `ppgps_test` (`DATABASE_URL_TEST`); o E2E sobe o app na porta 3100.

## Alterando o schema

1. Altere a coleção/configuração do Payload.
2. `pnpm migrate:create <nome-descritivo>` e `pnpm generate:types` (e `pnpm generate:importmap` se mudar componentes do admin).
3. `pnpm migrate` localmente e versione **no mesmo commit** a migration (`.ts` + `.json`), `src/migrations/index.ts` e `src/payload-types.ts`.

O CI (`migrations-check.yml`) falha se houver schema sem migration, tipos desatualizados ou falha em `down`/`up` ([ADR-0008](./docs/adr/0008-deteccao-de-drift-de-migrations.md)).

## Ambientes e pipeline

| Ambiente | Banco (Neon) | Deploy | Acesso |
|---|---|---|---|
| Local | Docker | `pnpm dev` | — |
| Preview (PR) | `preview/pr-N` (de `seed`, expira em 7 dias) | `preview-db.yml` | Autenticação básica + `noindex` |
| Homologação | `staging` | `deploy-staging.yml` (merge na `main`) — `ppgps-portal-staging.vercel.app` | Autenticação básica + `noindex` |
| Produção | `production` | `deploy-production.yml` (tag `vX.Y.Z`, disparo pelo dono do repositório e variável `PRODUCTION_DEPLOY_ENABLED=true`, **não definida** até a S06) | Público (a partir da S06) |

Migrations rodam sempre em job próprio, com `concurrency` por ambiente, **antes** do deploy. O deploy automático por Git da Vercel está desativado. Detalhes: [ADR-0005](./docs/adr/0005-ambientes-migrations-rollback.md) e [ADR-0009](./docs/adr/0009-neon-vercel-deploy-controlado.md).

### Configuração do GitHub (supervisor)

Variáveis do repositório (*Settings → Secrets and variables → Actions → Variables*): `NEON_PROJECT_ID`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `STAGING_DOMAIN`.

| GitHub Environment | Segredos |
|---|---|
| `preview` | `NEON_API_KEY`, `PAYLOAD_SECRET`, `BASIC_AUTH_USER`, `BASIC_AUTH_PASSWORD`, `VERCEL_TOKEN`, opcionais `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` (fictícios), `VERCEL_AUTOMATION_BYPASS_SECRET` |
| `staging` | `DATABASE_URL` (direta), `DATABASE_URL_POOLED`, `PAYLOAD_SECRET`, `BASIC_AUTH_USER`, `BASIC_AUTH_PASSWORD`, `VERCEL_TOKEN`, opcional `VERCEL_AUTOMATION_BYPASS_SECRET` |
| `production` (a criar; revisores obrigatórios indisponíveis no plano GitHub Free com repositório privado — ADR-0009) | `NEON_API_KEY`, `DATABASE_URL`, `DATABASE_URL_POOLED`, `PAYLOAD_SECRET`, `VERCEL_TOKEN` |

Cada ambiente usa valores **distintos** de `PAYLOAD_SECRET` e de autenticação básica. Enquanto os segredos não existirem, os workflows de preview/homologação apenas emitem aviso e não fazem deploy.

## Documentação

- [`AGENTS.md`](./AGENTS.md) — regras do projeto (agentes e pessoas)
- [`docs/PROGRESS.md`](./docs/PROGRESS.md) — estado atual e próximos passos
- [`docs/PLANEJAMENTO_PORTAL_PPGPS.md`](./docs/PLANEJAMENTO_PORTAL_PPGPS.md) — plano diretor (v1.3)
- [`docs/sprints/`](./docs/sprints/) — fichas das sprints S00–S11
- [`docs/adr/`](./docs/adr/) — decisões arquiteturais
- [`docs/convencoes-git.md`](./docs/convencoes-git.md) — branches, commits e releases
