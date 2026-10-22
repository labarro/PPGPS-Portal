# ADR-0004 — Modelo de pessoas: Pessoa ≠ Usuário, vínculos datados com o grupo e Conclusões acadêmicas

| Campo | Valor |
|---|---|
| Status | **Aceito** — parcialmente superado pelo ADR-0010 (22/10/2026) |
| Data | 19/10/2026 · revisado em 20/10/2026 (escopo do grupo, ADR-0006) |
| Sprint | S00 |
| Autor | Agente |
| Aprovação | Responsável técnico (supervisor), 22/10/2026 — aprovação expressa dos ADRs 0001–0009 |


> **Nota de 22/10/2026 (ADR-0010, Q5):** papéis do MVP reduzidos a `admin` (desenvolvedor) e `editor` (coordenador); `researcher` removido. Integrantes são `Person` sem conta. `User.person` 0..1 permanece. O restante deste ADR está em vigor.

## Contexto

A análise das fontes mostrou:

- A mesma pessoa aparece com grafias diferentes e com Lattes divergentes em fontes públicas.
- No DGP do grupo, pessoas mudam de papel ao longo do tempo (estudante → pesquisadora; egressa de um papel e ativa em outro). Verificado em 19/10/2026: ao menos duas pessoas constam simultaneamente como ex-integrantes no papel de estudante e ativas no papel de pesquisadora (nomes omitidos por minimização de dados).
- A maioria das pessoas exibidas **não terá conta**; algumas contas (ex.: técnico) não correspondem a uma pessoa exibida.
- "Egresso" tem dois sentidos: quem concluiu uma formação (mestrado, doutorado, pós-doc) × ex-integrante do grupo (o DGP usa "egressos" no segundo sentido).
- Uma pessoa pode ter várias titulações (inclusive em programas diferentes) e ser egressa e integrante ativa ao mesmo tempo.
- Com o escopo restrito ao grupo (ADR-0006), os vínculos relevantes são **com o grupo**; programas e instituições são contexto.

## Decisão

1. **`Person` ≠ `User`.** `Person` é o indivíduo acadêmico; `User` é a conta com papéis (`admin`, `editor`, `researcher`); relação **`User.person` 0..1** (S04).
2. **Papéis são vínculos datados com o grupo (`Membership`)**: papel (líder, pesquisador, estudante, técnico, colaborador estrangeiro, colaborador externo), nível de treinamento para estudantes (graduação/IC, especialização/MBA, mestrado, doutorado, pós-doc), linhas de atuação, início, fim, situação, motivo de encerramento e procedência (ex.: transcrição do DGP). **Não existe** campo "tipo de pessoa"; o papel atual é **calculado** (função pura testada) por hierarquia.
3. Vínculos do mesmo (pessoa, papel, nível) **não se sobrepõem**; `endDate ≥ startDate`.
4. **Afiliações institucionais** da pessoa (ex.: docente do PPGPS/UniCesumar) são **referências textuais** no perfil (`Person.affiliations`), não vínculos modelados.
5. **Conclusão acadêmica (`AcademicCompletion`)**: um registro por titulação ou pós-doutorado, ligado a pessoa e orientação, com **programa e instituição de referência** (texto + URL) e modalidade (S07). **Egresso é derivado** da existência de ao menos uma conclusão registrada no contexto do grupo; nunca de campo editável.
6. **Ex-integrante** é derivado de vínculo encerrado com o grupo sem vínculo ativo — conceito distinto, exibido como filtro/seção própria.
7. **Desligado sem titulação** não é exibido publicamente.
8. **Trajetória profissional (`CareerEntry`, N)** e **Perfil de egresso (`AlumniProfile`, 1)** públicos só com consentimento `alumni_info` (S07).
9. **Formação no perfil** = conclusões registradas (derivadas) + `externalEducation`, sem duplicidade.
10. **Visibilidade:** perfil público de qualquer pessoa exige consentimento `public_profile` vigente (ADR-0006).
11. Operações compostas (concluir orientação + criar conclusão + atualizar vínculo com o grupo) em **transação única**.
12. Entidades nascem conforme a seção 13.6 do planejamento: `Person`, `Membership`, `ConsentRecord` na **S04**; `Supervision`, `SupervisionParticipant`, `AcademicCompletion`, `AlumniProfile`, `CareerEntry` na **S07**.

## Alternativas consideradas

| Alternativa | Prós | Contras | Motivo da rejeição |
|---|---|---|---|
| Pessoa = Usuário | Menos entidades | Obriga conta para toda pessoa exibida; mistura autenticação com dado acadêmico | Inadequado |
| Campo "tipo de pessoa" | Simples | Perde histórico; não representa múltiplos papéis | Contradiz os dados do DGP |
| Egresso como motivo de encerramento do vínculo | Sem entidade extra | Não registra várias titulações, defesa, trabalho final e programa | Insuficiente |
| Vínculo polimórfico programa/grupo (v1.1) | Multiprograma | Complexidade sem uso no escopo do grupo | Substituído (ADR-0006) |

## Consequências

- Linha do tempo de vínculos e indicadores históricos da composição do grupo sem migração estrutural.
- Regras testadas para sobreposição, papel atual e derivação de egresso/ex-integrante.
- Importações preservam procedência e nunca inferem orientações por coautoria.
- A S03 usa `GroupProfile.leadersText` temporário (sem `Person`); removido na S04 via *expand/contract*.

## Referências

- Planejamento v1.2, seções 8.2–8.4, 10.4, 13.1–13.7, 14; ADR-0006.
- Espelho DGP do grupo: <http://dgp.cnpq.br/dgp/espelhogrupo/719693> (consultado em 19/10/2026).
