# ADR-0002 — Persistência: Payload + `@payloadcms/db-postgres` (Drizzle), sem Prisma

| Campo | Valor |
|---|---|
| Status | Proposto (aguarda aceite do supervisor; conferido para o escopo do grupo em 20/10/2026, sem mudança de decisão) |
| Data | 19/10/2026 |
| Sprint | S00 |
| Autor | Agente |
| Aprovação | — |

## Contexto

O Payload CMS 3 gera e gerencia o schema do banco a partir da sua configuração (coleções, campos, relações, versões) e possui sistema próprio de migrations. Indicadores futuros (seção 26) exigirão consultas agregadas que podem ultrapassar o que a Local API oferece. É comum agentes de IA proporem Prisma por hábito, o que criaria uma **segunda fonte de verdade** de schema.

## Decisão

1. A **única** fonte de verdade do schema é a **configuração do Payload** + **migrations versionadas** em `src/migrations`, geradas por `payload migrate:create`.
2. Banco: **PostgreSQL 16+** com o adaptador oficial **`@payloadcms/db-postgres`** (Drizzle internamente).
3. **Prisma é proibido** no repositório (dependência, schema ou client).
4. Consultas especiais (indicadores, similaridade `pg_trgm`, FTS) usam **Drizzle/SQL parametrizado via o adaptador do Payload**, sempre com parâmetros e revisão; nunca concatenação de strings.
5. Extensões Postgres (`unaccent`, `pg_trgm`) são habilitadas **por migration** na sprint que precisar delas (S09).
6. Regras operacionais de migrations seguem o ADR-0005.

## Alternativas consideradas

| Alternativa | Prós | Contras | Motivo da rejeição |
|---|---|---|---|
| Prisma em paralelo ao Payload | Ferramenta conhecida; tipagem de consultas | Dois schemas conflitantes; migrations divergentes; *drift* garantido | Viola fonte única de verdade |
| `@payloadcms/db-mongodb` | Adaptador maduro | Relações N:N com atributos, transações e agregações menos naturais; FTS em português depende de outro serviço | Modelo acadêmico é relacional |
| SQL puro sem ORM para consultas especiais | Controle total | Sem tipagem; risco de injeção | Aceito apenas parametrizado e pontual, via adaptador |

## Consequências

- Tipos do banco e do app derivam do mesmo lugar (`payload-types.ts`), versionados no repositório.
- PRs que introduzam Prisma devem ser rejeitados na revisão (regra explícita no `AGENTS.md` §2).
- Consultas de indicadores (S10, V3) ficam em `src/modules/indicators/`, com testes de integração em Postgres real.

## Referências

- Planejamento v1.2, seções 11.2 (tabela de camadas), 12.2, 15.4, 24.3, 26.
- `AGENTS.md` §2 e §6.
