/**
 * Conteúdo institucional PÚBLICO e VERIFICADO para homologação (ficha S03, tarefa 6), a partir
 * de `docs/content/inventario.md` §3.1–3.2. Cada dado registra fonte e data de coleta.
 *
 * - Fonte F2: espelho do grupo no DGP/CNPq, coletado em 19/10/2026.
 * - Fonte G: respostas do coordenador às Q2 (nome) e Q7 (linhas temáticas), relatadas em
 *   22/10/2026.
 *
 * Textos de apresentação, objetivos e histórico são PROVISÓRIOS (Q7, pendente): foram redigidos
 * apenas com fatos do registro público e ficam marcados como provisórios no painel e no site.
 * Nenhum dado pessoal: a liderança é referida pelo registro do DGP, sem nomes (S04).
 */
import { SITE_FULL_NAME } from '../../../src/lib/site/identity'
import { bulletList, paragraph, richText } from '../lexical'

export const DGP_URL = 'http://dgp.cnpq.br/dgp/espelhogrupo/5367326681852422'
export const DGP_ID = '5367326681852422'
export const DGP_COLLECTED_AT = '2026-10-19T12:00:00.000Z'
const DGP_SOURCE = 'Espelho do grupo no Diretório dos Grupos de Pesquisa do CNPq (DGP)'
const PPGPS_URL = 'https://www.unicesumar.edu.br/mestrado-e-doutorado/promocao-da-saude/'

const DGP_PURPOSE =
  'produção de trabalhos interdisciplinares e de métodos mistos que abordem questões relacionadas à bioética e promoção da saúde, especialmente no contexto do envelhecimento'

export const groupProfileSeed = {
  provisionalTexts: true,
  officialName: SITE_FULL_NAME,
  alternativeNames: [
    {
      name: 'Bioética e Promoção da Saúde',
      source: `Título do grupo no ${DGP_SOURCE}, coletado em 19/10/2026`,
    },
    {
      name: 'Bioética e Promoção da Saúde Global no Envelhecimento',
      source:
        'Campo "Repercussões" do espelho do grupo no DGP/CNPq e página do PPGPS/UniCesumar, coletados em 19/10/2026',
    },
  ],
  summary:
    'Trabalhos interdisciplinares e de métodos mistos sobre questões de bioética e promoção da saúde, especialmente no contexto do envelhecimento.',
  leadersText:
    'A liderança do grupo está registrada no Diretório dos Grupos de Pesquisa do CNPq (consulte o espelho do grupo). Os perfis dos líderes serão publicados após autorização individual.',
  description: richText(
    paragraph(
      'O Grupo de Pesquisa em Bioética e Promoção da Saúde - Unicesumar foi formado em 2021 e está certificado no Diretório dos Grupos de Pesquisa do CNPq. Sua área predominante, segundo o registro, é Ciências da Saúde, na subárea de Saúde Coletiva.',
    ),
    paragraph(`De acordo com o registro no DGP, o grupo tem como objetivo a ${DGP_PURPOSE}.`),
    paragraph(
      'Neste portal, a atuação do grupo está organizada em duas linhas temáticas: Bioética e Promoção da Saúde.',
    ),
  ),
  objectives: richText(
    paragraph('Conforme o registro do grupo no Diretório dos Grupos de Pesquisa do CNPq:'),
    bulletList([
      'Produzir trabalhos interdisciplinares e de métodos mistos sobre questões relacionadas à bioética e à promoção da saúde.',
      'Abordar essas questões especialmente no contexto do envelhecimento.',
    ]),
    paragraph(
      'Os objetivos específicos do grupo serão publicados após a validação do coordenador.',
    ),
  ),
  history: richText(
    paragraph(
      'O grupo foi formado em 2021. No Diretório dos Grupos de Pesquisa do CNPq, sua situação é "Certificado", com data da situação em 14/04/2021.',
    ),
    paragraph(
      'O espelho do grupo no DGP registra como instituição parceira a Diretoria de Pesquisa – DIPE (RS) e quatro linhas de pesquisa, listadas abaixo como referência histórica do registro.',
    ),
  ),
  dgpUrl: DGP_URL,
  dgpId: DGP_ID,
  certificationStatus: 'certified' as const,
  certifiedAt: '2021-04-14T12:00:00.000Z',
  formationYear: 2021,
  predominantArea: 'Ciências da Saúde; Saúde Coletiva',
  dgpResearchLines: [
    'Bioética e o processo de envelhecimento',
    'Determinantes sociais da saúde e aspectos biopsicossociais no processo de envelhecimento',
    'Espaços e práticas para a promoção da saúde do idoso',
    'Tecnologias na promoção da saúde no processo de envelhecimento',
  ].map((name) => ({ name, source: DGP_SOURCE, collectedAt: DGP_COLLECTED_AT })),
  institutionalReferences: [
    {
      name: 'UniCesumar',
      kind: 'institution' as const,
      relationText:
        'Grupo certificado pela UniCesumar no Diretório dos Grupos de Pesquisa do CNPq (instituição registrada: Centro de Ensino Superior de Maringá – CESUMAR; unidade: Diretoria de Pós-Graduação, Pesquisa e Extensão).',
      url: 'https://www.unicesumar.edu.br/',
      showInFooter: true,
    },
    {
      name: 'Programa de Pós-Graduação em Promoção da Saúde (PPGPS)',
      kind: 'program' as const,
      relationText:
        'Pesquisadores do grupo atuam no Programa de Pós-Graduação em Promoção da Saúde da UniCesumar.',
      url: PPGPS_URL,
      showInFooter: true,
    },
    {
      name: 'Diretório dos Grupos de Pesquisa no Brasil (DGP/CNPq)',
      kind: 'funder' as const,
      relationText: 'Registro oficial do grupo no diretório mantido pelo CNPq (espelho do grupo).',
      url: DGP_URL,
      showInFooter: true,
    },
    {
      name: 'Diretoria de Pesquisa – DIPE (RS)',
      kind: 'partner' as const,
      relationText: 'Instituição parceira registrada no espelho do grupo no DGP/CNPq.',
      showInFooter: false,
    },
  ],
  source: `${DGP_SOURCE} (${DGP_URL}); nome de exibição e linhas temáticas definidos pelo coordenador do grupo (Q2 e Q7)`,
  collectedAt: DGP_COLLECTED_AT,
}

const LINE_SOURCE =
  'Linha temática definida pelo coordenador do grupo (Q7, relatada em 22/10/2026); texto provisório elaborado a partir do espelho do grupo no DGP/CNPq (19/10/2026)'

export const researchLinesSeed = [
  {
    name: 'Bioética',
    slug: 'bioetica',
    order: 1,
    summary:
      'Eixo temático dedicado às questões de bioética estudadas pelo grupo, entre elas as relacionadas ao processo de envelhecimento.',
    description: richText(
      paragraph(
        'A Bioética é uma das duas linhas temáticas em que o grupo organiza sua atuação neste portal.',
      ),
      paragraph(
        'No registro do grupo no Diretório dos Grupos de Pesquisa do CNPq, o tema aparece na linha "Bioética e o processo de envelhecimento", apresentada no histórico do grupo como referência.',
      ),
      paragraph(
        'A descrição completa da linha, com temas de interesse e questões de pesquisa, será publicada após a validação do coordenador.',
      ),
    ),
    source: LINE_SOURCE,
  },
  {
    name: 'Promoção da Saúde',
    slug: 'promocao-da-saude',
    order: 2,
    summary:
      'Eixo temático dedicado à promoção da saúde, tema presente no registro do grupo em linhas voltadas ao processo de envelhecimento.',
    description: richText(
      paragraph(
        'A Promoção da Saúde é uma das duas linhas temáticas em que o grupo organiza sua atuação neste portal.',
      ),
      paragraph(
        'No registro do grupo no Diretório dos Grupos de Pesquisa do CNPq, o tema aparece nas linhas "Espaços e práticas para a promoção da saúde do idoso" e "Tecnologias na promoção da saúde no processo de envelhecimento", apresentadas no histórico do grupo como referência.',
      ),
      paragraph(
        'A descrição completa da linha, com temas de interesse e questões de pesquisa, será publicada após a validação do coordenador.',
      ),
    ),
    source: LINE_SOURCE,
  },
]
