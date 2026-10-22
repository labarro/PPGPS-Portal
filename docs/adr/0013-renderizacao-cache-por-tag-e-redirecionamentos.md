# ADR-0013 — Renderização das páginas públicas, cache de dados por tag e redirecionamentos 301

| Campo | Valor |
|---|---|
| Status | Proposto |
| Data | 22/10/2026 |
| Sprint | S03 |
| Autor | Agente |
| Aprovação | Pendente (supervisor) |

## Contexto

- O planejamento (12.4; AGENTS.md §4.8) prevê páginas públicas "estáticas + revalidação por tag ao publicar".
- O ADR-0005 proíbe acesso ao banco durante o `next build` (o CI comprova com um banco inacessível). Logo, o HTML gerado no build não tem conteúdo; com ISR clássico, cada deploy serviria páginas vazias até a primeira regeneração por tempo.
- A ficha da S03 exige: alteração publicada no painel refletida no site **sem deploy**; alterar o slug de uma linha cria redirecionamento **301**; rascunhos nunca públicos; pré-visualização.
- O Next 16 só emite 307/308 a partir de páginas (`redirect`/`permanentRedirect`); 301 só por Route Handler ou Proxy.

## Decisão

1. **Páginas públicas renderizadas no servidor a cada requisição** (`dynamic = 'force-dynamic'` no layout do site), com os **dados em cache por tags** (`unstable_cache`, `src/lib/content/cache.ts`): `group-profile`, `homepage`, `research-lines`, `research-line:<slug>`, `pages`, `page:<slug>`, `site-chrome`, `sitemap`.
2. Hooks `afterChange`/`afterDelete` das coleções e globals chamam `revalidateTag(tag, { expire: 0 })` e `revalidatePath` conforme `revalidationPlan` (`src/lib/content/cache-tags.ts`). O perfil do grupo revalida o layout inteiro (home, `/o-grupo/*`, rodapé).
3. Tempo de segurança do cache: 300 s (cobre alterações feitas fora do servidor, como o seed por linha de comando). As chaves incluem um hash do banco (e `DATA_CACHE_SCOPE` nos E2E).
4. **Pré-visualização** via Draft Mode (`/next/preview?path=…`), ativada somente para admin/editor autenticados no painel; em rascunho a leitura não usa cache.
5. **Redirecionamentos**: coleção do `@payloadcms/plugin-redirects` (somente admin/editor). Ao **publicar** um slug diferente do publicado, hooks criam `from → to` (301), reapontam cadeias e removem redirecionamentos cuja origem volta a existir. O **Proxy** consulta a tabela `redirects` (SQL mínimo, somente leitura, `pg` com 1 conexão) para `/linhas/*` e `/o-grupo/*` e responde **301/302 reais**; acertos ficam 30 s em memória, faltas não. A página mantém um fallback (`permanentRedirect`, 308) caso o proxy falhe.

## Alternativas consideradas

| Alternativa | Prós | Contras | Motivo da rejeição |
|---|---|---|---|
| ISR com HTML do build | CDN serve HTML | Build sem banco ⇒ páginas vazias após cada deploy até a regeneração | Viola a experiência e os E2E |
| Acessar o banco no build | SSG real | Contraria o ADR-0005 (build sem banco) | Rejeitado |
| `force-dynamic` sem cache de dados | Simples | Toda visita consulta o banco (Neon Free) | Custo/latência |
| Redirecionamento só na página | Sem SQL no proxy | Status 308, não 301 (critério da ficha) | Não atende o critério literal |
| Payload inteiro no Proxy | Usa a Local API | Proxy pesado em toda requisição | Desproporcional |

## Consequências

- Positivas: publicação aparece na hora; nenhum HTML vazio pós-deploy; 301 real; regra de visibilidade única (`canViewPublic`/`publicWhere`).
- Negativas: renderização por requisição (sem cache de CDN do HTML); o proxy depende de `DATABASE_URL` e do nome das colunas geradas (`from`, `to_url`, `type`) — coberto por teste de integração com o banco real.
- Riscos: cache de acertos do proxy por instância (até 30 s após remover um redirecionamento); `unstable_cache` é API legada no Next 16 — migrar para `'use cache'`/`cacheTag` quando `cacheComponents` for adotado (sprint dedicada).
- A reavaliar na S06 (hospedagem): cache de CDN para HTML público, se a hospedagem escolhida permitir.

## Referências

- Planejamento v1.3: 9.3, 12.4, 16.7; ficha `docs/sprints/S03.md`; ADR-0005.
- `src/lib/content/{cache,cache-tags,queries,redirect-lookup,redirect-db}.ts`, `src/hooks/{revalidate,slug-redirects}.ts`, `src/proxy.ts`.
