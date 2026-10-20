# Validações pendentes com os responsáveis do grupo (Q1–Q12)

> Origem: planejamento v1.2, seção 32 (substitui as Q1–Q20 da v1.1, dirigidas à coordenação do PPGPS — ver correspondência na seção 6).
> **Destinatários:** responsáveis pelo grupo de pesquisa "Bioética e Promoção da Saúde" (líderes registrados no DGP em 19/10/2026: Lucas França Garcia e Leonardo Pestillo de Oliveira). **Não** são dirigidas à coordenação do PPGPS nem à UniCesumar; se alguma resposta depender de consulta institucional, os próprios líderes a conduzem.
> **Regras:** (1) nenhuma validação bloqueia o **desenvolvimento** (usa-se dado público verificado ou fictício, marcado como provisório); (2) a coluna "Bloqueia" indica qual **publicação** depende da resposta; (3) a **aprovação conceitual** da proposta (registrada abaixo) **não** responde a nenhuma questão; (4) o envio é feito exclusivamente pelo supervisor — agentes não contatam a universidade nem os integrantes.

## 1. Registro de decisões e envios

| Data | Evento | Evidência | Efeito |
|---|---|---|---|
| 20/10/2026 | Responsável pelo grupo confirma: portal exclusivo do grupo e de suas atividades/laboratório; proposta de funcionalidades aprovada **conceitualmente**; sem autorização para envolver institucionalmente docentes, grupos ou coordenação do PPGPS | Relato do supervisor na sessão de 20/10/2026 (registrar e-mail/mensagem original quando disponível) | Escopo v1.2 e ADR-0006. **Não** constitui autorização de publicação, de uso de marcas nem de divulgação de dados pessoais |
| — | Envio das validações Q1–Q12 aos responsáveis | — | **Pendente — ação do supervisor** (critério de aceite da S00) |

As Q1–Q20 da v1.1 **não chegaram a ser enviadas**; não devem ser enviadas à coordenação. Atualize esta tabela (e `docs/PROGRESS.md`) ao enviar e a cada resposta.

## 2. Critérios de classificação

- **Prioridade:** **Crítica** — bloqueia o M1 e é necessária até a S04 (ou antes da S01); **Alta** — bloqueia o M1 com prazo até S05–S06, ou o módulo central do M2; **Média** — bloqueia parte do M1/M2 ou tem prazo a partir da S06; **Baixa** — não bloqueia o MVP.
- **Impacto:** **Alto** — risco legal/LGPD, de marca, de governança ou de retrabalho estrutural; **Médio** — afeta conteúdo ou parte de um módulo; **Baixo** — ajuste pontual.
- **Necessário até:** sprint em que a resposta evita retrabalho. Datas [ESTIMADO] pelo cronograma da seção 19.2 (início da sprint): S01 02/11/2026 · S02 09/11 · S03 16/11 · S04 23/11 · S05 30/11 · S06 07/12 · S07 21/12 · S08 28/12 · S10 11/01/2027.

## 3. Resumo

| # | Tema | Prioridade | Impacto | Bloqueia | Necessário até | Situação |
|---|---|---|---|---|---|---|
| Q3 | Domínio e hospedagem externa | Crítica | Alto | M1 | S06 (idealmente antes da S01) | Aberta |
| Q4 | Controlador, canal do titular, termo de autorização, regra de orientações | Crítica | Alto | M1 | S04 | Aberta |
| Q5 | Integrantes a exibir e autorizações individuais | Crítica | Alto | M1 (M2: estudantes/ex-integrantes) | S04 | Aberta |
| Q1 | Autorização formal do portal do grupo e exigências institucionais | Alta | Alto | M1 | S06 | Aberta |
| Q2 | Nome, identidade visual, uso textual das instituições, aviso | Alta | Alto | M1 | S02 / S03 | Aberta |
| Q6 | Laboratório do grupo e atividades próprias | Alta | Médio | M1 (se publicado) / M2 | S03 | Aberta |
| Q7 | Linhas e textos do grupo | Alta | Médio | M1 | S03 | Aberta |
| Q8 | Editor-chefe e política editorial | Alta | Alto | M1 | S05 | Aberta |
| Q9 | Fonte das orientações; em andamento, MINTER/DINTER, pós-doc | Alta | Alto | M2 | S07 | Aberta |
| Q10 | Curadoria contínua | Média | Alto | M2 (recomendado no M1) | S06 | Aberta |
| Q12 | Autorização de imagens e licenças de PDFs | Média | Médio | Fotos identificáveis; PDFs | S04 (fotos de perfil) / S08 / S10 | Aberta |
| Q11 | Comprovação de números de impacto | Média | Médio | M2 (evidências) | S10 | Aberta |

**Bloqueiam o M1:** Q1–Q5, Q7, Q8 e Q6 (se a página do laboratório for publicada). **Bloqueiam o M2:** Q9–Q12 (e Q5 para estudantes e ex-integrantes).

## 4. Detalhamento

### Q1 — Autorização formal do portal do grupo
- **Perguntas:** (a) Os responsáveis autorizam formalmente o portal como site **do grupo**, não oficial? (b) Quem assina as autorizações de publicação (M1, M2)? (c) A UniCesumar exige comunicação ou aprovação para sites de grupos de pesquisa que mencionem a instituição? (verificação a cargo dos líderes)
- **Por que importa:** legitimidade e governança; a aprovação conceitual de 20/10/2026 não basta para publicar.
- **Se não respondida:** desenvolvimento segue em homologação; o M1 não é publicado.

### Q2 — Nome, identidade e referências institucionais
- **Perguntas:** (a) Qual nome exibir: "Bioética e Promoção da Saúde" (título no DGP) ou "Bioética e Promoção da Saúde Global no Envelhecimento" (repercussões no DGP e página do PPGPS)? (b) O grupo tem logotipo, cores ou identidade própria? (c) Confirmam o uso **apenas textual** de UniCesumar, PPGPS e CNPq, com links e sem logotipos? (d) Aprovam o texto do aviso: "Portal do grupo de pesquisa Bioética e Promoção da Saúde. Não é site oficial da UniCesumar nem do Programa de Pós-Graduação em Promoção da Saúde"?
- **Se não respondida:** tokens visuais provisórios (S02); nome do DGP com o alternativo registrado (S03); nenhum logotipo.

### Q3 — Domínio e hospedagem
- **Perguntas:** (a) Domínio próprio do grupo ou subdomínio cedido formalmente pela instituição? (b) É aceitável hospedagem externa (Vercel/Neon/Cloudflare) com dados possivelmente fora do Brasil? (c) Há orçamento para plano pago na produção (≈ US$ 25–40/mês [ESTIMADO]), ou a produção deve buscar alternativa gratuita/VPS?
- **Contexto:** ADR-0003 (planos gratuitos até a S06; ADR de produção na S06).

### Q4 — LGPD
- **Perguntas:** (a) Quem é o controlador dos dados tratados pelo portal (líderes do grupo? a instituição?) e qual o canal do titular? (b) Qual termo de autorização será usado (há modelo institucional?) e quem o colhe e guarda? (c) Confirmam a regra de orientações concluídas: título, nível, ano e nome do orientando exibidos (dados de trabalho depositado em repositório público), com direito de oposição?
- **Contexto:** na v1.2 todo perfil público exige consentimento, inclusive de docentes (ADR-0006).

### Q5 — Integrantes e autorizações individuais
- **Perguntas:** (a) Quais integrantes atuais (o DGP lista 11 pesquisadores e 14 estudantes em 19/10/2026) devem aparecer? E quais ex-integrantes (36 registros)? (b) Os responsáveis coletarão as autorizações individuais (perfil, foto, e-mail público) e os ORCID e Lattes confirmados de cada pessoa? (c) A lista do DGP está atualizada (houve inclusões em 19/10/2026)?
- **Contexto:** sem autorização, a pessoa não tem perfil; aparece só como nome em autorias públicas.

### Q6 — Laboratório do grupo
- **Perguntas:** (a) Qual é o laboratório do grupo (nome, vínculo institucional, coordenação, finalidade)? (b) Quais atividades, projetos e ações de extensão pertencem ao grupo e quais são de terceiros (ex.: LIIPS e projetos do PPGPS em que pesquisadores do grupo participam)? (c) Há atividades próprias já existentes (ex.: LIIPS Podcast, coordenado por um dos líderes) que devem constar?
- **Contexto:** as fontes públicas não identificam um laboratório próprio do grupo; nenhum laboratório será atribuído ao grupo sem confirmação.

### Q7 — Linhas e textos do grupo
- **Perguntas:** (a) Confirmam as 4 linhas do DGP (Bioética e o processo de envelhecimento; Determinantes sociais da saúde e aspectos biopsicossociais no processo de envelhecimento; Espaços e práticas para a promoção da saúde do idoso; Tecnologias na promoção da saúde no processo de envelhecimento)? (b) Podem fornecer/aprovar apresentação, objetivos e histórico do grupo? (c) Desejam referenciar as linhas do PPGPS a que as linhas do grupo se relacionam (apenas texto)?

### Q8 — Editor-chefe e política editorial
- **Perguntas:** Quem é o editor-chefe? Qual a política editorial (temas, tom, conflitos de interesse, licença padrão — sugestão CC BY-NC-ND 4.0)? Quem redige os ≥ 3 ensaios iniciais exigidos no M1?

### Q9 — Orientações
- **Perguntas:** (a) Quem fornecerá as orientações conduzidas por pesquisadores do grupo (orientador, coorientador, orientando, nível, programa, datas de início e defesa, link do repositório)? (b) Orientações em andamento devem aparecer (com consentimento)? (c) MINTER/DINTER, sanduíche e pós-doutorado devem aparecer e com que detalhe?
- **Contexto:** a relação orientador–orientando não existe em fonte pública; proibido inferir por coautoria.

### Q10 — Curadoria
- **Pergunta:** Quem fará a curadoria contínua (integrantes, vínculos, orientações, produção) após o lançamento?

### Q11 — Impacto
- **Pergunta:** Os números de impacto das atividades do grupo têm documentos comprobatórios citáveis (relatórios, publicações, documentos oficiais)?
- **Contexto:** sem fonte, evidências não são exibidas; números declarados aparecem apenas como "declarado", com fonte e período.

### Q12 — Imagens e PDFs
- **Perguntas:** (a) As fotografias de integrantes e atividades possuem autorização de imagem? (b) Há permissão para hospedar PDFs de materiais produzidos pelo grupo?
- **Contexto:** fotos com pessoas identificáveis exigem consentimento; sem permissão de PDF, apenas links.

## 5. Modelo de mensagem (para uso do supervisor)

> Prezados professores,
>
> Conforme conversamos, o portal será exclusivamente do grupo de pesquisa Bioética e Promoção da Saúde e de suas atividades. Para avançar com segurança, precisamos de algumas confirmações. Elas não impedem o desenvolvimento, mas são necessárias antes de qualquer publicação. Nenhum dado pessoal, nome, foto ou marca institucional será publicado sem autorização expressa, e o portal será identificado como site do grupo, não oficial da UniCesumar nem do PPGPS.
>
> [Inserir a tabela da seção 3 e as perguntas da seção 4 conforme a prioridade]
>
> Se preferirem, podemos tratar os itens críticos (Q3, Q4 e Q5) em uma reunião curta.

## 6. Correspondência com a versão 1.1 (Q1–Q20)

| v1.1 | v1.2 |
|---|---|
| Q1 autorização | Q1 (aos líderes) |
| Q2 marca; Q8 nome do grupo | Q2 |
| Q3 domínio; Q18 hospedagem | Q3 |
| Q4 LGPD | Q4 |
| Q5 docentes; Q6 discentes/egressos; Q9 Lattes | Q5 |
| — | Q6 (nova: laboratório) |
| Q19 grupos ativos | Substituída por Q7 (linhas e textos do grupo) |
| Q12 editor-chefe | Q8 |
| Q7 orientações; Q20 MINTER/DINTER/pós-doc | Q9 |
| Q13 curadoria | Q10 |
| Q14 impacto | Q11 |
| Q16 PDFs; Q17 imagens | Q12 |
| Q10 permanentes × colaboradores | Removida (classificação do programa; papéis vêm do DGP) |
| Q11 conceito CAPES | Removida (dado do programa, fora do escopo) |
| Q15 OAI-PMH do RDU | Removida do MVP (link para o repositório; automação reavaliada na V2) |
