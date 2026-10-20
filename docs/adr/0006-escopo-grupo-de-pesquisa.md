# ADR-0006 — Escopo restrito ao grupo de pesquisa e simplificação do modelo

| Campo | Valor |
|---|---|
| Status | Proposto (aguarda aceite do supervisor) |
| Data | 20/10/2026 |
| Sprint | S00 (revisão de escopo; planejamento v1.2) |
| Autor | Agente |
| Aprovação | — |

## Contexto

O planejamento v1.1 tratava o portal como representação do **PPGPS inteiro** (programa, 2 linhas, 4 projetos integradores, 7 grupos, 12 docentes, ≈190 dissertações), com o grupo "Bioética e Promoção da Saúde" apenas como piloto de carga. O responsável pelo grupo informou (20/10/2026, via supervisor) que:

1. o portal será **exclusivamente do grupo de pesquisa "Bioética e Promoção da Saúde"** e de suas atividades/laboratório;
2. a proposta de funcionalidades foi aprovada **conceitualmente**;
3. **não existe autorização** para envolver institucionalmente todos os docentes, grupos ou a coordenação do PPGPS.

Consequências diretas: o modelo multiprograma/multigrupo deixa de ser necessário; a base institucional proposta para exibir dados de docentes (legítimo interesse do programa) desaparece; marcas institucionais não podem ser usadas sem autorização; as validações devem ser dirigidas aos responsáveis do grupo.

## Decisão

1. **Escopo:** o portal representa somente o grupo (identidade, linhas, integrantes, laboratório, orientações conduzidas por seus pesquisadores, egressos, produção relacionada ao grupo, eventos, projetos, impacto, blog e indicadores do grupo). Todos os módulos acadêmicos planejados são **preservados**.
2. **Instituições como referência:** UniCesumar, PPGPS e CNPq/DGP aparecem apenas como referências textuais com links; sem logotipos ou identidade visual institucional sem autorização formal; aviso permanente de **portal não oficial** no rodapé e em `/sobre-o-portal` (planejamento 5.4).
3. **Aprovação conceitual ≠ autorização:** publicação, uso de marcas e divulgação de dados pessoais exigem autorizações explícitas e registradas (validações Q1, Q2, Q4, Q5 do planejamento v1.2).
4. **Privacidade:** todo perfil público, inclusive de docentes e líderes, exige consentimento registrado (`public_profile`; `photo` e `email` separados).
5. **Simplificação do modelo** (planejamento 13.3):
   - grupo único como global `GroupProfile` (não coleção); `Program` e `ResearchGroup` removidos;
   - programas e instituições externos como **campos de referência** (texto + URL) em `Person.affiliations`, `Supervision`, `AcademicCompletion`, `Project` e `GroupProfile.institutionalReferences`;
   - `ResearchLine` somente do grupo; `Membership` sempre relativo ao grupo, com `role`, `trainingLevel` e `lines`;
   - `Project` sem tipo "integrador", criado na S10 (tipos pesquisa, extensão, cooperação, laboratório);
   - papéis `admin`, `editor`, `researcher` (sem `group_manager` e `User.managedGroups`);
   - identificadores externos como campos validados (sem coleção `ExternalId`); `Publication.groups` removido.
6. **Expansão futura sem complexidade prematura:** caminhos documentados (planejamento 13.7) para multigrupo, instituições normalizadas, laboratórios estruturados e identificadores múltiplos, a serem adotados apenas com novo ADR e ficha de sprint.
7. **Stack, arquitetura técnica, ambientes, migrations e sequência de sprints permanecem inalterados** (ADR-0001, 0002, 0003, 0005).
8. **Nome técnico:** arquivo `PLANEJAMENTO_PORTAL_PPGPS.md` e repositório `PPGPS-Portal` mantidos para não quebrar referências; não são exibidos ao público nem indicam vínculo oficial.

## Alternativas consideradas

| Alternativa | Prós | Contras | Motivo da rejeição |
|---|---|---|---|
| Manter o modelo multigrupo/multiprograma "para o futuro" | Expansão sem migração | Complexidade em coleções, acesso por grupo e testes sem uso real; contraria a regra de não antecipação | Complexidade prematura |
| `ResearchGroup` como coleção com um único registro | Expansão mais simples | Acesso, filtros e relações com chave de grupo desnecessárias em todo o modelo | Custo contínuo sem benefício atual; global é suficiente |
| Manter legítimo interesse para perfis docentes | Menos coleta de autorizações | Sem base institucional; risco LGPD | Incompatível com a ausência de autorização institucional |
| Usar marcas da UniCesumar/PPGPS como contexto visual | Reconhecimento | Sem autorização; risco de parecer site oficial | Proibido até autorização formal (Q2) |

## Consequências

- Menos coleções e regras de acesso (S03 e S04 mais simples); `Project` passa da S03 para a S10.
- Mais dependência de consentimentos individuais para o conteúdo do M1 (mitigado: M1 publica apenas quem autorizou, no mínimo os líderes).
- Migração para multigrupo, se um dia necessária, exigirá *expand/contract* planejado (aceito conscientemente).
- Inventário, validações, fichas S00–S11, AGENTS.md e CLAUDE.md revisados para o novo escopo.

## Referências

- Planejamento v1.2: histórico de mudanças, seções 1, 5, 8, 13, 14, 17.2, 18, 20 e 32.
- ADR-0004 (revisado para vínculos do grupo).
- `docs/content/inventario.md` e `docs/content/questoes-institucionais.md`.
