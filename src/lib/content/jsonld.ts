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

/**
 * JSON-LD `Person` (planejamento 16.7; ficha S04) — usado SOMENTE em perfis públicos
 * (consentimento `public_profile` vigente). `sameAs` com Lattes, ORCID e outros perfis;
 * imagem só quando a foto chega autorizada; e-mail nunca (evita coleta automatizada).
 * Afiliações apenas como texto (sem vínculo oficial com instituições).
 */
export function personJsonLd(
  person: {
    fullName: string
    slug: string
    shortBio?: string | null
    orcid?: string | null
    lattesUrl?: string | null
    otherProfiles?: { url: string }[] | null
    affiliations?: { institutionText: string; current?: boolean | null }[] | null
    expertise?: string[] | null
  },
  options: { siteUrl: string; path: string; jobTitle?: string | null; imageUrl?: string | null },
): Record<string, unknown> {
  const sameAs = [
    ...(person.orcid ? [`https://orcid.org/${person.orcid}`] : []),
    ...(person.lattesUrl ? [person.lattesUrl] : []),
    ...(person.otherProfiles ?? []).map((profile) => profile.url),
  ].filter(Boolean)
  const affiliation = (person.affiliations ?? [])
    .filter((item) => item.current !== false)
    .map((item) => ({ '@type': 'Organization', name: item.institutionText }))
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${options.siteUrl}${options.path}#pessoa`,
    name: person.fullName,
    url: `${options.siteUrl}${options.path}`,
    ...(person.shortBio ? { description: person.shortBio } : {}),
    ...(options.jobTitle ? { jobTitle: options.jobTitle } : {}),
    ...(options.imageUrl ? { image: new URL(options.imageUrl, options.siteUrl).toString() } : {}),
    ...(person.expertise && person.expertise.length > 0 ? { knowsAbout: person.expertise } : {}),
    ...(affiliation.length > 0 ? { affiliation } : {}),
    memberOf: { '@id': `${options.siteUrl}/#grupo` },
    ...(sameAs.length > 0 ? { sameAs } : {}),
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
