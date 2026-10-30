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
| Situação da S02 | **Concluída** (22/10/2026). Exceções formais: validação externa do **Sentry** e do **SMTP de homologação** adiadas para a S06 por decisão do responsável técnico (não são testes aprovados) |
| Situação da S03 | **Concluída** (30/10/2026; PR #14). Revisão visual/funcional, navegação desktop/mobile, conteúdo provisório e os 9 critérios aprovados pelo responsável técnico; textos definitivos do coordenador (Q7) seguem pendentes para a S06 |
| Situação da S04 | **Executada — aguardando revisão humana** (30/10/2026; PR #23). Critérios de aceite com evidência automatizada; faltam o roteiro de homologação pelo supervisor (DoD) e as autorizações individuais reais (bloqueiam só a publicação dos perfis) |
| Próxima sprint | **S05 — Blog acadêmico e fluxo editorial** — **não iniciada** (aguarda revisão da S04) |
| Domínio oficial | **`https://bioeticaps.app`** (ADR-0014) — associado ao projeto `ppgps-portal` na Vercel, DNS e HTTPS ativos, **nenhum deploy servido** (404 `DEPLOYMENT_NOT_FOUND`); ativação pública na S06 |
| Última atualização | 30/10/2026 |
| Planejamento vigente | `docs/PLANEJAMENTO_PORTAL_PPGPS.md` **v1.4** (30/10/2026) |
| ADRs | 0001–0013 **Aceitos** (0013 em 30/10/2026); **0014 Proposto** (domínio oficial; a escolha do domínio é decisão do responsável técnico). A S04 não exigiu ADR novo (decisões abaixo) |

## Situação das sprints

| Sprint | Nome | Marco | Situação |
|---|---|---|---|
| S00 | Descoberta, regras do projeto e inventário | M1 | **Concluída** (22/10/2026) |
| S01 | Setup técnico, ambientes e pipeline | M1 | **Concluída** (22/10/2026) |
| S02 | Autenticação, papéis, auditoria, storage, backup e base visual | M1 | **Concluída** (22/10/2026; Sentry e SMTP de homologação adiados para a S06) |
| S03 | Portal do grupo: identidade, linhas temáticas e homepage v1 | M1 | **Concluída** (30/10/2026; PR #14) |
| S04 | Integrantes, vínculos e consentimentos | M1 | **Executada — aguardando revisão humana** (30/10/2026; PR #23) |
| S05 | Blog acadêmico e fluxo editorial | M1 | Não iniciada |
| S06 | Reauditoria, conteúdo inicial e lançamento do M1 | M1 | Não iniciada |
| S07 | Orientações, conclusões acadêmicas e egressos | M2 | Não iniciada |
| S08 | Catálogo de publicações do grupo | M2 | Não iniciada |
| S09 | Importação em lote, deduplicação e busca global | M2 | Não iniciada |
| S10 | Eventos, projetos e impacto social | M2 | Não iniciada |
| S11 | Consolidação, carga de dados acadêmicos e lançamento do M2 | M2 | Não iniciada |

## Sessão de 30/10/2026 — execução da S04

**Modo:** autônomo, autorizado expressamente pelo responsável técnico (execução integral da S04, política de PRs `AGENTS.md` §11.1). Branch `s04-integrantes-consentimentos`, PR #23. S05 não iniciada. Nenhum deploy de produção; `PRODUCTION_DEPLOY_ENABLED` não definida; branch `production` do Neon não acessada. Nenhum dado pessoal real.

### Feito

- **Modelagem** (migration `20261030_120504_s04_people_memberships_consents`, aditiva/expand; `down` idempotente):
  - `people`: todos os campos da ficha (nome, citação, variantes, foto, mini-biografia, apresentação, formação, áreas, afiliações em texto, e-mail público opcional, Lattes, ORCID, outros perfis, `visibility`, `archivedAt`) + campos **calculados e somente leitura** `consentStatus`, `consentPublicProfile`, `consentPhoto`, `consentEmail`; ORCID/Lattes normalizados e **únicos**; slugs `orientacoes`/`egressos` reservados; exclusão bloqueada com vínculos/autorizações (arquivamento).
  - `memberships`: papel do DGP, nível (só e sempre estudantes), linhas temáticas, início/término, `status` calculado, motivo do término, procedência; sem sobreposição do mesmo (pessoa, papel, nível); datas coerentes e não futuras.
  - `consent-records`: escopos `public_profile`/`photo`/`email`, data, meio, comprovante (documento **não público**), quem colheu, revogação **definitiva**, observações; titular imutável.
  - `GroupProfile.leaders` → `people` (líder precisa de vínculo ativo de "Líder" e não arquivado); `leadersText` mantido como **transição** (expand/contract; remoção em release futura). `users.person` (opcional, único, só `admin` altera). `media.consentRecord` + `media.publicConsent` (calculado).
- **Visibilidade (regra única)**: `canViewPublic(person)`/`publicWhere('people'|'memberships')` em `src/lib/content/visibility.ts`, usados no acesso, nas consultas das páginas (sempre como visitante anônimo, inclusive na pré-visualização), no sitemap e no JSON-LD. Foto só com `photo` e mídia vinculada a autorização vigente **da própria pessoa**; e-mail só com `email`; ambos dependem de `public_profile`. Campos administrativos com acesso por campo (nem leitura nem filtro/ordenação por visitante).
- **Revogação**: hooks de `consent-records` recalculam pessoa e mídias na mesma transação; a atualização da pessoa revalida diretório, perfil, linhas, `/o-grupo`, home e sitemap; 301 para perfis só enquanto públicos (revogação remove).
- **Site**: `/integrantes` (filtros papel/linha/situação em formulário GET — URL compartilhável, funciona sem JS; ex-integrantes só no filtro próprio; estados vazios), `/integrantes/[slug]` (cabeçalho, linha do tempo, formação, áreas, afiliações, Lattes/ORCID/perfis, e-mail autorizado, JSON-LD `Person` com `sameAs`, sem e-mail), integrantes atuais autorizados em cada linha temática, líderes autorizados em `/o-grupo` (texto de transição se nenhum), seção "Integrantes em destaque" na home, item "Integrantes" no menu padrão e no rodapé. Componentes `PersonCard`, `PersonAvatar`, `MembershipTimeline`, `FilterBar`.
- **Importação CSV** (`pnpm import:people <csv> [--apply]`): parser RFC 4180 (`;`/`,`), validação linha a linha, pré-visualização, gravação idempotente por ORCID → Lattes → slug (sinalizado), vínculo idempotente por (pessoa, papel, nível, início), transação por pessoa (erro não deixa registro parcial), relatório; **nunca** cria consentimentos/e-mails/fotos; planilhas `*.csv`/`*.xlsx` ignoradas pelo git.
- **Seed fictício** `pnpm seed:people` (bloqueado em staging e produção): 6 pessoas cobrindo líder com e-mail autorizado, mestrado encerrado + pesquisadora ativa, ex-integrante, sem autorização, revogada e colaboradora externa. `seed:content` passa a atualizar menu e home **somente** se ainda idênticos ao padrão da S03.
- **Pipelines**: CI (E2E e Lighthouse) e preview executam `seed:people`; Lighthouse inclui `/integrantes` e um perfil; fumaça verifica `/integrantes` 200, `/api/consent-records` 403 e ausência de campos de consentimento em `/api/people`.
- **Docs**: `docs/privacidade/registro-tratamento.md` (operações T1–T8, bases legais propostas, retenção, modelo da planilha, pendências), README, `AGENTS.md` §3, ficha S04.

### Testes executados (30/10/2026, locais)

| Verificação | Resultado |
|---|---|
| lint / format / typecheck | Passou |
| Unitários | 220 (S04: ORCID/Lattes/e-mail, papel atual, ex-integrante, linha do tempo, sobreposição, consentimentos, `canViewPublic`, diretório e filtros, CSV, sitemap, JSON-LD, revalidação, sincronização); cobertura de linhas 89,8% (`src/lib/people` 98,7%) |
| Integração | 98 (S04: 26 — acesso por papel, campos calculados imutáveis, exclusão bloqueada, conta↔pessoa só por admin, ORCID inválido, unicidade, Lattes, slugs reservados, regras de vínculo, sobreposição, linha do tempo, visibilidade, e-mail/foto por escopo, revogação + tags revalidadas, filtros proibidos ao visitante, arquivamento, 301 de perfis, líderes, **vazamento** (API, populações, global, mídia, sitemap, diretório), **importação idempotente**, auditoria) |
| E2E (Playwright + axe) | 67/67 (S04: 21 — diretório, filtros na URL, ex-integrantes, 360 px, perfil e linha do tempo, e-mail e JSON-LD, sem consentimento/revogado fora de página/API/sitemap, slugs reservados, linhas e `/o-grupo`, menu, **consentimento concedido e revogado sem deploy**, **foto concedida e revogada** (imagem e arquivo), painel do editor; 4 rotas novas no axe desktop e celular) |
| Build sem banco | Passou |
| Migrations | `migrate`, `migrate:check` (sem drift), `migrate:down` + `migrate` |
| `pnpm audit --audit-level high` | Passou |
| Importação real em banco local (fixture fictícia) | 1ª: 3 pessoas, 4 vínculos, 1 erro; 2ª: 0 novos (idempotente) |

### Critérios de aceite da S04

| Critério | Situação | Evidência |
|---|---|---|
| ORCID com dígito inválido rejeitado | Atendido | Unitário + integração ("ORCID com dígito verificador inválido é rejeitado") |
| Sem `public_profile` (inclusive líder) fora de página, diretório, linha, API e sitemap | Atendido | Integração (líder sem consentimento; vazamento) + E2E (sem consentimento e revogado) |
| Foto e e-mail só com `photo` e `email` | Atendido | Integração + E2E (e-mail da líder; foto concedida/revogada) |
| Revogar remove o perfil após a revalidação | Atendido | Integração (tags revalidadas) + E2E (404 imediato, diretório e sitemap) |
| Mestrado encerrado + pesquisadora ativa: linha do tempo correta | Atendido | Integração + E2E (perfil fictício) |
| Ex-integrante só no filtro "ex-integrantes" | Atendido | Unitário + E2E |
| Somente editor/admin gerenciam; visitante sem consentimentos/campos administrativos | Atendido | Integração (acesso + vazamento) + fumaça de deploy |
| Importação reexecutada sem duplicatas | Atendido | Integração + execução local |
| DoD: supervisor verifica com `editor` de teste cadastro e visibilidade | **Pendente — supervisor** | Roteiro da ficha, passos 1–8 (preview com dados fictícios) |

### Decisões e premissas (sem ADR novo; dentro das ADRs 0004, 0006, 0010 e 0013)

1. Vigência do consentimento = registro sem `revokedAt`; datas de concessão/revogação nunca futuras e revogação definitiva → a visibilidade não depende de relógio nem de job agendado.
2. Campos calculados em `people`/`media` (sincronizados por hooks na mesma transação) para que o filtro público seja uma consulta simples e indexada.
3. Leitura pública de pessoas sempre como visitante anônimo, inclusive na pré-visualização (pessoas não têm rascunho).
4. Vínculo ativo = sem data de término (término não pode ser futuro).
5. `leadersText` permanece como transição; remoção (contract) em release posterior à primeira publicação com líderes autorizados.
6. Fotos exigem o vínculo `media.consentRecord` com autorização de foto **da mesma pessoa**; a mídia só é servida ao público com `publicConsent`.
7. 301 de perfis só para endereços que foram públicos (evita revelar slugs de pessoas não autorizadas).
8. Importação nunca cria consentimentos; identidade por ORCID → Lattes → slug (último caso sinalizado para conferência).

### Merge e homologação (após o PR #23)

| Verificação | Resultado |
|---|---|
| CI do PR #23 | 1ª execução: integração falhou (teste de líderes dependia do perfil do grupo já publicado no banco; o banco do CI é limpo) → corrigido no próprio PR (`test(s04)`) e reproduzido em banco de teste limpo. Execução final: **todos verdes** (lint/tipos, unit, integração, E2E + axe, build sem banco, Lighthouse, gitleaks, audit, banco limpo/drift/down-up, preview) |
| Lighthouse (runner) | `/integrantes`: desempenho 0,80, acessibilidade **1,00**, boas práticas 1,00, SEO **1,00**; `/integrantes/marina-ficticia-duarte`: 0,91 / **1,00** / 1,00 / **1,00**; JS 271 KB (orçamento 300 KB) |
| Preview | Branch `preview/pr-23` com migrations, `seed:content` e `seed:people` (6 pessoas fictícias); deploy e fumaça (incluindo `/integrantes` 200, `/api/consent-records` 403, sem campos de consentimento em `/api/people`) OK |
| Merge | PR #23 por *squash* (`93eb029`) |
| Workflows da `main` | CI `41058574032`, Verificação de migrations `41058574060`, Deploy de homologação `41058574019`: **sucesso** |
| Homologação | Migration aplicada em `staging` e `seed`; `seed:content` atualizou o menu (Integrantes) e a home padrão; **nenhuma pessoa carregada** (`seed:people` bloqueado em staging) |
| Verificação independente (`curl`, 30/10/2026) | 401 sem autenticação; com credenciais: `/`, `/integrantes`, `/integrantes?situacao=ex-integrantes`, `/o-grupo`, `/linhas/bioetica`, `/sitemap.xml`, `/robots.txt` → 200; perfil fictício e `/integrantes/egressos` → 404; `/api/consent-records` 403; `/api/graphql` 404; `/api/people` totalDocs 0; diretório exibe "Perfis em preparação"; menu com Integrantes; sitemap sem perfis e **sem `bioeticaps.app`**; canônica `https://ppgps-portal-staging.vercel.app/o-grupo`; `robots.txt` `Disallow: /`; `X-Robots-Tag: noindex, nofollow, noarchive` |
| `bioeticaps.app` | Continua **404 `DEPLOYMENT_NOT_FOUND`** (verificado de fora após o merge) |
| Neon | `production` sem operações dos pipelines/agente (única operação recente: `check_availability` do sistema Neon, 30/10 09:46 UTC); `staging` e `seed` migrados; `preview/pr-22` e `preview/pr-23` removidos ao fechar os PRs |
| Produção | Nenhum deploy; `PRODUCTION_DEPLOY_ENABLED` não definida; nenhum `deploy-production.yml` executado |

### Pendências técnicas / backlog (S04)

- Roteiro de homologação da ficha (passos 1–8) pelo supervisor no preview (dados fictícios) — DoD.
- Aceite do ADR-0014.
- *Contract* de `GroupProfile.leadersText` em release posterior à primeira publicação com líderes autorizados.
- PRs do Dependabot (#3–#6, #16–#21) seguem abertos: atualizações maiores (Payload 3.92, Next/React, dotenv 18, @types/node 26, actions) — avaliar em sprint dedicada (`AGENTS.md` §2). As vulnerabilidades altas novas foram tratadas por overrides no PR #22 (undici, happy-dom; GHSA de graphql-scalars ignorado com GraphQL desabilitado).
### Pendências de consentimento e conteúdo (coordenador)

| Item | Necessário para |
|---|---|
| Controlador dos dados e canal do titular (Q4) | Publicação dos perfis (S06) |
| Termo de autorização individual com escopos independentes (perfil, foto, e-mail) | Coleta das autorizações |
| Lista nominal validada (integrantes e ex-integrantes) com ORCID/Lattes e autorizações individuais | Carga em homologação/produção (`pnpm import:people`) |
| Indicação dos líderes com autorização (no mínimo os líderes para o M1) | `/o-grupo` e critério do M1 |
| Prazo de guarda de comprovantes após revogação | Registro de tratamento §3 (T6) |
| Recoleta do DGP antes da carga | Planilha |

Em homologação **nenhuma** pessoa foi carregada (só entram pessoas com autorização individual registrada; `seed:people` é bloqueado em staging).
## Sessão de 30/10/2026 — encerramento da S03 e domínio oficial

**Modo:** autônomo, autorizado expressamente pelo responsável técnico (encerramento da S03, domínio definitivo e execução integral da S04). Nenhum deploy de produção; `PRODUCTION_DEPLOY_ENABLED` não definida; branch `production` do Neon não acessada.

### Aprovações do responsável técnico (declaração expressa em 30/10/2026)

| Item | Registro |
|---|---|
| Revisão visual e funcional da S03 | Realizada e aprovada |
| Navegação desktop e dispositivos móveis | Aprovada |
| Conteúdo provisório | Revisado e adequado à etapa atual (textos definitivos do coordenador continuam pendentes para a S06) |
| 9 critérios de aceite da S03 | Aprovados, com as evidências automatizadas da sessão de 22/10/2026 |
| ADR-0013 | **Aprovado** → status `Aceito` |
| S03 | **Concluída** (30/10/2026) |

### `main` e workflows (verificado em 30/10/2026, sem reexecutar testes)

`main` = `1728a50` (sem alterações desde 22/10). Último CI `39868928617`, Verificação de migrations `39868928576` e Deploy de homologação `39868928439`: **sucesso**. Backups diários agendados de 23/10 a 30/10: **sucesso** (8 execuções). PRs abertos: apenas Dependabot (#3–#6, #16–#21), não mesclados — atualizações maiores fora do escopo (decisão do supervisor).

### Domínio `bioeticaps.app` — verificação (somente leitura)

| Item | Resultado |
|---|---|
| Associação na Vercel | Escopo `labarros-projects`, projeto **`ppgps-portal`**; domínio `verified: true`, sem redirecionamento nem branch Git (alvo *production*) |
| DNS | Nameservers `ns1/ns2.vercel-dns.com` (pretendidos = atuais); apex `A` → Vercel; `www` resolve para a Vercel, mas **não** está adicionado ao projeto |
| HTTPS | Certificados Vercel de 29/10/2026 para `bioeticaps.app` e `*.bioeticaps.app` (90 dias, renovação automática). A rede local do agente tem inspeção TLS (Fortinet), por isso a validação foi feita de fora (check-host.net): HTTPS funcional, `http://` → 308 para `https://` |
| Deployment servido | **Nenhum** — `https://bioeticaps.app/` e `https://www.bioeticaps.app/` → **404 `DEPLOYMENT_NOT_FOUND`** |
| Alvo *production* do projeto | Um único deploy de produção, de 20/10/2026 (setup da S01, CLI manual), **com falha de build** — sem artefato servível |
| Exposição antecipada | **Nenhuma** (nenhum conteúdo, painel, API ou dado acessível pelo domínio) |
| Observação de segurança | `ssoProtection = all_except_custom_domains`: domínios personalizados não têm *Vercel Authentication*; o domínio nunca pode ser alias de preview/homologação (regra adicionada ao `AGENTS.md` §7) |

### Preparação do domínio (código)

- `resolveServerUrl`: em `APP_ENV=production` usa `SERVER_URL` ou `https://bioeticaps.app` (nunca `VERCEL_URL`); fora da produção, `bioeticaps.app` em `SERVER_URL`/`VERCEL_URL` é **ignorado**. Canônica, Open Graph, `metadataBase`, sitemap, robots e JSON-LD herdam a regra.
- Proxy: somente em produção, `www.bioeticaps.app` → 308 para o apex (caminho e query preservados). Fora da produção nada muda (autenticação básica + `noindex`).
- `deploy-production.yml` passa `SERVER_URL=https://bioeticaps.app` (sobrescrevível por `PRODUCTION_DOMAIN`); a trava `PRODUCTION_DEPLOY_ENABLED` permanece.
- Homologação continua em `https://ppgps-portal-staging.vercel.app` (`STAGING_DOMAIN`); previews inalterados.

### Documentação atualizada

Planejamento **v1.4** (histórico e seções 24.1, 24.2, 25.1, 19.5/S06, 32), ADR-0013 (Aceito), **ADR-0014** (novo, Proposto), notas em ADR-0003, ADR-0009 e ADR-0010, `AGENTS.md` (§1, §1.1, §7), `CLAUDE.md`, `README.md`, `.env.example`, `docs/sprints/S04.md`, `docs/sprints/S06.md`, `docs/content/questoes-institucionais.md` (Q3).

### Pendências do domínio (S06)

1. Ativação pública somente com autorização do responsável técnico e confirmação do coordenador.
2. Adicionar `www.bioeticaps.app` ao projeto (redirecionamento para o apex) — o proxy já redireciona em produção.
3. Remover o deploy de produção com falha de 20/10/2026 (opcional; não é servido).
4. Search Console e conferência do certificado fora da rede local.
5. Aceite do ADR-0014.
## Sessão de 22/10/2026 — execução da S03

**Modo:** autônomo, autorizado expressamente pelo supervisor (execução integral da S03 e política de PRs, `AGENTS.md` §11.1). Branch `s03-portal-grupo`, PR #14. S04 não iniciada. Nenhum deploy de produção; `PRODUCTION_DEPLOY_ENABLED` não definida; branch `production` do Neon não acessada.

### Feito

- **Modelagem** (migration `20261022_211945_s03_group_profile_lines_pages_redirects`, aditiva; `down` idempotente):
  - global `group-profile` com rascunho/versões, todos os campos da ficha (13.3), `leadersText` temporário obrigatório para publicar, `institutionalReferences[]` somente texto+URL, `dgpResearchLines[]` (fonte e data), `responsibilityNote?`, `source`/`collectedAt` e a flag `provisionalTexts` (aviso discreto de texto provisório no site);
  - coleção `research-lines` ("Linhas temáticas"), rascunho/versões, slug normalizado e validado (gerado do nome), `active`, `provisional`, `order`, `relatedProgramLineText?`, `source`;
  - coleção `pages` com blocos (texto rico, chamada, lista de links, cartões), rascunho/versões, SEO e pré-visualização; slugs `historico`, `objetivos`, `referencias-institucionais` e `contato` complementam as páginas fixas;
  - global `homepage`: hero (chamada, frase de propósito, até 2 botões) e seções ordenáveis/ocultáveis; seções de S04–S10 existem no cadastro, mas o site só exibe as disponíveis (Apresentação, Linhas temáticas, Referências institucionais);
  - coleção `redirects` (`@payloadcms/plugin-redirects`), somente admin/editor, origem normalizada, caminhos do sistema e destinos inseguros recusados, auditada.
- **Acesso:** editor/admin editam; visitante lê só o publicado (`publicWhere`/`canViewPublic` únicos; linhas também precisam estar ativas); hook impede `?draft=true` e versões para visitantes; publicação auditada como `publish`.
- **Site** (Server Components, Local API `overrideAccess: false`): `/`, `/o-grupo`, `/o-grupo/historico`, `/o-grupo/objetivos`, `/o-grupo/referencias-institucionais`, `/o-grupo/contato`, `/o-grupo/[slug]`, `/linhas`, `/linhas/[slug]`, `/sitemap.xml`, `/robots.txt`, `/next/preview` e `/next/exit-preview`. Componentes: `InstitutionalReferences` (sem logotipos), `ResearchLinesDiptych` (os dois eixos lado a lado), `GroupFacts` (ficha do registro no DGP), `DgpLines` (referência histórica, sem links), `PageHeader`, `SectionNav`, `ProvisionalNote`, `SourceNote`, blocos e renderizador Lexical próprio (`safeHref`, sem HTML bruto). Menu padrão: Início · O grupo · Linhas temáticas. Rodapé com navegação e referências marcadas para o rodapé (somente texto). Ícone do site próprio (dois círculos sobrepostos; sem marca institucional).
- **Cache e revalidação (ADR-0013):** páginas renderizadas por requisição com dados em cache por tag; hooks revalidam tags/rotas (perfil → layout inteiro: home, `/o-grupo/*`, rodapé).
- **301:** ao publicar um slug diferente do publicado, hooks criam o redirecionamento (e reapontam cadeias); o proxy responde 301 real consultando a tabela `redirects`.
- **SEO:** `generateMetadata` com canônica, Open Graph e Twitter; JSON-LD `ResearchOrganization` do grupo (instituições só em `mentions`, sem `parentOrganization`/`memberOf`) e `BreadcrumbList`; sitemap só com conteúdo publicado; robots bloqueia tudo fora da produção (em produção: `/admin`, `/api`, `/next`); `noindex` mantido.
- **Seed** `pnpm seed:content` (idempotente, nunca sobrescreve edições; bloqueado em produção), a partir do inventário §3.1–3.2 com fonte e data: nome da Q2, nomes alternativos com fonte, registro do DGP, 4 linhas do DGP, 4 referências institucionais (UniCesumar, PPGPS e DGP no rodapé; DIPE-RS só na página), 2 linhas temáticas e textos **provisórios** redigidos apenas com fatos do registro público. Liderança referida ao DGP, **sem nomes** (S04). Executado no CI (E2E, Lighthouse), no preview, no branch `seed` e em homologação.
- **Pipelines:** novo job **Lighthouse CI** (mobile; acessibilidade e SEO ≥ 0,90 bloqueantes; JS ≤ 300 KB, 0 terceiros e CLS ≤ 0,1 bloqueantes; desempenho e LCP como aviso; relatórios só como artefato). Fumaça de deploy verifica as rotas da S03, `/api/redirects` 403, nome do grupo e ausência de "laboratório".
- **Docs:** ADR-0013 (Proposto), README e `AGENTS.md` §3 (comandos `seed:content` e Lighthouse).

### Testes executados (22/10/2026)

| Verificação | Local | CI (PR #14) |
|---|---|---|
| lint / format / typecheck | Passou | Passou |
| Unitários | 178/178; cobertura de linhas 89% (`src/hooks` 99%) | Passou |
| Integração | 72/72 — acesso por papel, liderança obrigatória para publicar, slug, **vazamento** (rascunhos/inativos em listas, por id, `?draft=true`, `where[_status]`, `/versions` → 403, globals), sitemap só publicado, 301 (criação, rascunho não gera, cadeias, remoção, páginas, SQL do proxy), revalidação por tag, auditoria `publish` | Passou |
| E2E (Playwright + axe) | 46/46 — 9 rotas sem violações sérias/críticas em 1280 px e 360 px, sem rolagem horizontal, sem logotipos, sem "laboratório", roteiro de navegação, 2 linhas, 4 linhas do DGP com fonte/data e sem links, referências/rodapé só texto, link do DGP, JSON-LD, SEO/robots/sitemap, **edição pelo editor refletida sem deploy**, **301 real**, rascunho ausente do site/sitemap/API e visível só na pré-visualização autenticada | Passou |
| Build sem banco | Passou | Passou |
| Migrations | `migrate`, `migrate:check` (sem drift), `migrate:down`/`migrate` local | Banco limpo, drift e down/up: passou (após tornar o `down` idempotente) |
| Lighthouse (mobile) | `/`, `/o-grupo`, `/o-grupo/historico`, `/linhas`, `/linhas/bioetica`: acessibilidade **1,00**, SEO **1,00**, boas práticas 0,96, desempenho 0,92–0,94 | Passou (a11y/SEO ≥ 0,90; desempenho 0,75–0,9 e LCP 3,3–4,0 s no runner, apenas aviso) |
| Preview do PR | — | Banco `preview/pr-14` com migrations e seed; deploy e fumaças OK |
| Link do DGP | `http://dgp.cnpq.br/dgp/espelhogrupo/5367326681852422` → HTTP 200 (o https redireciona para http) | — |

### Critérios de aceite da S03

| Critério | Situação | Evidência |
|---|---|---|
| Editor altera a apresentação e a página reflete sem deploy | Atendido | E2E "alteração da apresentação publicada aparece no site sem deploy"; integração de revalidação |
| 2 linhas temáticas publicadas e listadas; 4 linhas do DGP como referência histórica, sem páginas e sem extinção | Atendido | E2E (linhas, histórico, 404 em página de linha do DGP, ausência de termos de extinção) |
| Referências institucionais e rodapé só com texto e links | Atendido | E2E (0 `img/svg/picture` nas referências e no rodapé) |
| Link para o espelho do DGP funcional | Atendido | E2E (`href` oficial) + HTTP 200 |
| Nenhuma rota, link ou texto sobre laboratório | Atendido | E2E em todas as rotas + 404 em `/laboratorio`; fumaça de deploy |
| Alterar slug de uma linha cria 301 | Atendido | E2E (status 301 e `Location`) + integração |
| `sitemap.xml` só com publicado | Atendido | Integração + E2E |
| Rascunhos fora das páginas e da API pública | Atendido | Teste de vazamento (integração) + E2E |
| Lighthouse mobile ≥ 90 (acessibilidade e SEO) em `/` e `/o-grupo` | Atendido | Local 1,00/1,00; job Lighthouse CI verde |
| DoD: supervisor revisa conteúdo e navegação (desktop e mobile) | **Atendido** (30/10/2026) | Aprovação expressa do responsável técnico |

### Decisões e premissas

1. Páginas públicas por requisição com dados em cache por tag, 301 no proxy e pré-visualização via Draft Mode (ADR-0013, Proposto).
2. Textos de apresentação, objetivos, histórico e das linhas são **provisórios** (Q7), redigidos só com fatos do DGP, marcados no painel e no site ("Texto provisório, em validação pelo grupo").
3. Liderança: texto temporário sem nomes, remetendo ao DGP (perfis só com consentimento na S04).
4. Contato: nenhum e-mail publicado (Q1/Q4 em aberto); a página orienta para o espelho do DGP.
5. Redação da referência ao PPGPS e natureza da parceria com a DIPE (RS) mantidas como no inventário (a confirmar).
6. Orçamento de JS de 300 KB (o runner do CI mede ~265 KB com Next 16 + React 19 + Radix); a premissa de 150 KB do planejamento 16.8 não é atingível com a stack base — registrar para revisão na S06.
7. `en` continua oculto; slugs de páginas em `/o-grupo/<slug>`.

### Pendências de conteúdo (coordenador)

| Item | Uso no portal | Origem |
|---|---|---|
| Texto de apresentação do grupo | `/o-grupo`, página inicial | Q7 |
| Objetivos do grupo | `/o-grupo/objetivos` | Q7 |
| Histórico (marcos além de formação e certificação) | `/o-grupo/historico` | Q7 |
| Descrição das linhas Bioética e Promoção da Saúde (temas e questões) | `/linhas/*` | Q7 |
| Frase de propósito (hero) | página inicial | Q7 |
| Canal de contato do grupo (e-mail institucional) | `/o-grupo/contato`, rodapé | Q1/Q4 |
| Redação da referência ao PPGPS e natureza da parceria com a DIPE (RS) | Referências institucionais | Q2/inventário I-08 |
| Confirmação do nome curto "Bioética e Promoção da Saúde" | títulos das páginas, cabeçalho no celular | Q2 |
| Texto de liderança definitivo (até a S04) | `/o-grupo` | Q1/Q2 |

Depois de publicados no painel, desmarcar "Contém textos provisórios" (perfil) e "Texto provisório" (cada linha).

### Merge e homologação (após o PR #14)

| Verificação | Resultado |
|---|---|
| Merge | PR #14 mesclado por *squash* (`60a5202`) com todos os checks verdes (CI com Lighthouse, verificação de migrations, preview) |
| Workflows da `main` | CI `39866365353`, Verificação de migrations `39866365356` e Deploy de homologação `39866365355`: **sucesso** |
| Homologação | Migration aplicada em `staging` e `seed`; `seed:content` publicou perfil, 2 linhas, página inicial e menu; deploy, fumaça (incluindo as rotas da S03) e alias `https://ppgps-portal-staging.vercel.app` OK |
| Verificação independente (`curl`, 22/10/2026) | 401 sem autenticação básica; 200 com credenciais em `/`, `/o-grupo/*` (5 rotas), `/linhas`, `/linhas/bioetica`, `/linhas/promocao-da-saude`, `/sitemap.xml` (9 URLs), `/robots.txt`; `/laboratorio` 404; `/api/redirects` 403; `/api/graphql` 404; `X-Robots-Tag: noindex`; 0 `<img>` na home; JSON-LD presente; histórico com as 4 linhas do DGP, aviso de texto provisório e link do espelho do DGP |
| Neon | Branches `production` (última atualização 21/10/2026, **intocada**), `staging`, `seed`; `preview/pr-14` removido ao fechar o PR |
| Produção | Nenhum deploy; `PRODUCTION_DEPLOY_ENABLED` não definida |

### Pendências técnicas / backlog

- ~~Aceite do ADR-0013 pelo supervisor~~ — **feito** (30/10/2026).
- Roteiro de homologação da ficha (passos 1–9) pelo supervisor, em desktop e celular; para editar em homologação é preciso criar a conta `admin`/`editor` real (o banco `staging` não tem usuários).
- Revisar o orçamento de JS e o desempenho mobile no runner (0,75–0,9) na S06, junto com a hospedagem (cache de CDN para HTML).
- `unstable_cache` é API legada no Next 16: migrar para `'use cache'` em sprint dedicada.

## Sessão de 22/10/2026 — auditoria final do R2 e encerramento da S02

**Modo:** autônomo, autorizado pelo supervisor (encerramento da S02 e política de PRs). S03 não iniciada. Nenhum deploy de produção.

### Ajustes manuais declarados pelo supervisor

Tokens R2 de preview e staging restritos aos respectivos buckets; segredos atualizados; expiração de 7 dias no `ppgps-preview`; acesso público dos três buckets conferido no painel. Observação técnica: os segredos `R2_*` do ambiente `staging` foram atualizados às 20:24 UTC; os do `preview` mantêm a data original (17:44 UTC) — o escopo do token existente foi restringido. O efeito foi verificado abaixo.

### Auditoria do R2 (run `39849533647`, versão somente leitura do `r2-maintenance.yml`)

| Credencial | Próprio bucket | Outros buckets | Resultado |
|---|---|---|---|
| `preview` | `ppgps-preview` acessível | `ppgps-staging` e `ppgps-backups`: **AccessDenied 403** | Isolado |
| `staging` | `ppgps-staging` acessível | `ppgps-preview` e `ppgps-backups`: **AccessDenied 403** | Isolado |
| `backups` | `ppgps-backups` acessível | `ppgps-preview` e `ppgps-staging`: **AccessDenied 403** | Isolado |

- **Acesso anônimo:** listagem e leitura negadas nos 3 buckets pelo endpoint S3 (HTTP 400).
- **Expiração de 7 dias no `ppgps-preview`:** verificada tecnicamente sem ampliar permissões — a leitura da configuração é negada ao token de objetos (esperado, privilégio mínimo), e um objeto de sonda de 2 bytes recebeu `x-amz-expiration` de **7,0 dias** (sonda removida em seguida). Nenhuma configuração foi alterada pelo agente.
- **`r2.dev` e domínios públicos:** não visíveis pela API S3; registrados como conferidos pelo supervisor no painel (declaração).
- **Credenciais nos logs:** 0 sequências com formato de chave de acesso; os únicos valores hexadecimais de 64 caracteres são chaves de cache do pnpm; 67 ocorrências mascaradas (`***`).
- A auditoria anterior (run `39845589840`, tokens com escopo de conta) está **resolvida**.

### Backups após a rotação

| Verificação | Resultado |
|---|---|
| Backup (run `39849673054`) | `staging-20261022T203217Z.dump.age`, 86 105 bytes, enviado ao `ppgps-backups/staging/2026/10/` com manifesto; retenção: 0 expirados (backups anteriores preservados) |
| Restauração a partir do bucket (run `39849941472`) | Branch Neon temporário `restore-check-39849941472`, banco vazio; **37 s** (61 s com verificações); 0 tabelas divergentes; 2 migrations; 0 FKs não validadas; branch removido |
| Branch `production` do Neon | Intocada (nenhuma operação dos workflows) |

### Decisão do responsável técnico — Sentry e SMTP (22/10/2026)

Adiada para a **S06** a validação externa do Sentry e do SMTP de homologação, considerando o orçamento de R$ 0 e a ausência de lançamento público. Condições registradas: código e testes preservados; os dois critérios constam como **adiados**, não aprovados; a ficha `docs/sprints/S06.md` passa a exigir sua resolução **antes do lançamento do M1**, salvo nova decisão expressa; nenhum serviço pago; nenhum e-mail real em testes.

### Critérios de aceite da S02 — situação final

| Critério | Situação |
|---|---|
| Editor sem gestão de usuários/papéis/configurações técnicas, lê a auditoria; anônimo sem admin/escrita | Atendido |
| Sem cadastro público nem `researcher`; só admin cria contas | Atendido |
| Bloqueio de 15 min após 5 tentativas | Atendido |
| E-mail de recuperação capturado em homologação, link expira em 1 h | **Adiado para a S06** (comprovado só no local/CI com Mailpit) |
| Auditoria de criação/edição/exclusão com usuário, coleção, documento e data | Atendido |
| `.exe` renomeado rejeitado; imagem sem alt/crédito/licença/origem não salva | Atendido (inclusive no R2 real) |
| Backup de homologação gerado, criptografado e restaurado em branch temporário, com tempo | Atendido (37 s, a partir do bucket, antes e depois da rotação) |
| Erro forçado no Sentry sem dados pessoais | **Adiado para a S06** (sem evento real) |
| Menu mobile por teclado e Esc; foco visível; axe | Atendido |
| Tokens AA; nome do grupo no cabeçalho; sem logotipos (E2E) | Atendido |
| Segregação de buckets e credenciais (requisito do prompt de execução) | Atendido (auditoria acima) |

**Encerramento:** S02 **Concluída** em 22/10/2026 por autorização expressa do responsável técnico, com as exceções acima. Recomenda-se que o supervisor execute, quando possível, o roteiro manual de homologação da ficha (passos 1–7, 9–10), não reportado nesta sessão.

### Pendências transferidas para a S06

1. Sentry real (evento sem PII).
2. SMTP de produção e captura em homologação (recuperação com link de 1 h).
3. Limite de ~4,5 MB por upload na Vercel Hobby (junto com o ADR de hospedagem).
## Sessão de 22/10/2026 — finalização da S02

**Modo:** autônomo, autorizado pelo supervisor (política de PRs, `AGENTS.md` §11.1). S03 não iniciada.

### Confirmações do supervisor (22/10/2026)

| Item | Registro |
|---|---|
| Segredos `R2_BACKUP_ACCESS_KEY_ID` e `R2_BACKUP_SECRET_ACCESS_KEY` no ambiente `backups` | Confirmado e **verificado** (`gh secret list --env backups`, cadastrados às 19:42–19:43 UTC; valores não exibidos) e usados com sucesso pelos workflows |
| Chave privada `age` guardada em local seguro sob responsabilidade do supervisor | Confirmado (declaração) |
| ADR-0011 e ADR-0012 | **Aceitos** — status atualizado com a aprovação |

### Feito (PR #11, `5085325`)

- `restore-check.yml` passa a baixar o backup do **bucket `ppgps-backups`** (caminho real de recuperação; `scripts/backup/download.mjs`), com o artefato do GitHub apenas como alternativa; nova entrada `backup_base`.
- Novo `r2-maintenance.yml` + `scripts/storage/r2-maintenance.mjs` (mensal e sob demanda): garante a expiração de 7 dias **somente** no `ppgps-preview` e audita exposição anônima e isolamento entre credenciais dos três buckets.
- `r2-smoke.mjs` emite alerta a cada deploy se a credencial da aplicação alcançar o bucket de backups.

### Evidências

| Verificação | Resultado |
|---|---|
| Backup criptografado de homologação | Run `39843046978`: `staging-20261022T194700Z.dump.age`, **86 105 bytes**, `pg_dump`+`age` em 16 s; **enviado ao bucket `ppgps-backups`** em `staging/2026/10/` (dump + manifesto de 923 bytes); retenção de 7 dias aplicada (0 expirados) |
| Restauração real a partir do bucket | Run `39845182143`: download de `ppgps-backups` com as credenciais exclusivas; SHA-256 conferido com o manifesto; branch Neon temporário `restore-check-39845182143` (de `seed`, banco vazio `restore_check`); **restauração em 37 s** (61 s com verificações); 25 tabelas, **0 divergências**, 2 migrations, 0 FKs não validadas; branch removido |
| Neon após os testes | Branches: `production` (`updated_at` 21/10/2026, **0 operações recentes** — intocada), `staging`, `seed`. Nenhum branch temporário remanescente |
| Exposição anônima (run `39845589840`) | Os 3 buckets negam listagem e leitura anônimas pelo endpoint S3 (HTTP 400) |
| Isolamento das credenciais de backup | Token de `backups` recebe **AccessDenied (403)** em `ppgps-preview` e `ppgps-staging` — **isolado** |
| **Isolamento das credenciais da aplicação** | **FALHA:** os tokens de `preview` e de `staging` acessam os outros buckets, **inclusive `ppgps-backups`** (tokens com escopo de conta). Código de PR implantado em preview poderia ler/apagar backups |
| Expiração de 7 dias no `ppgps-preview` | **Não aplicada:** o token do preview não tem permissão de administração do bucket (`GetBucketLifecycleConfiguration` → AccessDenied 403). Controle compensatório ativo: limpeza automática de `pr-N/` ao fechar o PR |
| `r2.dev`/domínio público | Não verificável pela API S3: verificação manual no painel |
| CI, migrations e homologação após o PR #11 | Verdes (preview do PR #11 também com R2 real OK) |

### Revisão da integração de armazenamento, segurança e workflows

- Código: buckets privados, acesso sempre pela rota do app com verificação de permissão, URL assinada de 5 min para documentos, magic bytes/limites/SVG bloqueado — cobertos por 60 testes de integração e pela fumaça real no preview (PRs #9 e #11). Sem alterações necessárias.
- Workflows: `backup.yml` (envio ao bucket comprovado), `restore-check.yml` (agora a partir do bucket), `r2-maintenance.yml` (falha propositalmente enquanto os tokens não forem reescopados), alerta no `r2-smoke`. Credenciais só via segredos de ambiente; nenhum valor impresso (mascaramento do GitHub conferido nos logs).

### Sentry e e-mail — avaliação de adiamento

| Item | Situação real | Avaliação |
|---|---|---|
| Sentry (erro forçado sem PII) | Sem `SENTRY_DSN`: **nenhum evento real enviado**. Código, `beforeSend` e testes unitários de remoção de PII prontos; app funciona sem DSN | **Adiamento para a S06 proposto** (monitoramento e uptime são da S06). Não compromete os requisitos essenciais: a observabilidade é opcional e não há dados reais até o M1. Critério **não atendido** até teste real |
| E-mail capturado em homologação | Sem SMTP de captura em homologação: mensagens **descartadas** com log mascarado (nada é enviado). Recuperação, expiração de 1 h e uso único comprovados com Mailpit real no local/CI | **Adiamento para a S06 proposto**, com condição: antes do M1 a produção precisa de SMTP real (senão a recuperação de senha não funciona). Impacto na homologação: o supervisor define senhas como `admin` em vez de usar o link. Critério **parcial** |

Ambos só serão marcados como atendidos após teste real. O adiamento depende de decisão do supervisor.

### O que falta para encerrar a S02

1. **Bloqueante (segurança):** no painel da Cloudflare, restringir o token R2 do ambiente `preview` a **somente** `ppgps-preview` e o de `staging` a **somente** `ppgps-staging` (R2 → Manage API tokens → *Object Read & Write* → *Apply to specific buckets only*), atualizar os segredos `R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY` nos ambientes e revogar os tokens antigos. Depois, executar *Manutenção e auditoria do R2*: deve ficar verde (exceto lifecycle, se o item 2 for feito pelo painel).
2. Criar no painel a regra de ciclo de vida do `ppgps-preview` (expirar objetos após 7 dias; gratuito) **ou** fornecer token com permissão de administração somente desse bucket para o workflow aplicá-la.
3. Confirmar no painel que `r2.dev` e domínios públicos estão desativados nos 3 buckets.
4. Executar o roteiro de homologação da S02 (DoD) e decidir sobre o adiamento de Sentry e SMTP para a S06.

## Sessão de 22/10/2026 — execução da S02

**Modo:** autônomo, autorizado expressamente pelo supervisor (execução integral da S02, política permanente de PRs — `AGENTS.md` §11.1). ADR-0010 aceito pelo supervisor no mesmo prompt. PR #8 encontrado **já mesclado** (`7b712cd`).

### Incidente encontrado e corrigido

O CI da `main` após o PR #8 (run `39822648395`) **falhou** no `pnpm audit`: vulnerabilidade **crítica** do Next.js (GHSA-2464-fhr4-w9xw, RCE na otimização de imagens com SVG; também GHSA-p3m5-59mp-jv5r, alta). Corrigido atualizando Next 16.3.8 → **16.4.2** (dentro da faixa suportada pelo Payload 3.91). CI da `main` verde após o merge da S02.

### Feito

- **Auth/RBAC:** `users.roles` (`admin`/`editor`), `active`, `name`, `lastLoginAt`; funções puras em `src/access/`; só `admin` cria/exclui contas e altera papéis/ativação (acesso por campo); editor lê/edita só a própria conta; primeiro usuário vira `admin`; proteção do último admin; contas da S01 promovidas a `admin` pela migration. Senha ≥ 12 + lista de senhas comuns/previsíveis; bloqueio 5 tentativas/15 min; limite de taxa por IP (login 10/10 min, recuperação 5/15 min); token de redefinição 1 h de uso único; sessão de 2 h; cookie HttpOnly/SameSite=Lax/Secure; conta nova recebe e-mail para definir a senha.
- **Auditoria:** `audit-logs` imutável (API nega escrita a todos; gatilho no banco bloqueia UPDATE/TRUNCATE e DELETE de registros com menos de 2 anos); hooks transversais para create/update/delete/login/`role_change` e globals; só nomes de campos, IP truncado.
- **Storage:** `@payloadcms/storage-s3` — MinIO local/CI; R2 `ppgps-preview` (prefixo `pr-N`, apagado ao fechar o PR) e `ppgps-staging`; bucket privado; arquivos sempre pela rota do app com verificação de acesso; documentos por URL assinada de 5 min; magic bytes, 10/25 MB, SVG/executáveis bloqueados, nomes UUID; `media` com `alt`, `caption`, `credit`, `license`, `source`, `sourceNote`, `containsIdentifiablePeople` (imagens com pessoas não são públicas até a S04); coleção `documents` com `visibility` public/members/admin.
- **E-mail:** adaptador nodemailer + Mailpit local; captura (descarte com log mascarado) fora da produção sem SMTP; SMTP remoto fora da produção só se declarado como caixa de testes; templates pt-BR; links via `SERVER_URL`/`VERCEL_URL` (nunca `Host`).
- **Observabilidade/segurança:** Sentry opcional (servidor, edge, cliente) com `beforeSend` removendo PII; endpoint `POST /api/users/sentry-test` (só admin) para o roteiro; CSP completa em *report-only*, COOP, `X-Permitted-Cross-Domain-Policies`.
- **Backup:** `scripts/backup/` (`pg_dump` → `age` em fluxo; manifesto com contagens; restauração em banco vazio com conferência); `backup.yml` (diário) e `restore-check.yml` (mensal, branch Neon temporário). Par de chaves `age` gerado; pública em variável do repositório, privada no ambiente GitHub `backups` e em `.secrets/` para o cofre.
- **Base visual:** Tailwind 4 + shadcn/ui (Button, Sheet), tokens em `src/styles/tokens.css` (azul-marinho `#0b2545` e branco; contraste AA testado em 17 pares), Inter + Source Serif 4 via `next/font`; Header com wordmark (nome completo / curto no celular), menu móvel, Footer, SkipLink, Breadcrumbs, EmptyState, 404 (com rota coringa), `error` e `global-error`; globals `navigation`, `footer`, `site-settings` (grupo técnico só para admin). Texto "portal não oficial" removido da página e do E2E.
- **CI/CD:** MinIO + Mailpit nos jobs de integração/E2E; preview e homologação recebem storage/SMTP/Sentry por `vercel deploy --env` (somente servidor); verificação real do R2 a cada deploy; fumaça de armazenamento pelo app no preview; limpeza do prefixo do PR. Variáveis `R2_ACCOUNT_ID`, `R2_ENDPOINT`, `R2_REGION`, `BACKUP_AGE_RECIPIENT` cadastradas; ambiente `backups` criado com `BACKUP_AGE_IDENTITY` e `NEON_API_KEY`.
- **Docs:** ADR-0010 → Aceito; ADR-0011 e ADR-0012 (Propostos); `docs/operacao/armazenamento.md` e `backup.md`; README, `.env.example`, `AGENTS.md` (§3 e nova §11.1) e `CLAUDE.md`.

### Migration

`20261022_180524_s02_auth_audit_storage_globals` — aditiva (expand). Migração de dados idempotente (contas sem papel → `admin`) e gatilho de imutabilidade. `down` corrigido para ser idempotente. Comprovado: banco limpo, *drift*, `down`/`up` (local e CI), aplicada em `preview/pr-9`, `seed` e `staging` (staging tinha 0 usuários/0 mídias antes).

### Testes executados (22/10/2026)

| Verificação | Local | CI (PR #9 e `main`) |
|---|---|---|
| lint / format / typecheck | Passou | Passou |
| Unitários | 129/129; cobertura 98% linhas (`src/access`, `src/hooks`, `src/lib`) | Passou |
| Integração (Postgres + MinIO + Mailpit) | 60/60 — RBAC por papel e anônimo, senha, bloqueio, limite de taxa, sessão, recuperação (e-mail capturado, 1 h, uso único, expirado), auditoria (inclusive imutabilidade no banco), upload/download MinIO, `.exe`→`.jpg`, SVG, >10 MB, >25 MB, campos obrigatórios, documento privado negado e URL assinada, vazamento | Passou |
| E2E (Playwright + axe) | 16/16 — identidade, sem logotipos, SkipLink, foco visível, axe desktop/320 px/menu aberto/404, menu móvel por teclado com foco preso e Esc, 404, API anônima | Passou |
| Build sem banco | Passou | Passou |
| `migrations-check` | Passou | Passou |
| gitleaks / `pnpm audit` | — | Passou (falso positivo de commit intermediário registrado em `.gitleaksignore`) |
| R2 real — direto (`r2-smoke`) | — | preview `pr-9` e staging: escrita, leitura, URL assinada, acesso sem assinatura negado (HTTP 400), exclusão — OK |
| R2 real — pelo app implantado (preview) | — | login (conta fictícia do seed), upload com nome UUID, download público, `.exe` rejeitado (400), documento privado 403 ao visitante, 302 para URL assinada do R2 (`X-Amz-Expires=300`), download 200, sem assinatura negado, auditoria, limpeza — OK |
| Backup criptografado de homologação | Ciclo local (25 tabelas, 0 divergências) | Run `39838271079`: `staging-20261022T191411Z.dump.age`, 86 105 bytes, 22 s |
| Restauração em branch temporário | — | Run `39839034470`: branch `restore-check-39839034470` criado de `seed`, banco vazio, **restauração em 45 s** (76 s com verificações), 0 tabelas divergentes, 2 migrations, 0 FKs inválidas; branch removido |
| Homologação após o merge | `curl` independente: 401 sem basic auth, 200 com credenciais, `noindex`, CSP report-only, COOP, HSTS, nome do grupo no HTML, 0 `<img>`, 404, `/api/users` e `/api/audit-logs` 403, `forgot-password` 200, GraphQL 404 | `deploy-staging` run `39838192242` verde (migrate, seed, R2, deploy, fumaça, alias) |
| Branches Neon após tudo | — | `production` (última atualização 21/10, **intocada**), `staging`, `seed`; `preview/pr-9` e `restore-check-*` removidos |

### Critérios de aceite da S02

| Critério | Situação | Evidência |
|---|---|---|
| Editor não cria usuários, não altera papéis/configurações técnicas e lê a auditoria; anônimo sem admin/APIs de escrita | **Atendido** | `rbac.int.test.ts`; E2E API |
| Sem cadastro público nem `researcher`; só admin cria contas | **Atendido** | `rbac.int.test.ts`, `access.test.ts` |
| Bloqueio de 15 min após 5 tentativas | **Atendido** | `auth.int.test.ts` |
| E-mail de recuperação capturado em homologação e link expira em 1 h | **Parcial** | Local/CI: Mailpit captura, 1 h e expiração comprovados. Homologação: sem SMTP de captura configurado, a mensagem é **descartada** com log mascarado (comportamento seguro), não visualizável. Pendência: caixa de captura gratuita |
| Toda criação/edição/exclusão gera auditoria com usuário, coleção, documento e data | **Atendido** | `audit.int.test.ts`; fumaça do preview |
| `.exe` renomeado rejeitado; imagem sem alt/crédito/licença/origem não é salva | **Atendido** | integração e preview real |
| Backup gerado, criptografado e restaurado em branch temporário, com tempo | **Atendido** (envio ao bucket pendente) | Runs `39838271079` e `39839034470` (45 s). Arquivo guardado como artefato cifrado: faltam credenciais exclusivas do `ppgps-backups` |
| Erro forçado aparece no Sentry sem e-mail/PII | **Pendente (externo)** | Código e testes unitários do scrubbing prontos; **sem `SENTRY_DSN`** cadastrado não há evento real |
| Menu mobile por teclado, Esc, foco visível, axe | **Atendido** | E2E |
| Tokens AA; cabeçalho com o nome do grupo; sem logotipos (E2E) | **Atendido** | `audit-and-tokens.test.ts`; E2E; homologação |

### Decisões

1. Mídia servida pelo app (rota com controle de acesso); documentos por URL assinada de 5 min; bucket sempre privado (ADR-0011).
2. Limite de taxa em memória por instância, aceito com o bloqueio por conta como controle principal.
3. Fora da produção sem SMTP, e-mails são descartados (nunca enviados); SMTP remoto só se declarado como caixa de testes.
4. `members` tratado como restrito enquanto não houver contas de integrantes (Q5).
5. Imagens com pessoas identificáveis não são públicas até existir `media.consentRecord` (S04).
6. Backup sem credenciais de bucket fica como artefato cifrado do GitHub (7 dias) — nunca em claro.

### Pendências externas (supervisor)

1. ~~Credenciais exclusivas do bucket `ppgps-backups`~~ — **feito** (finalização da S02; envio comprovado).
2. ~~Chave privada `age` no cofre~~ — **feito** (declaração do supervisor).
3. **Sentry**: criar projeto no plano gratuito e cadastrar `SENTRY_DSN` nos ambientes `preview`/`staging`; depois executar o passo 8 do roteiro (`POST /api/users/sentry-test` como admin).
4. **E-mail em homologação**: se desejar visualizar e-mails, configurar caixa de captura gratuita (ex.: Mailtrap Sandbox) com `SMTP_*` no ambiente `staging` e variável `EMAIL_SMTP_IS_SANDBOX=true`. Sem isso o fluxo funciona, mas a mensagem é descartada.
5. **R2**: regra de ciclo de vida de 7 dias no `ppgps-preview`; confirmar `r2.dev`/domínio público desativados nos 3 buckets; acompanhar métricas mensais.
6. **Roteiro de homologação da S02** (ficha, passos 1–10), com a conta fictícia do seed no preview ou criando a conta `admin` real em homologação (o banco `staging` não tem usuários).
7. ~~Aceitar ADR-0011 e ADR-0012~~ — **feito**.
8. Dependabot abriu novos PRs de actions após o merge (atualizações *major*); decidir junto com os PRs #3–#6.

### Riscos e limitações registrados

- **Vercel Hobby:** uploads acima de ~4,5 MB falham na plataforma antes do app; limites de 10/25 MB valem no local/CI. Decidir na S06 (upload direto com CORS ou outra hospedagem) — ADR-0011.
- **Custo R2:** faixa gratuita não garante custo zero; consumo da S02 ≈ dezenas de operações e < 1 MB. Testes repetitivos usam só MinIO.
- Limite de taxa não é compartilhado entre instâncias serverless.
- Nenhum deploy de produção; `PRODUCTION_DEPLOY_ENABLED` não definida; branch `production` do Neon intocada.

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
| Textos de apresentação, objetivos e histórico do grupo e dos eixos temáticos (hoje provisórios no portal, ver sessão da S03) | Q7 | Publicação do M1 (S06) |
| Política editorial e ensaios iniciais (≥ 3) | Q8 | S05/S06 |
| Fonte e escopo dos dados de orientações | Q10 | S07 |
| Nome curto para títulos de página [PREMISSA "Bioética e Promoção da Saúde", em uso desde a S03] | Q2 | S06 |
| Exigência de comunicação à UniCesumar (não abordada; risco residual R17) | Q1 | Decisão do coordenador antes da S06 |
| ~~Domínio próprio~~ — definido: `bioeticaps.app` (ADR-0014); ativação | Q3 | S06 |
| Identificação nominal do coordenador nos registros | — | S06 |

### Ações manuais do supervisor

1. ~~Aceitar o ADR-0010~~ — **feito** (22/10/2026).
2. ~~Mesclar o PR da v1.3~~ — **feito** (PR #8).
3. Pré-requisitos da S02: R2 (`ppgps-preview`, `ppgps-staging`) **feito**; credenciais exclusivas do `ppgps-backups`, Sentry, e-mail de captura e cofre da chave `age` **pendentes** (ver "Pendências externas" da sessão da S02).
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

1. Agente: iniciar a **S03** somente com nova instrução do supervisor, pelo protocolo do `AGENTS.md` §11.
2. Supervisor (recomendado): executar o roteiro manual de homologação da S02.
3. S06: resolver as pendências transferidas (Sentry, SMTP, limite de upload) antes do M1.
4. Em paralelo, o coordenador fornece os itens institucionais em aberto (textos para a S03; controlador, canal do titular e autorizações para a S04).
