import { type LexicalNode, safeHref } from '../content/rich-text'

/**
 * Higienização do texto rico no SERVIDOR (ficha S05; planejamento 13.4 e 17.7): aplicada a
 * todo salvamento de ensaio, independentemente do editor do navegador. Cobre colagens do
 * Word/Google Docs e envios diretos pela API:
 *
 * - somente os tipos de nó que o renderizador próprio sabe exibir (lista de permissões);
 *   nós desconhecidos (ex.: `html`, incorporações, código) viram texto simples;
 * - estilos inline (`style`, `textStyle`: cores, fontes, tamanhos) são removidos;
 * - links só com destinos seguros (`safeHref`); `javascript:`/`data:` perdem o link;
 * - títulos limitados a h2–h4; formatos de texto limitados aos bits conhecidos;
 * - imagens só da coleção `media` (que exige alt, crédito, licença e autorização).
 *
 * Nada aqui gera HTML: o conteúdo continua sendo JSON renderizado pelo React (sem HTML bruto).
 */
const BLOCK_TYPES = new Set(['paragraph', 'heading', 'quote', 'list', 'horizontalrule', 'upload'])
const INLINE_TYPES = new Set(['text', 'linebreak', 'tab', 'link', 'autolink'])
const LIST_CHILD = 'listitem'
const KNOWN_TEXT_FORMAT_MASK = 1 | 2 | 4 | 8 | 16 | 32 | 64

type Node = LexicalNode & Record<string, unknown>

const textNode = (text: string): Node => ({
  type: 'text',
  version: 1,
  text,
  format: 0,
  style: '',
  mode: 'normal',
  detail: 0,
})

const paragraphOf = (children: Node[]): Node => ({
  type: 'paragraph',
  version: 1,
  format: '',
  indent: 0,
  direction: 'ltr',
  textFormat: 0,
  textStyle: '',
  children,
})

function textOf(node: Node): string {
  if (typeof node.text === 'string') return node.text
  return (node.children ?? []).map((child) => textOf(child as Node)).join(' ')
}

function sanitizeInline(node: Node): Node[] {
  switch (node.type) {
    case 'text': {
      const format = typeof node.format === 'number' ? node.format & KNOWN_TEXT_FORMAT_MASK : 0
      return [{ ...node, format, style: '', text: typeof node.text === 'string' ? node.text : '' }]
    }
    case 'linebreak':
    case 'tab':
      return [{ type: node.type, version: 1 }]
    case 'link':
    case 'autolink': {
      const children = sanitizeInlineChildren(node.children as Node[] | undefined)
      const fields = (node.fields ?? {}) as NonNullable<LexicalNode['fields']>
      if (fields.linkType === 'internal') {
        const doc = fields.doc
        const allowed = ['pages', 'research-lines', 'essays']
        if (doc && typeof doc === 'object' && allowed.includes(String(doc.relationTo))) {
          return [{ ...node, children, fields: { ...fields, url: undefined } }]
        }
        return children
      }
      const href = safeHref(fields.url ?? node.url)
      if (!href) return children
      return [
        {
          ...node,
          children,
          url: undefined,
          fields: { ...fields, linkType: 'custom', url: href, newTab: fields.newTab === true },
        },
      ]
    }
    default: {
      // Nó inline desconhecido: mantém só o texto.
      const text = textOf(node)
      return text ? [textNode(text)] : []
    }
  }
}

function sanitizeInlineChildren(children: Node[] | undefined): Node[] {
  return (children ?? []).flatMap((child) =>
    child && typeof child === 'object' ? sanitizeInline(child) : [],
  )
}

const HEADING_TAGS = ['h2', 'h3', 'h4']

function normalizeHeadingTag(tag: unknown): string {
  const level = typeof tag === 'string' ? Number(tag.replace(/^h/i, '')) : NaN
  if (!Number.isFinite(level)) return 'h2'
  return HEADING_TAGS[Math.min(Math.max(level, 2), 4) - 2]!
}

function sanitizeListItem(node: Node): Node {
  const children = (node.children ?? []).flatMap((child) => {
    const item = child as Node
    if (item?.type === 'list') return [sanitizeBlock(item)].filter(Boolean) as Node[]
    return sanitizeInline(item)
  })
  return {
    type: LIST_CHILD,
    version: 1,
    format: '',
    indent: typeof node.indent === 'number' ? node.indent : 0,
    direction: 'ltr',
    value: typeof node.value === 'number' ? node.value : 1,
    children,
  }
}

function sanitizeBlock(node: Node): Node | null {
  if (!node || typeof node !== 'object') return null
  switch (node.type) {
    case 'paragraph':
      return { ...node, textStyle: '', children: sanitizeInlineChildren(node.children as Node[]) }
    case 'heading':
      return {
        ...node,
        tag: normalizeHeadingTag(node.tag),
        children: sanitizeInlineChildren(node.children as Node[]),
      }
    case 'quote':
      return { ...node, children: sanitizeInlineChildren(node.children as Node[]) }
    case 'list': {
      const listType = node.listType === 'number' ? 'number' : 'bullet'
      return {
        ...node,
        listType,
        tag: listType === 'number' ? 'ol' : 'ul',
        children: (node.children ?? [])
          .filter((child) => (child as Node)?.type === LIST_CHILD)
          .map((child) => sanitizeListItem(child as Node)),
      }
    }
    case 'horizontalrule':
      return { type: 'horizontalrule', version: 1 }
    case 'upload':
      return node.relationTo === 'media' && node.value != null ? { ...node } : null
    default: {
      // Bloco desconhecido (ex.: HTML colado, incorporação): vira parágrafo com o texto.
      if (INLINE_TYPES.has(String(node.type))) {
        const inline = sanitizeInline(node)
        return inline.length > 0 ? paragraphOf(inline) : null
      }
      const text = textOf(node).trim()
      return text ? paragraphOf([textNode(text)]) : null
    }
  }
}

export type LexicalDocument = { root: Node }

export function sanitizeLexical(state: unknown): LexicalDocument | null {
  if (!state || typeof state !== 'object') return null
  const root = (state as { root?: Node }).root
  if (!root || typeof root !== 'object') return null
  const children = (root.children ?? [])
    .map((child) => sanitizeBlock(child as Node))
    .filter((child): child is Node => child !== null && BLOCK_TYPES.has(String(child.type)))
  return {
    root: {
      type: 'root',
      version: typeof root.version === 'number' ? root.version : 1,
      format: '',
      indent: 0,
      direction: 'ltr',
      children,
    },
  }
}
