# PROGRESS — Portal Acadêmico do grupo "Bioética e Promoção da Saúde"

> Memória entre sessões (planejamento 29.1 e 29.4). Atualizado ao fim de cada sessão de agente.
> Uma sessão nova deve ler, nesta ordem: `AGENTS.md` → este arquivo → ficha da sprint ativa em `docs/sprints/`.

## Estado atual

| Campo | Valor |
|---|---|
| Escopo | **Portal exclusivo do grupo de pesquisa "Bioética e Promoção da Saúde"** e de suas atividades/laboratório. UniCesumar e PPGPS são apenas referências contextuais (ADR-0006) |
| Marco corrente | M1 — Primeira publicação |
| Última sprint executada | **S01 — Setup técnico, ambientes e pipeline** |
| Situação da S01 | **Executada — aguardando revisão humana** (não concluída): falta a validação em máquina limpa pelo supervisor e o merge do PR #7 |
| Situação da S00 | **Executada — aguardando revisão humana** (não concluída): Q1–Q12 não enviadas/registradas |
| Próxima sprint | S02 — **não apta a iniciar** (dependências S00/S01 não concluídas) |
| Última atualização | 22/10/2026 |
| Planejamento vigente | `docs/PLANEJAMENTO_PORTAL_PPGPS.md` **v1.2** |

## Situação das sprints

| Sprint | Nome | Marco | Situação |
|---|---|---|---|
| S00 | Descoberta, regras do projeto e inventário | M1 | Executada — aguardando revisão humana |
| S01 | Setup técnico, ambientes e pipeline | M1 | Executada — aguardando revisão humana |
| S02 | Autenticação, papéis, auditoria, storage, backup e base visual | M1 | Não iniciada |
| S03 | Portal do grupo: identidade, linhas, laboratório e homepage v1 | M1 | Não iniciada |
| S04 | Integrantes, vínculos e consentimentos | M1 | Não iniciada |
| S05 | Blog acadêmico e fluxo editorial | M1 | Não iniciada |
| S06 | Reauditoria, conteúdo inicial e lançamento do M1 | M1 | Não iniciada |
| S07 | Orientações, conclusões acadêmicas e egressos | M2 | Não iniciada |
| S08 | Catálogo de publicações do grupo | M2 | Não iniciada |
| S09 | Importação em lote, deduplicação e busca global | M2 | Não iniciada |
| S10 | Eventos, projetos, laboratório e impacto social | M2 | Não iniciada |
| S11 | Consolidação, carga de dados acadêmicos e lançamento do M2 | M2 | Não iniciada |

## Revisão de encerramento formal S00/S01 (22/10/2026)

> Fonte de verdade: estado do repositório, do GitHub, do Neon e da Vercel em 22/10/2026. Nenhum deploy de produção; S02 não iniciada.

### Resultado

| Sprint | Situação | Motivo |
|---|---|---|
| **S00** | **Executada — aguardando revisão humana** (não concluída) | Critério "Validações Q1–Q12 enviadas aos responsáveis do grupo (data registrada)" sem evidência: `questoes-institucionais.md` §1 registra o envio como "Pendente — ação do supervisor" |
| **S01** | **Executada — aguardando revisão humana** (não concluída) | (1) Validação em máquina limpa pelo supervisor (DoD da ficha) sem registro; (2) PR #7 (correção do deploy de homologação) **aberto, não mesclado** |

**Aptos a iniciar a S02? Não.** O protocolo (`AGENTS.md` §11.1) exige as sprints de dependência concluídas. A S02 depende da S01, que depende da S00.

### Verificações realizadas

| Item | Evidência verificável | Resultado |
|---|---|---|
| PR #1 | `gh pr view 1`: `MERGED`; `origin/main` = `f82763b` | Mesclado (por *merge commit*, não *squash* como manda `docs/convencoes-git.md` §3; sem impacto funcional) |
| Workflows pós-merge do PR #1 na `main` | Runs `39509806267` (CI), `39509806293` (migrations), `39509806332` (homologação) | Verdes. A homologação migrou `staging` e atualizou `seed`; o deploy foi pulado (token gravado após o merge) |
| Deploy manual na `main` | Run `39810882526` (`workflow_dispatch`) | **Falhou no alias** (`vercel alias set`: `User not found`); o deploy em si foi publicado |
| PR #7 (correção) | `gh pr view 7`: `OPEN`, `MERGEABLE/CLEAN`, 0 revisões; 9 checks verdes no commit `7e6ab49` | **Não mesclado**: não existe deploy automático na `main` após ele |
| Pipeline corrigido | Run `39812186775` (`deploy-staging.yml` na branch do PR #7) | Verde: migrate `staging` → `seed` → deploy → fumaça → alias → fumaça no domínio fixo |
| Homologação `ppgps-portal-staging.vercel.app` | `curl` em 22/10 | 302 sem bypass (SSO Vercel) · 401 sem basic auth · 200 com ambos · `X-Robots-Tag: noindex, nofollow, noarchive` · `/api/graphql` 404 · `/admin` 200 |
| Preview por PR | PR #7: branch `preview/pr-7` (de `seed`, expira em 7 dias), deploy e fumaça; comentário automático no PR | Verde |
| Remoção de branches efêmeros | Lista de branches Neon: `preview/pr-1` e `preview/pr-2` ausentes após merge/fechamento; restam `production`, `staging`, `seed`, `preview/pr-7` (PR aberto) | OK; `production` intocada |
| Testes locais (22/10) | `lint`, `typecheck`, `test` 32/32, `build` sem banco, `test:e2e` 5/5, `migrate`, `migrate:check` | Verdes |
| Migrations no CI | `migrations-check` verde (banco limpo, drift, tipos, down/up); PR #2 de prova falhou com `DRIFT DETECTADO` | OK |
| Segurança | gitleaks no histórico completo (`--all`): sem vazamentos; 13 valores reais de segredos procurados nos logs de 40 runs: 0 ocorrências; nenhum `.env`/`.secrets`/`.vercel`/`.neon` versionado; `pnpm audit --audit-level high` verde | OK |
| **Clone limpo isolado (agente)** | Clone novo do GitHub (`f82763b`); `.env` gerado do zero; Compose em projeto separado (`ppgps-clean`, volumes novos); `pnpm install --frozen-lockfile` em contêiner `node:24-bookworm` sem cache → `pnpm migrate` → `pnpm dev` | `/` 200 + noindex · `/admin` 200 · `/api/graphql` 404 · `first-register` 200 · login 200 (token) · logout 200 · segundo `first-register` 403. Ambiente removido depois. **Evidência complementar; não substitui a validação do supervisor** |
| Proteção da `main` | `GET /branches/main/protection` e `/rulesets` → **HTTP 403** ("Upgrade to GitHub Pro or make this repository public") | **Inexistente e indisponível** no plano atual (repositório privado, conta Free) |
| Ambientes GitHub | `preview` e `staging` sem regras; `production` **não existe** | Revisores obrigatórios também indisponíveis no plano atual |

**Mitigação aplicada (PR #7):** `deploy-production.yml` só executa com `PRODUCTION_DEPLOY_ENABLED=true` (variável hoje **não definida**) e quando disparado pelo dono do repositório. Registrado no ADR-0009.

### Critérios de aceite — S00

| Critério | Situação |
|---|---|
| `AGENTS.md` com comandos, escopo, migrations, ambientes, testes e protocolo | Comprovado (comandos sincronizados na S01) |
| Uma ficha por sprint S01–S11 com as seções exigidas | Comprovado |
| Inventário mínimo com fonte e marco | Comprovado |
| Validações Q1–Q12 enviadas aos responsáveis (data registrada) | **Pendente — supervisor** (sem evidência) |

### Critérios de aceite — S01

| Critério | Situação | Evidência |
|---|---|---|
| Setup em máquina limpa pelo README | **Pendente — supervisor** (evidência técnica complementar do agente: clone limpo isolado, acima) | — |
| `/admin` cria o primeiro admin e faz login | Comprovado | E2E local e CI; clone limpo; homologação |
| PR com schema sem migration falha no CI | Comprovado | PR #2 |
| Dois PRs simultâneos com bancos distintos; branch removido ao fechar | Comprovado | `preview/pr-1` + `preview/pr-2`; remoções verificadas; `preview/pr-7` com app completo |
| `next build` sem migrations; migrate em job separado com `concurrency` | Comprovado | Job "Build sem acesso ao banco"; jobs de migrate com `concurrency` |
| Homologação e previews com autenticação básica, `noindex`; `/api/graphql` 404 | Comprovado | Fumaças automatizadas (preview e homologação) + `curl` |
| DoD: CI verde, migrations versionadas, controles 17.7 (S01), nada de sprint futura, `PROGRESS.md` e ADRs | Comprovado, **exceto** "preview revisado e homologação atualizada pelo supervisor" | — |

### Revisão dos ADRs 0001–0009 (consistência com o planejamento v1.2)

Todos estão **Propostos**; nenhum foi aceito pelo supervisor.

| ADR | Consistência com v1.2 e com o implementado | Observação para o aceite |
|---|---|---|
| 0001 Stack | Consistente (Next + Payload 3 + Postgres, monólito) | Versões exatas delegadas e fixadas no 0007 |
| 0002 Postgres sem Prisma | Consistente ("16+"; usado PG 18) | — |
| 0003 Hospedagem gratuita | Consistente (Vercel Hobby, Neon Free, GitHub Actions) | **Novo fato:** o GitHub Free com repositório privado não oferece proteção de branch nem revisores de ambiente; considerar na decisão de custos |
| 0004 Pessoa ≠ Usuário | Consistente; sem impacto na S01 (`users` mínimo) | — |
| 0005 Ambientes/migrations/rollback | Consistente na essência. Desvios registrados nos ADRs seguintes: branch de produção chama-se `production` (não `main`) → 0009; transação **por migration**, não por lote (a linha "Migration falha → nada aplicado" só vale para lote de uma migration) → 0008; aprovação manual de produção inviável no plano atual → 0009; `pg_dump` pré-deploy adiado para a S02 (backup) | Aceitar em conjunto com 0008/0009, ou atualizar o texto do 0005 |
| 0006 Escopo do grupo | Consistente; S01 sem dados institucionais | Depende de Q1/Q2 para publicação (não para o aceite) |
| 0007 Versões fixadas | Consistente com o `package.json` (Payload 3.91.0, Next 16.3.8, React 19.2.6, Node 24, PG 18) | Exceção de auditoria `GHSA-vfj7-8cjw-p6xm` (somente dev) a reavaliar |
| 0008 Drift | Consistente e comprovado (PR #2) | Limitação: edição manual de migration já gerada não é detectada |
| 0009 Neon/Vercel | Consistente e comprovado (preview, homologação, bypass) | Decisões pendentes: plano GitHub × trava compensatória; manter a Vercel Authentication (revisores precisam de conta Vercel) |

### Validações institucionais pendentes (não bloqueiam o desenvolvimento; bloqueiam publicação e o encerramento da S00)

- **Envio das Q1–Q12** aos responsáveis do grupo (critério da S00), com data registrada em `docs/content/questoes-institucionais.md` §1.
- Evidência original (e-mail/mensagem) da decisão de escopo de 20/10/2026 em `questoes-institucionais.md` §1.
- Prioridades: Q3 (domínio/hospedagem), Q4 (LGPD) e Q5 (integrantes) até a S04; Q1, Q2, Q6, Q7 e Q8 para o M1.

### Ações manuais restantes (supervisor) — com procedimento

1. **Validar em máquina limpa (S01)**, numa máquina ou conta de usuário sem o projeto: instalar Node 24, `corepack enable`, Docker; `git clone https://github.com/labarro/PPGPS-Portal.git` → `pnpm install` → `pnpm db:up` → `pnpm migrate` → `pnpm dev` → abrir `http://localhost:3000/admin`, criar o primeiro admin, sair e entrar. **Registrar** abaixo (data, SO, versões de Node/pnpm/Docker, resultado, eventuais desvios do README).
2. **Revisar e mesclar o PR #7** (*squash*); conferir que o run automático de `deploy-staging.yml` na `main` termina verde.
3. **Enviar as Q1–Q12** (modelo em `questoes-institucionais.md` §5) e registrar a data (S00).
4. **Aceitar/ajustar os ADRs 0001–0009** (alterar o campo Status e a data de aprovação).
5. **Proteção da `main`**: decidir entre GitHub Pro (US$ 4/mês) ou tornar o repositório público. Este contém só documentação e código, sem segredos, mas a decisão envolve as regras de exposição institucional. Na falta das duas, aplicar disciplina manual de PR. Com proteção disponível: PR obrigatório, 1 aprovação, checks obrigatórios (CI, `migrations-check`, preview), somente *squash*, bloqueio de *force push*/exclusão.
6. **Ambiente `production`**: criar com segredos próprios (`NEON_API_KEY`, `DATABASE_URL`, `DATABASE_URL_POOLED`, `PAYLOAD_SECRET`, `VERCEL_TOKEN`) e revisores (se o plano permitir). **Não** definir `PRODUCTION_DEPLOY_ENABLED` antes da S06.
7. **Executar o roteiro de homologação da ficha S01** (passos 1–7) e registrar o resultado.
8. **Guardar em cofre e apagar `.secrets/`** da máquina do agente.
9. **Dependabot**: decidir sobre os PRs #3–#6 (versões maiores de actions) e verificar a execução npm que falhou em 20/10.

### Registro da validação em máquina limpa (preencher pelo supervisor)

| Data | SO / máquina | Node / pnpm / Docker | Resultado | Observações |
|---|---|---|---|---|
| — | — | — | **Pendente** | — |

## Sessão de 20/10/2026 — execução da S01

**Gatilho/modo:** instrução explícita do supervisor para executar a S01 **de forma autônoma**, sem aprovações intermediárias (AGENTS.md §1.1 item 2 e §11 passo 2). **Premissa registrada:** a S00 ainda está "aguardando revisão humana"; a S01 foi iniciada por ordem do supervisor, e os documentos da S00 foram versionados em commit próprio no mesmo PR.

### Feito

- **App** (template oficial `blank` do `create-payload-app@3.91.0`): Next.js 16.3.8 (App Router, TS estrito), Payload 3.91.0 em `src/app/(payload)`, página pública provisória em `src/app/(site)` (pt-BR, aviso de portal não oficial), pnpm 10, Node 24 (`.nvmrc`/`engines`). Versões no **ADR-0007**.
- **Banco/migrations:** `@payloadcms/db-postgres` com `push: false`; primeira migration `20261020_201226_initial_users_media`; scripts `db:up`, `db:down`, `env:local`, `migrate`, `migrate:create`, `migrate:status`, `migrate:down`, `migrate:check`, `generate:types`, `generate:importmap`, `seed`.
- **Local:** `docker-compose.yml` com Postgres 18 (bancos `ppgps` e `ppgps_test`) e MinIO (imagem Chainguard fixada por digest — a MinIO deixou de publicar imagens oficiais); `.env` local gerado com segredos aleatórios.
- **Coleções mínimas** `users` (auth padrão) e `media` (upload básico); localização `pt-BR` padrão + `en` declarado e oculto (`src/lib/i18n/locales.ts`); admin em português.
- **Segurança:** GraphQL e playground desabilitados (rotas removidas; `/api/graphql` → 404); cabeçalhos HSTS, `nosniff`, `Referrer-Policy`, `X-Frame-Options`/`frame-ancestors`, `Permissions-Policy`; `X-Powered-By` removido; `src/proxy.ts` com autenticação básica em `preview`/`staging` (falha fechada 503 sem credenciais) e `X-Robots-Tag: noindex` fora da produção.
- **Qualidade:** ESLint (flat, `no-explicit-any` e `react/no-danger` como erro), Prettier, Husky + lint-staged + Commitlint (validados em commit real), `tsc --noEmit`.
- **Testes:** Vitest (projetos `unit` e `integration`; integração aplica migrations e inicializa o Payload/cria usuário), cobertura v8 com limite de 70%; Playwright + axe (home, cabeçalhos, GraphQL 404, primeiro usuário, login/logout/login).
- **CI/CD (GitHub Actions):** `ci.yml` (formatação, lint, tipos, unit, integração com Postgres de serviço, E2E, build sem banco, gitleaks, `pnpm audit`), `migrations-check.yml` (banco limpo, *drift*, tipos/import map, `down`/`up` — **ADR-0008**), `preview-db.yml` (branch Neon `preview/pr-N` de `seed`, migrate antes do deploy, expiração 7 dias, limite de 5, remoção ao fechar), `deploy-staging.yml`, `deploy-production.yml` (tag + ambiente `production` + ponto de restauração Neon); Dependabot (sem *major* de Next/Payload/React).
- **Neon** (projeto existente `fragrant-wildflower-16512089`, `aws-sa-east-1`, PG 18): branches `staging` e `seed` criados *schema-only* a partir de `production` (sem dados); migrations da S01 aplicadas em `seed` e `staging`; **branch `production` não foi alterada nem acessada para dados**. `neon init`/`neon deploy` **não** executados (justificativa no **ADR-0009**). Chave de API Neon com escopo do projeto criada para o GitHub (`github-actions-ppgps-preview`).
- **Vercel:** projeto `ppgps-portal` (escopo `labarros-projects`, Hobby) criado e vinculado; `vercel.json` com deploy por Git **desativado** e região `gru1`; deploy de homologação de validação feito pela CLI e apontado para `ppgps-portal-staging.vercel.app`.
- **GitHub:** ambientes `preview` e `staging` criados com segredos próprios (valores distintos de `PAYLOAD_SECRET` e de autenticação básica); variáveis `NEON_PROJECT_ID`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `STAGING_DOMAIN`. PR #1 aberto.
- **Docs:** ADR-0007, 0008 e 0009 (Propostos); README com setup reproduzível; `AGENTS.md` §3 sincronizado (e corrigido artefato `` `r`n `` no glossário).

### Testes executados (evidências)

| Verificação | Local (Windows, Docker) | CI (PR #1) |
|---|---|---|
| `pnpm lint` / `format:check` / `typecheck` | Passou | Passou |
| `pnpm test` (27 unitários + 5 integração) | 32/32 passou | Passou |
| Cobertura (`src/lib`, `src/proxy.ts`) | 100% linhas | Passou |
| `pnpm test:e2e` (5 testes, axe sem violações sérias/críticas) | 5/5 passou (`next dev` e `next start`) | Passou |
| `pnpm build` com `DATABASE_URL` inacessível | Passou (build não conecta nem migra) | Passou |
| `migrations-check` (banco limpo, drift, down/up) | Passou | Passou |
| gitleaks / `pnpm audit --audit-level high` | gitleaks local: sem vazamentos | Passou / Passou |
| `pnpm dev` → `/` 200 + noindex, `/admin` 200, `/api/graphql` 404, `/api/users/me` 200 | Passou | — |
| `pnpm seed` (idempotente, só `@example.com`) | Passou | — |
| actionlint / shellcheck nos workflows e scripts | Passou | — |
| Deploy de homologação (Vercel + Neon `staging`) | 401 sem credenciais; 401 com credencial errada; 200 com credenciais + `noindex` + cabeçalhos; `/api/graphql` 404; `/admin` 200 | — |
| PR de prova #2 (schema sem migration) | — | `migrations-check` **falhou** com `DRIFT DETECTADO` (`ADD COLUMN "drift_probe"`); após gerar a migration, **todos verdes** |
| Dois previews simultâneos | — | `preview/pr-1` e `preview/pr-2` coexistiram (ambos filhos de `seed`); ao fechar o PR #2, `preview/pr-2` foi **removido** |

### Decisões

1. Branch Neon de produção é `production` (não renomeada); equivale ao `main` do planejamento. `staging`/`seed` são *schema-only* (ADR-0009).
2. Deploy na Vercel somente pelo pipeline (`vercel build` + `deploy --prebuilt`); homologação = deploy *preview* com `APP_ENV=staging` + alias fixo (Hobby não tem ambientes personalizados).
3. Migrations do Payload rodam **em transação por migration** (premissa da seção 24.6 confirmada por migration, não por lote — ADR-0008).
4. Sem `serverURL` no Payload na S01 (URLs relativas funcionam com a URL variável dos previews); definir quando houver e-mail (S02).
5. Next 16.3.3 → 16.3.8, sharp 0.35.5 e Vitest 4.1.12 por vulnerabilidades; `dompurify` forçado ≥ 3.4.16; GHSA do `braces` (só dev, sem correção) ignorado com justificativa (ADR-0007).
6. Senhas de teste geradas em tempo de execução; 4 falsos positivos do gitleaks em commit antigo registrados em `.gitleaksignore`.

## Sessão de 22/10/2026 — bypass, correção do alias e validação de preview/homologação

**Modo:** autônomo, autorizado pelo supervisor (merge do PR #1 autorizado; sem deploy de produção; sem iniciar a S02).

### Feito

- PR #1 encontrado **já mesclado** na `main` (`f82763b`). Os workflows pós-merge passaram: CI, verificação de migrations e deploy de homologação. Este último aplicou as migrations em `staging` e atualizou o branch `seed` com seed fictício. O deploy na Vercel foi pulado porque o `VERCEL_TOKEN` foi gravado 4 min depois do merge.
- **Bypass de automação da Vercel:** segredo gerado localmente (não exibido), habilitado no projeto (`vercel project protection enable --protection-bypass`) e gravado como `VERCEL_AUTOMATION_BYPASS_SECRET` nos ambientes `preview` e `staging`. A Vercel Authentication **continua ativa**: sem bypass, 302 para o SSO; com bypass e sem credenciais do app, 401.
- **Correção do pipeline (PR #7, aberto):** a nova execução do deploy de homologação na `main` publicou o app, mas `vercel alias set --scope` falhou (`User not found`): o token com escopo de projeto não pode carregar o usuário. O alias passou a ser criado pela API REST da Vercel e **só depois** da fumaça do deploy; foi incluída uma fumaça no domínio fixo.
- PR #7 validado sem mesclar (a autorização de merge cobria só o PR #1): CI 100% verde e `deploy-staging.yml` executado por `workflow_dispatch` na branch do PR. **Todos os jobs passaram:** migrate staging, atualização do `seed`, deploy, fumaça do deploy, alias e fumaça de `ppgps-portal-staging.vercel.app`.

### Testes executados (22/10/2026)

| Verificação | Resultado |
|---|---|
| Local: `lint`, `typecheck`, `migrate`, `migrate:check` | Passou |
| Local: `pnpm test` (unidade + integração com Payload/Postgres) | 32/32 |
| Local: `pnpm build` com banco inacessível | Passou |
| Local: `pnpm test:e2e` (`next start`, axe) | 5/5 |
| CI do PR #7 (9 jobs: qualidade, unit, integração, E2E, build sem banco, gitleaks, audit, migrations, preview) | Todos verdes |
| Preview real (PR #7): branch Neon `preview/pr-7` de `seed`, migrations antes do deploy, deploy Vercel, fumaça | Passou (401 sem credenciais, 200 com credenciais, `noindex`, `/api/graphql` 404, `/admin` 200) |
| Homologação pelo pipeline (`deploy-staging.yml`) | Passou, inclusive alias e fumaça no domínio fixo |
| Verificação manual de `ppgps-portal-staging.vercel.app` | 302 sem bypass (SSO Vercel) · 401 com bypass, sem basic auth · 200 com ambos · `X-Robots-Tag: noindex, nofollow, noarchive` · `/api/graphql` 404 · `/admin` 200 |
| Branches Neon | `preview/pr-1` removido após o merge do PR #1; `preview/pr-2` removido ao fechar o PR #2 (sessão anterior); `preview/pr-7` criado com expiração de 7 dias. `production` intocada |
| gitleaks no histórico completo (`--all`) | Nenhum vazamento |
| Valores reais dos segredos (13) procurados nos logs dos 40 runs mais recentes | 0 ocorrências |
| Arquivos sensíveis versionados (`.env`, `.secrets/`, `.vercel/`, `.neon`) | Nenhum |

## Sessão de 20/10/2026 — revisão de escopo (v1.2)

**Gatilho:** o responsável pelo grupo confirmou (via supervisor) que o portal é exclusivo do grupo "Bioética e Promoção da Saúde" e de suas atividades/laboratório; a proposta foi aprovada **conceitualmente**; não há autorização para envolver institucionalmente docentes, grupos ou coordenação do PPGPS.
**Modo:** autônomo, autorizado pelo supervisor; sem código, dependências, commits ou push; sem contato externo.

### Feito

- **Planejamento v1.2** (`docs/PLANEJAMENTO_PORTAL_PPGPS.md`): cabeçalho e histórico de mudanças; seções 1, 2.4, 3, 4, 5 (com nova 5.4 — referências institucionais), 6, 8, 9, 10, 13 (com nova 13.7 — expansão futura), 14, 15, 16, 17.1–17.2, 18, 19 (com nova 19.4), 20 (resumo por sprint; fichas passam a ser a referência detalhada), 21, 23.4, 25.2–25.3, 26, 30, 32 e notas nas seções 2 e 33. Stack, arquitetura técnica, ambientes, migrations, CI/CD e sequência de sprints preservados.
- **ADR-0006** (novo): escopo restrito ao grupo e simplificação do modelo. **ADR-0004** reescrito (vínculos com o grupo, afiliações e programas como referência). ADR-0001/0002/0003/0005 conferidos (0003 e 0005 com ajustes pontuais).
- **AGENTS.md** e **CLAUDE.md** atualizados (escopo, grupo único como global, papéis sem `group_manager`, consentimento para todos, portal não oficial, proibição de marcas, aprovação conceitual ≠ autorização).
- **Inventário** reescrito com o grupo como foco (dados do PPGPS registrados apenas como contexto/fora de escopo).
- **Validações Q1–Q12** dirigidas aos responsáveis do grupo, com tabela de correspondência às Q1–Q20 da v1.1 (que não chegaram a ser enviadas).
- **Fichas S00–S11** revisadas: S00, S03, S04, S06, S07, S08, S10, S11 reescritas; S01, S02, S05, S09 ajustadas.
- `README.md` e `docs/convencoes-git.md` ajustados.

### Decisões (v1.2)

1. Grupo único como global `GroupProfile`; sem coleções `programs`/`research-groups`; programas e instituições como campos de referência (texto + URL).
2. Papéis do sistema: `admin`, `editor` (líderes e editor-chefe), `researcher`; `group_manager` e `managedGroups` removidos.
3. **Todo** perfil público exige consentimento registrado, inclusive docentes e líderes (sem base institucional para legítimo interesse).
4. `Project` passa a ser criado na S10 (tipos pesquisa, extensão, cooperação, laboratório); a S03 não tem projetos integradores.
5. Orientações registradas: as que têm ao menos um participante integrante do grupo (OR-4 adaptada); egresso = pessoa com conclusão registrada nesse contexto, com programa de referência.
6. Produção curada: publicação exige autoria de integrante e linha do grupo.
7. Laboratório: página editorial no M1 apenas se confirmado (Q6); atividades como projetos `laboratory` no M2; nenhum laboratório de terceiros (ex.: LIIPS) atribuído ao grupo sem confirmação.
8. Aviso de portal não oficial obrigatório desde a S02; nenhum logotipo institucional sem autorização formal; título das páginas com o nome curto do grupo (nunca "PPGPS").
9. Nomes técnicos (`PLANEJAMENTO_PORTAL_PPGPS.md`, repositório `PPGPS-Portal`) mantidos para não quebrar referências.
10. Rotas públicas: `/o-grupo/*`, `/linhas`, `/integrantes` (com `/integrantes/orientacoes` e `/integrantes/egressos`), `/producao`, `/blog`, `/eventos`, `/projetos`, `/impacto`.
11. A seção 20 do planejamento resume as sprints; as fichas em `docs/sprints/` são normativas (evita duplicação divergente).

### Preservado da v1.1

Stack (Next.js + Payload 3 + PostgreSQL + R2), monólito modular, ADR-0001/0002/0003/0005, marcos M1/M2, numeração e ordem das sprints, módulos (integrantes, orientações com OR-1 a OR-10, conclusões, egressos, trajetória, publicações, DOI/importação/deduplicação, busca, blog com fluxo editorial, eventos, projetos, impacto/ODS, indicadores), segurança progressiva (17.7), ambientes isolados, pipeline de migrations, backup e rollback, DoD global, convenções de Git.

## Sessão de 19/10/2026 — execução inicial da S00 (escopo v1.1, superado)

- Criados `AGENTS.md`, `CLAUDE.md`, ADR-0000 a 0005, fichas S00–S11, inventário (escopo PPGPS), questões Q1–Q20, convenções de Git; README corrigido.
- Consultadas as fontes públicas (página do PPGPS e espelho DGP do grupo); RDU bloqueou acesso automatizado (HTTP 403).
- Todo esse material foi revisado em 20/10/2026 para o escopo do grupo.

## Validações abertas (Q1–Q12)

Críticas: Q3 (domínio/hospedagem, idealmente antes da S01), Q4 (LGPD) e Q5 (integrantes e autorizações) até a S04. Altas para o M1: Q1 (autorização formal), Q2 (nome/identidade/aviso), Q6 (laboratório), Q7 (linhas e textos), Q8 (editor-chefe). Ver `docs/content/questoes-institucionais.md`.

## Backlog / ideias (não implementar sem ficha)

- Multigrupo, instituições normalizadas, coleção de laboratórios e `external-ids`: caminhos em planejamento 13.7 (somente com ADR).

## Limitações conhecidas

- Laboratório do grupo não identificado em fonte pública (Q6).
- Descrições das 4 linhas não transcritas (espelhos das linhas não consultados); textos a obter com os líderes (Q7).
- DGP atualizado no dia da coleta: recoletar antes da S04.
- Seções técnicas preservadas do planejamento (11, 12, 22, 24, 27, 28, 29) foram revisadas apenas pontualmente; não houve mudança de conteúdo técnico.

## Próximos passos

1. Supervisor: executar as ações manuais da "Revisão de encerramento formal S00/S01" (máquina limpa, PR #7, Q1–Q12, ADRs, proteção da `main`).
2. Agente (nova sessão): conferir as evidências registradas e marcar S00 e S01 como **Concluídas** somente com elas.
3. Só então iniciar a **S02** seguindo o protocolo do `AGENTS.md` §11.
