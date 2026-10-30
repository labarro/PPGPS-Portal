import { isRichTextEmpty, plainText } from '../content/rich-text'

/**
 * Regras puras dos ensaios (planejamento 8.8, 13.3 e 15.5; ficha S05): natureza (selo e
 * aviso), estágio de desenvolvimento, autoria, licença, tempo de leitura, completude para
 * revisão e formatação das referências estruturadas.
 */
export const NATURE_OPTIONS = [
  { value: 'reflective_essay', label: 'Ensaio reflexivo' },
  { value: 'science_communication', label: 'Divulgação científica' },
  { value: 'critical_analysis', label: 'Análise crítica' },
  { value: 'academic_opinion', label: 'Opinião acadêmica fundamentada' },
  { value: 'review', label: 'Resenha' },
  { value: 'group_news', label: 'Notícia do grupo' },
  { value: 'interview', label: 'Entrevista' },
] as const

export type EssayNature = (typeof NATURE_OPTIONS)[number]['value']

export const natureLabel = (value: string | null | undefined): string =>
  NATURE_OPTIONS.find((option) => option.value === value)?.label ?? 'Ensaio'

/** Primeira frase do aviso, conforme a natureza (planejamento 8.8: aviso configurável por natureza). */
const NATURE_NOTICE: Record<EssayNature, string> = {
  reflective_essay: 'Texto de natureza ensaística e reflexiva.',
  science_communication: 'Texto de divulgação científica, com linguagem voltada ao público geral.',
  critical_analysis: 'Texto de análise crítica, de natureza ensaística.',
  academic_opinion: 'Texto de opinião acadêmica fundamentada, de natureza ensaística.',
  review: 'Resenha de natureza ensaística.',
  group_news: 'Notícia sobre atividades do grupo.',
  interview: 'Entrevista editada pela coordenação do portal.',
}

export const PEER_REVIEW_NOTICE =
  'Não passou por revisão por pares: a revisão editorial do portal verifica natureza, clareza e cuidados éticos, mas não equivale à avaliação científica de um periódico.'

export const INSTITUTIONAL_NOTICE =
  'As opiniões são de responsabilidade dos autores e não representam necessariamente posição institucional.'

/**
 * Aviso editorial exibido em TODO ensaio (ficha S05). A frase sobre revisão por pares e a de
 * posição institucional são fixas; o texto complementar pode ser ajustado nas configurações.
 */
export function essayNotice(
  nature: string | null | undefined,
  complement?: string | null,
): { lead: string; peerReview: string; institutional: string; complement: string | null } {
  return {
    lead: NATURE_NOTICE[nature as EssayNature] ?? NATURE_NOTICE.reflective_essay,
    peerReview: PEER_REVIEW_NOTICE,
    institutional: INSTITUTIONAL_NOTICE,
    complement: complement?.trim() || null,
  }
}

export const DEVELOPMENT_STAGE_OPTIONS = [
  { value: 'idea', label: 'Ideia' },
  { value: 'essay', label: 'Ensaio' },
  { value: 'in_discussion', label: 'Em discussão' },
  { value: 'in_academic_development', label: 'Em desenvolvimento acadêmico' },
  { value: 'published_as_article', label: 'Publicado como artigo' },
] as const

export const developmentStageLabel = (value: string | null | undefined): string | null =>
  DEVELOPMENT_STAGE_OPTIONS.find((option) => option.value === value)?.label ?? null

export const AUTHOR_ROLE_OPTIONS = [
  { value: 'author', label: 'Autor(a) principal' },
  { value: 'co_author', label: 'Coautor(a)' },
  { value: 'guest', label: 'Autor(a) convidado(a) externo(a)' },
] as const

export type AuthorRole = (typeof AUTHOR_ROLE_OPTIONS)[number]['value']

/** Licenças de ensaios (planejamento 15.5). Padrão sugerido: CC BY-NC-ND 4.0. */
export const ESSAY_LICENSES = [
  {
    value: 'cc-by-nc-nd',
    label: 'CC BY-NC-ND 4.0',
    url: 'https://creativecommons.org/licenses/by-nc-nd/4.0/deed.pt-br',
  },
  {
    value: 'cc-by-nc-sa',
    label: 'CC BY-NC-SA 4.0',
    url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/deed.pt-br',
  },
  {
    value: 'cc-by-nc',
    label: 'CC BY-NC 4.0',
    url: 'https://creativecommons.org/licenses/by-nc/4.0/deed.pt-br',
  },
  {
    value: 'cc-by-nd',
    label: 'CC BY-ND 4.0',
    url: 'https://creativecommons.org/licenses/by-nd/4.0/deed.pt-br',
  },
  {
    value: 'cc-by-sa',
    label: 'CC BY-SA 4.0',
    url: 'https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br',
  },
  {
    value: 'cc-by',
    label: 'CC BY 4.0',
    url: 'https://creativecommons.org/licenses/by/4.0/deed.pt-br',
  },
  { value: 'all-rights-reserved', label: 'Todos os direitos reservados aos autores', url: null },
] as const

export type EssayLicense = (typeof ESSAY_LICENSES)[number]['value']

export const DEFAULT_ESSAY_LICENSE: EssayLicense = 'cc-by-nc-nd'

export function resolveLicense(
  essayLicense: string | null | undefined,
  defaultLicense: string | null | undefined,
): (typeof ESSAY_LICENSES)[number] {
  const find = (value: string | null | undefined) =>
    ESSAY_LICENSES.find((license) => license.value === value)
  return find(essayLicense) ?? find(defaultLicense) ?? find(DEFAULT_ESSAY_LICENSE)!
}

/** Palavras por minuto usadas no tempo estimado de leitura (texto acadêmico em português). */
export const WORDS_PER_MINUTE = 200

export function countWords(text: string): number {
  const words = text.trim().match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu)
  return words ? words.length : 0
}

/** Tempo de leitura em minutos (mínimo 1), a partir do corpo do ensaio. */
export function readingTimeMinutes(content: unknown): number {
  const words = countWords(plainText(content))
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE))
}

export const readingTimeLabel = (minutes: number | null | undefined): string => {
  const value = Math.max(1, Math.round(minutes ?? 1))
  return value === 1 ? '1 minuto de leitura' : `${value} minutos de leitura`
}

export type EssayAuthorInput = {
  role?: string | null
  person?: unknown
  name?: string | null
  bio?: string | null
}

export type EssayForReview = {
  title?: string | null
  excerpt?: string | null
  nature?: string | null
  category?: unknown
  content?: unknown
  authors?: EssayAuthorInput[] | null
}

const hasRelation = (value: unknown) =>
  value != null && value !== '' && !(typeof value === 'object' && !(value as { id?: unknown }).id)

/** Pendências que impedem enviar à revisão, aprovar ou publicar (mensagens em português). */
export function essayCompletenessErrors(essay: EssayForReview): string[] {
  const errors: string[] = []
  if (!essay.title?.trim()) errors.push('Informe o título.')
  if (!essay.excerpt?.trim()) errors.push('Informe o resumo (chamada).')
  if (!NATURE_OPTIONS.some((option) => option.value === essay.nature)) {
    errors.push('Indique a natureza do texto.')
  }
  if (!hasRelation(essay.category)) errors.push('Escolha a categoria.')
  if (isRichTextEmpty(essay.content)) errors.push('Escreva o texto do ensaio.')
  const authors = essay.authors ?? []
  if (authors.length === 0) errors.push('Registre ao menos um autor.')
  authors.forEach((author, index) => {
    const position = index + 1
    if (author.role === 'guest') {
      if (!author.name?.trim()) errors.push(`Autor ${position}: informe o nome do convidado.`)
    } else if (!hasRelation(author.person)) {
      errors.push(`Autor ${position}: escolha o integrante cadastrado (ou use "convidado").`)
    }
  })
  if (authors.length > 0 && !authors.some((author) => author.role !== 'co_author')) {
    errors.push('Indique o autor principal (ou um autor convidado).')
  }
  return errors
}

/** DOI normalizado (sem prefixo de URL, minúsculas) ou `null` se inválido. */
export function normalizeDoi(value: string | null | undefined): string | null {
  if (!value) return null
  const clean = value
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '')
    .toLowerCase()
  return /^10\.\d{4,9}\/\S+$/.test(clean) ? clean : null
}

export function validateDoi(value: unknown): true | string {
  if (value == null || value === '') return true
  return typeof value === 'string' && normalizeDoi(value)
    ? true
    : 'DOI inválido. Ex.: 10.1590/s0104-12902020000000'
}

export type EssayReference = {
  authors?: string | null
  title?: string | null
  source?: string | null
  publisher?: string | null
  year?: number | null
  doi?: string | null
  url?: string | null
  accessedAt?: string | null
}

export type FormattedReference = {
  lead: string | null
  title: string
  rest: string | null
  doi: string | null
  url: string | null
  accessed: string | null
}

const sentence = (value: string) => (/[.!?]$/.test(value) ? value : `${value}.`)

/**
 * Referência estruturada em partes, no estilo ABNT simplificado: AUTORES. Título. Fonte,
 * editora, ano. DOI. Disponível em: URL. Acesso em: data.
 */
export function formatReference(ref: EssayReference): FormattedReference {
  const restParts = [ref.source?.trim(), ref.publisher?.trim(), ref.year ? String(ref.year) : null]
    .filter((part): part is string => !!part)
    .join(', ')
  const accessed = ref.accessedAt
    ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(ref.accessedAt))
    : null
  return {
    lead: ref.authors?.trim() ? sentence(ref.authors.trim()) : null,
    title: sentence(ref.title?.trim() || 'Sem título'),
    rest: restParts ? sentence(restParts) : null,
    doi: normalizeDoi(ref.doi),
    url: ref.url?.trim() || null,
    accessed,
  }
}

/** Texto para a descrição (meta/RSS) quando o resumo estiver vazio. */
export const essayDescription = (excerpt: string | null | undefined, content: unknown): string =>
  excerpt?.trim() || plainText(content, 200)
