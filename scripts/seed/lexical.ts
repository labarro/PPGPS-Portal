/** Monta o JSON do Lexical (editor do Payload) a partir de parágrafos de texto simples. */
type Node = Record<string, unknown>

const text = (value: string): Node => ({
  type: 'text',
  version: 1,
  text: value,
  format: 0,
  style: '',
  mode: 'normal',
  detail: 0,
})

const block = (type: string, children: Node[], extra: Node = {}): Node => ({
  type,
  version: 1,
  format: '',
  indent: 0,
  direction: 'ltr',
  children,
  ...extra,
})

export const paragraph = (value: string): Node =>
  block('paragraph', [text(value)], { textFormat: 0, textStyle: '' })

export const bulletList = (items: string[]): Node =>
  block(
    'list',
    items.map((item, index) => block('listitem', [text(item)], { value: index + 1 })),
    { listType: 'bullet', start: 1, tag: 'ul' },
  )

export function richText(...children: Node[]) {
  return {
    root: {
      type: 'root',
      version: 1,
      format: '',
      indent: 0,
      direction: 'ltr',
      children,
    },
  }
}
