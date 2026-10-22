# PROGRESS — Portal do Grupo de Pesquisa em Bioética e Promoção da Saúde - Unicesumar

> Memória entre sessões (planejamento 29.1 e 29.4). Atualizado ao fim de cada sessão de agente.
> Uma sessão nova deve ler, nesta ordem: `AGENTS.md` → este arquivo → ficha da sprint ativa em `docs/sprints/`.

## Estado atual

| Campo | Valor |
|---|---|
| Escopo | Portal exclusivo do **"Grupo de Pesquisa em Bioética e Promoção da Saúde - Unicesumar"**, publicado como iniciativa do grupo, com foco em Bioética e Promoção da Saúde. UniCesumar e PPGPS apenas como referências textuais, sem logotipos. Laboratório fora do escopo atual (ADR-0006, ADR-0010) |
| Marco corrente | M1 — Primeira publicação |
| Situação da S00 | **Concluída** (22/10/2026) |
| Situação da S01 | **Concluída** (22/10/2026) |
| Próxima sprint | **S02 — Autenticação, papéis, auditoria, storage, backup e base visual** (`docs/sprints/S02.md`, revisada na v1.3) — **apta a iniciar**, seguindo o protocolo do `AGENTS.md` §11. Não iniciada |
| Última atualização | 22/10/2026 |
| Planejamento vigente | `docs/PLANEJAMENTO_PORTAL_PPGPS.md` **v1.3** (22/10/2026) |
| ADRs | 0001–0009 **Aceitos**; 0010 **Proposto** (decisões em vigor por determinação do supervisor; falta aceite formal da redação) |

## Situação das sprints

| Sprint | Nome | Marco | Situação |
|---|---|---|---|
| S00 | Descoberta, regras do projeto e inventário | M1 | **Concluída** (22/10/2026) |
| S01 | Setup técnico, ambientes e pipeline | M1 | **Concluída** (22/10/2026) |
| S02 | Autenticação, papéis, auditoria, storage, backup e base visual | M1 | Não iniciada (apta) |
| S03 | Portal do grupo: identidade, linhas temáticas e homepage v1 | M1 | Não iniciada |
| S04 | Integrantes, vínculos e consentimentos | M1 | Não iniciada |
| S05 | Blog acadêmico e fluxo editorial | M1 | Não iniciada |
| S06 | Reauditoria, conteúdo inicial e lançamento do M1 | M1 | Não iniciada |
| S07 | Orientações, conclusões acadêmicas e egressos | M2 | Não iniciada |
| S08 | Catálogo de publicações do grupo | M2 | Não iniciada |
| S09 | Importação em lote, deduplicação e busca global | M2 | Não iniciada |
| S10 | Eventos, projetos e impacto social | M2 | Não iniciada |
| S11 | Consolidação, carga de dados acadêmicos e lançamento do M2 | M2 | Não iniciada |

## Sessão de 22/10/2026 — aprovações, respostas Q1–Q12 e planejamento v1.3

**Modo:** autônomo, documental (sem código, sem dependências, sem deploy, sem merge de PRs, S02 não iniciada). Branch `docs-v1-3-aprovacoes`.

### Aprovações do responsável técnico (declaração expressa na sessão de 22/10/2026)

| Item | Aprovação | Registro |
|---|---|---|
| Teste em ambiente limpo (S01) | **Realizado, validado e aprovado** pelo responsável técnico | Declaração do supervisor; complementa o clone limpo isolado executado pelo agente na sessão anterior (evidência técnica abaixo) |
| PR #7 | Aprovado e mesclado | Verificado no GitHub nesta sessão (abaixo) |
| ADR-0001 a ADR-0009 | Revisados e aprovados | Status alterado para **Aceito**, com data e aprovador |
| Planejamento v1.2 | Aprovado como base do projeto | Base da v1.3 |
| Escopo | Portal exclusivo do grupo, conforme decisão anterior do coordenador | Reafirma o ADR-0006 |

### Verificações executadas nesta sessão (22/10/2026)

> Distinção: abaixo estão **somente** verificações feitas nesta sessão. Nenhuma suíte automatizada (lint, testes, build, E2E) foi executada pelo agente nesta sessão, que foi puramente documental. Os resultados de testes citados vêm das execuções do CI e de sessões anteriores, identificados como tal.

| Verificação | Evidência | Resultado |
|---|---|---|
| PR #7 mesclado | `origin/main` = `b49da2e` ("Merge pull request #7 from labarro/s01-ajuste-deploy-staging") | **Confirmado** |
| CI na `main` após o merge | Run `39817265399` (commit `b49da2e`) | **Sucesso** |
| Verificação de migrations na `main` | Run `39817265487` | **Sucesso** |
| Deploy de homologação na `main` | Runs `39817255542` e `39817265385` (ambos `push` de `b49da2e`; um terceiro, `39817261560`, foi cancelado por concorrência), todos os jobs com sucesso: migrations em `staging`, atualização do `seed`, deploy, fumaça e alias | **Sucesso** |
| Homologação no ar (`ppgps-portal-staging.vercel.app`, alias → `ppgps-portal-5llwoubom…`) | `curl` nesta sessão | 302 sem bypass (proteção Vercel) · 401 sem autenticação básica · 200 com ambos · `X-Robots-Tag: noindex, nofollow, noarchive` · `/api/graphql` 404 · `/admin` 200 |
| Branches Neon | `neon branches list` | `production` (padrão, `updated_at` 21/10/2026), `staging`, `seed`. **`preview/pr-7` removido** após o merge (limpeza automática comprovada mais uma vez) |
| Branch `production` intocada | `neon operations list`: só operações de sistema (criação, configuração inicial e ciclos de start/suspend do compute); última em 20/10/2026 | Nenhuma operação dos pipelines |
| Trava de produção | `gh variable list` | `PRODUCTION_DEPLOY_ENABLED` **não definida** |
| Deploy de produção | Histórico de runs | **Nenhum** `deploy-production.yml` executado |

### Feito (documentação)

- **ADRs:** 0001–0009 → **Aceito**; notas de atualização em 0003, 0004, 0005 e 0006 apontando para o novo **ADR-0010** (decisões do coordenador Q1–Q12 e ajustes da v1.3; *Proposto*).
- **Planejamento v1.3:** cabeçalho, histórico e alterações; seções 1–5 (identidade, iniciativa do grupo, papéis), 6 (RF-004/115 → W, RF-114 → C, RF-003/021/106 revistos), 8 (homepage, laboratório, perfis, orientações, projetos, blog), 9–10 (sitemap sem laboratório; fluxos com dois usuários), 13 (`dgpResearchLines`, `responsibilityNote`, `User.roles` sem `researcher`, `Project` sem `laboratory`, expansão futura), 14 (matriz com dois papéis), 15 (governança), 16 (azul-marinho e branco), 17 (Q4 e Q12 sem dispensar consentimento individual), 18–21, 23, 25 (riscos R1–R3, R9, R15, R17), 30, 31 e 32 (respostas Q1–Q12). Nova seção 19.5.
- **`docs/content/questoes-institucionais.md`:** reescrito com as respostas, os efeitos, os itens em aberto e as questões complementares sugeridas. **Datas de envio e de resposta não informadas foram registradas como "não informada"**, não inventadas.
- **`docs/content/inventario.md`:** nome de exibição, linhas temáticas, linhas do DGP como referência histórica, laboratório fora do escopo, identidade visual, próximas ações.
- **Fichas:** S00 e S01 marcadas como concluídas; S02 reescrita (dois papéis, tokens azul-marinho/branco, sem aviso obrigatório, pré-requisitos de contas técnicas); S03–S11 ajustadas (linhas temáticas, sem laboratório, sem `researcher`, coordenador como curador e revisor).
- **`AGENTS.md`**, **`CLAUDE.md`**, **`README.md`**, **`docs/convencoes-git.md`** atualizados. A limitação do GitHub Free para proteção da `main` foi registrada com os controles compensatórios.

### Decisões registradas (detalhe no ADR-0010)

1. Publicação como iniciativa do grupo, **sem aviso ostensivo**; `/sobre-o-portal` com identificação discreta (Q1).
2. Nome "Grupo de Pesquisa em Bioética e Promoção da Saúde - Unicesumar"; azul-marinho e branco; **sem logotipos institucionais** (Q2). Nome curto para títulos: "Bioética e Promoção da Saúde" [PREMISSA a confirmar].
3. Hospedagem própria e independente do site institucional; domínio a adquirir (Q3).
4. Autorização do grupo para dados (Q4) e materiais (Q12) registrada **sem dispensar** o consentimento individual e a autorização de imagem.
5. Somente `admin` (desenvolvedor) e `editor` (coordenador); `researcher` removido; site sem login (Q5, Q8, Q9).
6. Laboratório fora do escopo atual (Q6).
7. Linhas temáticas Bioética e Promoção da Saúde; as 4 linhas do DGP ficam como referência histórica (Q7).
8. Orientações e egressos confirmados, geridos pelos dois usuários (Q10); sem conteúdo prioritário (Q11).
9. Stack e arquitetura inalteradas; todos os módulos acadêmicos preservados.

## Encerramento formal das sprints S00 e S01 (22/10/2026)

### S00 — **Concluída**

| Critério | Situação | Evidência |
|---|---|---|
| `AGENTS.md` com comandos, escopo, migrations, ambientes, testes e protocolo | Atendido | `AGENTS.md` (atualizado na v1.3) |
| Uma ficha por sprint S01–S11 com as seções exigidas | Atendido | `docs/sprints/S01.md` … `S11.md` |
| Inventário mínimo com fonte, situação e marco | Atendido | `docs/content/inventario.md` |
| Validações Q1–Q12 enviadas aos responsáveis (data registrada) | **Atendido com ressalva documental** | As 12 questões foram respondidas pelo coordenador, o que comprova o envio. As respostas foram relatadas pelo responsável técnico em 22/10/2026 e estão registradas em `questoes-institucionais.md` §1. A **data exata de envio e de resposta não foi informada** e não foi inventada |
| Aprovação do supervisor (DoD da S00) | Atendido | Planejamento v1.2 e ADRs 0001–0009 aprovados em 22/10/2026 |

**Ressalva não bloqueante:** arquivar o registro escrito das respostas do coordenador e anotar a referência em `questoes-institucionais.md` §1. É exigido antes da publicação do M1 (S06).

### S01 — **Concluída**

| Critério | Situação | Evidência |
|---|---|---|
| Setup em máquina limpa pelo README | Atendido | **Aprovação do responsável técnico** (22/10/2026); complemento técnico: clone limpo isolado executado pelo agente na sessão anterior (`/admin` 200, primeiro usuário, login/logout, `first-register` repetido → 403) |
| `/admin` cria o primeiro admin e faz login | Atendido | E2E local e no CI (sessões anteriores); clone limpo; homologação `/admin` 200 (verificado nesta sessão) |
| PR com schema sem migration falha no CI | Atendido | PR #2 (sessão de 20/10): `DRIFT DETECTADO`; verde com a migration |
| Dois PRs com bancos distintos; branch removido ao fechar | Atendido | `preview/pr-1` + `preview/pr-2` simultâneos; remoção de `pr-1`, `pr-2` e `pr-7` comprovada (a última nesta sessão) |
| `next build` sem migrations; migrate em job separado com `concurrency` | Atendido | Job "Build sem acesso ao banco" verde no CI da `main` (`39817265399`); jobs de migrate com `concurrency` |
| Homologação e previews com autenticação básica, `noindex`; `/api/graphql` 404 | Atendido | Homologação verificada nesta sessão; preview verificado no PR #7 (sessão anterior) |
| DoD: CI verde, migrations versionadas, controles 17.7, nada antecipado, PROGRESS/ADRs, homologação atualizada | Atendido | Workflows da `main` após o PR #7 verdes; ADRs aceitos |

### Origem dos resultados de testes citados

| Resultado | Quando/onde foi executado |
|---|---|
| CI completo (lint, formatação, tipos, unit, integração, E2E com axe, build sem banco, gitleaks, audit) | CI do GitHub no merge do PR #7, run `39817265399` — **verificado nesta sessão** |
| Verificação de migrations (banco limpo, drift, tipos, down/up) | Run `39817265487` — **verificado nesta sessão** |
| Deploy e fumaça de homologação | Runs `39817255542` e `39817265385` — **verificados nesta sessão**; `curl` independente nesta sessão |
| Suíte local (32 testes, 5 E2E, build) e clone limpo isolado | Sessões anteriores de 22/10/2026 — **não reexecutados nesta sessão** |
| Varredura de segredos (gitleaks no histórico completo e busca de 13 valores reais nos logs de 40 runs) | Sessão anterior de 22/10/2026 — **não reexecutada nesta sessão**; os runs posteriores passaram pelo gitleaks do CI |

## Pendências

### Validações institucionais em aberto (não bloqueiam o desenvolvimento; detalhe em `questoes-institucionais.md` §3 e §5)

| Item | Origem | Necessário até |
|---|---|---|
| Registro escrito das respostas do coordenador arquivado (referência em §1) | S00/Q1–Q12 | S06 |
| Controlador dos dados, canal do titular, termo de autorização individual, regra de orientações concluídas | Q4 | S04 (publicação dos perfis) |
| Lista nominal de integrantes e ex-integrantes com autorizações individuais, ORCID e Lattes | Q4/Q5 | S04/S06 |
| Textos de apresentação, objetivos e histórico do grupo e dos eixos temáticos | Q7 | S03 (publicação) |
| Política editorial e ensaios iniciais (≥ 3) | Q8 | S05/S06 |
| Fonte e escopo dos dados de orientações | Q10 | S07 |
| Nome curto para títulos de página [PREMISSA "Bioética e Promoção da Saúde"] | Q2 | S03 |
| Exigência de comunicação à UniCesumar (não abordada; risco residual R17) | Q1 | Decisão do coordenador antes da S06 |
| Domínio próprio | Q3 | S06 (opcional; pode usar endereço do provedor) |
| Identificação nominal do coordenador nos registros | — | S06 |

### Ações manuais do supervisor

1. **Aceitar (ou ajustar) o ADR-0010.** As decisões já estão em vigor por sua determinação, mas a redação está "Proposto".
2. **Revisar e mesclar o PR desta sessão** (branch `docs-v1-3-aprovacoes`; documentação v1.3).
3. **Pré-requisitos da S02:** criar contas e credenciais por ambiente e gravá-las nos GitHub Environments:
   - Cloudflare R2: buckets `ppgps-preview`, `ppgps-staging`, `ppgps-backups`;
   - Sentry;
   - provedor de e-mail;
   - chave `age` de backup em cofre.
4. **Proteção da `main`:** decidir entre GitHub Pro/Team, repositório público ou manter os controles compensatórios (ADR-0009; `convencoes-git.md` §5).
5. **Ambiente `production`:** criar com segredos próprios quando for o momento (até a S06). **Não** definir `PRODUCTION_DEPLOY_ENABLED` antes da S06.
6. **Guardar em cofre e apagar `.secrets/`** da máquina do agente.
7. **Dependabot:** decidir sobre os PRs #3–#6 (versões maiores de actions) e verificar a execução npm que falhou em 20/10.

### Condições para executar a S02

- [x] S00 e S01 **concluídas** (protocolo `AGENTS.md` §11.1)
- [x] Ficha `docs/sprints/S02.md` revisada para a v1.3 (dois papéis, azul-marinho/branco, sem aviso obrigatório)
- [x] Dependências do grupo da S02 resolvidas (Q1, Q2, Q5)
- [ ] Plano curto da S02 apresentado ao supervisor e confirmado (ou autorização de execução autônoma registrada) — `AGENTS.md` §11.2
- [ ] PR desta sessão (v1.3) mesclado, para que a S02 parta da `main` com a documentação atualizada
- [ ] Contas técnicas R2, Sentry e e-mail. Recomendado, **não bloqueante**: sem elas, os itens correspondentes ficam pendentes e o restante da S02 segue com MinIO e captura local

---

> **Nota:** a seção "Revisão de encerramento formal S00/S01 (22/10/2026)" abaixo registra o estado **antes** das aprovações desta sessão e está **superada** pelo encerramento acima. Fica mantida como histórico.

## [Histórico, superado] Revisão de encerramento formal S00/S01 (22/10/2026, antes das aprovações)

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
| 22/10/2026 (aprovação declarada) | Não informado | Não informado | **Aprovado** pelo responsável técnico | Declaração expressa do supervisor na sessão de 22/10/2026 ("realizado, validado e aprovado"). Detalhes de ambiente não informados |

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

## Backlog / ideias (não implementar sem ficha)

- Multigrupo, instituições normalizadas, laboratório do grupo (Q6), contas de integrantes (Q5) e `external-ids`: caminhos em planejamento 13.7 (somente com decisão do coordenador quando aplicável, ADR e ficha).

## Limitações conhecidas

- Respostas Q1–Q12 registradas a partir do relato do responsável técnico; a mensagem original do coordenador ainda não está arquivada, e as datas de envio e resposta não foram informadas.
- Laboratório do grupo: existe, mas está fora do escopo atual (Q6); nenhuma informação sobre ele foi coletada.
- Descrições das 4 linhas do DGP não transcritas. Pela Q7 não geram páginas; os textos dos dois eixos temáticos virão do coordenador.
- DGP atualizado no dia da coleta: recoletar antes da S04.
- Proteção da `main` e revisores de ambiente indisponíveis no plano GitHub Free com repositório privado (ADR-0009), com controles compensatórios.
- Seções técnicas preservadas do planejamento (11, 12, 22, 24, 27, 28, 29) não mudaram na v1.3, salvo referências pontuais.

## Próximos passos

1. Supervisor: aceitar o ADR-0010 e mesclar o PR da v1.3.
2. Supervisor: providenciar as contas técnicas da S02 (R2, Sentry, e-mail, chave de backup).
3. Agente: iniciar a **S02** pelo protocolo do `AGENTS.md` §11 (plano curto → confirmação → branch `s02-...`).
4. Em paralelo, o coordenador fornece os itens institucionais em aberto (textos para a S03; controlador, canal do titular e autorizações para a S04).
