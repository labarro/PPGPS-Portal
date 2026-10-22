import type { GroupProfile } from '@/payload-types'

/**
 * JSON-LD do grupo (planejamento 16.7): `ResearchOrganization`. Instituições aparecem SOMENTE
 * como referência textual (`mentions` com nome e URL) — sem `parentOrganization`/`memberOf`,
 * que sugeririam vínculo oficial (Q1, Q2). Nenhum dado pessoal.
 */
export function organizationJsonLd(
  profile: Pick<
    GroupProfile,
    | 'officialName'
    | 'summary'
    | 'alternativeNames'
    | 'acronym'
    | 'formationYear'
    | 'dgpUrl'
    | 'predominantArea'
    | 'contactEmail'
    | 'institutionalReferences'
  >,
  siteUrl: string,
): Record<string, unknown> {
  const alternateName = [
    ...(profile.alternativeNames ?? []).map((item) => item.name),
    ...(profile.acronym ? [profile.acronym] : []),
  ].filter(Boolean)
  const references = (profile.institutionalReferences ?? []).map((reference) => ({
    '@type': 'Organization',
    name: reference.name,
    ...(reference.url ? { url: reference.url } : {}),
  }))
  return {
    '@context': 'https://schema.org',
    '@type': 'ResearchOrganization',
    '@id': `${siteUrl}/#grupo`,
    name: profile.officialName,
    url: siteUrl,
    ...(profile.summary ? { description: profile.summary } : {}),
    ...(alternateName.length > 0 ? { alternateName } : {}),
    ...(profile.formationYear ? { foundingDate: String(profile.formationYear) } : {}),
    ...(profile.predominantArea ? { knowsAbout: profile.predominantArea } : {}),
    ...(profile.contactEmail ? { email: profile.contactEmail } : {}),
    ...(profile.dgpUrl ? { sameAs: [profile.dgpUrl] } : {}),
    ...(references.length > 0 ? { mentions: references } : {}),
  }
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
  siteUrl: string,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.path === '/' ? '' : item.path}`,
    })),
  }
}

/**
 * Serializa JSON-LD para um `<script type="application/ld+json">` sem permitir o fechamento
 * da tag nem a injeção de HTML: `<`, `>`, `&` e separadores de linha Unicode viram escapes.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}
