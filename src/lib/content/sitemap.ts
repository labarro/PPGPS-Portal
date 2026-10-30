import type { MetadataRoute } from 'next'

import {
  FIXED_GROUP_SLUGS,
  GROUP_SECTIONS,
  MEMBERS_BASE_PATH,
  pagePath,
  personPath,
  researchLinePath,
} from './paths'

export type SitemapEntries = {
  profileUpdatedAt: string | null
  lines: { slug: string; updatedAt: string }[]
  pages: { slug: string; updatedAt: string }[]
  /** S04: somente perfis com consentimento `public_profile` vigente (acesso público). */
  people?: { slug: string; updatedAt: string }[]
}

/**
 * Monta o sitemap: página inicial, seções de "O grupo" (quando o perfil está publicado),
 * linhas temáticas e páginas publicadas. As entradas já chegam filtradas por `canViewPublic`.
 */
export function buildSitemap(entries: SitemapEntries, siteUrl: string): MetadataRoute.Sitemap {
  const base = siteUrl.replace(/\/+$/, '')
  const url = (path: string) => `${base}${path === '/' ? '' : path}` || base
  const items: MetadataRoute.Sitemap = [{ url: `${base}/`, changeFrequency: 'weekly', priority: 1 }]

  const pageBySlug = new Map(entries.pages.map((page) => [page.slug, page]))

  if (entries.profileUpdatedAt) {
    for (const section of GROUP_SECTIONS) {
      const complement = section.slug ? pageBySlug.get(section.slug) : undefined
      const dates = [entries.profileUpdatedAt, complement?.updatedAt].filter(Boolean) as string[]
      items.push({
        url: url(section.href),
        lastModified: dates.sort().at(-1),
        changeFrequency: 'monthly',
        priority: section.slug ? 0.6 : 0.8,
      })
    }
  }

  if (entries.lines.length > 0) {
    items.push({ url: url('/linhas'), changeFrequency: 'monthly', priority: 0.8 })
    for (const line of entries.lines) {
      items.push({
        url: url(researchLinePath(line.slug)),
        lastModified: line.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }
  }

  for (const page of entries.pages) {
    if (FIXED_GROUP_SLUGS.includes(page.slug)) continue
    items.push({
      url: url(pagePath(page.slug)),
      lastModified: page.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.5,
    })
  }

  const people = entries.people ?? []
  if (people.length > 0) {
    items.push({ url: url(MEMBERS_BASE_PATH), changeFrequency: 'weekly', priority: 0.8 })
    for (const person of people) {
      items.push({
        url: url(personPath(person.slug)),
        lastModified: person.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }
  }

  return items
}
