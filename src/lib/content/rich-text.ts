import { pagePath, researchLinePath } from './paths'

/**
 * Tipos e regras puras do renderizador próprio de rich text (Lexical → React), sem HTML bruto
 * (AGENTS.md §4.7). Nós desconhecidos são ignorados (exibem só o texto dos filhos).
 */
export type LexicalNode = {
  type?: string
  version?: number
  children?: LexicalNode[]
  text?: string
  format?: number | string
  tag?: string
  listType?: 'bullet' | 'number' | 'check'
  value?: number
  url?: string
  fields?: {
    linkType?: 'custom' | 'internal'
    url?: string
    newTab?: boolean
    doc?: { relationTo?: string; value?: unknown } | null
  }
  [key: string]: unknown
}

export type LexicalState = { root?: LexicalNode | null } | null | undefined

export const TEXT_FORMAT = {
  bold: 1,
  italic: 2,
  strikethrough: 4,
  underline: 8,
  code: 16,
  subscript: 32,
  superscript: 64,
} as const

export function hasFormat(format: unknown, flag: number): boolean {
  return typeof format === 'number' && (format & flag) === flag
}

/**
 * Só aceita destinos seguros: caminho interno, âncora, http(s) e mailto. Qualquer outro
 * esquema (javascript:, data:, vbscript:…) é descartado e o texto aparece sem link.
 */
export function safeHref(value: unknown): string | null {
  if (typeof value !== 'string') return null
  // Remove caracteres de controle e espaços usados para disfarçar esquemas (ex.: "java\tscript:").
  const href = value.replace(/[\u0000-\u001F\u007F\s]+/g, '')
  if (!href) return null
  if (href.startsWith('/') && !href.startsWith('//')) return href
  if (href.startsWith('#')) return href
  if (/^https?:\/\/[^/]/i.test(href)) return href
  if (/^mailto:[^@]+@[^@]+$/i.test(href)) return href
  return null
}

export function isExternalHref(href: string): boolean {
  return /^(https?:|mailto:)/i.test(href)
}

/** Resolve link interno do editor (documento relacionado) para a rota pública. */
export function internalLinkHref(
  doc: { relationTo?: string; value?: unknown } | null | undefined,
): string | null {
  if (!doc || typeof doc !== 'object') return null
  const value = doc.value as { slug?: unknown } | null | undefined
  const slug = value && typeof value === 'object' ? value.slug : null
  if (typeof slug !== 'string' || !slug) return null
  if (doc.relationTo === 'research-lines') return researchLinePath(slug)
  if (doc.relationTo === 'pages') return pagePath(slug)
  return null
}

export function linkHref(node: LexicalNode): string | null {
  const fields = node.fields ?? {}
  if (fields.linkType === 'internal') return internalLinkHref(fields.doc ?? null)
  return safeHref(fields.url ?? node.url)
}

/** Nível do título exibido: o editor permite h2–h4; `base` desloca quando o texto está numa seção. */
export function headingLevel(tag: unknown, base = 2): 2 | 3 | 4 | 5 | 6 {
  const parsed = typeof tag === 'string' ? Number(tag.replace(/^h/i, '')) : NaN
  const level = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 2), 4) : 2
  return Math.min(level + (base - 2), 6) as 2 | 3 | 4 | 5 | 6
}

/** Texto puro (para descrições/meta e verificação de conteúdo vazio). */
export function plainText(state: LexicalState | unknown, maxLength?: number): string {
  const parts: string[] = []
  const walk = (node: LexicalNode | null | undefined) => {
    if (!node) return
    if (typeof node.text === 'string') parts.push(node.text)
    if (node.type === 'linebreak') parts.push(' ')
    node.children?.forEach(walk)
    if (node.type === 'paragraph' || node.type === 'heading' || node.type === 'listitem') {
      parts.push(' ')
    }
  }
  walk((state as LexicalState)?.root)
  const text = parts.join('').replace(/\s+/g, ' ').trim()
  if (maxLength && text.length > maxLength) return `${text.slice(0, maxLength - 1).trimEnd()}…`
  return text
}

/**
 * Parágrafos iniciais (texto puro) até o limite de caracteres, sem cortar no meio da frase:
 * usado em chamadas resumidas (ex.: apresentação na página inicial).
 */
export function leadingParagraphs(state: LexicalState | unknown, maxChars = 480): string[] {
  const root = (state as LexicalState)?.root
  const result: string[] = []
  let total = 0
  for (const node of root?.children ?? []) {
    if (node.type !== 'paragraph') continue
    const text = plainText({ root: { children: [node] } })
    if (!text) continue
    if (result.length > 0 && total + text.length > maxChars) break
    result.push(text)
    total += text.length
  }
  return result
}

export function isRichTextEmpty(state: LexicalState | unknown): boolean {
  return plainText(state) === ''
}
