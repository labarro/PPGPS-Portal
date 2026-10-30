import {
  BLOG_ATOM_PATH,
  BLOG_BASE_PATH,
  BLOG_RSS_PATH,
  categoryPath,
  essayPath,
} from '../content/paths'
import { natureLabel } from './essay'

/**
 * Feeds RSS 2.0 e Atom do blog (ficha S05). Somente ensaios listáveis (as consultas já chegam
 * filtradas: publicados, data alcançada, não arquivados). Somente texto escapado — título,
 * resumo, autores (nome publicado), categoria e natureza; nada de HTML do corpo.
 */
export type FeedItem = {
  title: string
  slug: string
  excerpt: string | null
  nature: string
  publishedAt: string | null
  updatedAt: string
  authors: { name: string }[]
  category: { name: string; slug: string } | null
  tags: { name: string }[]
}

export type FeedOptions = { siteUrl: string; title: string; description: string }

/** Escapa texto para XML (inclui aspas) e remove caracteres de controle inválidos em XML 1.0. */
export function escapeXml(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

const absolute = (siteUrl: string, path: string) => `${siteUrl.replace(/\/+$/, '')}${path}`

const authorsText = (item: FeedItem) => item.authors.map((author) => author.name).join(', ')

const describe = (item: FeedItem) =>
  [`[${natureLabel(item.nature)}]`, item.excerpt?.trim() ?? ''].filter(Boolean).join(' ')

export function buildRss(items: FeedItem[], options: FeedOptions): string {
  const blogUrl = absolute(options.siteUrl, BLOG_BASE_PATH)
  const latest = items
    .map((item) => item.publishedAt ?? item.updatedAt)
    .sort()
    .at(-1)
  const entries = items
    .map((item) => {
      const link = absolute(options.siteUrl, essayPath(item.slug))
      const date = item.publishedAt ?? item.updatedAt
      const categories = [item.category?.name, ...item.tags.map((tag) => tag.name)]
        .filter((name): name is string => !!name)
        .map((name) => `      <category>${escapeXml(name)}</category>`)
      return [
        '    <item>',
        `      <title>${escapeXml(item.title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `      <pubDate>${new Date(date).toUTCString()}</pubDate>`,
        item.authors.length > 0
          ? `      <dc:creator>${escapeXml(authorsText(item))}</dc:creator>`
          : null,
        `      <description>${escapeXml(describe(item))}</description>`,
        ...categories,
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n')
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    '  <channel>',
    `    <title>${escapeXml(options.title)}</title>`,
    `    <link>${escapeXml(blogUrl)}</link>`,
    `    <description>${escapeXml(options.description)}</description>`,
    '    <language>pt-BR</language>',
    latest ? `    <lastBuildDate>${new Date(latest).toUTCString()}</lastBuildDate>` : null,
    `    <atom:link href="${escapeXml(absolute(options.siteUrl, BLOG_RSS_PATH))}" rel="self" type="application/rss+xml"/>`,
    entries || null,
    '  </channel>',
    '</rss>',
    '',
  ]
    .filter((line) => line !== null)
    .join('\n')
}

export function buildAtom(items: FeedItem[], options: FeedOptions): string {
  const blogUrl = absolute(options.siteUrl, BLOG_BASE_PATH)
  const selfUrl = absolute(options.siteUrl, BLOG_ATOM_PATH)
  const latest =
    items
      .map((item) => item.updatedAt)
      .sort()
      .at(-1) ?? new Date(0).toISOString()
  const entries = items
    .map((item) => {
      const link = absolute(options.siteUrl, essayPath(item.slug))
      return [
        '  <entry>',
        `    <title>${escapeXml(item.title)}</title>`,
        `    <link href="${escapeXml(link)}"/>`,
        `    <id>${escapeXml(link)}</id>`,
        `    <published>${new Date(item.publishedAt ?? item.updatedAt).toISOString()}</published>`,
        `    <updated>${new Date(item.updatedAt).toISOString()}</updated>`,
        ...item.authors.map(
          (author) => `    <author><name>${escapeXml(author.name)}</name></author>`,
        ),
        item.category
          ? `    <category term="${escapeXml(item.category.slug)}" label="${escapeXml(item.category.name)}" scheme="${escapeXml(absolute(options.siteUrl, categoryPath('')))}"/>`
          : null,
        `    <summary>${escapeXml(describe(item))}</summary>`,
        '  </entry>',
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n')
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="pt-BR">',
    `  <title>${escapeXml(options.title)}</title>`,
    `  <subtitle>${escapeXml(options.description)}</subtitle>`,
    `  <link href="${escapeXml(blogUrl)}"/>`,
    `  <link rel="self" href="${escapeXml(selfUrl)}" type="application/atom+xml"/>`,
    `  <id>${escapeXml(blogUrl)}</id>`,
    `  <updated>${new Date(latest).toISOString()}</updated>`,
    entries || null,
    '</feed>',
    '',
  ]
    .filter((line) => line !== null)
    .join('\n')
}
