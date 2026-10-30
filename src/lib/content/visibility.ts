import type { Where } from 'payload'

/**
 * Regra ÚNICA de visibilidade pública (AGENTS.md §4.6), reutilizada pelo acesso das coleções,
 * pelas consultas das páginas, pelo sitemap, pelo JSON-LD e (a partir da S09) pela busca.
 *
 * - S03: documento publicado (`_status = published`); linhas temáticas também precisam estar
 *   ativas; nada arquivado.
 * - S04: pessoa visível somente com `visibility = public`, sem arquivamento e com consentimento
 *   `public_profile` vigente (inclusive docentes e líderes). Vínculos seguem a pessoa.
 *   Foto exige também o escopo `photo`; e-mail, o escopo `email`.
 */
export type PublicCollection = 'research-lines' | 'pages' | 'people' | 'memberships'

type VisibilityDoc = {
  _status?: 'draft' | 'published' | null
  active?: boolean | null
  archivedAt?: string | null
  visibility?: string | null
  consentPublicProfile?: boolean | null
  person?: unknown
}

export type PersonVisibility = {
  visibility?: string | null
  archivedAt?: string | null
  consentPublicProfile?: boolean | null
  consentPhoto?: boolean | null
  consentEmail?: boolean | null
}

export function canViewPersonPublic(person: PersonVisibility | null | undefined): boolean {
  return (
    !!person &&
    person.visibility === 'public' &&
    !person.archivedAt &&
    person.consentPublicProfile === true
  )
}

/** Foto exibida somente com perfil público e escopo `photo` vigente. */
export const canShowPhoto = (person: PersonVisibility | null | undefined): boolean =>
  canViewPersonPublic(person) && person?.consentPhoto === true

/** E-mail exibido somente com perfil público e escopo `email` vigente. */
export const canShowEmail = (person: PersonVisibility | null | undefined): boolean =>
  canViewPersonPublic(person) && person?.consentEmail === true

export function canViewPublic(collection: PublicCollection, doc: VisibilityDoc | null | undefined) {
  if (!doc) return false
  if (collection === 'people') return canViewPersonPublic(doc)
  if (collection === 'memberships') {
    return typeof doc.person === 'object' && canViewPersonPublic(doc.person as PersonVisibility)
  }
  if (doc._status !== 'published') return false
  if (doc.archivedAt) return false
  if (collection === 'research-lines' && doc.active !== true) return false
  return true
}

const PERSON_PUBLIC: Where[] = [
  { visibility: { equals: 'public' } },
  { archivedAt: { exists: false } },
  { consentPublicProfile: { equals: true } },
]

/** Mesmo critério de `canViewPublic`, como filtro de consulta (usado pelo `read` das coleções). */
export function publicWhere(collection: PublicCollection): Where {
  if (collection === 'people') return { and: PERSON_PUBLIC }
  if (collection === 'memberships') {
    return {
      and: PERSON_PUBLIC.map((condition) =>
        Object.fromEntries(
          Object.entries(condition).map(([key, value]) => [`person.${key}`, value]),
        ),
      ) as Where[],
    }
  }
  const published: Where = { _status: { equals: 'published' } }
  if (collection === 'research-lines') {
    return { and: [published, { active: { equals: true } }] }
  }
  return published
}

/** Globals com rascunho: o visitante só lê a versão publicada. */
export const PUBLISHED_GLOBAL_WHERE: Where = { _status: { equals: 'published' } }

/**
 * Campos administrativos de pessoas, vínculos e mídias: nunca saem em respostas públicas
 * (acesso por campo) e não podem ser usados em filtros/ordenação por visitantes.
 */
export const PERSON_ADMIN_FIELDS = [
  'visibility',
  'archivedAt',
  'consentPublicProfile',
  'consentPhoto',
  'consentEmail',
  'consentStatus',
  'memberships',
  'consents',
] as const

export const MEMBERSHIP_ADMIN_FIELDS = ['endReason', 'source', 'sourceUrl', 'collectedAt'] as const

export const MEDIA_ADMIN_FIELDS = ['consentRecord', 'publicConsent'] as const
