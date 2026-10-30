# Runbook — Restauração do banco de produção

> ADR-0012, planejamento 24.5. **RPO**: 24 h (backup diário) ou o ponto `predeploy-*` do último deploy. **RTO**: 1 h.

## Opção A — ponto de restauração do deploy (Neon, mais rápido)

Use quando o problema surgiu no último deploy (migration ou carga).

1. Ative o modo de manutenção: reexecute `deploy-production.yml` com `maintenance=true` (ver `deploy.md`).
2. Identifique o ponto `predeploy-<tag>-<run>` desejado:

   ```bash
   neon branches list --project-id <NEON_PROJECT_ID>
   ```

3. Restaure a branch `production` a partir dele, preservando o estado atual para análise:

   ```bash
   neon branches restore production predeploy-<tag>-<run> --preserve-under-name production-antes-da-restauracao --project-id <NEON_PROJECT_ID>
   ```

   A URL de conexão de `production` não muda.
4. Faça o rollback da aplicação para a versão compatível (`rollback.md`) e desative a manutenção.

## Opção B — backup criptografado diário (bucket `ppgps-backups`)

1. **Ensaio** (sempre antes de mexer na produção): `gh workflow run restore-check.yml -f label=production`. O workflow:
   - restaura em branch Neon temporário;
   - confere as contagens com o manifesto;
   - cronometra a operação;
   - remove o branch.
2. Restauração real: siga `docs/operacao/backup.md` (`scripts/backup/restore.sh` aceita somente banco vazio). Crie um branch novo e vazio, restaure nele e confira. Em seguida, aponte `DATABASE_URL`/`DATABASE_URL_POOLED` do ambiente `production` para ele, ou restaure `production` a partir desse branch (Opção A, passo 3).
3. A chave privada `age` fica no cofre do supervisor e no segredo `BACKUP_AGE_IDENTITY` (ambiente `backups`). Nunca a copie para a máquina local sem necessidade.

## Depois

- Registre: horário, causa, RPO/RTO efetivos e registros afetados em `docs/PROGRESS.md`.
- Se houve exposição de dados pessoais, siga `incidente.md` (LGPD).
