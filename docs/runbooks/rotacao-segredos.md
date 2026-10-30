# Runbook — Rotação de segredos

> AGENTS §9.1. Rotacione imediatamente em caso de suspeita de vazamento; caso contrário, uma vez por ano. Nunca imprima valores em logs ou chats.

| Segredo | Onde está | Como rotacionar | Efeito |
|---|---|---|---|
| `PAYLOAD_SECRET` | `production`, `staging`, `preview` | Gerar 48 bytes aleatórios → `gh secret set PAYLOAD_SECRET --env <amb>` → novo deploy | Encerra todas as sessões; tokens de recuperação pendentes deixam de valer |
| Senha do banco (`neondb_owner`) | `DATABASE_URL*` (`production`), `PRODUCTION_DATABASE_URL` (`backups`) | `neon roles reset-password neondb_owner --branch production` → atualizar os 3 segredos → novo deploy | Conexões antigas falham até o deploy |
| `NEON_API_KEY` | `production`, `preview`, `backups` | Console Neon → API keys → criar nova, revogar a antiga | Pipelines param até a troca |
| `VERCEL_TOKEN` | `production`, `staging`, `preview` | Vercel → Account → Tokens → criar (escopo do time), revogar o antigo | Deploys param até a troca |
| Tokens R2 | `R2_*` por ambiente; `R2_BACKUP_*` em `backups` | Cloudflare → R2 → Manage API tokens → *Object Read & Write* somente no bucket do ambiente → revogar o antigo → `r2-maintenance.yml` para auditar o isolamento | Uploads param até o deploy |
| SMTP | `SMTP_*` (`production`) | Painel do provedor → nova senha/chave → atualizar → novo deploy | Recuperação de senha indisponível até o deploy |
| `SENTRY_DSN` | `production`, `staging` | Sentry → Client Keys → nova chave, desativar a antiga | DSN é público por natureza; troque se houver abuso |
| `CRON_SECRET` | `production` e `production-cron` (mesmo valor) | Gerar ≥ 32 caracteres → atualizar os dois → novo deploy | Agendador falha (401) até ambos coincidirem |
| `BASIC_AUTH_*` | `staging`, `preview` | Atualizar → reexecutar `deploy-staging.yml` | Revisores precisam das novas credenciais |
| Chave `age` | Pública: variável `BACKUP_AGE_RECIPIENT`; privada: `BACKUP_AGE_IDENTITY` + cofre | `age-keygen` → atualizar ambas → **manter a privada antiga** até expirarem os backups cifrados com ela (30 dias) | Backups novos usam a chave nova |

Depois de rotacionar:

1. Rode a fumaça (`deploy.md`).
2. Registre a data em `docs/PROGRESS.md`, sem valores.
