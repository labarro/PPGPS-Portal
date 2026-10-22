# ADR-0001 — Stack: monólito modular Next.js + Payload CMS 3 + PostgreSQL + R2

| Campo | Valor |
|---|---|
| Status | **Aceito** |
| Data | 19/10/2026 |
| Sprint | S00 |
| Autor | Agente |
| Aprovação | Responsável técnico (supervisor), 22/10/2026 — aprovação expressa dos ADRs 0001–0009 |

## Contexto

O portal precisa de: site público com SEO forte (SSG/ISR), painel administrativo em português para editores não técnicos, RBAC por coleção/documento/campo, versões e rascunhos, fluxo editorial, uploads seguros, relações acadêmicas complexas (N:N com atributos) e manutenção por **uma única pessoa** apoiada por agentes de IA. O orçamento até o M1 é zero (planos gratuitos) e há exigência de portabilidade (RNF-15).

Referências: planejamento, seções 11 (comparação), 12 (arquitetura técnica), 7 (RNF), 25 (custos).

## Decisão

Adotar a **Alternativa A** da seção 11 do planejamento:

1. **Um único app Next.js (App Router) com Payload CMS 3 instalado dentro dele** (`src/app/(site)` e `src/app/(payload)`), em um único repositório e um único deploy.
2. **TypeScript `strict`**, pnpm, Node LTS fixado em `.nvmrc`/`engines`.
3. **PostgreSQL 16+** via adaptador oficial `@payloadcms/db-postgres` (ver ADR-0002).
4. **Lexical** como editor rich text, renderizado por serializer próprio (sem HTML bruto).
5. **Tailwind CSS + shadcn/ui (Radix) + lucide-react** na UI pública; componentes copiados para o repositório.
6. **Cloudflare R2** via `@payloadcms/storage-s3` (MinIO no ambiente local).
7. **Busca** com Postgres FTS (`portuguese` + `unaccent`) e `pg_trgm` (M2), sem serviço externo.
8. **Testes**: Vitest, Playwright + `@axe-core/playwright`, Lighthouse CI.
9. **GraphQL desabilitado**; leitura pública via Local API com `overrideAccess: false`.
10. **Organização por módulos de domínio** (seção 28.1 do planejamento), criados progressivamente.

As **versões exatas** de Next.js, Payload e React serão fixadas na S01 (combinação do template oficial do Payload vigente no início da S01) e registradas em ADR próprio (ADR previsto: "versões fixadas"). Atualizações de versão maior só em sprint dedicada.

## Alternativas consideradas

| Alternativa | Prós | Contras | Motivo da rejeição |
|---|---|---|---|
| B. Next.js + Prisma + Better Auth + admin próprio | Flexibilidade total; lock-in mínimo | Admin, RBAC, versões e uploads construídos do zero (≈30–40% do esforço); maior superfície de bugs de segurança | Esforço e risco incompatíveis com manutenção por uma pessoa |
| C. Astro + CMS SaaS (Sanity/Strapi Cloud) | SEO excelente; admin pronto | Duas plataformas; relações N:N com atributos artificiais; custo/limites do SaaS; dados fora do próprio banco | Lock-in alto e modelagem acadêmica inadequada |
| Backend separado (NestJS/Express) | Separação de camadas | Duplica auth, deploy e tipos | Sem benefício na escala prevista |
| Microsserviços | Escalabilidade independente | Complexidade operacional | Incompatível com uma pessoa |
| WordPress | Já usado pelo site institucional | Modelagem relacional frágil via plugins | Inadequado para dados acadêmicos relacionados |
| Elasticsearch/Algolia | Busca avançada | Custo e operação | Desnecessário para milhares de registros |

## Consequências

**Positivas**
- Admin, autenticação, RBAC, versões, rascunhos, uploads e migrations prontos, com tipos gerados que reduzem erros de agentes.
- Um único deploy, um único conjunto de tipos e um único banco.
- Portável: roda com `next start`/Docker, Postgres padrão e S3 compatível.

**Negativas / riscos**
- Curva de aprendizado do Payload; dependência do ritmo de releases do Payload/Next (R11). Mitigação: versões fixadas, atualização em sprint dedicada com E2E completos.
- Componentes personalizados no admin devem ser mínimos para reduzir manutenção.

**A fazer**
- S01: inicializar o projeto a partir do template oficial, fixar versões em ADR, desabilitar GraphQL, configurar localização (pt-BR padrão, `en` declarado).

## Referências

- Planejamento v1.2, seções 11, 12, 16.8, 24.7, 28.
- Payload CMS — *What is Payload?* <https://payloadcms.com/docs/getting-started/what-is-payload> (consultado no planejamento em 19/10/2026).
