# Fluxo editorial dos ensaios (S05)

Guia curto para o coordenador (`editor`) e o desenvolvedor (`admin`). Regras técnicas: [ADR-0015](../adr/0015-fluxo-editorial-e-publicacao-agendada.md).

## Estados

| Situação | Quem altera | No site | Observação |
|---|---|---|---|
| Rascunho | editor/admin | Não | Edição livre (salvar rascunho) |
| Em revisão | editor/admin | Não | Texto bloqueado para edição; checklist editável |
| Devolvido | editor/admin | Não | Comentário de revisão obrigatório; texto volta a ser editável |
| Aprovado | editor/admin | Não | Exige o checklist editorial completo |
| Agendado | editor/admin | A partir da data | Aparece sozinho na data; o sistema conclui a publicação |
| Publicado | editor/admin | Sim | Home (destaques), blog, categoria, tag, RSS, sitemap, perfil dos autores |
| Arquivado | editor/admin | Só pela URL, com aviso | Fora de listagens, RSS, sitemap e destaques; pode ser restaurado |

Transições permitidas: Rascunho → Em revisão; Em revisão → Devolvido ou Aprovado; Devolvido → Em revisão; Aprovado → Agendado, Publicado ou Devolvido; Agendado → Publicado ou Aprovado (cancela o agendamento); Publicado → Arquivado ou Em revisão (correção relevante, nova versão — o texto anterior continua no ar até a nova aprovação; preencha a "Nota de correção"); Arquivado → Publicado (restaurar). Qualquer outra (ex.: Rascunho → Publicado) é recusada.

## Passo a passo no painel

1. **Editorial → Ensaios → Criar novo.** Preencha título, resumo, texto, natureza, categoria, autores (integrante cadastrado ou convidado externo) e referências; **Salvar rascunho**.
2. Na barra lateral, **Ações editoriais → Enviar para revisão**.
3. O revisor (preferencialmente quem não redigiu/enviou) preenche a aba **Revisão → Checklist** e usa **Aprovar** ou **Devolver com comentários** (comentário obrigatório).
4. Aprovado: **Publicar agora** ou informe data e hora e use **Agendar publicação**.
5. Para retirar do blog: **Arquivar** (a URL continua respondendo com aviso). Para voltar: **Restaurar (republicar)**.

Não há botão "Publicar" genérico: a publicação acontece somente pelas ações editoriais. Versões antigas só podem ser restauradas como rascunho.

## Cuidados (checklist do planejamento 15.2)

Natureza correta; argumentação fundamentada e referências para afirmações factuais; **nenhum dado de pacientes, participantes de pesquisa ou terceiros**; imagens com crédito, licença e, se houver pessoas identificáveis, autorização de imagem; linguagem acessível; conflitos de interesse declarados; sem aconselhamento clínico individual; nada apresentado como posição oficial da UniCesumar, do PPGPS ou do grupo. Todo ensaio exibe automaticamente o selo de natureza, o aviso de que **não passou por revisão por pares** e de que **não representa posição institucional**, e a licença (padrão em **Configurações do site → Blog e ensaios**).

## Publicação agendada (operação)

- O site mostra o ensaio agendado exatamente na data (a regra de visibilidade usa a data, não depende de nenhum processo).
- A situação "Agendado" vira "Publicado" pelo job do Payload (servidor contínuo), pelo endpoint `GET /api/essays/publish-due` (cron com `Authorization: Bearer $CRON_SECRET`) ou ao abrir o ensaio no painel.
- Na homologação (Vercel) não há cron configurado até a S06: a mudança de situação ocorre ao abrir o ensaio no painel; o site já exibe o ensaio na data.

## Dados de teste

`pnpm seed:essays` cria ensaios **fictícios** (local, CI e previews). É bloqueado em homologação e produção: ali só entram ensaios reais aprovados pelo coordenador.
