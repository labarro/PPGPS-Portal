# Convenções de Git: branches, commits, PRs e releases

> Aplicáveis a partir da S01. Baseadas no planejamento v1.2 (seções 22.2, 23.3, 24.4 e 29.4) e no ADR-0005.
> Instruções explícitas do supervisor em uma sessão prevalecem (ex.: "não faça commit").

## 1. Branches

| Branch | Uso | Regras |
|---|---|---|
| `main` | Código revisado; publicado automaticamente em **homologação** (`staging`) | Protegida; só recebe merge **squash** de PR aprovado com CI verde |
| `sXX-nome-curto` | Trabalho de uma sprint (ex.: `s01-setup-pipeline`, `s05-blog-editorial`) | Criada a partir da `main` atualizada; uma por sprint |
| `sXX-nome-curto-ajuste` | Sub-branch opcional quando a sprint precisar de PRs menores | Mesmo prefixo da sprint |
| `fix-descricao-curta` | Correção urgente fora de sprint (*hotfix*) | Vira release `vX.Y.Z+1` após aprovação |
| `docs-descricao-curta` | Alteração somente documental fora de sprint (ex.: mudança no `AGENTS.md`) | Revisão do supervisor obrigatória |

Nomes em minúsculas, sem acentos, com hífens.

## 2. Commits — Conventional Commits

Formato: `tipo(escopo): descrição no imperativo, em português, sem ponto final`

- **Escopo** = identificador da sprint (`s01` … `s20`); fora de sprint use o módulo (`docs`, `ci`, `deps`, `security`).
- **Tipos**: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`, `build`, `perf`, `style`, `revert`.
- Cabeçalho ≤ 100 caracteres; corpo opcional explicando o **porquê**; rodapé com `BREAKING CHANGE:` ou `Refs: #N` quando aplicável.
- Commits **pequenos**, cada um com testes passando.
- Toda alteração de schema leva **no mesmo commit** a migration (`pnpm migrate:create`) e os tipos regenerados.
- Proibido commitar `.env`, segredos, dumps de banco, dados reais de discentes ou arquivos gerados não versionados.

Exemplos:

```text
docs(s00): adicionar fichas das sprints S01 a S11
feat(s04): criar coleção people com validação de ORCID
test(s04): cobrir vazamento de discentes sem consentimento
fix(s05): impedir transição rascunho -> publicado por pesquisador
ci(s01): adicionar verificação de drift de migrations
```

Validação automática: **Commitlint** + **Husky** + **lint-staged** (configurados na S01).

**Proibições para agentes:** `git push --force`, reescrever histórico publicado, alterar `git config`, pular hooks (`--no-verify`), criar commits vazios ou usar modo interativo (`-i`) — salvo pedido explícito do supervisor. Commits e push só quando autorizados na sessão.

## 3. Pull Requests

- Título no formato de commit: `feat(s03): portal institucional, linhas, grupos e homepage v1`.
- Um PR por sprint (ou poucos PRs menores com o mesmo prefixo), sempre contra a `main`.
- Merge **squash**; a mensagem final segue Conventional Commits.

**Modelo de descrição:**

```markdown
## Resumo
<o que foi feito e por quê>

## Sprint
SXX — <nome> (ficha: docs/sprints/SXX.md)

## Critérios de aceite
- [x] critério 1 — evidência (teste, print, link do preview)
- [ ] critério 2 — pendente: <motivo>

## Verificação local
pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build

## Migrations
<lista de migrations; expand/contract quando aplicável>

## Dependências novas
<nome — justificativa; ADR se estrutural>

## Pendências e riscos
<itens registrados em docs/PROGRESS.md>

## Roteiro de homologação
<passos da ficha a executar no preview>
```

**Pré-requisitos de merge:** CI verde (lint, typecheck, unit, integração, E2E, build, gitleaks, `pnpm audit`, verificação de migrations); revisão e aprovação do supervisor; conversas resolvidas.

## 4. Releases

- **Versionamento semântico** `vX.Y.Z` com tags anotadas na `main`.
- Produção só recebe código por **release aprovada manualmente** pelo supervisor (ambiente protegido no GitHub Actions).
- Marcos previstos:

| Release | Conteúdo |
|---|---|
| `v0.x.y` | Builds de homologação antes do M1 (opcional, para referência) |
| `v1.0.0` | **M1** — primeira publicação (S06) |
| `v1.x.y` | Correções e ajustes pós-M1 |
| `v2.0.0` | **M2** — MVP completo (S11) |
| `v2.x.y` / `v3.0.0` | Evoluções V2/V3 conforme impacto |

- Cada release possui notas (GitHub Release) com: mudanças, migrations, se exige modo de manutenção, plano de rollback e verificação pós-deploy.
- Release com migration segue o pipeline do ADR-0005: ponto de restauração → (manutenção) → migrate → deploy → fumaça.
- `CHANGELOG` gerado a partir dos commits (ferramenta definida na S01, se adotada).

## 5. Proteção da `main` no GitHub (configuração manual pelo supervisor)

Agentes **não** alteram configurações do repositório. Checklist para o supervisor:

- [ ] Exigir PR para merge na `main` (bloquear push direto)
- [ ] Exigir ao menos 1 aprovação (supervisor)
- [ ] Exigir *status checks* do CI aprovados e branch atualizada antes do merge (ativar quando o CI existir, na S01)
- [ ] Permitir apenas **squash merge**
- [ ] Bloquear *force push* e exclusão da `main`
- [ ] Exigir resolução de conversas antes do merge
- [ ] Ambiente `production` no GitHub Actions com aprovação manual obrigatória
- [ ] Ativar secret scanning / push protection (se disponível no plano) e Dependabot/Renovate

Situação atual: **pendente** (registrar a data de configuração em `docs/PROGRESS.md`).
