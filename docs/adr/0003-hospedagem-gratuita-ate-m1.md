# ADR-0003 — Hospedagem em planos gratuitos até a decisão de produção (antes do M1)

| Campo | Valor |
|---|---|
| Status | **Aceito** |
| Data | 19/10/2026 |
| Sprint | S00 |
| Autor | Agente |
| Aprovação | Responsável técnico (supervisor), 22/10/2026 — aprovação expressa dos ADRs 0001–0009 |


> **Nota de 22/10/2026 (ADR-0010, Q3):** o coordenador definiu hospedagem própria, independente do site institucional, e domínio próprio a adquirir no futuro. A alternativa "infraestrutura da UniCesumar" deixa de ser plano B. A decisão de produção continua na S06.

> **Nota de 30/10/2026 (ADR-0014):** o domínio definitivo de produção é `https://bioeticaps.app`, já associado ao projeto na Vercel e sem deploy servido; ativação pública na S06.

## Contexto

O projeto não tem orçamento aprovado para infraestrutura (RNF-14: operar em planos gratuitos até o lançamento). Desenvolvimento, previews e homologação precisam de banco Postgres com *branching* (previews isolados), armazenamento S3 compatível e CI. A hospedagem de produção depende de validação com os responsáveis do grupo (Q3 do planejamento v1.2: domínio e aceitação de hospedagem externa com dados possivelmente fora do Brasil). Revisado em 20/10/2026 para o escopo do grupo (ADR-0006), sem mudança na decisão.

Preços e limites verificados no planejamento em 19/10/2026 (seção 2.3):

| Serviço | Plano | Limites relevantes |
|---|---|---|
| Vercel | Hobby (US$ 0) | **Uso pessoal e não comercial**; 100 GB transferência; 1M invocações; 5 mil transformações de imagem/mês |
| Neon | Free | 100 CU-h/projeto; 1 GB; **10 branches**; histórico 6 h; scale-to-zero após 5 min |
| Cloudflare R2 | Free | 10 GB-mês; 1M op. classe A; 10M classe B; egress gratuito |
| GitHub Actions | Gratuito (limites da conta) | CI, migrations, deploys, backups, jobs |

## Decisão

1. **Da S01 até a S06**, usar exclusivamente planos gratuitos: **Vercel Hobby** (app; previews e homologação), **Neon Free** (branches `main`, `staging`, `seed` e efêmeros por PR), **Cloudflare R2 Free** (buckets por ambiente e de backup), **GitHub Actions** (CI/CD e jobs), Sentry/uptime/e-mail em planos gratuitos.
2. As contas técnicas são **criadas pelo supervisor** (S01); agentes nunca recebem credenciais de produção.
3. A **hospedagem de produção** será decidida em **ADR próprio na S06**, antes da primeira publicação, considerando: resposta à Q3, restrição de uso não comercial do Vercel Hobby e custos estimados (seção 25: Vercel Pro + Neon Launch + R2 ≈ US$ 25–40/mês [ESTIMADO]; alternativa VPS ≈ US$ 6–15/mês [ESTIMADO]).
4. O código **não** usa APIs proprietárias da Vercel no domínio, preservando o plano B (Docker/VPS ou infraestrutura da UniCesumar).
5. Mitigações dos limites gratuitos: no máximo 4–5 previews simultâneos (Neon 10 branches); variantes de imagem geradas no upload (Payload `imageSizes`); PDFs grandes apontam para o RDU; monitoramento de uso nos painéis.

## Alternativas consideradas

| Alternativa | Prós | Contras | Motivo da rejeição (por ora) |
|---|---|---|---|
| Vercel Pro + Neon Launch desde a S01 | Sem restrição comercial; mais recursos | Custo antes de existir valor publicado; sem orçamento aprovado | Prematuro; reavaliar na S06 |
| VPS com Coolify desde a S01 | Barato; controle total | Responsabilidade operacional (SO, segurança) desde o início | Aumenta carga do único responsável técnico |
| Infraestrutura da UniCesumar | Dados no país; sem custo direto | Exigiria autorização institucional, inexistente no escopo atual (ADR-0006) | Mantém-se apenas como plano B, se oferecida formalmente |

## Consequências

- Custo zero até o M1; decisões de custo só quando houver produto para publicar.
- **Risco:** manter o Hobby em produção conflita com a restrição de uso não comercial; por isso a decisão de produção é obrigatória antes do M1 (S06).
- **Risco:** transferência internacional de dados (LGPD) — região mais próxima (ex.: São Paulo) quando disponível; registrar na política de privacidade (S06).
- Portabilidade (RNF-15) garantida por Postgres padrão, S3 compatível e `next start`/Docker.

## Referências

- Planejamento v1.2, seções 1 (decisões principais), 2.3, 24.1, 24.7, 25, 32 (Q3).
- Vercel Pricing <https://vercel.com/pricing>; Neon Pricing <https://neon.com/pricing>; R2 Pricing <https://developers.cloudflare.com/r2/pricing/> (consultados no planejamento em 19/10/2026; revalidar antes da S06).
