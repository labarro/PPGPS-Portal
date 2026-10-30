# Runbook — Solicitação de instituição para retirar menção ou marca

> AGENTS §9.1, Q1 e Q2. O portal só menciona UniCesumar, PPGPS e CNPq como **referência textual com link**, sem logotipos.

## 1. Receber

O pedido chega ao coordenador ou ao desenvolvedor (ex.: a UniCesumar pede para retirar a menção ao programa). Registre a data, o solicitante e o pedido exato. Agentes **não** respondem a instituições.

## 2. Executar (no mesmo dia, sem deploy)

| Pedido | Ação no painel |
|---|---|
| Retirar uma referência institucional | **Perfil do grupo → Referências institucionais**: remova o item ou desmarque “Exibir no rodapé” → Publicar |
| Alterar o nome de exibição | O nome completo está em `src/lib/site/identity.ts` (exige release) e em **Configurações do site → Nome** (sem deploy). Avalie com o coordenador, pois o nome vem da Q2 |
| Retirar menção em ensaio | Correção do ensaio (nova versão com nota de correção) ou arquivamento |
| Retirar texto da nota de responsabilidade | **Perfil do grupo → Nota de responsabilidade** e/ou a página `sobre-o-portal` em **Páginas** |

## 3. Conferir e registrar

- Busque o termo nas páginas públicas e no sitemap (aba anônima). Os testes automatizados de marca (`tests/e2e/s06-launch.e2e.spec.ts`) garantem a ausência de logotipos.
- Registre o atendimento em `docs/content/questoes-institucionais.md`.
