# ADR-0015 — Fluxo editorial dos ensaios e publicação agendada

| Campo | Valor |
|---|---|
| Status | **Aceito** |
| Data | 30/10/2026 |
| Sprint | S05 |
| Autor | Agente |
| Aprovação | Responsável técnico (supervisor), 30/10/2026 — revisão e aprovação expressas no encerramento da S05 |

## Contexto

- A ficha da S05 exige estados editoriais (rascunho → em revisão → devolvido → aprovado → agendado/publicado → arquivado, com restauração e correção com nova versão), transições inválidas rejeitadas, comentário obrigatório na devolução, auditoria de quem aprovou e publicou, agendamento por jobs do Payload ou cron e nenhum caminho (painel, REST, Local API, job) que contorne as regras.
- O Payload oferece rascunhos/versões (`_status` draft/published) e publicação agendada nativa (`schedulePublish`), mas esta publica qualquer rascunho na data, sem as regras do fluxo, e depende de um processo contínuo executando a fila.
- Hospedagem até o M1 é gratuita (ADR-0003/0009): na Vercel não há processo contínuo para o `autoRun` da fila; o cron do plano gratuito é limitado. Orçamento R$ 0.
- O cache de dados das páginas é por tag (ADR-0013): uma publicação agendada não gera, por si, um evento de revalidação.

## Decisão

1. **Máquina de estados pura** (`src/lib/editorial/workflow.ts`) é a fonte única das transições, validações (comentário ≥ 10 caracteres na devolução, ensaio completo para enviar/aprovar/publicar, checklist editorial completo para aprovar, agendamento ≥ 1 min no futuro, agendador só conclui agendamentos vencidos) e do efeito de cada transição (quem submeteu/aprovou/publicou/arquivou, datas, histórico).
2. **Rascunhos/versões do Payload + `workflowStatus`**: a versão principal ("publicada") só muda por transição. Estados públicos (agendado, publicado, arquivado) gravam a versão principal; os demais gravam apenas uma nova versão de rascunho — por isso a correção de um texto publicado (Publicado → Em revisão) não tira a versão anterior do ar até a nova aprovação. Cancelar agendamento despublica a versão principal.
3. **Imposição em toda gravação**: o hook `beforeChange` da coleção rejeita, sem o contexto de transição criado pelo serviço único (`transitionEssay`), qualquer gravação da versão principal (`403`), descarta alterações nos campos do fluxo (acesso por campo `create/update: false`), bloqueia restauração de versões como publicadas e revalida a transição dentro da mesma operação (inclusive o estado de origem, contra corridas). Conteúdo é editável apenas em Rascunho/Devolvido (acesso por campo). O endpoint `POST /api/essays/:id/transition` exige `editor`/`admin`; a gravação usa `overrideAccess: false`.
4. **Visibilidade pública independente do job**: o ensaio é público quando a versão principal está publicada, em estado público e com `publishedAt <= agora` (filtro de acesso avaliado a cada consulta). Um agendado aparece exatamente na data, mesmo sem o job. As listagens usam uma "época de publicação" (a última `publishedAt` já alcançada) na chave do cache, recalculando-se quando um agendamento vence.
5. **Job do Payload** `publishScheduledEssays` (fila `editorial`, cron a cada minuto) conclui Agendado → Publicado sem usuário (ator "agendador", que só pode concluir agendamentos vencidos), registrando histórico e auditoria. Execução: `autoRun` em servidores contínuos (local, Docker, `next start`; desligado na Vercel por padrão — `PAYLOAD_JOBS_AUTORUN`); na Vercel, `GET /api/essays/publish-due` com `Authorization: Bearer CRON_SECRET` (cron externo gratuito, configurado na S06) e, como redundância, o painel conclui agendamentos vencidos ao abrir um ensaio; qualquer ação editorial sobre um agendado vencido conclui a publicação antes.
6. **Auditoria**: novas ações `approve` (aprovação) e `workflow` (envio, devolução, agendamento, arquivamento, restauração), além de `publish`; o resumo registra a transição, nunca o comentário de revisão (dado interno).
7. **Arquivamento** mantém a versão principal publicada com `archivedAt`: a URL responde 200 com aviso (e `noindex`), fora de listagens, RSS, sitemap e destaques. Ensaio publicado não é excluído (exclusão lógica).

## Alternativas consideradas

| Alternativa | Prós | Contras | Motivo da rejeição |
|---|---|---|---|
| `schedulePublish` nativo do Payload | Pronto, com UI | Publica qualquer rascunho na data, sem aprovação; contorna a máquina de estados; depende da fila | Viola "somente textos aprovados" |
| Só `workflowStatus`, sem rascunhos/versões | Simples | Sem histórico de versões; correção de texto publicado tiraria o original do ar | Ficha exige versões e nova versão para correção |
| Visibilidade dependente do job | Estado sempre coerente | Sem processo contínuo na Vercel, o ensaio atrasaria até o próximo cron | Critério "publicado na data correta" |
| Vercel Cron a cada minuto | Nativo | Plano gratuito limita a frequência | Custo/limite; mantido apenas como opção na S06 |

## Consequências

- Positivas: regras testáveis em função pura (unitários) e impostas no servidor (integração); publicação na data exata sem infraestrutura paga; histórico e auditoria completos.
- Negativas: a coluna `workflowStatus` pode ficar "Agendado" após a data até o job/endpoint/painel concluir (só afeta o painel; o site já exibe). Na Vercel o job não roda sozinho até a S06 configurar o cron.
- Riscos: tabela `payload_jobs` cresce com execuções agendadas (o Payload remove jobs concluídos por padrão; acompanhar na S06). Mitigação documentada.
- A fazer na S06: configurar o cron externo gratuito (`CRON_SECRET` no ambiente) para homologação/produção, se o supervisor autorizar.

## Referências

- Planejamento v1.4: 8.8, 10.2, 13.3, 15.2, 15.5, 16.7, 17.7 (S05), 20 (S05).
- Ficha `docs/sprints/S05.md`; ADR-0005, ADR-0009, ADR-0013.
