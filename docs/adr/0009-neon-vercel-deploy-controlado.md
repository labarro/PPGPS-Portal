# ADR-0009 — Neon (branches por ambiente) e deploy controlado pelo pipeline na Vercel

| Campo | Valor |
|---|---|
| Status | **Aceito** |
| Data | 20/10/2026 |
| Sprint | S01 |
| Autor | Agente |
| Aprovação | Responsável técnico (supervisor), 22/10/2026 — aprovação expressa dos ADRs 0001–0009 |

## Contexto

O ADR-0005 define quatro ambientes isolados, branches Neon `main`/`staging`/`seed` + efêmeros por PR, migrations em job dedicado e deploy automático de produção da Vercel desativado. Na S01 o supervisor criou o projeto Neon `ppgps-portal` (`fragrant-wildflower-16512089`, org `org-icy-morning-44249588`, região `aws-sa-east-1`, PostgreSQL 18, plano Free) com a branch padrão **`production`**, e indicou as instruções do Neon `neon init -y ... --services postgres` e `neon deploy`.

Documentação atual do Neon CLI 8.8.0 (consultada em 20/10/2026): `neon init` instala ferramentas de agentes, vincula o diretório (`.neon`) e **grava o `DATABASE_URL` da branch vinculada em `.env`**; com `--services` cria `neon.ts`. `neon deploy` é alias de `neon config apply`: aplica a política `neon.ts` (Auth, Data API, Functions, Storage, Realtime) — **não** publica a aplicação.

## Decisão

### Neon

1. **Não executar `neon init` nem `neon deploy`.** `init` gravaria a URL da branch `production` no `.env` local (viola "agentes nunca acessam produção" e "local usa Docker"); `deploy` só provisiona serviços Neon que o projeto não usa (Payload cuida de auth/API; R2 de arquivos). Sem `neon.ts` no repositório.
2. Neon CLI usado apenas como ferramenta de infraestrutura (instalação global; no CI via `pnpm dlx neon@8.8.0`), sempre com `--project-id` explícito.
3. Mapeamento de branches (a branch de produção **não** foi renomeada nem modificada):

| Ambiente | Branch Neon | Criação |
|---|---|---|
| Produção | `production` (equivale ao `main` do planejamento) | Supervisor (existente, padrão) |
| Homologação | `staging` | S01, `--schema-only` a partir de `production` (sem dados) |
| Base dos previews | `seed` | S01, `--schema-only` a partir de `production` (sem dados) |
| Preview por PR | `preview/pr-N` | `preview-db.yml`, filho de `seed`, expira em 7 dias, removido ao fechar o PR |
| Ponto de restauração | `predeploy-vX.Y.Z` | `deploy-production.yml`, filho de `production`, mantém os 2 últimos |

   Branches *schema-only* garantem que homologação e seed nunca herdem dados de produção (inclusive se recriados). Migrations da S01 aplicadas em `seed` e `staging`; **nenhuma operação na branch `production`**.
4. Limite do Free (10 branches): `preview-db.yml` recusa novo preview com 5 previews ativos; `expires_at` remove previews inativos automaticamente.
5. Conexões: migrations usam a URL direta; a aplicação usa a URL *pooled*.

### Vercel

1. Projeto `ppgps-portal` (escopo `labarros-projects`, Hobby), região de funções `gru1` (São Paulo, próxima ao Neon `sa-east-1`), Node 24.
2. **Deploy por Git desativado** (`vercel.json` → `git.deploymentEnabled: false`; repositório não conectado). Todo deploy é feito pelo GitHub Actions com a Vercel CLI: `vercel pull` → `vercel build` no runner → `vercel deploy --prebuilt` (`scripts/ci/vercel-deploy.sh`), com `APP_ENV`, `DATABASE_URL`, `PAYLOAD_SECRET` e autenticação básica passados por deploy (`--env`) a partir dos **GitHub Environments** `preview`, `staging` e `production` (segredos distintos por ambiente).
3. O Hobby não oferece ambientes personalizados: homologação é um deploy do alvo *preview* com `APP_ENV=staging` e alias fixo `ppgps-portal-staging.vercel.app` (variável `STAGING_DOMAIN`).
4. Produção só via `deploy-production.yml` (tag `vX.Y.Z` na `main` + aprovação manual no ambiente `production`); publicação pública apenas na S06. **Limitação verificada em 22/10/2026:** o repositório é privado em conta GitHub Free, que não oferece proteção de branch, *rulesets* nem revisores obrigatórios em ambientes (API → HTTP 403). Enquanto isso perdurar, o workflow tem uma trava própria: só executa com a variável `PRODUCTION_DEPLOY_ENABLED=true` (definida pelo supervisor) e quando disparado pelo dono do repositório. Decisão pendente do supervisor: GitHub Pro/Team, repositório público ou manter a trava compensatória.
5. A Proteção de Deploy da Vercel (*Vercel Authentication*) permanece ativa nos previews como camada adicional à autenticação básica. A fumaça do CI usa `VERCEL_AUTOMATION_BYPASS_SECRET` (bypass de automação habilitado em 22/10/2026, segredo nos ambientes `preview` e `staging`). Validado: sem bypass → 302 (SSO da Vercel); com bypass e sem credenciais do app → 401; com ambos → 200. Revisores humanos precisam de conta Vercel com acesso ao projeto, além da autenticação básica.
6. Alias de homologação criado pela API REST da Vercel (`POST /v2/deployments/{id}/aliases`) **após** a fumaça do deploy: tokens com escopo de projeto não funcionam com `vercel alias set --scope` (`User not found`).

### Proteção de ambientes não produtivos

`src/proxy.ts` (convenção `proxy` do Next 16): `APP_ENV` `preview`/`staging` exigem autenticação básica (sem credenciais configuradas → **503**, falha fechada); qualquer ambiente fora de `production` (inclusive `APP_ENV` ausente) responde `X-Robots-Tag: noindex`, também aplicado em `next.config.ts` e no `robots` dos metadados.

## Alternativas consideradas

| Alternativa | Prós | Contras | Motivo da rejeição |
|---|---|---|---|
| `neon init` + `neon deploy` (instruções do Neon) | Configuração em um comando | Grava credenciais de produção no `.env`; provisiona serviços desnecessários | Conflita com ADR-0005 e com a regra de não acessar produção |
| Integração Git nativa da Vercel | Simples | Deploy automático de produção e build com migrations fora do controle do pipeline | Conflita com ADR-0005 |
| Integração Neon ↔ Vercel (Marketplace) | Branch por preview automático | Cria branches a partir da branch padrão (produção) e acopla o banco ao build | Previews devem nascer de `seed` |
| `staging` como branch com dados de `production` | Dados reais em homologação | Copia consentimentos/auditoria | Proibido (ADR-0005) |

## Consequências

- Isolamento comprovado: cada ambiente tem branch e segredos próprios; nenhum ambiente não produtivo recebe URL de produção.
- **Risco:** a chave `NEON_API_KEY` (escopo de projeto) usada no ambiente `preview` também pode administrar a branch `production`. Mitigações: workflows de PR só rodam para branches do próprio repositório (forks excluídos); ambiente `preview` com segredos próprios; recomenda-se branch `production` protegida e/ou IP allowlist quando o plano permitir (S06).
- Validado na S01: deploy de homologação na Vercel conectado ao Neon `staging` respondeu 401 sem credenciais, 200 com credenciais + `noindex` + cabeçalhos, 404 em `/api/graphql` e 200 em `/admin`.
- Pendente de acessos: segredos/variáveis nos GitHub Environments e `VERCEL_TOKEN` para os workflows de preview/homologação.

## Referências

- ADR-0003, ADR-0005; planejamento v1.2, 12.3, 24.1–24.4.
- Neon CLI: <https://neon.com/docs/reference/neon-cli>, <https://neon.com/docs/cli/init>; `neondatabase/create-branch-action@v6`.
- Next.js 16 `proxy.ts` (documentação empacotada em `next/dist/docs`).
