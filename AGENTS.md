# AGENTS.md — Regras permanentes para agentes do Portal PPGPS

> Fonte única de regras para qualquer agente de IA (Claude Code, Codex, OpenCode ou similar) e para pessoas que contribuam com o repositório.
> Alterações neste arquivo são feitas **somente por PR revisado pelo supervisor**.
> Uma sessão nova **nunca** depende do histórico de conversa: tudo o que é necessário está nos arquivos do repositório.

---

## 1. Visão do projeto (5 linhas)

1. Portal acadêmico **exclusivo do "Grupo de Pesquisa em Bioética e Promoção da Saúde - Unicesumar"** (nome de exibição definido pelo coordenador; grupo registrado no DGP/CNPq), com foco temático em **Bioética** e **Promoção da Saúde**. É publicado como **iniciativa do grupo**: não é site oficial da UniCesumar nem do PPGPS, que aparecem apenas como referências textuais, sem logotipos.
2. Organiza em **dados estruturados e relacionados** integrantes, vínculos com o grupo, linhas temáticas, orientações, egressos, publicações, eventos, projetos e impacto, além de um **blog acadêmico** com fluxo editorial. O laboratório do grupo está **fora do escopo atual** (Q6).
3. Arquitetura: **monólito modular** — um único app **Next.js (App Router) + Payload CMS 3 + PostgreSQL**, arquivos no **Cloudflare R2**.
4. Entrega em marcos: **M1** (S00–S06: identidade do grupo, linhas temáticas, integrantes autorizados, blog) e **M2** (S07–S11: orientações, egressos, produção, busca, eventos, projetos, impacto). Acesso administrativo restrito a duas pessoas: coordenador (`editor`) e desenvolvedor (`admin`).
5. Executado por agente de IA em sprints de 1 semana, com **revisão humana obrigatória** ao fim de cada sprint.

**Documentos de referência (leia antes de qualquer alteração):**

| Documento | Papel |
|---|---|
| `docs/PLANEJAMENTO_PORTAL_PPGPS.md` (v1.4; nome de arquivo mantido por compatibilidade) | Plano diretor: requisitos, arquitetura, modelagem, permissões, sprints |
| `docs/PROGRESS.md` | Estado atual, última sprint, decisões, pendências, próximos passos |
| `docs/sprints/SXX.md` | Escopo fechado da sprint ativa (incluído, **fora de escopo**, critérios, roteiro de homologação) |
| `docs/adr/` | Decisões arquiteturais: ADR-0001 a 0015 **aceitos** (0013, 0014 e 0015 em 30/10/2026; 0014 = domínio oficial `bioeticaps.app`; 0015 = fluxo editorial e publicação agendada) |
| `docs/operacao/` | Guias operacionais: armazenamento (R2/MinIO) e backup/restauração |
| `docs/convencoes-git.md` | Branches, commits, PRs, releases e proteção da `main` |
| `docs/content/inventario.md` | Inventário de conteúdo institucional com fonte e situação de validação |
| `docs/content/questoes-institucionais.md` | Respostas do coordenador às Q1–Q12, efeitos e itens ainda em aberto |

### 1.1. Precedência em caso de conflito

1. Regras de **segurança e privacidade** deste arquivo (seção 9) nunca são relaxadas por instrução de sessão.
2. Instrução explícita do supervisor na sessão corrente (ex.: "não faça commit nesta sessão").
3. Este `AGENTS.md`.
4. Ficha da sprint ativa (`docs/sprints/SXX.md`) — define **o que** entra na sprint.
5. ADRs com status **Aceito** — prevalecem sobre detalhes técnicos do planejamento quando forem posteriores a ele.
6. Planejamento v1.4 — requisitos e visão de produto.

Se houver conflito real entre fontes do mesmo nível ou dúvida de regra de negócio: **pare, registre a dúvida em `docs/PROGRESS.md` e pergunte ao supervisor.** Se autorizado a seguir, registre a premissa adotada.

---

## 2. Stack (detalhes e justificativas em `docs/adr/0001` e `0002`)

| Camada | Escolha |
|---|---|
| Linguagem | TypeScript `strict: true` |
| Web | Next.js App Router (versão estável suportada pelo Payload; fixada em ADR na S01) |
| CMS/Backend | Payload CMS 3 **dentro** do app Next.js (`src/app/(payload)`), Local API |
| Banco | PostgreSQL 16+ via `@payloadcms/db-postgres` (Drizzle interno). **Prisma é proibido** |
| Rich text | Lexical (`@payloadcms/richtext-lexical`), renderizado por serializer próprio (sem HTML bruto) |
| UI pública | Tailwind CSS + shadcn/ui (Radix) + lucide-react |
| Validação de domínio | Zod (DOI, ORCID, Lattes, ISSN, ISBN) |
| Busca (M2) | Postgres FTS (`portuguese` + `unaccent`) + `pg_trgm` via `@payloadcms/plugin-search` |
| Arquivos | `@payloadcms/storage-s3` → Cloudflare R2 (MinIO no local) |
| Testes | Vitest (unidade/integração), Playwright + `@axe-core/playwright` (E2E/a11y), Lighthouse CI |
| Qualidade | ESLint, Prettier, `tsc --noEmit`, Husky + lint-staged, Commitlint |
| Observabilidade | Sentry (sem dados pessoais), monitor de uptime |
| Pacotes / Node | pnpm; Node LTS fixado em `.nvmrc` e `engines` |

**Rejeitados (não reabrir sem ADR):** backend separado, microsserviços, Prisma, GraphQL público, WordPress, Elasticsearch/Algolia no MVP, APIs proprietárias da Vercel no código de domínio.

Atualização de versão **maior** de Next/Payload/React só em sprint dedicada.

---

## 3. Comandos

> Scripts criados na **S01**. A lista oficial é a do `package.json` e do `README.md`; mantenha esta tabela sincronizada.

| Objetivo | Comando |
|---|---|
| Instalar dependências | `pnpm install` |
| Subir Postgres + MinIO + Mailpit locais (gera/completa o `.env` local e cria os buckets) | `pnpm db:up` (`pnpm db:down` para parar) |
| Criar buckets locais do MinIO (somente endpoints locais) | `pnpm storage:init` |
| Aplicar migrations | `pnpm migrate` |
| Criar migration | `pnpm migrate:create <nome-descritivo>` |
| Situação das migrations | `pnpm migrate:status` |
| Reverter o último lote | `pnpm migrate:down` |
| Verificar *drift* (schema sem migration) | `pnpm migrate:check` |
| Gerar tipos / import map do Payload | `pnpm generate:types` / `pnpm generate:importmap` |
| Popular dados fictícios | `pnpm seed` |
| Conteúdo institucional público verificado (idempotente; bloqueado em produção) | `pnpm seed:content` |
| Integrantes fictícios (idempotente; bloqueado em homologação e produção) | `pnpm seed:people` |
| Ensaios fictícios do blog (idempotente; bloqueado em homologação e produção) | `pnpm seed:essays` |
| Importar integrantes de CSV (pré-visualização; `--apply` grava; idempotente por ORCID/Lattes) | `pnpm import:people <arquivo.csv> [--apply]` |
| Conta `admin` inicial (somente com banco sem contas; senha aleatória descartada — definir por recuperação de senha) | `BOOTSTRAP_ADMIN_EMAIL=<e-mail> pnpm users:bootstrap-admin` |
| Lighthouse CI (app em `localhost:3100`) | `pnpm dlx @lhci/cli@0.15.1 autorun` |
| Desenvolvimento | `pnpm dev` |
| Lint / formatação | `pnpm lint` / `pnpm format:check` |
| Tipos | `pnpm typecheck` |
| Testes unitários e de integração | `pnpm test` (`test:unit`, `test:int`, `test:coverage`) |
| E2E (inclui axe) | `pnpm test:e2e` |
| Build de produção | `pnpm build` |

**Verificação local obrigatória antes de abrir PR:**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build
```

---

## 4. Regras de arquitetura

1. **Monólito modular de um único grupo.** Código organizado por domínio (`people`, `supervisions`, `publications`, `editorial`, `events`, `projects`, `governance`, `search`, `indicators`). Estrutura de referência: planejamento, seção 28.1. **Crie apenas as pastas de que a sprint precisa.**
2. **Uma coleção por pasta**: `src/collections/<Nome>/index.ts`, `hooks.ts`, `access.ts`, `fields.ts`.
3. **Acesso sempre em `src/access/`**, em funções puras e testadas (`isAdmin`, `isEditor`, `isOwnerPerson`, `isParticipant`…). Nenhuma lógica de acesso em componentes.
4. Funções de `read` retornam **filtros (`where`)**, não apenas booleanos, para que listagens respeitem o escopo.
5. **Leitura pública via Local API em Server Components** com `overrideAccess: false` e usuário anônimo.
6. **Visibilidade pública em uma única função** (`canViewPublic(doc)`), reutilizada por acesso, consultas, sitemap, RSS e índice de busca.
7. **Rich text**: nunca `dangerouslySetInnerHTML`; renderizar o JSON do Lexical com serializer próprio.
8. **Renderização**: páginas públicas SSG/ISR; hooks `afterChange`/`afterDelete` revalidam por tag/rota todas as páginas afetadas.
9. **Sem lógica de negócio no cliente**: componentes cliente só para interatividade (filtros, menu, busca).
10. **Jobs** (importação, enriquecimento, agendamento) pela fila do Payload ou cron; nunca processos longos dentro de requisições.
11. **Integrações externas** em `src/integrations/<fonte>/` (cliente + mapeador + testes com respostas gravadas); dado externo é **não confiável** (timeout, validação, sanitização). Nenhuma integração publica conteúdo sem revisão humana.
12. **GraphQL desabilitado**; REST pública somente leitura, paginada e com profundidade limitada.
13. **Portabilidade**: o app roda com `next start`/Docker, Postgres padrão e bucket S3 compatível.

### 4.1. Princípios de modelagem (planejamento, seção 13)

- **Grupo único como configuração**: o grupo é o global `GroupProfile`; não existem coleções `programs` nem `research-groups`, nem chave de grupo nas entidades. Programas e instituições externas são **campos de referência** (texto + URL). Ver ADR-0006; expansão futura no planejamento 13.7 (não antecipar).
- **Pessoa ≠ Usuário**: `Person` é o indivíduo acadêmico; `User` é conta de acesso (0..1 Person). Ver ADR-0004.
- **Papéis são vínculos datados com o grupo** (`Membership` com papel, nível de treinamento, linhas, início/fim). Não existe campo fixo "tipo de pessoa".
- **Egresso é derivado de `AcademicCompletion`** (uma por titulação/pós-doc, orientada por pesquisador do grupo ou de estudante integrante, com programa de referência). "Ex-integrante" é outro conceito (vínculo com o grupo encerrado).
- Relações N:N com atributos são entidades próprias (Autoria, Participações).
- Identificadores externos como campos normalizados, validados e únicos (DOI, ORCID, Lattes, ISSN, ISBN); sem coleção `ExternalId` no MVP.
- Entidades sensíveis têm `visibility` e procedência (`source`, `sourceUrl`, `collectedAt`).
- Exclusão lógica (`archivedAt`) em entidades acadêmicas; exclusão física só por solicitação de titular (LGPD), com anonimização.
- Campos textuais públicos localizáveis (pt-BR padrão; `en` na V2).
- Operações compostas (concluir orientação + criar conclusão + encerrar vínculo; mesclar duplicatas) em **transação única**.
- **Não antecipar coleções**: cada entidade nasce na sprint indicada na seção 13.6 do planejamento.

### 4.2. Papéis do sistema (planejamento, seção 14)

`admin` (desenvolvedor responsável: acesso total, usuários, papéis, configurações técnicas) e `editor` (coordenador do grupo: todo o conteúdo acadêmico e editorial, consentimentos e importações; lê a auditoria; não gerencia usuários). Visitante anônimo só lê o que é público; **não há login de visitantes nem contas de integrantes** (Q5). **Não existem** `researcher`, `group_manager` nem `managedGroups` (ADR-0010, ADR-0006). A matriz de permissões da seção 14.3 é normativa; toda mudança de papel gera auditoria `role_change`.

---

## 5. Convenções de código

| Tema | Padrão |
|---|---|
| Tipagem | `strict: true`; `any` proibido sem comentário justificando; `payload-types.ts` gerado e versionado |
| Nomes | Código e identificadores em **inglês**; textos de interface e documentação em **português** |
| Coleções | Slug em inglês kebab-case (`research-lines`); rótulos do admin em português |
| Rotas públicas | Em português (`/o-grupo`, `/linhas` — linhas temáticas Bioética e Promoção da Saúde —, `/integrantes`, `/producao`, `/blog`); não há rota de laboratório |
| Slugs de conteúdo | Português sem acentos; alteração gera redirect 301 |
| Organização | Por módulo; UI genérica em `src/components/ui`; componentes do portal em `src/components/site` |
| Erros | Erros de domínio tipados; nunca expor stack ao público; logs estruturados |
| Datas | Armazenadas em UTC; anos acadêmicos como inteiros |
| Dependências novas | Justificadas no PR; ADR se estruturais |

---

## 6. Regras de migrations (planejamento, seção 24.3; ADR-0005)

1. Fonte de verdade: configuração do Payload + migrations versionadas em `src/migrations`.
2. Alterou schema → `pnpm migrate:create <nome-descritivo>` **no mesmo commit**, junto com os tipos regenerados.
3. `push` (sincronização automática) **somente** no banco local descartável. Nunca em bancos Neon.
4. **Nunca editar** migration já aplicada em `staging` ou produção; correção vira nova migration.
5. Mudanças destrutivas (remover/renomear campo ou coleção, alterar tipo) **somente em *expand/contract***, em duas releases. A versão anterior do app deve funcionar com o schema novo.
6. Migrations de dados: idempotentes, em lotes, com contagem registrada; longas ficam separadas da migration de schema.
7. **Nunca executar migrations dentro de `next build`.** Elas rodam em job dedicado com `concurrency` por ambiente, antes do deploy, seguido de `migrate:status`.
8. CI bloqueia o PR se: migrations não aplicam em banco limpo; há *drift* (migration gerada após aplicar não é vazia); `down`/`up` da última migration falha (quando houver `down`).
9. Conflito de migrations entre branches: o PR mais recente faz rebase e regenera a sua.
10. Release de produção com migration exige ponto de restauração prévio e, se bloquear tabelas ou alterar dados, modo de manutenção.

---

## 7. Regras de ambientes (planejamento, seção 24.2; ADR-0005)

| Ambiente | Banco | Arquivos | Dados | Acesso |
|---|---|---|---|---|
| Local | Postgres em Docker | MinIO | Fixtures **fictícias** | Desenvolvedor/agente |
| Preview (por PR) | Branch Neon efêmero `preview/pr-N` criado de `seed` | `ppgps-preview/pr-N/` (expira em 7 dias) | Fictícios + institucionais públicos verificados | Autenticação básica + `noindex` |
| Homologação (`staging`) | Branch Neon `staging` | `ppgps-staging` | Conteúdo real em revisão, sem consentimentos/comprovantes/auditoria da produção | Autenticação básica + `noindex` |
| Produção | Branch Neon `main` | `ppgps-prod` (objetos imutáveis) | Dados reais | Público (admin autenticado) em `https://bioeticaps.app` (ativação na S06) |

**Proibições absolutas para agentes:**

- Nunca acessar banco, bucket, segredos ou painéis de **produção**.
- Nunca copiar dados de produção para outro ambiente (cópias sanitizadas só por script versionado e com aprovação do supervisor).
- Nunca enviar e-mail real fora da produção (e-mails capturados em local/preview/homologação).
- Nunca remover `noindex`/autenticação básica de ambientes não produtivos.
- **Domínio oficial `bioeticaps.app` (ADR-0014):** nunca usá-lo como URL base, alias ou destino de redirecionamento de local, preview ou homologação; nunca associá-lo a deploys não produtivos. Homologação permanece em `https://ppgps-portal-staging.vercel.app`. A ativação pública é exclusiva da S06.
- Deploy de produção só por release (`vX.Y.Z`) aprovada manualmente pelo supervisor.

---

## 8. Regras de testes (planejamento, seções 22 e 23)

1. Toda **regra de acesso, validação e hook** tem teste (unitário ou de integração).
2. Toda **página pública nova** tem E2E com **axe** (zero violações sérias/críticas).
3. Toda **coleção nova com dados não públicos** tem **teste de vazamento** (respostas públicas, sitemap, RSS e busca não expõem campos administrativos, rascunhos ou dados sem consentimento). Padrão introduzido na S03.
4. Cobertura ≥ 70% de linhas em `src/access`, `src/hooks`, `src/lib`.
5. Integrações externas testadas com **respostas gravadas**; nunca chamar APIs reais em testes automatizados.
6. Fixtures e seeds de teste **exclusivamente fictícios**; seed de homologação só com dados públicos verificados, marcados com `source` e data.
7. **CI verde é pré-requisito** de merge (lint, typecheck, unit, integração, E2E, build, gitleaks, `pnpm audit`, verificação de migrations).
8. Lighthouse mobile ≥ 90 nas rotas-chave quando a ficha exigir (desde a S03).

---

## 9. Segurança e privacidade (planejamento, seção 17)

1. **Nunca commitar segredos.** `.env` fora do git; `.env.example` sem valores; `PAYLOAD_SECRET` distinto por ambiente; gitleaks no CI.
2. **Nunca usar dados reais de discentes** (ou de qualquer pessoa sem consentimento) em fixtures, seeds de teste, prints ou exemplos.
3. **Respeitar consentimentos**: **nenhuma pessoa** (inclusive docentes e líderes) aparece com perfil público sem `ConsentRecord` vigente do escopo correspondente; revogação revalida o cache imediatamente. Autorias em publicações públicas exibem apenas o nome publicado. A autorização do grupo informada pelo coordenador (Q4) não dispensa esse registro individual.
4. **Minimização**: nunca coletar CPF, matrícula, data de nascimento, telefone pessoal ou endereço. E-mail público só por opção do titular.
5. O portal **não** armazena dados clínicos nem de participantes de pesquisa.
6. Upload: MIME real por *magic bytes*, limites de tamanho (imagem 10 MB, PDF 25 MB), nomes aleatórios, **SVG bloqueado**, `alt`/crédito/licença obrigatórios; pessoas identificáveis exigem consentimento.
7. Cabeçalhos: HSTS, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors`; CSP *report-only* (S02) → *enforce* (S06).
8. Bloqueio após 5 tentativas por 15 min; limite de taxa em login, recuperação de senha e busca.
9. Auditoria imutável (`AuditLog`) de criação, edição, publicação, exclusão, login e mudança de papel.
10. Controles de segurança são **progressivos**: implemente os previstos para a sprint corrente na seção 17.7 do planejamento e não regrida os anteriores.
11. Acessibilidade WCAG 2.2 AA em toda página pública e componente próprio.

### 9.1. Dados institucionais, marcas e autorizações


- **Não invente informações institucionais.** Todo dado transcrito registra fonte (URL) e data de coleta.
- Dados divergentes ou não confirmados são marcados como **provisórios** e listados em `docs/content/inventario.md` / `questoes-institucionais.md`.
- O portal **referencia** documentos normativos (editais, regimento, matriz, RDU) por link; não os duplica.
- Nada de *scraping* de Lattes, DGP ou Sucupira; transcrição manual ou importação de arquivos exportados pelo titular.
- Números de impacto só são exibidos com fonte comprobatória (Q11). Conceito CAPES, editais e números do programa **não** são conteúdo do portal (apenas link para o site oficial).
- **Identidade e referências (Q1, Q2):** portal publicado como iniciativa do grupo, com o nome "Grupo de Pesquisa em Bioética e Promoção da Saúde - Unicesumar" e identidade azul-marinho e branco. **Não há** aviso ostensivo de portal não oficial; `/sobre-o-portal` identifica discretamente o grupo como mantenedor. UniCesumar, PPGPS e CNPq aparecem somente como referência textual com link; **nenhum logotipo ou identidade visual institucional** sem autorização formal registrada (não concedida).
- **Autorização do grupo ≠ autorização do titular:** as manifestações do coordenador sobre dados pessoais (Q4) e imagens/materiais (Q12) estão registradas, mas **não** substituem o `ConsentRecord` individual por escopo nem a autorização de imagem de pessoas identificáveis.
- **Laboratório (Q6):** não incluir página, atividades, nome ou vínculos do laboratório do grupo, e não atribuir ao grupo laboratórios de terceiros (ex.: LIIPS), até nova manifestação do coordenador.
- **Linhas (Q7):** foco em dois eixos temáticos; as quatro linhas do DGP são referência histórica (sem páginas e sem tratá-las como extintas).
- Não cadastrar docentes, grupos, linhas, discentes ou produção do PPGPS que não pertençam ao grupo.
- Agentes **não** enviam mensagens à universidade, aos integrantes do grupo nem a terceiros; contatos são feitos pelo supervisor.

---

## 10. Regras de escopo (planejamento, seção 29.3)

- Implemente **somente** os itens da ficha da sprint ativa.
- **Proibido** criar coleções, rotas, campos, pastas ou dependências de sprints futuras "para adiantar". Exceção: ponto de extensão previsto explicitamente na ficha.
- Refatorações fora do escopo só se necessárias para a sprint e descritas no PR; caso contrário, registre como pendência em `docs/PROGRESS.md`.
- Arquivos de outros módulos só são alterados quando a ficha prevê a integração.
- Ideias novas vão para "Pendências / backlog" em `docs/PROGRESS.md`, não para o código.
- Dependências institucionais **nunca bloqueiam o desenvolvimento** (use dado público verificado ou fictício, marcado como provisório); bloqueiam apenas a **publicação** do marco.

---

## 11. Protocolo de execução de sprint (planejamento, seção 29.4)

1. **Preparação**: ler `AGENTS.md`, `docs/PROGRESS.md`, `docs/sprints/SXX.md` e as seções do planejamento citadas na ficha. Confirmar em `PROGRESS.md` que as sprints de dependência estão concluídas; se não estiverem, **parar e avisar**.
2. **Plano**: apresentar ao supervisor um plano curto (tarefas e dúvidas) e **aguardar confirmação** — salvo autorização explícita do supervisor para execução autônoma, registrada em `PROGRESS.md`.
3. **Branch**: criar `sXX-nome-curto` a partir da `main` atualizada (`docs/convencoes-git.md`).
4. **Execução incremental**: commits pequenos em Conventional Commits com escopo `sXX`, cada um com testes passando — salvo instrução de sessão em contrário.
5. **Verificação**: rodar lint, typecheck, testes, E2E e build; conferir cada critério de aceite com evidência.
6. **Documentação**: atualizar `docs/PROGRESS.md`, ADRs e README quando necessário.
7. **Entrega**: abrir PR com resumo, checklist de critérios, evidências, pendências e riscos.
8. **Revisão**: o supervisor revisa e homologa no preview; ajustes no mesmo PR.
9. **Encerramento**: após o merge, registrar em `PROGRESS.md` "SXX concluída" e a próxima sprint.

### 11.1. Política permanente de Pull Requests (determinação do supervisor, 22/10/2026)

Com a execução de uma sprint autorizada, o agente gerencia o fluxo de Git sem pedir aprovação individual por PR: cria branches e PRs, faz commits e push, corrige falhas de CI e realiza **squash merge** quando, e somente quando:

1. todos os checks obrigatórios estão verdes (CI, verificação de migrations, preview);
2. não há conflitos com a `main`;
3. o diff foi revisado, sem segredos, sem dados pessoais reais e sem funcionalidade fora da ficha;
4. as migrations são aditivas (ou *expand/contract* autorizado) e passaram em banco limpo, *drift* e `down`/`up`.

Nunca contornar restrições de aprovação do GitHub, nunca `push --force` na `main`, nunca habilitar `PRODUCTION_DEPLOY_ENABLED` nem fazer deploy de produção. Após o merge, validar os workflows da `main` e a homologação e registrar em `PROGRESS.md`.

**Status de sprint usados em `PROGRESS.md`:** `Não iniciada` → `Em execução` → `Executada — aguardando revisão humana` → `Concluída` (após aprovação/merge) | `Bloqueada`.

**Fim de toda sessão:** `PROGRESS.md` atualizado com feito, em andamento, próximos passos, decisões e pendências.

---

## 12. Definition of Done global (planejamento, seção 20.2)

- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e` e `pnpm build` passando no CI
- [ ] Migrations geradas e versionadas; CI comprova banco limpo, ausência de *drift* e compatibilidade *expand/contract*
- [ ] Controles da seção 17.7 previstos para a sprint implementados e testados; nenhuma regressão
- [ ] Testes de vazamento cobrindo toda coleção nova com dados não públicos
- [ ] Nenhuma funcionalidade de sprint futura implementada
- [ ] `docs/PROGRESS.md` atualizado; ADRs registrados para decisões novas
- [ ] Preview do PR revisado e, após o merge, homologação atualizada e verificada pelo supervisor
- [ ] Sem violações axe sérias/críticas nas páginas públicas novas
- [ ] PR com descrição, critérios marcados e evidências

> Sprints puramente documentais (S00) aplicam apenas os itens pertinentes: documentação revisada pelo supervisor, `PROGRESS.md` atualizado e nenhuma implementação antecipada.

---

## 13. Documentação e ADRs

- ADRs em `docs/adr/NNNN-titulo-kebab.md` com: status, data, contexto, decisão, alternativas, consequências e referências. Use `docs/adr/0000-modelo.md`.
- Status de ADR: `Proposto` (agente) → `Aceito` (supervisor) | `Rejeitado` | `Substituído por ADR-NNNN`.
- ADRs já previstos: versões fixadas (S01), mecanismo de *drift* (S01), biblioteca de citação (S08), parsers BibTeX/RIS (S09), hospedagem de produção (S06).
- O planejamento só é alterado por PR, com nova versão e resumo no topo do arquivo. Agentes não alteram o planejamento sem pedido expresso.
- Não crie documentação além do necessário (risco "documentação excessiva" da S00).

---

## 14. Glossário rápido

| Termo | Significado |
|---|---|
| M1 / M2 | Marcos de publicação: primeira publicação (S00–S06) / MVP completo (S07–S11) |
| V2 / V3 | Evoluções pós-MVP (S12–S17 / S18–S20) |
| Supervisor | Desenvolvedor responsável que aprova planos, revisa código e homologa |
| Grupo | "Grupo de Pesquisa em Bioética e Promoção da Saúde - Unicesumar" (nome de exibição, Q2; título no DGP: "Bioética e Promoção da Saúde"), único escopo do portal |
| Coordenador do grupo | Responsável pelo grupo e pelo conteúdo; único usuário `editor`; revisa e publica com o desenvolvedor (Q8, Q9) |
| Expand/contract | Mudança de schema em duas releases para manter compatibilidade com a versão anterior |
| Teste de vazamento | Teste que garante que dados não públicos não aparecem em respostas públicas |
| Q1–Q12 | Validações respondidas pelo coordenador (relatadas em 22/10/2026), com itens em aberto (`docs/content/questoes-institucionais.md`) |
