# ADR-0012 — Backup criptografado com `age` e verificação de restauração

| Campo | Valor |
|---|---|
| Status | **Aceito** |
| Data | 22/10/2026 |
| Sprint | S02 |
| Autor | Agente |
| Aprovação | Responsável técnico (supervisor), 22/10/2026 — aprovação formal expressa na finalização da S02 |

## Contexto

Planejamento 17.5 e 24.5: backup diário criptografado em bucket dedicado, restauração testada antes de existir dado real (S02 em homologação), RPO ≤ 24 h e RTO ≤ 4 h. Orçamento R$ 0. O Neon Free oferece apenas histórico curto, que não substitui backup.

## Decisão

1. `pg_dump` (formato custom, PostgreSQL 18, contêiner `postgres:18-alpine`) é **criptografado em fluxo** com `age` (X25519) usando apenas a **chave pública** (`BACKUP_AGE_RECIPIENT`, variável do repositório). O dump em claro nunca é gravado em disco (`scripts/backup/backup.sh`).
2. Um manifesto sem dados pessoais acompanha o arquivo: SHA-256, tamanho, versão do servidor e contagem de linhas por tabela.
3. Destino: bucket `ppgps-backups`, prefixo `staging/AAAA/MM/`, retenção de 7 dias em homologação, com **credenciais exclusivas** (`R2_BACKUP_ACCESS_KEY_ID`/`R2_BACKUP_SECRET_ACCESS_KEY` no ambiente GitHub `backups`). Enquanto essas credenciais não existirem, o arquivo criptografado fica como artefato do GitHub por 7 dias (seguro, pois está cifrado) e o workflow emite aviso.
4. **Chave privada:** gerada localmente, nunca versionada nem impressa; guardada pelo supervisor em cofre (com cópia selada) e cadastrada como segredo `BACKUP_AGE_IDENTITY` **somente** no ambiente `backups`, usado exclusivamente pela verificação de restauração.
5. **Verificação de restauração** (`restore-check.yml`, mensal e sob demanda): cria branch Neon temporário `restore-check-<run>` a partir de `seed` (com expiração de 24 h como rede de segurança), cria nele um banco **vazio**, descriptografa direto para o `pg_restore --single-transaction`, compara contagens com o manifesto, verifica migrations e chaves estrangeiras, registra o **tempo** no resumo do job e remove o branch. Os scripts recusam `production`, `staging`, `seed` e bancos de destino não vazios.
6. Produção: o mesmo mecanismo será ativado na S06 (`ALLOW_PRODUCTION_BACKUP`), não antes.

## Alternativas consideradas

- **GPG:** mais complexo e propenso a erro de configuração; `age` é simples, auditado e sem estado.
- **Restaurar no Postgres de serviço do runner:** isolado e gratuito, mas a ficha pede branch temporário no mesmo provedor (aproxima o cenário real de recuperação). O teste local usa um banco temporário no Docker.
- **Backups nativos/PITR pagos:** fora do orçamento.

## Consequências

- Perder a chave privada torna os backups irrecuperáveis: a guarda em cofre com cópia selada é obrigatória (pendência do supervisor).
- A cópia semanal fora da Cloudflare (planejamento 24.5) e o backup de arquivos de mídia ficam para a S06, junto com o backup de produção.
- Custo: dumps pequenos (KB–MB) e poucas operações por dia; dentro da faixa gratuita do R2 e do GitHub Actions.

## Referências

Planejamento v1.3: 17.5, 24.5, 24.6. ADR-0005, ADR-0009. `docs/operacao/backup.md`.
