# ADR-0014 - Domínio oficial de produção `bioeticaps.app`

| Campo | Valor |
|---|---|
| Status | Proposto |
| Data | 30/10/2026 |
| Sprint | S04 (registro); ativação pública na S06 |
| Autor | Agente |
| Aprovação | Decisão do domínio: responsável técnico (supervisor), 30/10/2026. Detalhes técnicos deste ADR: pendente (supervisor) |

## Contexto

- Q3 (ADR-0010): hospedagem própria, independente do site institucional, e domínio próprio "a adquirir no futuro". O planejamento v1.3 (24.1, 25.1) e a ficha S06 tratavam o domínio como opcional.
- Em 30/10/2026 o responsável técnico declarou que o domínio definitivo do portal é **`https://bioeticaps.app`** e que já o adicionou manualmente ao projeto `ppgps-portal` na Vercel. O domínio deixa de ser aquisição futura e passa a integrar a infraestrutura oficial planejada.
- Adicionar o domínio à Vercel **não** autoriza publicar o portal: a ativação pública continua reservada à S06 (autorização do responsável técnico + confirmação do coordenador).
- O código usava `SERVER_URL` → `VERCEL_URL` → localhost para URLs absolutas (canônica, Open Graph, sitemap, robots, JSON-LD, links de e-mail). Em produção, `VERCEL_URL` é o endereço do deploy (`*.vercel.app`), inadequado como canônica.

### Verificação realizada em 30/10/2026 (agente, somente leitura)

| Item | Resultado |
|---|---|
| Associação | `vercel domains inspect`: `bioeticaps.app` no escopo `labarros-projects`, projeto **`ppgps-portal`**; API de domínios do projeto: `verified: true`, sem redirecionamento nem branch Git associada (aponta para o alvo *production*) |
| Registro / DNS | Registrador terceiro; nameservers `ns1/ns2.vercel-dns.com` (pretendidos = atuais); apex `A` → IPs da Vercel; `www.bioeticaps.app` resolve para a Vercel, mas **não** está adicionado ao projeto |
| HTTPS | Certificados emitidos pela Vercel em 29/10/2026 para `bioeticaps.app` e `*.bioeticaps.app` (validade de 90 dias, renovação automática). Da rede do agente, um proxy de inspeção TLS (Fortinet) re-assina o certificado, por isso a validação local não é conclusiva; verificado de fora (check-host.net, 3–4 países): HTTPS funcional e `http://` → **308** para `https://` |
| Deployment servido | **Nenhum.** `https://bioeticaps.app/` e `https://www.bioeticaps.app/` → **404 `DEPLOYMENT_NOT_FOUND`** (página genérica da Vercel). Não há alias de deploy para o domínio |
| Alvo *production* do projeto | Um único deploy de produção, de 20/10/2026 (setup da S01, `vercel deploy --prod` manual pela CLI, commit "first commit"), com **falha de build** (`ERROR`, sem artefatos). Nenhum deploy de produção bem-sucedido existe |
| Exposição antecipada | **Nenhuma**: o domínio não serve conteúdo do portal, painel, API nem dados |
| Deploy por Git | Repositório conectado ao projeto, mas `vercel.json` → `git.deploymentEnabled: false` (nenhum deploy automático; comprovado pelo histórico) |
| Proteção da Vercel | `ssoProtection = all_except_custom_domains`: domínios personalizados **não** passam pela *Vercel Authentication*. Hoje sem efeito (nada é servido); em produção é o comportamento desejado. Por isso o domínio **nunca** pode ser alias de preview/homologação |

## Decisão

1. **`https://bioeticaps.app` é o domínio definitivo planejado para produção** (forma canônica: apex, HTTPS, sem `www`).
2. **URL base por ambiente** (`src/lib/env/server-url.ts`):
   - produção (`APP_ENV=production`): `SERVER_URL` se definida; senão `https://bioeticaps.app` (nunca `VERCEL_URL`);
   - local, preview e homologação: `SERVER_URL` → `VERCEL_URL` → localhost, como antes. Se alguma dessas variáveis apontar para `bioeticaps.app` (ou subdomínio), ela é **ignorada** — o domínio de produção nunca vira URL base fora da produção.
   - Homologação continua em `https://ppgps-portal-staging.vercel.app` (`STAGING_DOMAIN`); previews mantêm `VERCEL_URL`.
3. Canônica, Open Graph, `metadataBase`, sitemap, `robots.txt` (linha `Sitemap`) e JSON-LD usam essa URL base; portanto, em produção, apontam para `bioeticaps.app` sem alteração de código na S06.
4. **Redirecionamento de produção:** somente em `APP_ENV=production`, `www.bioeticaps.app` → **308** para `https://bioeticaps.app` (preservando caminho e query). Fora da produção o proxy não redireciona por host.
5. `deploy-production.yml` passa `SERVER_URL=https://bioeticaps.app` (sobrescrevível pela variável `PRODUCTION_DOMAIN`). O workflow continua travado por `PRODUCTION_DEPLOY_ENABLED` e pelo dono do repositório.
6. Até a S06: nenhum deploy de produção; nenhum alias de preview/homologação para `bioeticaps.app` ou subdomínios; `noindex`/autenticação básica mantidos fora da produção; nenhum redirecionamento do domínio para homologação.
7. Na S06 (ativação), checklist: adicionar `www.bioeticaps.app` ao projeto como redirecionamento para o apex (painel da Vercel) ou manter o redirecionamento do proxy; remover/arquivar o deploy de produção com falha de 20/10/2026; conferir certificado de fora da rede local; Search Console; fumaça no domínio.

## Alternativas consideradas

| Alternativa | Prós | Contras | Motivo da rejeição |
|---|---|---|---|
| Continuar com `VERCEL_URL` em produção | Nada a mudar | Canônica e sitemap apontariam para `*.vercel.app` do deploy, mudando a cada release | Ruim para SEO e para links de e-mail |
| Usar `bioeticaps.app` como URL base também em homologação | Links "reais" | Viola a separação de ambientes e induz indexação/links para produção a partir de homologação | Proibido pelo responsável técnico |
| Redirecionar todos os hosts não canônicos em produção (inclusive `*.vercel.app`) | Canonicalização forte | Quebraria a fumaça pós-deploy que acessa a URL do deploy | Avaliar na S06; a canônica já resolve a indexação |
| `www` como forma canônica | Convenção antiga | Endereço mais longo; o domínio foi adicionado como apex | Apex escolhido |

## Consequências

- Positivas: metadados, sitemap e robots corretos em produção sem trabalho adicional na S06; salvaguarda contra uso acidental do domínio de produção em outros ambientes.
- Negativas: o domínio é constante no código (mudança futura exige PR ou `SERVER_URL`).
- Riscos: (a) qualquer `vercel deploy --prod` manual publicaria imediatamente no domínio — mitigado pela regra de deploys somente pelo pipeline e pela trava `PRODUCTION_DEPLOY_ENABLED`; (b) domínios personalizados não têm *Vercel Authentication* — nunca associar o domínio a deploys não produtivos; (c) renovação do domínio é responsabilidade do supervisor (registrador terceiro; custo não informado ao agente).
- A fazer: S06 — ADR de hospedagem de produção referenciando este ADR; checklist do item 7 da decisão.

## Referências

- Planejamento v1.4: seções 1, 16.7, 24.1, 24.2, 25.1 e 32 (Q3).
- ADR-0003 (hospedagem gratuita até o M1), ADR-0005 (ambientes), ADR-0009 (deploy controlado), ADR-0010 (Q3), ADR-0013 (renderização e 301).
- Vercel — *Domains* e *Deployment Protection* (documentação oficial).
