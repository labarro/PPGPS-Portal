# ADR-0007 — Versões fixadas da stack (S01)

| Campo | Valor |
|---|---|
| Status | **Aceito** |
| Data | 20/10/2026 |
| Sprint | S01 |
| Autor | Agente |
| Aprovação | Responsável técnico (supervisor), 22/10/2026 — aprovação expressa dos ADRs 0001–0009 |

## Contexto

O planejamento (11.2) e o `AGENTS.md` §2 exigem fixar na S01 versões exatas e compatíveis entre si de Node, Next.js, React e Payload, usando a combinação do template oficial do Payload (risco "compatibilidade Next/Payload" da ficha S01). Versões maiores só mudam em sprint dedicada.

## Decisão

1. Projeto inicializado a partir do template oficial `blank` do `create-payload-app@3.91.0` (Postgres), adaptado ao escopo da S01.
2. Versões fixadas (sem `^`/`~` no `package.json`; `pnpm-lock.yaml` versionado):

| Componente | Versão | Observação |
|---|---|---|
| Node.js | **24 LTS** (`.nvmrc` = `24`; `engines.node` = `>=24.11.0 <25`) | LTS ativa em out/2026; a Vercel usa `24.x` |
| pnpm | **10.34.7** (`packageManager`; `engines.pnpm` = `^10`) | Template aceita 9–11 |
| Payload (`payload`, `@payloadcms/*`) | **3.91.0** | `latest` em 20/10/2026 |
| Next.js | **16.3.8** | Template usa 16.3.3; atualizado no mesmo *minor* por segurança (GHSA de SSRF/otimização de imagem, corrigidos em 16.3.6/16.3.8). Faixa aceita pelo `@payloadcms/next@3.91.0`: `>=16.3.3 <17` |
| React / React DOM | **19.2.6** | Do template |
| TypeScript | 5.7.3 | Do template |
| PostgreSQL | **18** (Neon e `postgres:18-alpine` local/CI) | Projeto Neon criado em PG 18 (planejamento exige 16+) |
| sharp | 0.35.5 | 0.35.4 tinha GHSA alta |
| Vitest / Playwright | 4.1.12 / 1.58.2 | Vitest 4.0.x tinha GHSA crítica |

3. Exceções de auditoria registradas em `package.json` (`pnpm.auditConfig`/`overrides`):
   - `dompurify` forçado para `^3.4.16` (transitivo do editor Monaco no admin; GHSA baixa).
   - `GHSA-vfj7-8cjw-p6xm` (braces, *DoS* por padrões aninhados) ignorado: dependência **somente de desenvolvimento** via `eslint-config-next`, sem versão corrigida publicada. Reavaliar a cada atualização do Dependabot.
4. Dependabot ignora atualizações **maiores** de Next, Payload e React.

## Alternativas consideradas

| Alternativa | Prós | Contras | Motivo da rejeição |
|---|---|---|---|
| Next 16.4.x | Mais recente | Fora da combinação testada pelo template | Risco de incompatibilidade com o Payload |
| Manter Next 16.3.3 do template | Combinação exata do template | Vulnerabilidades altas/críticas conhecidas | Correção disponível no mesmo *minor* |
| Node 22 | LTS de manutenção | Fim de suporte mais próximo | Node 24 é a LTS ativa |
| Payload 4 (beta) | Novidades | Instável | Proibido usar versão não estável |

## Consequências

- Reprodutibilidade em local, CI e Vercel (`pnpm install --frozen-lockfile`).
- Atualizações de *patch/minor* chegam via Dependabot e passam pelo CI completo; *major* exige sprint dedicada.
- `pnpm audit --audit-level high` no CI bloqueia novas vulnerabilidades altas/críticas.

## Referências

- Planejamento v1.2, 11.2; `AGENTS.md` §2; ficha `docs/sprints/S01.md`.
- `npm view payload dist-tags` e template `create-payload-app@3.91.0 -t blank` (consultados em 20/10/2026).
