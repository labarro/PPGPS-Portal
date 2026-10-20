# ADR-0008 — Detecção de *drift* e verificação de migrations no CI

| Campo | Valor |
|---|---|
| Status | Proposto (aguarda aceite do supervisor) |
| Data | 20/10/2026 |
| Sprint | S01 |
| Autor | Agente |
| Aprovação | — |

## Contexto

O ADR-0005 e o `AGENTS.md` §6.8 exigem que o CI bloqueie PRs quando: as migrations não aplicam em banco limpo; existe *drift* (alteração de schema sem migration); `down`/`up` da última migration falha. O mecanismo exato de *drift* e a premissa de que as migrations rodam em transação (planejamento 24.6) deviam ser confirmados na S01.

## Investigação (Payload 3.91.0, `@payloadcms/drizzle`)

- `payload migrate:create` compara o schema derivado da **configuração** com o **snapshot JSON da migration mais recente** em `src/migrations` (não com o banco). Com `--skip-empty`, encerra com código 0 **sem criar arquivo** quando não há diferença.
- `payload migrate` executa **cada migration em uma transação própria** (`initTransaction` → `up` → registro em `payload-migrations` → `commitTransaction`; em erro, `killTransaction` e saída com código 1). Premissa da seção 24.6 **confirmada por migration** (não por lote: em um lote com várias migrations, as anteriores à que falhou permanecem aplicadas).
- `payload migrate:down` reverte o **último lote** (*batch*), cada migration em transação.
- O adaptador está com `push: false` em todos os ambientes: o schema só muda por migrations.

## Decisão

Workflow `migrations-check.yml` (bloqueante, em todo PR e na `main`), com Postgres 18 de serviço:

1. **Banco limpo:** `pnpm migrate` e `pnpm migrate:status`.
2. ***Drift*:** `pnpm migrate:check` (`scripts/migrations/check-drift.mjs`) executa `payload migrate:create drift_check --skip-empty`; se algum arquivo for gerado, imprime o SQL pendente, remove os arquivos gerados e **falha**. Validado localmente: adicionar um campo sem migration → falha com `ALTER TABLE "users" ADD COLUMN ...`; sem alteração → sucesso.
3. **Artefatos gerados:** `pnpm generate:types` e `pnpm generate:importmap` não podem alterar `src/payload-types.ts` nem o `importMap.js` versionados.
4. **Reversibilidade:** `pnpm migrate:down` seguido de `pnpm migrate` e `migrate:status`.

Regras complementares: migrations sempre geradas por `pnpm migrate:create <nome>` no mesmo commit da mudança de schema; migrations aplicadas em `staging`/produção nunca são editadas.

## Alternativas consideradas

| Alternativa | Prós | Contras | Motivo da rejeição |
|---|---|---|---|
| Comparar `pg_dump --schema-only` (migrations x `push`) | Compara bancos reais | Falsos positivos por ordem de colunas (`ALTER ... ADD COLUMN` x criação direta) | Ruído alto; o snapshot do Payload é a fonte de verdade |
| `neondatabase/schema-diff-action` | Diff visual no PR | Compara branches Neon, não configuração x migrations; exige segredos no CI de PR | Não detecta schema sem migration |
| `push` em CI | Simples | Mascara a ausência de migration | Proibido (ADR-0005) |

## Consequências

- PR com alteração de schema sem migration falha no CI com mensagem indicando o comando a executar.
- *Drift* causado por edição manual de uma migration já gerada (SQL diferente do snapshot) **não** é detectado por este mecanismo; é mitigado pela regra de nunca editar migrations e pela revisão do PR.
- Transação por migration: migrations de dados longas devem ser separadas (AGENTS.md §6.6) para evitar bloqueios prolongados.

## Referências

- ADR-0005; planejamento v1.2, 24.3 e 24.6; `AGENTS.md` §6.
- Código-fonte de `@payloadcms/drizzle@3.91.0` (`migrate.js`, `migrateDown.js`, `utilities/buildCreateMigration.js`).
