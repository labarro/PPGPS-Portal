import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { RenderBlocks } from '@/components/blocks/render-blocks'
import { RichText } from '@/components/rich-text/rich-text'

const text = (value: string, format = 0) => ({ type: 'text', text: value, format })
const paragraph = (...children: unknown[]) => ({ type: 'paragraph', children })
const doc = (...children: unknown[]) => ({ root: { type: 'root', children } })

describe('renderizador próprio do Lexical (sem HTML bruto)', () => {
  it('converte nós suportados em elementos React', () => {
    const html = renderToStaticMarkup(
      <RichText
        data={doc(
          { type: 'heading', tag: 'h2', children: [text('Título')] },
          paragraph(
            text('Negrito', 1),
            text(' itálico', 2),
            { type: 'linebreak' },
            text('fim', 8 | 4),
          ),
          {
            type: 'list',
            listType: 'number',
            children: [{ type: 'listitem', children: [text('Um')] }],
          },
          {
            type: 'list',
            listType: 'bullet',
            children: [{ type: 'listitem', children: [text('Dois')] }],
          },
          { type: 'quote', children: [text('Citação')] },
          { type: 'horizontalrule' },
          paragraph(text('código', 16), text('2', 64), text('x', 32), { type: 'tab' }),
        )}
      />,
    )
    expect(html).toContain('<h2>Título</h2>')
    expect(html).toContain('<strong>Negrito</strong>')
    expect(html).toContain('<em> itálico</em>')
    expect(html).toContain('<br/>')
    expect(html).toContain('<u><s>fim</s></u>')
    expect(html).toContain('<ol><li>Um</li></ol>')
    expect(html).toContain('<ul><li>Dois</li></ul>')
    expect(html).toContain('<blockquote>Citação</blockquote>')
    expect(html).toContain('<hr/>')
    expect(html).toContain('<code>código</code><sup>2</sup><sub>x</sub>')
  })

  it('escapa texto e descarta HTML embutido, esquemas perigosos e nós desconhecidos', () => {
    const html = renderToStaticMarkup(
      <RichText
        data={doc(
          paragraph(text('<img src=x onerror=alert(1)>')),
          paragraph({
            type: 'link',
            fields: { linkType: 'custom', url: 'javascript:alert(1)' },
            children: [text('clique')],
          }),
          { type: 'html', html: '<script>alert(1)</script>', children: [text('só texto')] },
          { type: 'upload', value: { url: '/x.png' } },
        )}
      />,
    )
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(html).not.toMatch(/javascript:/i)
    expect(html).toContain('<p>clique</p>')
    expect(html).not.toContain('<script')
    expect(html).toContain('só texto')
  })

  it('links externos com rel seguro e aviso de nova aba; internos como rota do site', () => {
    const html = renderToStaticMarkup(
      <RichText
        baseHeading={3}
        data={doc(
          { type: 'heading', tag: 'h2', children: [text('Seção')] },
          paragraph(
            {
              type: 'link',
              fields: { linkType: 'custom', url: 'https://exemplo.org', newTab: true },
              children: [text('externo')],
            },
            {
              type: 'link',
              fields: {
                linkType: 'internal',
                doc: { relationTo: 'research-lines', value: { slug: 'bioetica' } },
              },
              children: [text('interno')],
            },
          ),
        )}
      />,
    )
    expect(html).toContain('<h3>Seção</h3>')
    expect(html).toContain('href="https://exemplo.org"')
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('(abre em nova aba)')
    expect(html).toContain('href="/linhas/bioetica"')
  })

  it('não renderiza nada para texto vazio', () => {
    expect(renderToStaticMarkup(<RichText data={null} />)).toBe('')
    expect(renderToStaticMarkup(<RichText data={doc(paragraph())} />)).toBe('')
  })
})

describe('blocos de páginas', () => {
  it('renderiza chamada, lista de links e cartões com links seguros', () => {
    const html = renderToStaticMarkup(
      <RenderBlocks
        blocks={[
          {
            blockType: 'callout',
            id: '1',
            tone: 'emphasis',
            title: 'Chamada',
            text: 'Texto',
            linkLabel: 'Ver',
            href: '/linhas',
          },
          {
            blockType: 'linkList',
            id: '2',
            title: 'Links',
            links: [
              { id: 'a', label: 'Externo', href: 'https://exemplo.org', description: 'Desc' },
              { id: 'b', label: 'Perigoso', href: 'javascript:alert(1)' },
            ],
          },
          {
            blockType: 'cards',
            id: '3',
            title: 'Cartões',
            items: [
              { id: 'c', title: 'Cartão', text: 'Texto', href: '/o-grupo' },
              { id: 'd', title: 'Sem link' },
            ],
          },
          {
            blockType: 'richText',
            id: '4',
            content: doc(paragraph(text('Corpo'))) as never,
          },
        ]}
      />,
    )
    expect(html).toContain('Chamada')
    expect(html).toContain('href="/linhas"')
    expect(html).toContain('href="https://exemplo.org"')
    expect(html).toContain('(site externo)')
    expect(html).not.toMatch(/javascript:/i)
    expect(html).toContain(
      '<span class="inline-flex min-h-6 items-center rounded-sm font-medium text-link underline underline-offset-4 hover:no-underline">Perigoso</span>',
    )
    expect(html).toContain('href="/o-grupo"')
    expect(html).toContain('Sem link')
    expect(html).toContain('<p>Corpo</p>')
    expect(renderToStaticMarkup(<RenderBlocks blocks={[]} />)).toBe('')
  })
})
