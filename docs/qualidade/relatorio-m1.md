# Relatório do M1 — primeira publicação

> Ficha S06. Situação em 31/10/2026 (UTC). Portal publicado em `https://bioeticaps.app` (release `v1.0.1`). Registros detalhados em `docs/PROGRESS.md`.

## 1. Publicação

| Item | Resultado |
|---|---|
| Autorização | Declaração expressa do responsável técnico (30/10/2026): aprovação das S00–S05 pelo coordenador, ciência e autorização do lançamento (`questoes-institucionais.md` §1) |
| Release | `v1.0.0` (parou na verificação do R2, antes do deploy) → `v1.0.1` (PR #40; deploy run `41157393442`) |
| Ponto de restauração | Branches Neon `predeploy-v1.0.1-41156459727` e `predeploy-v1.0.1-41157393442` |
| Domínio | `bioeticaps.app` 200 (região `gru1`); `www` → 308 para o apex; `http` → 308 para `https`; certificado válido até 27/01/2027 (renovação automática) |
| Fumaça de produção no CI | Run `41158557956` verde (rotas do M1, páginas legais, cabeçalhos, sem `noindex`, robots e sitemap no domínio, canônica, APIs administrativas fechadas, `first-register` 403, sem logotipo, nota de responsabilidade) |
| Conteúdo publicado | Perfil do grupo e 2 linhas temáticas (textos **provisórios** sinalizados, só fatos do DGP), páginas legais, menu e home padrão, categorias do blog. **Nenhuma pessoa e nenhum ensaio** (sem autorizações individuais nem ensaios reais fornecidos) |
| Contas | 1 `admin` (desenvolvedor). Conta `editor` do coordenador: a criar pelo admin |

## 2. Reauditoria

| Controle | Evidência |
|---|---|
| CSP em *enforce* | Cabeçalho em produção; E2E sem violações no console; 102/102 E2E contra `next start` (inclui fluxos do painel e pré-visualização) |
| Acesso de todas as coleções do M1 | Integração (114) + vazamento global E2E: rotas públicas, sitemap, feeds e API REST com `depth=2` sem e-mail privado, consentimento, auditoria, rascunho ou pessoa sem consentimento |
| Marca | E2E em todas as rotas públicas e legais: nenhum logotipo; nota de responsabilidade em `/sobre-o-portal`; fumaça de produção sem `<img>` institucional |
| Axe | Todas as rotas públicas (desktop e 360 px): 0 violações sérias/críticas |
| Lighthouse | Job do CI verde nos PRs #38–#41 (orçamentos e asserções inalterados) |
| ASVS N1 (resumo) | Autenticação: senha ≥ 12, bloqueio 5/15 min, limite de taxa, sessão de 2 h, cookies seguros. Controle de acesso: funções puras testadas, `read` com `where`, acesso por campo. Validação e saída: Zod, serializer próprio, upload por *magic bytes*. Configuração: HSTS, CSP, `nosniff`, `frame-ancestors`, GraphQL desligado. Registro: auditoria imutável; Sentry sem PII. Primeira conta: `first-register` bloqueado em produção |
| Modo de manutenção | Unitários; ensaio em homologação: run `41154796846` (escrita 503 + aviso) e retorno ao normal, run `41155075798` |
| Rollback de aplicação | Ensaio em homologação (30/10/2026): alias → deploy anterior (S05) em 2,9 s e retorno em 3,0 s, conferidos por `vercel inspect` |
| Backup de produção pós-carga | Run `41157755772`: `production-20261031T015739Z.dump.age` (485 786 bytes, `age`) no `ppgps-backups/production/`; retenção de 30 dias; diário a partir de agora |
| Restauração | Run `41157882170`: a partir do bucket, branch temporário, **240 s** (RTO 1 h), 0 tabelas divergentes, branch removido |
| Monitoramento | `production-cron.yml` a cada 30 min (disponibilidade + certificado) e agendador da publicação agendada (200 com `CRON_SECRET`) |
| Sentry | Erro forçado (`POST /api/users/sentry-test`) registrado no Sentry real **sem** e-mail, IP ou dados pessoais — verificado pelo responsável técnico em 31/10/2026 |
| SMTP de produção | E-mail de recuperação recebido e senha definida pelo responsável técnico em 31/10/2026 |

## 3. Pendências do M1

| Item | Responsável | Observação |
|---|---|---|
| Textos definitivos do grupo e das linhas (Q7) | Coordenador | Publicar no painel e desmarcar "provisório" |
| Perfis com autorização individual — no mínimo os líderes | Coordenador | Termo individual + `Consentimentos`; sem isso, nenhum perfil é publicado |
| ≥ 3 ensaios reais com autorização dos autores; política editorial (Q8) | Coordenador | Fluxo editorial no painel |
| Controlador formal e canal do titular (Q4); e-mail de contato do grupo | Coordenador | Hoje a política remete a `/o-grupo/contato`, que ainda não tem e-mail |
| Conta `editor` e treinamento; o coordenador publica um ensaio e atualiza um perfil sem ajuda | Supervisor + coordenador | Guia: `docs/guias/guia-do-editor.md` |
| Revisão manual com teclado e NVDA | Supervisor | Registrar aqui |
| Captura do e-mail de recuperação em **homologação** (sandbox) | Supervisor | Ambiente `staging` sem `SMTP_*`; critério da S02 ainda não comprovado em homologação |
| Search Console | Supervisor | Verificação por DNS (Vercel) |
| Arquivamento do registro escrito original do coordenador | Supervisor | Anotar referência em `questoes-institucionais.md` §1 |
| Verificação de backups e monitoramento após 7 dias (DoD) | Supervisor/agente | A partir de 07/11/2026 |
| Aceite do ADR-0016 | Supervisor | — |
