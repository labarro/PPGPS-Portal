# Backup e restauração (S02)

Decisão: ADR-0012. Scripts: `scripts/backup/`. Workflows: `.github/workflows/backup.yml` e `restore-check.yml`.

## O que existe

| Item | Quando | Onde | Retenção |
|---|---|---|---|
| `pg_dump` de homologação criptografado com `age` | Diário (05:17 UTC) e sob demanda | R2 `ppgps-backups/staging/` (com credenciais de backup) ou artefato do GitHub enquanto elas faltarem | 7 dias |
| Verificação de restauração em branch Neon temporário | Mensal (dia 3) e sob demanda | Branch `restore-check-<run>`, removido ao final (expira em 24 h de qualquer forma) | — |
| Produção | A partir da S06 | — | 30 diários + 12 mensais |

## Chaves

- **Pública** (`age1…`): variável `BACKUP_AGE_RECIPIENT` do repositório. Só cifra.
- **Privada** (`AGE-SECRET-KEY-…`): segredo `BACKUP_AGE_IDENTITY` no ambiente GitHub `backups` (usado só pela verificação de restauração) e no **cofre do supervisor**, com cópia selada. Nunca no repositório, em logs ou em mensagens. Sem ela, os backups são irrecuperáveis.

## Executar manualmente

1. Actions → "Backup criptografado (homologação)" → *Run workflow*.
2. Actions → "Verificação de restauração (branch temporário)" → *Run workflow* (opcional: id do run do backup).
3. O resumo do job mostra o tempo de restauração e a tabela de contagens (backup × restaurado).

## Restauração de emergência (manual)

1. Criar um banco **vazio** de destino (branch Neon novo, nunca `production` sem plano de incidente).
2. Baixar `*.dump.age` e `*.manifest.json` (R2 `ppgps-backups/staging/AAAA/MM/` ou artefato do run).
3. Salvar a chave privada num arquivo temporário com permissão 600 e executar, num ambiente com PostgreSQL 18, `age` e `jq`:
   `TARGET_DATABASE_URL=… BACKUP_AGE_IDENTITY_FILE=… bash scripts/backup/restore.sh <dump.age> <manifest.json>`
4. Apagar o arquivo da chave. Registrar o incidente e o tempo.

O runbook completo de incidente e rollback é da S06.

## Teste local

Com o docker-compose ativo, o ciclo completo pode ser executado em contêiner `postgres:18-alpine` (com `apk add age jq bash coreutils`) contra um banco temporário vazio do Postgres local. Executado na S02: 25 tabelas conferidas, 0 divergências (ver `docs/PROGRESS.md`).
