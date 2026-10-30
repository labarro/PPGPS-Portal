# Runbook — Solicitação de titular de dados (LGPD, art. 18)

> Canal público: página `/privacidade`, que remete ao contato do grupo (`/o-grupo/contato`). Responsável: coordenador do grupo (`editor`), com apoio do desenvolvedor (`admin`). Prazo de referência: **15 dias** (art. 19, II).

## 1. Registrar

Anote, fora do repositório, em registro interno do grupo: data, solicitante, pedido e canal. Confirme a identidade do solicitante por um meio já conhecido do grupo (ex.: o e-mail institucional dele). **Não** peça documentos além do necessário.

## 2. Atender

| Pedido | Como fazer no painel |
|---|---|
| Confirmação e acesso | Em **Pessoas**, localize o registro e envie ao titular os dados cadastrados e as autorizações (escopos e datas) |
| Correção | Edite o campo em **Pessoas** ou **Vínculos**. A alteração aparece no site sem deploy |
| Revogação (perfil, foto ou e-mail) | Em **Consentimentos**, abra o registro e preencha a data de revogação (definitiva). O efeito é imediato no site, na API e no sitemap |
| Eliminação | Revogue as autorizações e arquive a pessoa (`archivedAt`). A exclusão física, com anonimização, é feita pelo desenvolvedor (planejamento 13.1). A auditoria é mantida por 2 anos |
| Autoria em ensaio | O nome publicado pode ser substituído por iniciais ou removido mediante correção do ensaio (nova versão, com nota de correção) |

## 3. Responder e encerrar

Responda ao titular pelo mesmo canal, informando o que foi feito e quando. Registre o encerramento. Confira no site (aba anônima) que a informação saiu.
