# Inventário de conteúdo — Portal do grupo de pesquisa "Bioética e Promoção da Saúde"

> Criado na S00 (19/10/2026) e revisado em 20/10/2026 para o escopo do grupo (planejamento v1.2, ADR-0006).
> Base para os seeds de homologação (S03, S04, S07–S10) e para a carga de produção (S06, S11).
> **Nenhum dado aqui está aprovado.** "Verificado" significa apenas "consultado diretamente na fonte pública na data indicada". A aprovação conceitual do responsável pelo grupo **não** valida conteúdo nem autoriza publicação.

## 1. Fontes e convenções

| Código | Fonte | URL | Coleta | Uso na v1.2 |
|---|---|---|---|---|
| **F2** | Espelho DGP/CNPq do grupo | URL informada <http://dgp.cnpq.br/dgp/espelhogrupo/719693>; canônica `dgp.cnpq.br/dgp/espelhogrupo/5367326681852422` | 19/10/2026 ("Data do último envio: 19/10/2026 15:04") | **Fonte principal** |
| **F1** | Página do PPGPS (UniCesumar) | <https://www.unicesumar.edu.br/mestrado-e-doutorado/promocao-da-saude/> | 19/10/2026 | **Somente contexto**: vínculo dos líderes com o programa, menção ao grupo, atividades em que integrantes participam. Não é carregada no portal |
| F3 | RDU — Repositório Digital Unicesumar | <https://rdu.unicesumar.edu.br/handle/123456789/10> | 19/10/2026 | HTTP 403 a acesso automatizado; usado apenas como destino de links (orientações, S07) |
| G | Responsáveis do grupo | — | — | Fonte de textos, laboratório, orientações, autorizações (Q1–Q12) |

**Situação de validação:** `verificado-fonte` (conferido na fonte; aguarda validação dos responsáveis) · `divergente` (fontes discordam; provisório) · `provisório` (inferido ou incompleto) · `pendente-grupo` (depende de informação dos responsáveis) · `bloqueado-consentimento` (exibição exige autorização individual) · `validado` (aprovado pelos responsáveis, com data e evidência — **nenhum item ainda**) · `fora-de-escopo` (dado do programa sem relação com o grupo; não carregar).

**Sensibilidade:** `pública-grupo` (dados do grupo) · `pessoal-consentimento` (qualquer pessoa, inclusive docentes e líderes — v1.2) · `impacto-declarado` · `direitos-autorais` · `marca-institucional`.

**Responsável pela validação:** Líderes do grupo (LID) · Titular do dado (TIT) · Editor-chefe/curador designados (ED) · Supervisor técnico (SUP).

> **Regra de privacidade deste documento:** apenas os **líderes** são nomeados (dado público do DGP, necessário para a governança). Demais pesquisadores, estudantes e ex-integrantes aparecem só em contagens. Nenhum perfil será publicado sem autorização (Q5).

---

## 2. Visão geral (inventário mínimo da S00, v1.2)

| ID | Conteúdo | Fonte | Responsável | Marco | Sprint de carga | Situação | Sensibilidade |
|---|---|---|---|---|---|---|---|
| I-01 | Identidade do grupo (nome, nome alternativo, certificação, ano de formação, área, instituição certificadora, repercussões) | F2 | LID | M1 | S03 | `divergente` (nome) — Q2 | pública-grupo |
| I-02 | Apresentação, objetivos e histórico do grupo (textos próprios) | G | LID | M1 | S03 | `pendente-grupo` — Q7 | pública-grupo |
| I-03 | Linhas do grupo (4) | F2 | LID | M1 | S03 | `verificado-fonte` — Q7 | pública-grupo |
| I-04 | Líderes (2) | F2 (F1 lista 1) | LID | M1 | S03 (texto), S04 (perfis) | `divergente` (nº de líderes) — Q1/Q2; perfis `bloqueado-consentimento` | pessoal-consentimento |
| I-05 | Pesquisadores atuais (11) | F2 | LID + TIT | M1 | S04 | `bloqueado-consentimento` — Q5 | pessoal-consentimento |
| I-06 | Estudantes atuais (14) | F2 | LID + TIT | M1 (se autorizado) / M2 | S04 | `bloqueado-consentimento` — Q5 | pessoal-consentimento |
| I-07 | Ex-integrantes ("egressos" do DGP: 4 pesquisadores, 32 estudantes) | F2 | LID + TIT | M2 | S04 (vínculos), S07 (exibição) | `bloqueado-consentimento` — Q5 | pessoal-consentimento |
| I-08 | Instituição parceira (Diretoria de Pesquisa – DIPE, RS) | F2 | LID | M1 | S03 (referências) | `verificado-fonte` (confirmar natureza da parceria) | pública-grupo |
| I-09 | Referências institucionais (UniCesumar, PPGPS, CNPq/DGP) | F2, F1 | LID | M1 | S03 | `verificado-fonte`; formato textual — Q2 | marca-institucional |
| I-10 | Laboratório do grupo | G | LID | M1 (se confirmado) / M2 | S03, S10 | `pendente-grupo` — Q6 | pública-grupo |
| I-11 | Atividades/projetos com participação de líderes divulgadas por terceiros (ex.: LIIPS Podcast) | F1 | LID | M2 | S10 | `provisório` — Q6 (confirmar se são do grupo) | impacto-declarado |
| I-12 | Orientações conduzidas por pesquisadores do grupo | G | LID/ED | M2 | S07 | `pendente-grupo` — Q9 | pessoal-consentimento |
| I-13 | Produção científica do grupo | G (arquivos exportados pelos integrantes), Crossref | ED + TIT | M2 | S08, S09 | `pendente-grupo` | direitos-autorais |
| I-14 | Eventos do grupo | G | ED | M2 | S10 | `pendente-grupo` | pública-grupo |
| I-15 | Evidências de impacto | G | LID | M2 | S10 | `pendente-grupo` — Q11 | impacto-declarado |
| I-16 | Identidade visual própria do grupo | G | LID | M1 | S02 | `pendente-grupo` — Q2 | pública-grupo |
| I-17 | Contato do grupo | F2 (e-mail institucional de líder) | LID | M1 | S03 | `provisório` — confirmar canal a publicar (Q1/Q4) | pessoal-consentimento |

---

## 3. Detalhamento

### 3.1. Identidade do grupo (I-01, I-04, I-08, I-09, I-17) — F2, 19/10/2026

| Item | Valor transcrito |
|---|---|
| Nome no DGP (título) | **Bioética e Promoção da Saúde** |
| Nome alternativo | **Bioética e Promoção da Saúde Global no Envelhecimento** — usado no campo "Repercussões" do próprio DGP e na página do PPGPS (`divergente`, Q2) |
| Situação | Certificado (pela instituição); data da situação 14/04/2021 |
| Ano de formação | 2021 |
| Líderes | Lucas França Garcia; Leonardo Pestillo de Oliveira (F1 lista apenas o primeiro como líder) |
| Área predominante | Ciências da Saúde; Saúde Coletiva |
| Instituição do grupo (DGP) | Centro de Ensino Superior de Maringá – CESUMAR (UniCesumar); unidade: Diretoria de Pós-Graduação, Pesquisa e Extensão |
| Repercussões (texto do DGP) | O grupo tem como objetivo a produção de trabalhos interdisciplinares e de métodos mistos que abordem questões relacionadas à bioética e promoção da saúde, especialmente no contexto do envelhecimento |
| Instituição parceira | Diretoria de Pesquisa – DIPE (RS) |
| Redes de pesquisa / website | Nenhum registro no DGP |
| Contato | O DGP informa telefone institucional e e-mail docente de um líder; **não** publicar até definição do canal do grupo (Q1/Q4) |
| Equipamentos/softwares | Nenhum registrado |

**Referências institucionais propostas (somente texto e links, Q2):**

| Referência | Texto sugerido | URL |
|---|---|---|
| UniCesumar | "Grupo certificado pela UniCesumar no Diretório dos Grupos de Pesquisa do CNPq" | site da UniCesumar |
| PPGPS | "Pesquisadores do grupo atuam no Programa de Pós-Graduação em Promoção da Saúde (PPGPS) da UniCesumar" (confirmar redação, Q2) | <https://www.unicesumar.edu.br/mestrado-e-doutorado/promocao-da-saude/> |
| CNPq/DGP | "Espelho do grupo no Diretório dos Grupos de Pesquisa no Brasil" | `http://dgp.cnpq.br/dgp/espelhogrupo/5367326681852422` |
| DIPE (RS) | "Instituição parceira registrada no DGP" (confirmar natureza) | — |

### 3.2. Linhas do grupo (I-03) — F2, 19/10/2026

| # | Linha | Estudantes | Pesquisadores | Observação |
|---|---|---|---|---|
| LG1 | Bioética e o processo de envelhecimento | 5 | 7 | — |
| LG2 | Determinantes sociais da saúde e aspectos biopsicossociais no processo de envelhecimento | 4 | 7 | — |
| LG3 | Espaços e práticas para a promoção da saúde do idoso | 0 | 2 | Mesmo nome do projeto integrador P2 do PPGPS (referência textual opcional, Q7) |
| LG4 | Tecnologias na promoção da saúde no processo de envelhecimento | 5 | 3 | — |

Descrições das linhas não foram transcritas (o espelho da linha não foi aberto); solicitar textos aos líderes (Q7).

### 3.3. Integrantes (I-05, I-06, I-07) — F2, 19/10/2026

| Categoria | Contagem | Observações |
|---|---|---|
| Pesquisadores | 11 (10 doutorado, 1 mestrado) | Inclui os 2 líderes e pesquisadores de outras instituições; datas de inclusão de 14/04/2021 a 19/10/2026 |
| Estudantes | 14 (graduação 5, MBA 2, mestrado 5, doutorado 2) | Inclusões de 13/09/2022 a 19/10/2026 |
| Técnicos | 0 | — |
| Colaboradores estrangeiros | 0 | — |
| Ex-integrantes (pesquisadores) | 4 | Períodos entre 2021 e 2023 |
| Ex-integrantes (estudantes) | 32 | Períodos entre 2021 e 2026; há pessoas ex-integrantes como estudante e ativas como pesquisadoras |
| Indicadores de RH (DGP) | Doutorado 12; Mestrado 3; Graduação 5; Outros 5; total 25 | — |

- **Nenhum integrante é transcrito nominalmente** além dos líderes. A carga (S04) usará planilha preenchida/validada pelos líderes, com autorização de cada pessoa (Q5).
- O DGP foi atualizado no dia da coleta (inclusões em 19/10/2026): **recoletar** antes da S04.
- Papéis do DGP mapeiam para `Membership.role` (líder, pesquisador, estudante, técnico, colaborador estrangeiro) e níveis de treinamento para `trainingLevel` (planejamento 13.3).
- Afiliações (ex.: docente do PPGPS) entram como referência textual no perfil, somente com autorização.

### 3.4. Laboratório e atividades (I-10, I-11)

| Item | Situação |
|---|---|
| Laboratório próprio do grupo | **Não identificado** nas fontes públicas (F2 não registra laboratório nem equipamentos). Aguardar Q6. Nenhum laboratório será atribuído ao grupo sem confirmação |
| LIIPS (Laboratório Interdisciplinar de Intervenção em Promoção da Saúde) | Laboratório vinculado ao ICETI/PPGPS, coordenado por docente que **não** consta como integrante do grupo no DGP. **Fora de escopo**, salvo confirmação de participação do grupo (Q6). Seus números (atendimentos, recursos captados) não pertencem ao grupo |
| LIIPS Podcast | Projeto de extensão divulgado em F1, coordenado por um docente do programa e por um dos líderes do grupo (Lucas França Garcia). `provisório`: incluir como atividade do grupo apenas se confirmado (Q6) |
| Projetos de extensão do PPGPS com participação de líderes | Ex.: PAPEF (coordenado por Leonardo Pestillo de Oliveira, F1). `provisório`: confirmar se são atividades do grupo (Q6) |
| Demais projetos de extensão do PPGPS (13 listados em F1) | `fora-de-escopo`, exceto os confirmados pelos líderes |

### 3.5. Orientações, produção, eventos e impacto (I-12 a I-15)

| Item | Situação |
|---|---|
| Orientações | Não há fonte pública com orientador–orientando. A página do PPGPS lista dissertações sem orientador; **não** usar como fonte do grupo. Planilha a ser fornecida pelos líderes (Q9); links para RDU/repositórios |
| Produção | Curada: publicações com integrante como autor e aderência a linha do grupo (planejamento 8.5). Fonte: DOI (Crossref) e arquivos exportados pelos integrantes (S09). Livros e materiais do PPGPS `fora-de-escopo`, salvo autoria do grupo |
| Eventos | Sem registro público consolidado; levantar com os líderes |
| Impacto | Sem evidência pública específica do grupo; regra anti-alegação (planejamento 8.7); Q11 |

### 3.6. Dados do PPGPS fora do escopo (registrados apenas como contexto)

Coletados na v1.1 (F1, 19/10/2026) e **não** carregados no portal: identidade completa do programa, 2 linhas e 4 projetos integradores, 7 grupos de pesquisa, 12 docentes e 1 convidado, ≈190 dissertações, ≈355 discentes, MINTER/DINTER, ≈19 pós-doutorandos, 13 projetos de extensão, LIIPS, revista, livros, materiais educativos, parcerias internacionais, editais, regimento, matrizes, autoavaliação, conceito CAPES (não confirmado). O portal apenas **linka** o site oficial do programa. Problemas de qualidade observados em F1 (links DGP quebrados, Lattes divergentes, grafias variadas) servem de alerta para a transcrição de dados dos integrantes que também constam no programa.

---

## 4. Problemas de qualidade relevantes ao grupo

1. Nome do grupo divergente (título × repercussões no DGP × página do PPGPS) — Q2.
2. Número de líderes divergente (DGP: 2; página do PPGPS: 1) — confirmar na Q1/Q2.
3. Lista de integrantes atualizada no dia da coleta — recoletar antes da S04.
4. Pessoas com papéis simultâneos (ex-estudante e pesquisadora ativa) — tratadas por vínculos datados (ADR-0004).
5. Laboratório do grupo não identificado em fonte pública — Q6.

## 5. Próximas ações de levantamento

| Ação | Responsável | Até |
|---|---|---|
| Enviar Q1–Q12 aos líderes | SUP | Imediato (S00) |
| Obter textos de apresentação, objetivos, histórico e descrições das linhas | LID | S03 (Q7) |
| Confirmar laboratório e atividades próprias | LID | S03 (Q6) |
| Recoletar F2 e obter planilha de integrantes com autorizações, ORCID e Lattes | SUP + LID | S04 (Q5) |
| Obter planilha de orientações | LID | S07 (Q9) |
| Solicitar arquivos de produção (BibTeX/RIS/DOIs) aos integrantes | LID | S08–S09 |
