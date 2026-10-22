# ADR-0010 — Decisões do coordenador do grupo (Q1–Q12) e ajustes da v1.3

| Campo | Valor |
|---|---|
| Status | **Aceito** |
| Data | 22/10/2026 |
| Sprint | Entre S01 e S02 (planejamento v1.3) |
| Autor | Agente (registro das decisões informadas pelo coordenador e determinadas pelo responsável técnico) |
| Aprovação | Responsável técnico (supervisor), 22/10/2026 — aprovação expressa no prompt de execução da S02 |

## Contexto

O coordenador do grupo respondeu às validações Q1–Q12 (planejamento v1.2, seção 32). As respostas foram relatadas pelo responsável técnico em 22/10/2026; a data exata de envio e de resposta não foi informada. Elas alteram premissas de decisões já aprovadas:

- ADR-0006: aviso permanente de portal não oficial; papéis `admin`, `editor` e `researcher`; laboratório no escopo do M1; quatro linhas do DGP.
- ADR-0004: `User` com o papel `researcher`.
- ADR-0003: hospedagem e domínio.

O responsável técnico determinou incorporar as respostas sem mudar a stack (Next.js + Payload CMS 3 + PostgreSQL + Cloudflare R2) e sem remover módulos acadêmicos.

## Decisão

1. **Publicação e identidade (Q1, Q2)**
   - O portal é publicado como **iniciativa do grupo**.
   - Deixa de ser obrigatório o aviso ostensivo de "não é site oficial" no rodapé e no topo das páginas.
   - A página `/sobre-o-portal` informa de forma discreta quem mantém o portal (o grupo) e quem responde pelo conteúdo.
   - O selo editorial dos ensaios ("não representa posição institucional") permanece: é uma boa prática editorial, não o aviso de portal.
2. **Nome de exibição (Q2):** "Grupo de Pesquisa em Bioética e Promoção da Saúde - Unicesumar".
   - O nome curto para títulos de página e espaços reduzidos é "Bioética e Promoção da Saúde" [PREMISSA, a confirmar com o coordenador].
   - A instituição aparece **somente como texto no nome e nas referências**.
   - **Nenhum logotipo, selo ou identidade visual institucional** sem autorização formal registrada. A resposta da Q2 não concede essa autorização.
3. **Identidade visual (Q2):** azul-marinho e branco como cores-base, definidas em tokens próprios com contraste AA verificado. A marca é tipográfica (wordmark) até existir logotipo próprio aprovado.
4. **Hospedagem e domínio (Q3)**
   - Hospedagem própria, independente do site institucional; sem infraestrutura da UniCesumar.
   - Domínio próprio a adquirir no futuro. Até lá, homologação e produção usam endereços do provedor.
   - O ADR de hospedagem de produção continua na S06.
5. **Dados pessoais (Q4)**
   - A manifestação do coordenador de que a publicação de informações dos integrantes está autorizada é registrada como **autorização do grupo**.
   - Ela **não** substitui o registro individual exigido pela LGPD. Cada perfil público continua dependendo de um `ConsentRecord` vigente por escopo (perfil, foto, e-mail, orientação em andamento, egresso), com evidência e possibilidade de revogação.
   - O coordenador pode colher e encaminhar esses registros.
   - Ainda não foram definidos: controlador formal, canal do titular e modelo de termo (pendências institucionais).
6. **Acesso (Q5, Q8, Q9, Q10)**
   - Site público sem login de visitantes.
   - **Somente duas pessoas têm contas administrativas:** o coordenador do grupo e o desenvolvedor responsável.
   - Os demais integrantes são **registros acadêmicos** (`Person`), sem contas.
   - Papéis do sistema no MVP:
     - `admin` (desenvolvedor): acesso total, incluindo usuários, papéis, configurações técnicas e auditoria.
     - `editor` (coordenador): cria, edita, revisa e publica todo o conteúdo acadêmico e editorial, inclusive consentimentos e importações. Lê a auditoria; não gerencia usuários nem papéis.
   - O papel `researcher` é **removido do MVP**, junto com: edição do próprio perfil por integrantes (RF-115), submissão de ensaios por pesquisadores, sugestões de publicações e convites em massa.
   - Contas são criadas pelo `admin`; não há cadastro público. Recuperação de senha, bloqueio, limite de taxa e auditoria permanecem.
   - Reintroduzir contas de integrantes (antiga área do integrante, S13) exige novo ADR e decisão do coordenador.
7. **Fluxo editorial (Q8):** coordenador e desenvolvedor revisam e aprovam ensaios e publicações.
   - Estados mantidos: rascunho → em revisão → aprovado → agendado/publicado → arquivado, com devolução.
   - Transições permitidas apenas a `editor`/`admin`. A auditoria registra quem aprovou e publicou.
   - Autores de ensaios são `Person` (ou convidados externos), não usuários.
   - Notificações por e-mail entre os dois usuários passam a ser opcionais (RF-114: S → C).
8. **Laboratório (Q6):** o grupo tem laboratório, mas **nenhuma informação sobre ele entra agora**.
   - Removidos do M1: a página `/o-grupo/laboratorio` e a chamada na homepage.
   - O tipo `laboratory` de `Project` não é criado na S10 sem nova autorização do coordenador.
   - É proibido inventar nome, atividades ou vínculos, ou atribuir ao grupo laboratórios de terceiros (ex.: LIIPS).
   - O caminho de expansão fica documentado (planejamento 13.7).
9. **Foco temático (Q7):** o foco público do portal é **Bioética** e **Promoção da Saúde**.
   - A coleção `research-lines` (rota `/linhas`, rótulo "Linhas temáticas") passa a conter esses **dois eixos**.
   - As **quatro linhas registradas no DGP** são preservadas como **referência histórica**, em `GroupProfile.dgpResearchLines[]`, com fonte e data de coleta. Não têm páginas próprias e não são tratadas como extintas.
   - Relações existentes (`Membership.lines`, `Publication.lines`, `Supervision.line`, `Project.lines`) apontam para os eixos temáticos. Não há renomeação de entidades.
10. **Orientações e egressos (Q10):** o portal pode apresentar diferentes informações acadêmicas sobre orientações e egressos, cadastradas e geridas somente pelo coordenador e pelo desenvolvedor.
    - As regras de visibilidade e consentimento (OR-1 a OR-10, consentimento `ongoing_supervision` e `alumni_info`, direito de oposição) permanecem.
11. **Conteúdo prioritário (Q11):** não há projetos, eventos ou publicações prioritários. Os critérios de conteúdo do M2 passam a ser "se houver".
    - A regra de evidência continua: números de impacto só com fonte comprobatória.
12. **Fotografias e materiais (Q12):** fica registrada a autorização informada pelo coordenador para usar fotografias, documentos e materiais do grupo.
    - Os controles continuam: origem, crédito, licença e `alt` obrigatórios; pessoas identificáveis exigem autorização de imagem vinculada à mídia; PDFs de terceiros só com licença compatível.
    - A manifestação do coordenador cobre o direito de uso dos materiais do grupo, não o direito de imagem individual.

## Alternativas consideradas

| Alternativa | Prós | Contras | Motivo da rejeição |
|---|---|---|---|
| Manter `researcher` "para o futuro" | Facilita a V2 | Código, testes e riscos de acesso sem usuários reais; contraria a Q5 | Complexidade sem uso |
| Tratar a manifestação do coordenador como consentimento de todos | Menos registros | Não comprova a vontade do titular nem permite revogação individual; frágil diante da LGPD | Rejeitada |
| Renomear `research-lines` para `research-themes` (e `/temas`) | Nome mais preciso | Renomeação em todo o planejamento e nas fichas sem ganho funcional | Rótulo público "Linhas temáticas" basta |
| Manter o aviso de portal não oficial no rodapé | Menor risco de confusão | Contraria a decisão do coordenador (Q1) | Substituído por identificação discreta em `/sobre-o-portal` |
| Criar já a página do laboratório com placeholder | Antecipa estrutura | Contraria a Q6 e a regra de não inventar dados | Rejeitada |

## Consequências

- S02 mais simples: dois papéis, sem convites em massa, sem aviso obrigatório no rodapé; tokens azul-marinho e branco.
- S03: dois eixos temáticos, quatro linhas do DGP como referência histórica, sem laboratório.
- S04: sem edição de perfil pelos integrantes; o consentimento individual continua obrigatório.
- S05: fluxo editorial operado por duas pessoas.
- S10: sem projetos `laboratory`.
- **Risco R1/R2 maior:** toda a manutenção depende de duas pessoas. Mitigação: guia do editor, painel em português, lembretes de atualização e runbooks.
- **Risco residual (marca):** o nome de exibição contém "Unicesumar". A resposta não informa se a instituição exige comunicação prévia sobre sites de grupos (Q1, item c). A decisão é do coordenador; o portal não usa logotipos e retira menções a pedido da instituição (planejamento 15.6).
- Supera parcialmente o ADR-0006 (decisão 2 sobre o aviso; papéis da decisão 5; laboratório nas decisões 1 e 5) e o ADR-0004 (papéis da decisão 1). Os demais pontos desses ADRs continuam em vigor.

## Referências

- Planejamento v1.3: histórico, seções 1, 4, 5, 8, 9, 13, 14, 15, 16, 17, 18, 20, 25 e 32.
- `docs/content/questoes-institucionais.md` (respostas e situação de cada questão).
- ADR-0003, ADR-0004, ADR-0006.
