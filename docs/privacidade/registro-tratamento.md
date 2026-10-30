# Registro das operações de tratamento de dados pessoais

> Ficha S04, tarefa 9; planejamento v1.4, seções 8.2, 10.5, 17.1–17.3 e 17.7 (S04).
> Documento interno de governança (art. 37 da LGPD). Atualizar a cada nova categoria de dado ou finalidade (próximas: S05 ensaios, S07 orientações e egressos).
> **Situação:** versão inicial de 30/10/2026, redigida pelo agente. Itens marcados como **[EM ABERTO]** dependem do coordenador (Q4) e de validação jurídica; nada aqui foi inventado como fato.

## 1. Identificação

| Item | Situação |
|---|---|
| Portal | Portal do Grupo de Pesquisa em Bioética e Promoção da Saúde - Unicesumar (iniciativa do grupo; não é site oficial da UniCesumar nem do PPGPS) |
| Domínio de produção | `https://bioeticaps.app` (ADR-0014; publicação somente na S06) |
| Controlador | **[EM ABERTO — Q4]** [PREMISSA do planejamento 17.2] o coordenador responde pelo tratamento no âmbito do grupo, sem prejuízo de exigências da UniCesumar, a verificar pelo próprio coordenador |
| Canal do titular (acesso, correção, oposição, revogação, eliminação) | **[EM ABERTO — Q4]** até a definição, pedidos chegam pelo contato do grupo (`/o-grupo/contato`) e são registrados pelo coordenador ou pelo desenvolvedor |
| Operadores (infraestrutura) | Vercel (aplicação, região `gru1`), Neon (banco, `aws-sa-east-1`), Cloudflare R2 (arquivos e backups criptografados), GitHub (código e pipelines, sem dados pessoais reais) |
| Quem acessa dados administrativos | Somente duas contas: coordenador (`editor`) e desenvolvedor (`admin`) (Q5). Não há contas de integrantes nem de visitantes |

## 2. Contexto: autorização do grupo × autorização individual

- O coordenador informou (Q4, 22/10/2026) que a publicação de informações dos integrantes está autorizada pelo grupo, e (Q12) que há autorização para usar fotografias e materiais do grupo.
- Essas manifestações ficam registradas como **contexto**. **Não** substituem o consentimento individual de cada titular, registrado por escopo em `consent-records` (planejamento 17.2; AGENTS.md §9.3).

## 3. Operações de tratamento (S04–S05)

| # | Operação | Titulares | Dados | Finalidade | Base legal proposta [PREMISSA a validar juridicamente] | Onde | Retenção |
|---|---|---|---|---|---|---|---|
| T1 | Cadastro de pessoas do grupo | Integrantes e ex-integrantes (pesquisadores — inclusive docentes e líderes —, estudantes, técnicos, colaboradores) | Nome completo, nome em citações e variantes, mini-biografia, apresentação acadêmica, formação, áreas de atuação, afiliações (texto), Lattes, ORCID, outros perfis acadêmicos | Registro acadêmico do grupo e preparação de perfis | Consentimento (art. 7º, I) para a publicação; o cadastro interno prévio à autorização é mínimo e fica restrito às duas contas | `people` | Enquanto houver vínculo ou interesse histórico do grupo; exclusão lógica por arquivamento; eliminação a pedido do titular, com anonimização (planejamento 13.1) |
| T2 | Vínculos com o grupo | Mesmos de T1 | Papel no grupo, nível de formação (estudantes), linhas temáticas, período, motivo do encerramento, fonte | Composição e histórico do grupo; diretório público | Consentimento para a exibição pública (segue o perfil) | `memberships` | Como T1 |
| T3 | Perfil público | Titulares com escopo `public_profile` vigente | Dados de T1/T2, exceto foto e e-mail | Divulgação acadêmica do grupo | **Consentimento individual** (`public_profile`) | `/integrantes`, `/integrantes/[slug]`, linhas, `/o-grupo`, página inicial, sitemap, JSON-LD | Até a revogação (efeito imediato) |
| T4 | Fotografia | Titulares com escopo `photo` vigente | Imagem identificável + crédito, licença e origem | Identificação visual no perfil | **Consentimento individual** (`photo`), vinculado à mídia (`media.consentRecord`) | `media` (bucket privado; arquivo servido só após verificação de acesso) | Até a revogação; a imagem deixa de ser servida imediatamente |
| T5 | E-mail público | Titulares com escopo `email` vigente | E-mail informado pelo titular | Contato acadêmico | **Consentimento individual** (`email`) | Perfil público (nunca no JSON-LD) | Até a revogação |
| T6 | Registro das autorizações | Mesmos de T1 | Escopos, data, meio, comprovante (documento privado), quem colheu, revogação, observações | Prova do consentimento e controle da visibilidade | Cumprimento de obrigação de demonstrar o consentimento (art. 8º, §2º) | `consent-records`, `documents` (visibilidade administrativa) | Enquanto o dado tratado existir e pelo prazo necessário à defesa em eventual questionamento **[EM ABERTO — definir prazo com o coordenador]** |
| T7 | Contas administrativas | Coordenador e desenvolvedor | E-mail, nome de exibição, papel, último acesso; vínculo opcional à própria pessoa (`users.person`) | Acesso e auditoria | Execução das atividades do grupo / legítimo interesse [PREMISSA] | `users`, `audit-logs` | Enquanto a função durar; auditoria por 2 anos [PREMISSA, planejamento 13.3] |
| T9 | Autoria de ensaios (S05) | Integrantes cadastrados e autores convidados externos | Nome publicado; minibiografia (somente convidados); vínculo interno com people (integrantes) | Atribuição de autoria no blog | Consentimento/autorização do autor ao enviar o texto à coordenação [PREMISSA: termo de cessão — política editorial, Q8]; link para o perfil só com public_profile vigente | essays.authors, /blog, RSS, JSON-LD | Enquanto o ensaio existir (arquivamento mantém a autoria) |
| T10 | Revisão editorial interna (S05) | Coordenador e desenvolvedor | Quem enviou, aprovou, publicou e arquivou; comentários de revisão; anotações internas | Fluxo editorial e auditoria | Legítimo interesse / execução das atividades do grupo [PREMISSA] | essays (campos internos, nunca públicos), udit-logs | Como o ensaio; auditoria por 2 anos |
| T8 | Importação de planilha | Pessoas da planilha validada pelo coordenador | Colunas do modelo (§6) | Carga inicial sem digitação manual | Como T1 (nenhuma publicação sem consentimento) | `scripts/import/people.ts` | Arquivo da planilha fora do repositório (`*.csv` ignorado pelo git); apagar após a carga |

## 4. Regras técnicas que garantem o registro (verificadas por testes)

1. **Nenhum perfil público sem `public_profile` vigente** — inclusive docentes e líderes. Regra única `canViewPublic(person)` (`src/lib/content/visibility.ts`), aplicada no acesso da API, nas consultas das páginas, no sitemap e no JSON-LD.
2. **Foto** só com `photo` e mídia vinculada a autorização vigente da própria pessoa; **e-mail** só com `email`. Sem perfil público, nada é exibido.
3. **Revogação** registrada em `consent-records.revokedAt` (definitiva) recalcula imediatamente os campos da pessoa e das mídias e revalida diretório, perfil, linhas, `/o-grupo`, página inicial e sitemap; remove redirecionamentos para o perfil.
4. Consentimentos e campos calculados **nunca** saem em respostas públicas (acesso por campo) nem podem ser usados como filtro por visitantes.
5. Importação **nunca** cria consentimentos, e-mails ou fotos.
6. **Minimização:** não há campos de CPF, matrícula, data de nascimento, telefone ou endereço. Dados de saúde de pessoas não são tratados.
7. Exclusão física de pessoa com vínculos/autorizações é bloqueada (arquivamento); auditoria imutável de criação, edição e exclusão.
8. Fixtures, seeds e testes usam **somente dados fictícios** (`example.com`, ORCIDs fora das faixas emitidas). O seed fictício é bloqueado em homologação e produção.
9. Consentimentos, comprovantes e auditoria **não** são copiados para fora da produção (ADR-0005).
10. **Ensaios (S05):** autores sem public_profile aparecem só pelo nome publicado (sem link, sem id do cadastro na API pública); comentários de revisão, checklist, anotações internas e responsáveis pelo fluxo nunca saem em respostas públicas; o editor exibe alerta contra dados de pacientes, participantes de pesquisa e terceiros, e o checklist de aprovação exige a confirmação de ausência desses dados.

## 5. Transferência internacional

Operadores podem processar dados fora do Brasil (Vercel, Neon, Cloudflare, GitHub). Regiões mais próximas já configuradas (Neon `sa-east-1`, funções Vercel `gru1`). Registrar na política de privacidade (S06).

## 6. Modelo da planilha de importação

Arquivo CSV (UTF-8; separador `;` ou `,`), uma linha por vínculo. Modelo fictício: `tests/fixtures/people-ficticio.csv` (a linha 5 contém erros de propósito).

| Coluna | Obrigatória | Valores |
|---|---|---|
| `nome_completo` | Sim | Nome completo |
| `nome_citacao`, `slug` | Não | Slug gerado do nome se vazio |
| `orcid`, `lattes` | Recomendado | Chaves de idempotência (ORCID, depois Lattes) |
| `papel` | Sim | `lider`, `pesquisador`, `estudante`, `tecnico`, `colaborador-estrangeiro`, `colaborador-externo` |
| `nivel_formacao` | Para estudantes | `posdoc`, `doutorado`, `mestrado`, `especializacao`, `graduacao`, `outro` |
| `linhas` | Não | Slugs separados por `\|` (ex.: `bioetica\|promocao-da-saude`) |
| `inicio`, `termino` | `inicio` sim | `AAAA-MM-DD` ou `DD/MM/AAAA`; término nunca futuro |
| `motivo_termino` | Se houver término | `saida`, `conclusao`, `mudanca-de-papel`, `outro` |
| `fonte`, `url_fonte`, `data_coleta` | Não | `planilha` (padrão), `dgp`, `manual` |

Uso: `pnpm import:people <arquivo.csv>` (pré-visualização) e `pnpm import:people <arquivo.csv> --apply` (gravação). Reexecutar não duplica pessoas nem vínculos.

## 7. Pendências que dependem do coordenador

1. Controlador e canal do titular (Q4).
2. Termo de autorização individual (modelo com os três escopos independentes: perfil público, foto, e-mail).
3. Lista nominal validada de integrantes e ex-integrantes, com ORCID/Lattes e as autorizações individuais colhidas.
4. Prazo de guarda dos comprovantes após revogação.
5. Recoleta do DGP antes da carga (houve atualização em 19/10/2026).
