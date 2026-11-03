# Relatório do M1 — primeira publicação

> Ficha S06. Situação em 03/11/2026 (UTC). Portal publicado em `https://bioeticaps.app` (release **`v1.0.2`**). Registros detalhados em `docs/PROGRESS.md`.

## 1. Publicação

| Item | Resultado |
|---|---|
| Autorização | Declaração expressa do responsável técnico (30/10/2026), **reconfirmada em 03/11/2026**: o coordenador (prof. Lucas) aprovou o portal, a estrutura, a identidade visual e as funcionalidades até a S05, e autorizou o lançamento (`questoes-institucionais.md` §1) |
| Releases | `v1.0.0` (parou na verificação do R2, antes do deploy) → `v1.0.1` (31/10; run `41157393442`) → **`v1.0.2`** (03/11; run `41685129160`: correção do alerta do Sentry e revisão mobile) |
| Pontos de restauração | `predeploy-*` a cada release (os 2 mais recentes são mantidos) |
| Domínio | `bioeticaps.app` 200 (região `gru1`); `www` → 308 para o apex; `http` → 308 para `https`; certificado válido até 27/01/2027 (renovação automática) |
| Fumaça de produção | Verde em `v1.0.1` (run `41158557956`) e `v1.0.2` (run `41685129160`): rotas do M1, páginas legais, cabeçalhos, sem `noindex`, robots/sitemap/canônica no domínio, APIs administrativas fechadas, `first-register` 403, sem logotipo, nota de responsabilidade |
| Conteúdo publicado | Perfil do grupo e 2 linhas temáticas (textos **provisórios** sinalizados, só fatos do DGP), páginas legais, menu e home padrão, categorias do blog. **Nenhuma pessoa e nenhum ensaio**: não há autorizações individuais nem ensaios reais disponíveis |
| Contas | `admin` (desenvolvedor) e **`editor` do prof. Lucas, já criada e com acesso configurado** (homologado pelo responsável técnico em 03/11/2026). Há 4 contas no total; o responsável técnico declarou em 03/11/2026 que as outras 2 são **legítimas** (decisão registrada; a ficha previa só as duas reais) |
| Recuperação de senha e SMTP (Resend) | **Homologados** pelo responsável técnico, com envio real em produção (31/10 e 03/11/2026) |

## 2. Reauditoria

| Controle | Evidência |
|---|---|
| CSP em *enforce* | Cabeçalho em produção; E2E sem violações no console; **116/116** E2E contra `next start` (v1.0.2), incluindo fluxos do painel e pré-visualização |
| Acesso de todas as coleções do M1 | Integração (114) + vazamento global E2E: rotas públicas, sitemap, feeds e API REST com `depth=2` sem e-mail privado, consentimento, auditoria, rascunho ou pessoa sem consentimento |
| Marca | E2E em todas as rotas públicas e legais: nenhum logotipo; nota de responsabilidade em `/sobre-o-portal` |
| Axe | Todas as rotas públicas (desktop, 320, 360, 375, 390 e 430 px): 0 violações sérias/críticas |
| Teclado e árvore de acessibilidade | `scripts/qa/a11y-keyboard.mjs` (03/11/2026), 17 rotas a 1280 e 375 px. Em todas: 1º foco "Pular para o conteúdo"; ordem cabeçalho → conteúdo → rodapé; contorno ≥ 2 px em cada parada; um h1; sem saltos de nível; marcos presentes; controles com nome. **NVDA não foi executado** (não instalado nesta máquina) — ver §4 |
| Lighthouse mobile (runner do CI, mediana de 3) | v1.0.2 (PR #48): desempenho 0,90–0,93 em todas as 9 rotas (home 0,90; ensaio 0,92); acessibilidade, boas práticas e SEO **1,00**; JS ~188 KB |
| ASVS N1 (resumo) | Autenticação: senha ≥ 12, bloqueio 5/15 min, limite de taxa, sessão de 2 h, cookies seguros. Controle de acesso: funções puras testadas, `read` com `where`, acesso por campo. Validação e saída: Zod, serializer próprio, upload por *magic bytes*. Configuração: HSTS, CSP, `nosniff`, `frame-ancestors`, GraphQL desligado. Registro: auditoria imutável; Sentry sem PII. Primeira conta: `first-register` bloqueado em produção |
| Modo de manutenção | Unitários; ensaio em homologação: run `41154796846` (escrita 503 + aviso) e retorno ao normal, run `41155075798` |
| Rollback de aplicação | Ensaio em homologação (30/10/2026): alias → deploy anterior em 2,9 s e retorno em 3,0 s |
| Backup de produção | Pós-carga: run `41157755772`. Agendados diários com sucesso de 31/10 a 03/11 (ex.: `production-20261103T125112Z.dump.age`, 487 258 bytes, `age`, retenção de 30 dias) |
| Restauração | Run `41157882170`: a partir do bucket, branch temporário, **240 s** (RTO 1 h), 0 tabelas divergentes. Verificação mensal agendada de homologação em 03/11 com sucesso (run `41655546685`) |
| Monitoramento | `production-cron.yml`: 14 execuções agendadas de 31/10 a 03/11, todas verdes, mas com **cadência real de ~6 h** (mediana de 380 min) para um agendamento de 30 min. Monitor externo recomendado (ADR-0016) |
| Sentry | Erro forçado sem PII (homologado em 31/10/2026). Alerta real de 02/11/2026 diagnosticado e corrigido (§3) |

## 3. Correções pós-lançamento (v1.0.2, PR #48)

### 3.1 Alerta do Sentry `Error: undefined`

Issue 7825652445, `GET /privacidade`, 02/11/2026 21:43 UTC, release `1e43f3f`.

| Etapa | Resultado |
|---|---|
| Acesso ao evento no Sentry | Indisponível para o agente: sem token, API 401. Stack trace e breadcrumbs não consultados diretamente |
| Logs da Vercel | Indisponíveis: o plano Hobby não retém logs de runtime desse intervalo |
| Neon | O compute da branch `production` estava **ativo** às 21:43 (iniciado 21:32:56, suspenso 21:57:30): não foi partida a frio |
| Causa (reproduzida) | Falha de conexão com o Postgres durante a inicialização do Payload. O `@payloadcms/db-postgres@3.92` chama `rejectInitializing()` **sem argumento**, e a promise `initializing` rejeita com `undefined` sem observador → `unhandledRejection: undefined` → Sentry `Error: undefined` (`auto.node.onunhandledrejection`). Reprodução local: 1 rejeição por inicialização falha; com o banco saudável, 0 |
| Origem da falha de rede de 02/11 | **Não determinada** com as evidências disponíveis (oscilação transitória entre a função e o Neon é a hipótese mais provável). Risco residual baixo: evento isolado, recuperação automática, observabilidade melhorada |
| Impacto anterior | HTTP 200 com estados vazios e **404 em perfis e categorias/tags** durante a indisponibilidade. `/privacidade` exibia o texto padrão. Nada degradado ficou em cache |
| Correção | Motivo descritivo (`DatabaseUnavailableError`) e promise observada; timeout de conexão de 15 s; uma nova tentativa; indisponibilidade persistente → 500 com a página de erro do portal (capturada pelo Sentry com a causa real); erros comuns mantêm o fallback e passam a ser registrados. Nenhum tratamento global silenciado; Sentry mantido |
| Validação | Mesma reprodução após a correção: **0** rejeições não tratadas, páginas com 500 e recuperação automática; 8 testes unitários (o 1º reproduz o defeito original); produção v1.0.2 com fumaça verde |
| Situação da issue | **Não marcada como resolvida pelo agente** (sem acesso ao Sentry). Recomendação: resolver na próxima release e acompanhar recorrência; eventos futuros chegarão com a causa real |

### 3.2 Revisão mobile-first

Antes/depois: imagens em `docs/qualidade/mobile-s06/` (home, menu, O grupo, perfil, ensaio, rodapé — 375 px).

| Área | Problema observado nas capturas | Correção |
|---|---|---|
| Cabeçalho | Marca em 2 linhas, cabeçalho de 70 px | Marca em 1 linha a partir de 375 px; botão de menu de 44 px |
| Menu | Só 5 itens; tablet com itens quebrados ("O / grupo") | Itens de 48 px + links de apoio (contato, páginas legais); menu móvel até 1024 px |
| Home | Hero ocupava ~1,5 tela; links de "O grupo" antes do texto | Chamadas na 1ª tela; ordem de leitura corrigida; altura total −17% a 375 px |
| Hierarquia | Nome da linha (36 px) maior que o título da seção (24–30 px) | Nome da linha ≤ título da seção em todas as larguras de celular |
| Seções de "O grupo" | Pílulas com rolagem horizontal cortada | Pílulas quebram em linhas, todas visíveis |
| Perfil / ensaio | Avatar de 128 px isolado; trilha com título longo; "·" órfão | Avatar proporcional; trilha truncada; metadados sem separador órfão |
| Rodapé | ~2 telas em coluna única; links de 24 px com 8 px de espaço; faixa branca solta | Duas colunas; alvos de 44 px; sem faixa solta |
| Alvos de toque | Vários abaixo de 24 px (marca, autores, linhas) | Todos ≥ 24 px (WCAG 2.5.8), verificados em 320/375/390/430 px |

Testes: 14 E2E novos (`tests/e2e/mobile.e2e.spec.ts`), axe em todas as larguras, desktop 1280 px sem regressão.

## 4. Pendências rastreáveis (não bloqueiam a operação)

| Item | Responsável | Próxima ação |
|---|---|---|
| Textos definitivos do grupo e das linhas (Q7) | Coordenador | Publicar no painel e desmarcar "provisório" |
| Perfis com autorização individual — no mínimo os líderes | Coordenador | Termo individual + registro em **Consentimentos**; sem isso, nenhum perfil é publicado |
| ≥ 3 ensaios reais com autorização dos autores; política editorial e licença (Q8) | Coordenador | Fluxo editorial no painel |
| Demonstração "o coordenador publica um ensaio e atualiza um perfil sem ajuda" | Coordenador + responsável técnico | Realizar com o primeiro ensaio e o primeiro perfil reais (conta `editor` já existe) |
| Controlador formal e canal do titular (Q4); e-mail de contato do grupo | Coordenador | Hoje a política remete a `/o-grupo/contato`, que ainda não tem e-mail |
| Referência do arquivamento do registro escrito original do coordenador | Responsável técnico | Anotar data, meio e local em `questoes-institucionais.md` §1 |
| Avaliação com NVDA | Responsável técnico | Roteiro: rotas do M1 com NVDA + Chrome no Windows; registrar aqui |
| Captura do e-mail de recuperação em **homologação** (sandbox) | Responsável técnico | Opcional: `SMTP_*` sandbox + `EMAIL_SMTP_IS_SANDBOX=true` no ambiente `staging`. A produção já está homologada |
| Search Console | Responsável técnico | Procedimento em `docs/runbooks/deploy.md` (TXT no DNS da Vercel + envio do sitemap) |
| Monitor externo de disponibilidade | Responsável técnico | UptimeRobot/Better Stack gratuito, 5 min, alerta por e-mail (`docs/runbooks/deploy.md`) |
| Resolver a issue 7825652445 no Sentry e acompanhar recorrência | Responsável técnico | Marcar como resolvida na v1.0.2; reabrir se reaparecer |
| Verificação de backups e monitoramento após 7 dias (DoD) | Responsável técnico / agente | Janela inicia em **07/11/2026**; não concluída nesta data |
