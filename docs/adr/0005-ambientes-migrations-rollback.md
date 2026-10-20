# ADR-0005 — Ambientes isolados, pipeline de migrations, backup e rollback

| Campo | Valor |
|---|---|
| Status | Proposto (aguarda aceite do supervisor; conferido para o escopo do grupo em 20/10/2026, sem mudança de decisão) |
| Data | 19/10/2026 |
| Sprint | S00 |
| Autor | Agente |
| Aprovação | — |

## Contexto

Riscos R14 (migration corromper dados em produção) e R16 (vazamento entre ambientes) têm impacto alto. O projeto é executado por agentes de IA, com um único responsável técnico, e trata dados pessoais (LGPD). A versão 1.0 do planejamento executava migrations no build, o que impede trava de concorrência, rollback controlado e verificação prévia. RNF-08, RNF-17 e RNF-18 exigem deploy seguro, backup verificado e isolamento.

## Decisão

### 1. Quatro ambientes isolados

| Aspecto | Local | Preview (por PR) | Homologação (`staging`) | Produção |
|---|---|---|---|---|
| Origem | Máquina do agente/supervisor | Cada PR | Cada merge na `main` | Tag `vX.Y.Z` promovida manualmente |
| Banco | Postgres em Docker | Branch Neon efêmero `preview/pr-N` criado de `seed`, removido ao fechar o PR | Branch Neon `staging` | Branch Neon `main` |
| Dados | Fixtures fictícias | Fictícios + institucionais públicos verificados | Conteúdo real em revisão; nunca consentimentos/comprovantes/auditoria da produção | Reais |
| Arquivos | MinIO | `ppgps-preview/pr-N/` (expira em 7 dias) | `ppgps-staging` | `ppgps-prod` (objetos imutáveis) |
| E-mail | Mailpit/console | Capturado | Capturado ou restrito a domínios autorizados | Envio real |
| Segredos | `.env` local | Conjunto `preview` | Conjunto `staging` | Conjunto `production` (só supervisor) |
| Acesso | — | Autenticação básica + `noindex` | Autenticação básica + `noindex` | Público (admin autenticado) |

Regras: nenhum ambiente não produtivo acessa banco, bucket ou segredos de produção; cópias de produção só **sanitizadas** por script versionado e com aprovação do supervisor; o branch `seed` é recriado (migrations + seed fictício) sempre que o schema muda; workflow remove previews de PRs fechados ou inativos há 7 dias.

### 2. Migrations

1. Fonte de verdade: config do Payload + `src/migrations` (ADR-0002). `push` só no banco local.
2. Toda alteração de schema gera `payload migrate:create <nome>` no mesmo commit, com tipos regenerados.
3. **CI bloqueante**: aplicar todas as migrations em banco limpo; **detecção de *drift*** (gerar migration após aplicar e falhar se não vazia — mecanismo exato validado e registrado em ADR na S01); `down`/`up` da última migration quando houver `down`; aplicar no branch efêmero antes do deploy do preview.
4. ***Expand/contract*** obrigatório para mudanças destrutivas (duas releases), garantindo que a versão anterior do app funcione com o schema novo.
5. Migrations de dados idempotentes, em lotes, com contagem registrada.
6. **Nunca dentro de `next build`**: job dedicado no GitHub Actions com `concurrency` por ambiente, antes do deploy, seguido de `migrate:status`.
7. Migration aplicada em `staging`/produção nunca é editada; conflito entre branches → o PR mais recente rebaseia e regenera.

### 3. Pipeline

PR → CI (lint, typecheck, testes, build, gitleaks, audit, migrations) → branch Neon efêmero + migrate + preview → revisão → merge squash → job migrate `staging` + deploy homologação + fumaça → (marco/correção) tag `vX.Y.Z` com aprovação manual → **ponto de restauração** (branch Neon `predeploy-vX.Y.Z` + `pg_dump`) → modo de manutenção se necessário → migrate produção → deploy → fumaça → monitorar 24 h ou rollback. Deploy automático de produção da Vercel **desativado**.

### 4. Backup

| Item | Frequência | Destino | Retenção |
|---|---|---|---|
| `pg_dump` produção criptografado (`age`) | Diário | R2 `ppgps-backups` (credencial só escrita) | 30 diários + 12 mensais |
| Cópia fora da Cloudflare | Semanal | Backblaze B2 ou armazenamento institucional | 8 semanais |
| Ponto de restauração pré-deploy | Cada release com migration | Branch Neon + `pg_dump` | 2 branches; dumps 30 dias |
| Mídias e documentos | Semanal | Bucket de backup + cópia externa mensal | 90 dias |
| Homologação | Diário | Prefixo `staging/` | 7 dias |

Chave de criptografia fora do repositório (cofre do supervisor + cópia selada com um dos líderes do grupo). Restauração automática mensal com consultas de sanidade; teste manual completo na S02 (homologação), S06, S11 e trimestralmente. RPO ≤ 24 h; RTO ≤ 4 h. Histórico de 6 h do Neon não é estratégia de backup.

### 5. Rollback

| Cenário | Ação |
|---|---|
| Bug sem migration ou após *expand* | Reverter para o deploy anterior (minutos, sem perda) |
| Migration falha | Roda em transação [PREMISSA a confirmar na S01]; nada aplicado; deploy não publicado |
| Migration corrompe dados | Modo de manutenção → restaurar `predeploy` ou dump → reverter deploy → incidente (≤ 4 h) |
| Conteúdo errado | Restaurar versão do documento no Payload |
| Exclusão acidental | Restaurar dump em branch temporário e copiar registros por script |
| Perda do provedor | Restaurar dump em outro Postgres (plano B) |
| Vazamento de segredo | Rotacionar, invalidar sessões, revisar auditoria |

Runbooks em `docs/runbooks/` são criados na **S06** e ensaiados em homologação antes do M1.

## Alternativas consideradas

| Alternativa | Motivo da rejeição |
|---|---|
| Migrations no `next build` (v1.0) | Sem trava de concorrência; deploy e schema acoplados; rollback difícil |
| `push` automático em todos os ambientes | Perde histórico versionado; *drift* silencioso; risco de perda de dados |
| Preview compartilhando banco de homologação | Previews concorrentes se corrompem; risco de dados reais em PR |
| Confiar apenas no histórico do Neon | 6 h de retenção no Free; sem cópia fora do provedor |

## Consequências

- Maior complexidade de CI na S01 (workflows de migrations, preview-db, deploy) e S02 (backup/restore), compensada pela redução de R14/R16.
- Limite de 10 branches do Neon Free restringe previews simultâneos a 4–5.
- Mecanismos exatos (detecção de *drift*, deploy controlado pela Vercel CLI, transação das migrations) são validados na S01 e registrados em ADR.

## Referências

- Planejamento v1.2, seções 12.3, 17.5, 23.3, 24.2–24.7, 25.2 (R14, R16).
- `AGENTS.md` §6 e §7.
