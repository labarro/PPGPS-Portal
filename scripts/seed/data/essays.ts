import { bulletList, heading, paragraph, quote, richText } from '../lexical'

/**
 * Ensaios FICTÍCIOS de demonstração (S05) — local, E2E, Lighthouse e previews. Nenhum texto,
 * autor ou referência real: títulos e referências são marcados como fictícios. Bloqueado em
 * homologação e produção (lá só entram ensaios reais aprovados pelo coordenador).
 */
export const FICTITIOUS_ESSAY_NOTE = 'Ensaio fictício de demonstração (seed:essays)'

export type SeedEssayState = 'draft' | 'published' | 'archived' | 'scheduled'

export type SeedEssay = {
  slug: string
  title: string
  subtitle?: string
  excerpt: string
  nature:
    | 'reflective_essay'
    | 'science_communication'
    | 'critical_analysis'
    | 'academic_opinion'
    | 'review'
    | 'group_news'
    | 'interview'
  category: string
  tags: string[]
  authors: (
    | { role: 'author' | 'co_author'; personSlug: string }
    | { role: 'guest'; name: string; bio: string }
  )[]
  paragraphs: string[]
  references: { authors: string; title: string; source: string; year: number }[]
  state: SeedEssayState
}

export const tagsSeed = [
  { name: 'Autonomia', slug: 'autonomia' },
  { name: 'Atenção básica', slug: 'atencao-basica' },
  { name: 'Território', slug: 'territorio' },
  { name: 'Comunicação em saúde', slug: 'comunicacao-em-saude' },
]

const body = (paragraphs: string[]) =>
  richText(
    paragraph(paragraphs[0] ?? ''),
    heading('Um ponto de partida'),
    ...paragraphs.slice(1).map((text) => paragraph(text)),
    quote('Citação fictícia usada apenas para demonstrar o estilo editorial do blog.'),
    bulletList(['Primeiro aspecto fictício.', 'Segundo aspecto fictício.']),
  )

const filler = (topic: string) => [
  `Este é um texto fictício de demonstração sobre ${topic}, criado apenas para testar o blog acadêmico do portal. Ele não representa a opinião de nenhuma pessoa real nem posição institucional.`,
  `A argumentação a seguir é ilustrativa. Em um ensaio real, o autor apresentaria o problema, os conceitos centrais e as referências que sustentam as afirmações factuais, cuidando para não expor dados de pacientes ou de terceiros.`,
  `O texto continua com parágrafos de tamanho realista para que o tempo estimado de leitura, a tipografia de leitura longa e a navegação por teclado possam ser avaliados nos testes automatizados e na homologação.`,
  `Por fim, a conclusão fictícia retoma a pergunta inicial e indica caminhos de discussão para o grupo, sem aconselhamento clínico individual.`,
]

export const essaysSeed: SeedEssay[] = [
  {
    slug: 'ensaio-ficticio-autonomia-e-cuidado',
    title: 'Autonomia e cuidado: notas fictícias para uma bioética da atenção básica',
    subtitle: 'Um ensaio de demonstração sobre decisões compartilhadas',
    excerpt:
      'Ensaio fictício de demonstração que discute, em termos gerais, a relação entre autonomia e cuidado na atenção básica.',
    nature: 'reflective_essay',
    category: 'bioetica',
    tags: ['autonomia', 'atencao-basica'],
    authors: [
      { role: 'author', personSlug: 'helena-exemplar-ficticia' },
      { role: 'co_author', personSlug: 'sofia-ilustrativa-sem-autorizacao' },
    ],
    paragraphs: filler('autonomia e cuidado'),
    references: [
      {
        authors: 'AUTORA FICTÍCIA, A.',
        title: 'Obra fictícia de demonstração sobre bioética',
        source: 'Editora Fictícia',
        year: 2020,
      },
      {
        authors: 'AUTOR EXEMPLO, B.; AUTORA EXEMPLO, C.',
        title: 'Artigo fictício sobre cuidado e decisão',
        source: 'Revista Fictícia de Demonstração',
        year: 2022,
      },
    ],
    state: 'published',
  },
  {
    slug: 'ensaio-ficticio-promocao-da-saude-em-territorios',
    title: 'Promoção da saúde em territórios: um exercício fictício de divulgação',
    excerpt:
      'Texto fictício de divulgação científica que apresenta, de forma acessível, a ideia de promoção da saúde a partir do território.',
    nature: 'science_communication',
    category: 'promocao-da-saude',
    tags: ['territorio', 'comunicacao-em-saude'],
    authors: [
      { role: 'author', personSlug: 'marina-ficticia-duarte' },
      {
        role: 'guest',
        name: 'Convidado Fictício Externo',
        bio: 'Autor convidado fictício, usado somente para demonstrar autoria externa sem conta.',
      },
    ],
    paragraphs: filler('promoção da saúde em territórios'),
    references: [
      {
        authors: 'INSTITUIÇÃO FICTÍCIA',
        title: 'Relatório fictício de demonstração',
        source: 'Repositório Fictício',
        year: 2021,
      },
    ],
    state: 'published',
  },
  {
    slug: 'ensaio-ficticio-arquivado',
    title: 'Ensaio fictício arquivado: memória de um debate',
    excerpt:
      'Ensaio fictício publicado e depois arquivado, para demonstrar o aviso de arquivamento.',
    nature: 'critical_analysis',
    category: 'bioetica',
    tags: ['autonomia'],
    authors: [{ role: 'author', personSlug: 'helena-exemplar-ficticia' }],
    paragraphs: filler('um debate arquivado'),
    references: [],
    state: 'archived',
  },
  {
    slug: 'ensaio-ficticio-agendado',
    title: 'Ensaio fictício agendado para o futuro',
    excerpt: 'Ensaio fictício agendado para uma data distante; não deve aparecer no site.',
    nature: 'academic_opinion',
    category: 'promocao-da-saude',
    tags: [],
    authors: [{ role: 'author', personSlug: 'marina-ficticia-duarte' }],
    paragraphs: filler('um tema agendado'),
    references: [],
    state: 'scheduled',
  },
  {
    slug: 'ensaio-ficticio-rascunho',
    title: 'Rascunho fictício em preparação',
    excerpt: 'Rascunho fictício; não deve aparecer no site.',
    nature: 'group_news',
    category: 'bioetica',
    tags: [],
    authors: [
      { role: 'guest', name: 'Convidada Fictícia', bio: 'Convidada fictícia de demonstração.' },
    ],
    paragraphs: filler('um rascunho'),
    references: [],
    state: 'draft',
  },
]

export const essayBody = body

/** Data distante usada no ensaio agendado de demonstração (nunca alcançada nos testes). */
export const FAR_FUTURE_SCHEDULE = '2099-01-01T12:00:00.000Z'
