# Validações com o coordenador do grupo (Q1–Q12)

> Origem: planejamento seção 32 (v1.2: perguntas; **v1.3: respostas incorporadas**). As Q1–Q20 da v1.1, dirigidas à coordenação do PPGPS, foram substituídas e nunca enviadas (correspondência na seção 6).
>
> **Destinatário:** coordenador do grupo de pesquisa "Bioética e Promoção da Saúde". Líderes registrados no DGP em 19/10/2026: Lucas França Garcia e Leonardo Pestillo de Oliveira. A identificação nominal do coordenador que respondeu não foi informada ao agente; registrar quando disponível.
>
> **Regras:**
> 1. As respostas são registradas como **decisões informadas pelo coordenador**, com seu conteúdo e suas limitações. Nada além do que foi dito é presumido.
> 2. Dependências institucionais nunca bloqueiam o desenvolvimento; bloqueiam apenas a publicação.
> 3. Agentes não contatam a universidade nem os integrantes; o contato é feito pelo responsável técnico.

## 1. Registro de decisões, envios e respostas

| Data | Evento | Evidência | Efeito |
|---|---|---|---|
| 20/10/2026 | Responsável pelo grupo confirma: portal exclusivo do grupo; proposta aprovada **conceitualmente**; sem autorização para envolver institucionalmente docentes, grupos ou a coordenação do PPGPS | Relato do responsável técnico na sessão de 20/10/2026 | Escopo v1.2 e ADR-0006 |
| Não informada | Envio das validações Q1–Q12 ao coordenador | Comprovado indiretamente pela existência das respostas; data exata não informada e **não inventada** | Critério de envio da S00 atendido |
| Não informada; relatadas ao agente em **22/10/2026** | Respostas do coordenador às Q1–Q12 (seção 4) | Relato expresso do responsável técnico na sessão de 22/10/2026. A mensagem original não está no repositório | Planejamento v1.3 e ADR-0010 |
| 22/10/2026 | Responsável técnico confirma: escopo exclusivo do grupo; planejamento v1.2 aprovado como base; ADRs 0001–0009 aprovados | Declaração expressa do responsável técnico na sessão de 22/10/2026 | `docs/PROGRESS.md` |

**Pendência documental (não bloqueia o desenvolvimento):** arquivar, fora do repositório e sem dados pessoais desnecessários, o registro escrito (e-mail ou mensagem) das respostas do coordenador e da decisão de 20/10/2026, anotando aqui a referência (data, meio, local de guarda). Isso é exigido antes da publicação do M1 (S06).

## 2. Critérios de classificação

- **Situação:**
  - *Respondida*: a resposta resolve a questão.
  - *Respondida com ressalvas*: decide o essencial, mas deixa itens complementares em aberto.
  - *Aberta*: sem resposta.
- **Bloqueia:** qual publicação depende dos itens ainda abertos.

## 3. Resumo

| # | Tema | Situação | Itens ainda abertos | Bloqueia |
|---|---|---|---|---|
| Q1 | Publicação do portal | **Respondida com ressalvas** | Se a UniCesumar exige comunicação prévia sobre sites de grupos (item c, não abordado; decisão do coordenador) | — (risco residual registrado) |
| Q2 | Nome e identidade | **Respondida** | Nome curto para títulos [PREMISSA "Bioética e Promoção da Saúde"]; logotipos institucionais continuam não autorizados | — |
| Q3 | Domínio e hospedagem | **Respondida com ressalvas** | Domínio a adquirir; orçamento do plano de produção (decidido no ADR da S06) | Domínio próprio (não bloqueia o M1, que pode usar endereço do provedor) |
| Q4 | Dados pessoais | **Respondida com ressalvas** | Controlador formal, canal do titular, modelo de termo individual, regra de orientações concluídas | Perfis públicos (S04) até haver registro individual e canal do titular |
| Q5 | Integrantes e acesso | **Respondida com ressalvas** | Lista nominal de integrantes a exibir; ORCID/Lattes confirmados | Carga de perfis (S04/S06) |
| Q6 | Laboratório | **Respondida** (fora do escopo atual) | — | — |
| Q7 | Linhas de pesquisa | **Respondida com ressalvas** | Textos de apresentação, objetivos e histórico do grupo e dos dois eixos | Publicação das páginas do grupo (S03/S06) |
| Q8 | Revisão editorial | **Respondida com ressalvas** | Política editorial (temas, tom, conflitos de interesse, licença padrão); autoria dos ensaios iniciais | Publicação do blog no M1 |
| Q9 | Atualização de conteúdos | **Respondida** | — | — |
| Q10 | Orientações e egressos | **Respondida com ressalvas** | Fonte dos dados das orientações; inclusão de orientações em andamento, MINTER/DINTER e pós-doutorado | Carga do módulo (S07/S11) |
| Q11 | Conteúdo prioritário | **Respondida** | Comprovação de números de impacto continua exigida item a item | Evidências de impacto (S10) |
| Q12 | Fotografias e materiais | **Respondida com ressalvas** | Autorização de imagem individual de pessoas identificáveis | Fotos com pessoas identificáveis |

## 4. Respostas e efeitos

### Q1 — Publicação do portal
- **Resposta do coordenador:** o portal será publicado como iniciativa do grupo. Não é necessário exibir aviso ostensivo de que não é o site oficial da UniCesumar ou do PPGPS.
- **Efeito:** removida a obrigação do aviso no rodapé. `/sobre-o-portal` identifica de forma discreta o grupo como mantenedor e responsável pelo conteúdo.
- **Ressalva:** não foi informado se a UniCesumar exige comunicação ou aprovação para sites de grupos que mencionem a instituição. A responsabilidade pela decisão é do coordenador; registrado como risco residual (planejamento 25.2, R17).

### Q2 — Nome e identidade
- **Resposta:** nome "Grupo de Pesquisa em Bioética e Promoção da Saúde - Unicesumar"; identidade visual azul-marinho e branco.
- **Efeito:** nome de exibição definido; tokens visuais azul-marinho/branco (S02); marca tipográfica.
- **Limite expresso:** **não** presumir autorização para logotipos institucionais. Nenhum logotipo, selo ou identidade visual da UniCesumar, do PPGPS ou do CNPq.

### Q3 — Domínio e hospedagem
- **Resposta:** hospedagem própria, independente do site institucional; domínio próprio a ser adquirido futuramente.
- **Atualização (30/10/2026, responsável técnico):** domínio definido e registrado — `https://bioeticaps.app` (ADR-0014). Ativação pública na S06.
- **Efeito:** mantém a estratégia de provedores externos (ADR-0003 e ADR-0009). O ADR de produção na S06 decide plano e custos. Até haver domínio, usam-se endereços do provedor. A política de privacidade informa a possibilidade de processamento fora do Brasil.

### Q4 — Dados pessoais
- **Resposta:** a publicação de informações dos integrantes está autorizada.
- **Efeito:** registrada como **autorização do grupo**. Não equivale a autorização individual irrestrita nem dispensa a LGPD: cada perfil público exige `ConsentRecord` vigente por escopo, com evidência e revogação. O coordenador pode colher os registros.
- **Em aberto:** controlador formal dos dados, canal do titular, modelo de termo individual e confirmação da regra de orientações concluídas (nome do orientando com direito de oposição).

### Q5 — Integrantes e acesso
- **Resposta:** site público sem login; acesso administrativo apenas para o coordenador e o desenvolvedor; demais integrantes como registros acadêmicos, sem contas.
- **Efeito:** papéis `editor` (coordenador) e `admin` (desenvolvedor); `researcher` removido do MVP (ADR-0010).
- **Em aberto:** lista nominal de integrantes atuais e ex-integrantes a exibir e identificadores (ORCID/Lattes) confirmados.

### Q6 — Laboratório
- **Resposta:** o grupo possui laboratório, mas suas informações não devem ser incluídas neste momento.
- **Efeito:** página do laboratório, chamada na homepage e projetos `laboratory` fora do escopo. Proibido inventar nome, atividades ou vínculo com outros laboratórios. Reavaliar somente com nova manifestação do coordenador.

### Q7 — Linhas de pesquisa
- **Resposta:** foco exclusivo em Bioética e Promoção da Saúde; sem exigir páginas independentes para as quatro linhas do CNPq; preservá-las como referência histórica, sem assumir que foram extintas.
- **Efeito:** dois eixos temáticos em `research-lines` (rótulo "Linhas temáticas"). As quatro linhas do DGP ficam em `GroupProfile.dgpResearchLines[]` com fonte e data de coleta (inventário I-03).
- **Em aberto:** textos de apresentação do grupo e dos dois eixos.

### Q8 — Revisão editorial
- **Resposta:** revisão e aprovação de ensaios e publicações pelo coordenador e pelo desenvolvedor.
- **Efeito:** fluxo editorial operado pelos dois usuários (ADR-0010, decisão 7).
- **Em aberto:** política editorial e ensaios iniciais (≥ 3 para o M1).

### Q9 — Atualização de conteúdos
- **Resposta:** somente o coordenador e o desenvolvedor cadastram, editam e publicam informações acadêmicas e editoriais.
- **Efeito:** sem edição de perfil por integrantes (RF-115 → W); curadoria a cargo dos dois usuários.

### Q10 — Orientações e egressos
- **Resposta:** o portal pode apresentar diferentes informações acadêmicas sobre orientações e egressos, cadastradas e geridas pelo coordenador e pelo desenvolvedor.
- **Efeito:** módulo de orientações e egressos confirmado no M2. As regras de visibilidade e consentimento permanecem.
- **Em aberto:** fonte e escopo dos dados (em andamento, MINTER/DINTER, pós-doutorado).

### Q11 — Conteúdo prioritário
- **Resposta:** não há projetos, eventos ou publicações definidos como prioridade inicial.
- **Efeito:** critérios de conteúdo do M2 passam a "se houver". A exigência de fonte comprobatória para números de impacto continua.

### Q12 — Fotografias e materiais
- **Resposta:** existe autorização para usar fotografias, documentos e materiais do grupo.
- **Efeito:** registrada como autorização de uso dos materiais do grupo. Continuam obrigatórios: origem, crédito, licença, `alt`; autorização de imagem individual para pessoas identificáveis; licença compatível para hospedar PDFs de terceiros.

## 5. Questões complementares sugeridas (para uso do responsável técnico)

Derivadas dos itens em aberto; não bloqueiam o desenvolvimento.

1. Quem responde como controlador dos dados e qual é o canal do titular (e-mail do grupo)? Há modelo de termo de autorização individual? (Q4)
2. Quais integrantes e ex-integrantes devem aparecer inicialmente, com ORCID/Lattes confirmados? (Q5)
3. Textos de apresentação, objetivos e histórico do grupo e dos eixos Bioética e Promoção da Saúde. (Q7)
4. Política editorial (temas, tom, conflitos de interesse, licença padrão) e autores dos ensaios iniciais. (Q8)
5. Fonte das orientações e inclusão de orientações em andamento, MINTER/DINTER e pós-doutorado. (Q10)
6. Confirmação do nome curto para títulos de página. (Q2)
7. Opcional: a UniCesumar precisa ser comunicada sobre o portal? (Q1, item c)

## 6. Correspondência com a versão 1.1 (Q1–Q20)

| v1.1 | v1.2/v1.3 |
|---|---|
| Q1 autorização | Q1 |
| Q2 marca; Q8 nome do grupo | Q2 |
| Q3 domínio; Q18 hospedagem | Q3 |
| Q4 LGPD | Q4 |
| Q5 docentes; Q6 discentes/egressos; Q9 Lattes | Q5 |
| — | Q6 (laboratório) |
| Q19 grupos ativos | Substituída por Q7 |
| Q12 editor-chefe | Q8 |
| Q7 orientações; Q20 MINTER/DINTER/pós-doc | Q9/Q10 |
| Q13 curadoria | Q9/Q10 (coordenador e desenvolvedor) |
| Q14 impacto | Q11 |
| Q16 PDFs; Q17 imagens | Q12 |
| Q10 permanentes × colaboradores | Removida |
| Q11 conceito CAPES | Removida |
| Q15 OAI-PMH do RDU | Removida do MVP |

> **Nota de numeração:** na v1.2, Q9 era "orientações" e Q10 "curadoria". As respostas do coordenador vieram com os temas "atualização de conteúdos" (Q9) e "orientações e egressos" (Q10). A tabela acima usa a numeração das respostas; o conteúdo das perguntas originais está coberto.
