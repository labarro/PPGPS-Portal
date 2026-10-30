import {
  currentRole,
  isActiveMembership,
  isFormerMember,
  type MembershipRole,
  roleFromSlug,
  ROLE_SLUGS,
  timeline,
  type TrainingLevel,
} from './memberships'

/**
 * Diretório público de integrantes (ficha S04): dados já filtrados pelo acesso público
 * (somente pessoas com consentimento `public_profile` vigente). Funções puras, testadas.
 */
export type PublicPhoto = {
  url: string
  alt: string
  width?: number | null
  height?: number | null
}

export type DirectoryMembership = {
  id: number | string
  role: MembershipRole
  trainingLevel?: TrainingLevel | null
  startDate: string
  endDate?: string | null
  lineIds: (number | string)[]
}

export type DirectoryPerson = {
  id: number | string
  slug: string
  fullName: string
  shortBio: string | null
  photo: PublicPhoto | null
  memberships: DirectoryMembership[]
  current: DirectoryMembership | null
  former: boolean
}

type RawPerson = {
  id: number | string
  slug: string
  fullName: string
  shortBio?: string | null
  photo?: unknown
}

type RawMembership = {
  id: number | string
  person: unknown
  role: string
  trainingLevel?: string | null
  startDate: string
  endDate?: string | null
  lines?: unknown[] | null
}

const idOf = (value: unknown): number | string | null => {
  if (value == null) return null
  if (typeof value === 'object') return ((value as { id?: number | string }).id ?? null) as never
  return value as number | string
}

/** Foto só quando a mídia veio populada (leitura pública permitida) e com URL. */
export function toPublicPhoto(value: unknown): PublicPhoto | null {
  if (!value || typeof value !== 'object') return null
  const media = value as { url?: unknown; alt?: unknown; width?: unknown; height?: unknown }
  if (typeof media.url !== 'string' || !media.url) return null
  return {
    url: media.url,
    alt: typeof media.alt === 'string' ? media.alt : '',
    width: typeof media.width === 'number' ? media.width : null,
    height: typeof media.height === 'number' ? media.height : null,
  }
}

export function toDirectoryMembership(raw: RawMembership): DirectoryMembership {
  return {
    id: raw.id,
    role: raw.role as MembershipRole,
    trainingLevel: (raw.trainingLevel as TrainingLevel | null) ?? null,
    startDate: raw.startDate,
    endDate: raw.endDate ?? null,
    lineIds: (raw.lines ?? []).map(idOf).filter((id): id is number | string => id != null),
  }
}

const collator = new Intl.Collator('pt-BR', { sensitivity: 'base' })

/** Monta o diretório: cada pessoa com seus vínculos, papel atual e condição de ex-integrante. */
export function buildDirectory(
  people: readonly RawPerson[],
  memberships: readonly RawMembership[],
): DirectoryPerson[] {
  const byPerson = new Map<string, DirectoryMembership[]>()
  for (const raw of memberships) {
    const personId = idOf(raw.person)
    if (personId == null) continue
    const list = byPerson.get(String(personId)) ?? []
    list.push(toDirectoryMembership(raw))
    byPerson.set(String(personId), list)
  }
  return people
    .map((person) => {
      const list = timeline(byPerson.get(String(person.id)) ?? [])
      return {
        id: person.id,
        slug: person.slug,
        fullName: person.fullName,
        shortBio: person.shortBio ?? null,
        photo: toPublicPhoto(person.photo),
        memberships: list,
        current: currentRole(list),
        former: isFormerMember(list),
      }
    })
    .sort((a, b) => collator.compare(a.fullName, b.fullName))
}

export type DirectoryStatus = 'atuais' | 'ex-integrantes'

export type DirectoryFilters = {
  role: MembershipRole | null
  line: string | null
  status: DirectoryStatus
}

type SearchParams = Record<string, string | string[] | undefined>

const first = (value: string | string[] | undefined): string | null =>
  (Array.isArray(value) ? value[0] : value)?.trim() || null

/** Lê os filtros da URL (`?papel=&linha=&situacao=`), ignorando valores desconhecidos. */
export function parseFilters(params: SearchParams, lineSlugs: readonly string[]): DirectoryFilters {
  const line = first(params.linha)
  return {
    role: roleFromSlug(first(params.papel)),
    line: line && lineSlugs.includes(line) ? line : null,
    status: first(params.situacao) === 'ex-integrantes' ? 'ex-integrantes' : 'atuais',
  }
}

/** Query string canônica dos filtros (para links e "copiar a URL"). */
export function filtersToQuery(filters: Partial<DirectoryFilters>): string {
  const params = new URLSearchParams()
  if (filters.role) params.set('papel', ROLE_SLUGS[filters.role])
  if (filters.line) params.set('linha', filters.line)
  if (filters.status === 'ex-integrantes') params.set('situacao', 'ex-integrantes')
  const query = params.toString()
  return query ? `?${query}` : ''
}

export const hasActiveFilters = (filters: DirectoryFilters): boolean =>
  !!filters.role || !!filters.line || filters.status !== 'atuais'

/**
 * Aplica os filtros:
 * - "atuais" (padrão): pessoas com vínculo ativo; papel e linha avaliados nos vínculos ativos;
 * - "ex-integrantes": somente pessoas sem vínculo ativo; papel e linha nos vínculos encerrados.
 * Ex-integrantes nunca aparecem na lista padrão (critério de aceite da S04).
 */
export function filterDirectory(
  people: readonly DirectoryPerson[],
  filters: DirectoryFilters,
  lineIdBySlug: ReadonlyMap<string, number | string>,
): DirectoryPerson[] {
  const lineId = filters.line ? lineIdBySlug.get(filters.line) : undefined
  return people.filter((person) => {
    if (filters.status === 'atuais' ? person.former || !person.current : !person.former) {
      return false
    }
    const relevant = person.memberships.filter((m) =>
      filters.status === 'atuais' ? isActiveMembership(m) : true,
    )
    return relevant.some(
      (m) =>
        (!filters.role || m.role === filters.role) &&
        (lineId === undefined || m.lineIds.some((id) => String(id) === String(lineId))),
    )
  })
}

/** Integrantes atuais com vínculo ativo na linha temática (página da linha). */
export function membersOfLine(
  people: readonly DirectoryPerson[],
  lineId: number | string,
): DirectoryPerson[] {
  return people.filter((person) =>
    person.memberships.some(
      (m) => isActiveMembership(m) && m.lineIds.some((id) => String(id) === String(lineId)),
    ),
  )
}

/** Ordem de destaque: hierarquia do papel atual, depois nome. */
export function byCurrentRole(a: DirectoryPerson, b: DirectoryPerson): number {
  const order = Object.keys(ROLE_SLUGS)
  const rank = (p: DirectoryPerson) => (p.current ? order.indexOf(p.current.role) : 99)
  return rank(a) - rank(b) || collator.compare(a.fullName, b.fullName)
}

/** Líderes autorizados: indicados no perfil do grupo, visíveis e com vínculo ativo de líder. */
export function authorizedLeaders(
  leaderIds: readonly unknown[] | null | undefined,
  people: readonly DirectoryPerson[],
): DirectoryPerson[] {
  const byId = new Map(people.map((person) => [String(person.id), person]))
  const result: DirectoryPerson[] = []
  for (const raw of leaderIds ?? []) {
    const id = idOf(raw)
    const person = id == null ? undefined : byId.get(String(id))
    if (person?.memberships.some((m) => isActiveMembership(m) && m.role === 'leader')) {
      result.push(person)
    }
  }
  return result
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const letters = [parts[0]?.[0], parts.length > 1 ? parts.at(-1)?.[0] : undefined]
  return letters.filter(Boolean).join('').toUpperCase()
}
