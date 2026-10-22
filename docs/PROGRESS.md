# PROGRESS — Portal Acadêmico do grupo "Bioética e Promoção da Saúde"

> Memória entre sessões (planejamento 29.1 e 29.4). Atualizado ao fim de cada sessão de agente.
> Uma sessão nova deve ler, nesta ordem: `AGENTS.md` → este arquivo → ficha da sprint ativa em `docs/sprints/`.

## Estado atual

| Campo | Valor |
|---|---|
| Escopo | **Portal exclusivo do grupo de pesquisa "Bioética e Promoção da Saúde"** e de suas atividades/laboratório. UniCesumar e PPGPS são apenas referências contextuais (ADR-0006) |
| Marco corrente | M1 — Primeira publicação |
| Última sprint executada | **S01 — Setup técnico, ambientes e pipeline** |
| Situação da S01 | **Executada — aguardando revisão humana**: PR #1 mesclado; correção final no PR #7; 5/6 critérios comprovados, falta a validação em máquina limpa |
| Situação da S00 | Executada — aguardando revisão humana (documentos versionados na `main` pelo PR #1) |
| Próxima sprint | S02 — **não iniciar** antes da aprovação da S00/S01 e das ações pendentes abaixo |
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

## Sessão de 22/10/2026 — encerramento da S01

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

## Critérios de aceite da S01

| Critério | Situação | Evidência / o que falta |
|---|---|---|
| `pnpm install && pnpm db:up && pnpm migrate && pnpm dev` funciona em máquina limpa seguindo o README | **Atendido nesta máquina; validação do supervisor pendente** | Fluxo repetido em 20 e 22/10; falta repetir em máquina limpa (DoD da ficha) |
| `/admin` permite criar o primeiro usuário admin e fazer login | **Atendido** | E2E `admin.e2e.spec.ts`, local e CI; `/admin` 200 em homologação e preview |
| PR com alteração de schema sem migration falha no CI | **Atendido** | PR #2: `DRIFT DETECTADO` → com migration, verde |
| Dois PRs simultâneos usam bancos distintos e o branch é removido ao fechar | **Atendido** | `preview/pr-1` e `preview/pr-2` simultâneos; ambos removidos ao fechar/mesclar; `preview/pr-7` com deploy de app completo |
| `next build` não executa migrations; migration em job separado com trava de concorrência | **Atendido** | Build com banco inacessível verde (local e CI); jobs de migrate com `concurrency`, executados antes do deploy |
| Homologação e previews exigem autenticação básica e respondem com `noindex`; `/api/graphql` 404 | **Atendido** | Fumaça automatizada em preview (PR #7) e homologação (deploy e domínio fixo) + verificação manual |

**Status da S01:** executada; **5 de 6 critérios comprovados**. O sexto (máquina limpa) depende do supervisor. A sprint passa a **Concluída** após o merge do PR #7 e a validação em máquina limpa.

## Pendências

### Ações do supervisor para concluir a S01

- [ ] **Aprovar e mesclar o PR #7** (correção do alias de homologação; CI verde, validado por `workflow_dispatch`). Depois, conferir o run automático de `deploy-staging.yml` na `main`
- [ ] **Repetir o README em máquina limpa** (`git clone` → `pnpm install` → `pnpm db:up` → `pnpm migrate` → `pnpm dev` → criar o primeiro admin em `/admin`, sair e entrar)
- [ ] Executar o roteiro de homologação da ficha S01 (passos 1–7). Credenciais de homologação/preview estão em `.secrets/staging.env` e `.secrets/preview.env`; o acesso pelo navegador também exige login na Vercel (proteção de deploy ativa)
- [ ] Aceitar ou ajustar ADR-0007, 0008 e 0009 (e ADR-0001 a 0006 da S00)
- [ ] Criar o ambiente GitHub **`production`** com revisores obrigatórios e seus segredos — agentes não manipulam credenciais de produção
- [ ] Proteção da `main` (`docs/convencoes-git.md` §5), exigindo os checks do CI, de `migrations-check` e do preview
- [ ] Guardar em cofre e **apagar** a pasta local `.secrets/` (valores de `staging`/`preview`, chave Neon e segredo de bypass; ignorada pelo git)
- [ ] Decidir sobre os PRs do Dependabot #3–#6 (atualizações maiores de actions: checkout 7, upload-artifact 7, github-script 9, gitleaks-action 3); revisar a execução do Dependabot npm que falhou em 20/10
- [ ] Opcional: proteger a branch Neon `production` (plano pago) e/ou IP allowlist; chave Neon separada para produção

### Pontos de atenção técnicos

- Neon Free: alterar `suspend_timeout` é proibido (HTTP 412) — removido do workflow.
- Tokens Vercel com escopo de projeto não funcionam com `vercel alias set --scope`; usar a API REST (PR #7).
- `pnpm/action-setup@v4` usa Node 20 (aviso de descontinuação do GitHub); atualizar quando houver versão nova.
- O Postgres avisa que `sslmode=require` passará a se comportar como `verify-full`; as URLs do Neon funcionam, mas convém revisar o `sslmode` na S02.
- `X-Frame-Options`/`frame-ancestors 'self'` também valem para o admin; revisar junto com a CSP na S02.

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

## Critérios de aceite da S00 (v1.2)

| Critério | Situação |
|---|---|
| `AGENTS.md` com comandos, escopo, migrations, ambientes, testes e protocolo | Atendido |
| Uma ficha por sprint S01–S11 com objetivo, escopo, fora de escopo, critérios e roteiro de homologação | Atendido (verificação automática das seções) |
| Inventário com identidade, 4 linhas, líderes, composição (contagens), ex-integrantes, parceiro, laboratório, referências e atividades, cada item com marco | Atendido |
| Validações Q1–Q12 enviadas aos responsáveis do grupo (data registrada) | **Pendente — ação do supervisor** |

## Pendências anteriores (S00)

### Ações do supervisor (encerramento da S00)

- [ ] Revisar a v1.2 e aceitar/ajustar ADR-0001 a ADR-0006
- [ ] Registrar a evidência da decisão de escopo de 20/10/2026 (e-mail/mensagem) em `questoes-institucionais.md` §1
- [ ] Enviar Q1–Q12 aos responsáveis do grupo e registrar a data (as Q1–Q20 da v1.1 **não** devem ser enviadas)
- [x] Commitar os documentos — feito na S01 (commit `docs(s00): ...` no PR #1)
- [ ] Configurar a proteção da `main` (`docs/convencoes-git.md` §5) — agora com os checks do CI disponíveis
- [ ] Marcar a S00 como **Concluída** após a aprovação

### Contas técnicas (ADR-0003)

- [x] GitHub, Vercel e Neon disponíveis e usados na S01
- [ ] Cloudflare R2 — necessário na S02 (storage e backup)

### Validações abertas (Q1–Q12)

Críticas: Q3 (domínio/hospedagem, idealmente antes da S01), Q4 (LGPD) e Q5 (integrantes e autorizações) até a S04. Altas para o M1: Q1 (autorização formal), Q2 (nome/identidade/aviso), Q6 (laboratório), Q7 (linhas e textos), Q8 (editor-chefe). Ver `docs/content/questoes-institucionais.md`.

### Backlog / ideias (não implementar sem ficha)

- Multigrupo, instituições normalizadas, coleção de laboratórios e `external-ids`: caminhos em planejamento 13.7 (somente com ADR).

## Limitações conhecidas

- Laboratório do grupo não identificado em fonte pública (Q6).
- Descrições das 4 linhas não transcritas (espelhos das linhas não consultados); textos a obter com os líderes (Q7).
- DGP atualizado no dia da coleta: recoletar antes da S04.
- Seções técnicas preservadas do planejamento (11, 12, 22, 24, 27, 28, 29) foram revisadas apenas pontualmente; não houve mudança de conteúdo técnico.

## Próximos passos

1. Supervisor: mesclar o PR #7, validar em máquina limpa, executar o roteiro de homologação da S01 e concluir as pendências acima.
2. Registrar "S01 concluída" após essas validações.
3. Só então iniciar a **S02** seguindo o protocolo do `AGENTS.md` §11.
