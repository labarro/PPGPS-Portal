# CLAUDE.md — Instruções para Claude (Claude Code e similares)

> **Leia primeiro o [`AGENTS.md`](./AGENTS.md).** Ele é a fonte única das regras do projeto (arquitetura, escopo, migrations, ambientes, testes, segurança, protocolo de sprint e Definition of Done). Este arquivo só acrescenta orientações específicas do Claude e **não** substitui nem relaxa nenhuma regra do `AGENTS.md`. Em caso de divergência, vale o `AGENTS.md`.

## Escopo em uma frase

Portal do **"Grupo de Pesquisa em Bioética e Promoção da Saúde - Unicesumar"**, publicado como iniciativa do grupo, com foco em Bioética e Promoção da Saúde. **Não** é portal do PPGPS nem da UniCesumar, que são apenas referências textuais (planejamento v1.3, ADR-0006, ADR-0010).

## Ordem de leitura ao iniciar qualquer sessão

1. `AGENTS.md`
2. `docs/PROGRESS.md` — sprint ativa, situação, pendências e próximos passos
3. `docs/sprints/SXX.md` — ficha da sprint ativa (escopo fechado e **fora de escopo**)
4. Seções do `docs/PLANEJAMENTO_PORTAL_PPGPS.md` citadas na ficha (no mínimo 13, 14 e a ficha correspondente da seção 20)
5. ADRs relevantes em `docs/adr/`

Não dependa do histórico de conversas anteriores; se algo não está nos arquivos, trate como desconhecido e pergunte.

## Comportamento esperado

- **Idioma:** responda e documente em português; código e identificadores em inglês (AGENTS.md §5).
- **Planejamento de tarefas:** use a ferramenta de lista de tarefas (TodoWrite ou equivalente) para toda sprint ou tarefa com 3+ passos, marcando o progresso em tempo real.
- **Plano antes de codar:** siga o passo 2 do protocolo (AGENTS.md §11): apresente plano curto e aguarde confirmação, a menos que o supervisor tenha autorizado execução autônoma na sessão.
- **Escopo:** antes de criar qualquer arquivo, coleção, rota ou dependência, confirme que está listado na ficha da sprint ativa. Se não estiver, registre em `docs/PROGRESS.md` como pendência.
- **Pull Requests:** siga a política permanente do `AGENTS.md` §11.1 (squash merge autônomo apenas com checks verdes, sem conflitos, diff revisado e migrations seguras; nunca deploy de produção).
- **Commits e push:** siga `docs/convencoes-git.md`. Instruções da sessão prevalecem (ex.: "não faça commit"). Nunca faça `push --force`, nunca altere configuração do git, nunca pule hooks.
- **Ações externas:** nunca envie mensagens, e-mails ou formulários à universidade, aos integrantes do grupo ou a terceiros; nunca acesse ambientes de produção.
- **Dados institucionais:** não invente; registre fonte e data; marque divergências como provisórias (AGENTS.md §9.1).
- **Escopo do grupo:** não modele nem carregue docentes, grupos, linhas ou produção do PPGPS que não pertençam ao grupo; não use logotipos ou identidade visual da UniCesumar/PPGPS/CNPq; não inclua o laboratório (Q6). Não há aviso ostensivo de portal não oficial (Q1).
- **Acesso:** só existem os papéis `admin` (desenvolvedor) e `editor` (coordenador); não crie `researcher`, contas de integrantes ou login de visitantes (Q5).
- **Autorização:** as respostas do coordenador (Q1–Q12, em `docs/content/questoes-institucionais.md`) valem com as limitações registradas. A autorização do grupo **não** substitui o consentimento individual de cada titular nem autoriza logotipos institucionais.
- **Fim da sessão:** atualize `docs/PROGRESS.md` (feito, em andamento, decisões, pendências, próximos passos) e apresente um resumo com critérios atendidos e pendentes.

## Ferramentas MCP disponíveis no ambiente do supervisor

- **shadcn/ui MCP:** fonte preferencial para componentes de UI (a partir da S02). Copie componentes para `src/components/ui` conforme o padrão shadcn.
- **21st.dev MCP:** apenas para inspiração ou componentes pontuais, dentro do escopo da sprint. **Não** use geração paga ou recuperação paga de componentes sem autorização do supervisor.
- **Chrome DevTools MCP:** depuração, acessibilidade, Lighthouse e verificação de cabeçalhos em ambiente local ou preview — nunca em produção com credenciais.
- **WebFetch:** consulta a documentação técnica e às fontes públicas listadas no planejamento (seção 33). Não faça *scraping* de Lattes, DGP ou Sucupira.

## Lembretes de alto risco

- Nada de Prisma, GraphQL público ou `dangerouslySetInnerHTML` com rich text.
- Nada de migrations no `next build`; nada de `push` de schema fora do banco local.
- Nada de dados reais de pessoas em fixtures; nenhum perfil público sem consentimento (inclusive docentes e líderes).
- Nada de coleções `programs`/`research-groups`, papéis `group_manager`/`researcher` ou chave de grupo nas entidades (grupo único = global `GroupProfile`).
- Toda coleção nova com dados não públicos exige teste de vazamento.
