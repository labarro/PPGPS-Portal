/**
 * Vínculos com o grupo (planejamento 8.2 e 13.3; ficha S04, tarefa 2). Funções puras:
 * papéis do DGP (sem relação com papéis de sistema), papel atual por hierarquia, condição de
 * ex-integrante e regra de não sobreposição.
 */
export const MEMBERSHIP_ROLES = [
  'leader',
  'researcher',
  'student',
  'technician',
  'foreign_collaborator',
  'external_collaborator',
] as const
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number]

export const TRAINING_LEVELS = [
  'postdoc',
  'doctorate',
  'masters',
  'specialization',
  'undergraduate',
  'other',
] as const
export type TrainingLevel = (typeof TRAINING_LEVELS)[number]

export const END_REASONS = ['left', 'training_completed', 'role_changed', 'other'] as const
export type EndReason = (typeof END_REASONS)[number]

export const MEMBERSHIP_SOURCES = ['dgp_transcription', 'manual', 'spreadsheet'] as const

export const ROLE_LABELS: Record<MembershipRole, string> = {
  leader: 'Líder',
  researcher: 'Pesquisador(a)',
  student: 'Estudante',
  technician: 'Técnico(a)',
  foreign_collaborator: 'Colaborador(a) estrangeiro(a)',
  external_collaborator: 'Colaborador(a) externo(a)',
}

/** Plural usado nos filtros e agrupamentos. */
export const ROLE_PLURAL_LABELS: Record<MembershipRole, string> = {
  leader: 'Líderes',
  researcher: 'Pesquisadores(as)',
  student: 'Estudantes',
  technician: 'Técnicos(as)',
  foreign_collaborator: 'Colaboradores(as) estrangeiros(as)',
  external_collaborator: 'Colaboradores(as) externos(as)',
}

export const TRAINING_LEVEL_LABELS: Record<TrainingLevel, string> = {
  postdoc: 'pós-doutorado',
  doctorate: 'doutorado',
  masters: 'mestrado',
  specialization: 'especialização/MBA',
  undergraduate: 'graduação/iniciação científica',
  other: 'outro nível',
}

export const END_REASON_LABELS: Record<EndReason, string> = {
  left: 'Saída do grupo',
  training_completed: 'Conclusão da formação',
  role_changed: 'Mudança de papel',
  other: 'Outro motivo',
}

export const SOURCE_LABELS: Record<(typeof MEMBERSHIP_SOURCES)[number], string> = {
  dgp_transcription: 'Transcrição do DGP',
  manual: 'Cadastro manual',
  spreadsheet: 'Planilha validada pelo coordenador',
}

/** Slugs públicos (português) dos papéis, usados no filtro `?papel=` de /integrantes. */
export const ROLE_SLUGS: Record<MembershipRole, string> = {
  leader: 'lider',
  researcher: 'pesquisador',
  student: 'estudante',
  technician: 'tecnico',
  foreign_collaborator: 'colaborador-estrangeiro',
  external_collaborator: 'colaborador-externo',
}

export function roleFromSlug(slug: string | null | undefined): MembershipRole | null {
  if (!slug) return null
  const entry = Object.entries(ROLE_SLUGS).find(([, value]) => value === slug)
  return entry ? (entry[0] as MembershipRole) : null
}

export type MembershipLike = {
  id?: number | string
  role: MembershipRole | string
  trainingLevel?: TrainingLevel | string | null
  startDate: string
  endDate?: string | null
}

/** Rótulo do vínculo: "Estudante de mestrado", "Pesquisador(a)". */
export function membershipLabel(m: Pick<MembershipLike, 'role' | 'trainingLevel'>): string {
  const base = ROLE_LABELS[m.role as MembershipRole] ?? 'Integrante'
  if (m.role === 'student' && m.trainingLevel) {
    const level = TRAINING_LEVEL_LABELS[m.trainingLevel as TrainingLevel]
    if (level) return `${base} de ${level}`
  }
  return base
}

/**
 * Vínculo ativo: sem data de término. A data de término nunca é futura (validação), por isso
 * a situação não depende do relógio.
 */
export const isActiveMembership = (m: Pick<MembershipLike, 'endDate'>): boolean => !m.endDate

const ROLE_RANK: Record<string, number> = Object.fromEntries(
  MEMBERSHIP_ROLES.map((role, index) => [role, index]),
)
const LEVEL_RANK: Record<string, number> = Object.fromEntries(
  TRAINING_LEVELS.map((level, index) => [level, index]),
)

/** Ordena vínculos por hierarquia (papel, depois nível de formação). */
export function compareByHierarchy(a: MembershipLike, b: MembershipLike): number {
  const role = (ROLE_RANK[a.role] ?? 99) - (ROLE_RANK[b.role] ?? 99)
  if (role !== 0) return role
  return (LEVEL_RANK[a.trainingLevel ?? ''] ?? 99) - (LEVEL_RANK[b.trainingLevel ?? ''] ?? 99)
}

/** Papel em destaque: vínculo ativo de maior hierarquia (planejamento 8.2). */
export function currentRole<T extends MembershipLike>(memberships: readonly T[]): T | null {
  const active = memberships.filter(isActiveMembership)
  if (active.length === 0) return null
  return [...active].sort(compareByHierarchy)[0] ?? null
}

/** Ex-integrante: possui vínculo registrado e nenhum ativo (planejamento 13.3). */
export function isFormerMember(memberships: readonly MembershipLike[]): boolean {
  return memberships.length > 0 && !memberships.some(isActiveMembership)
}

export const isCurrentMember = (memberships: readonly MembershipLike[]): boolean =>
  memberships.some(isActiveMembership)

/** Linha do tempo: do vínculo mais recente ao mais antigo (ativos primeiro). */
export function timeline<T extends MembershipLike>(memberships: readonly T[]): T[] {
  return [...memberships].sort((a, b) => {
    const activeA = isActiveMembership(a) ? 1 : 0
    const activeB = isActiveMembership(b) ? 1 : 0
    if (activeA !== activeB) return activeB - activeA
    const end = (b.endDate ?? '').localeCompare(a.endDate ?? '')
    if (end !== 0) return end
    return b.startDate.localeCompare(a.startDate)
  })
}

/** Ano (ou "atual") para exibir períodos: "2021–2023", "2023–atual". */
export function membershipPeriod(m: Pick<MembershipLike, 'startDate' | 'endDate'>): string {
  const start = m.startDate.slice(0, 4)
  const end = m.endDate ? m.endDate.slice(0, 4) : 'atual'
  return start === end ? start : `${start}–${end}`
}

const day = (value: string): string => value.slice(0, 10)

/**
 * Regra de não sobreposição (planejamento 13.3): para a mesma pessoa, vínculos com o mesmo
 * papel e o mesmo nível de formação não podem ter períodos que se cruzam. Retorna o primeiro
 * vínculo conflitante. Períodos encostados (fim = início do outro) são permitidos.
 */
export function findOverlap<T extends MembershipLike>(
  candidate: MembershipLike,
  others: readonly T[],
): T | null {
  const start = day(candidate.startDate)
  const end = candidate.endDate ? day(candidate.endDate) : '9999-12-31'
  for (const other of others) {
    if (candidate.id != null && other.id != null && String(other.id) === String(candidate.id)) {
      continue
    }
    if (other.role !== candidate.role) continue
    if ((other.trainingLevel ?? null) !== (candidate.trainingLevel ?? null)) continue
    const otherStart = day(other.startDate)
    const otherEnd = other.endDate ? day(other.endDate) : '9999-12-31'
    if (start < otherEnd && otherStart < end) return other
  }
  return null
}

export type MembershipValidationInput = {
  role?: string | null
  trainingLevel?: string | null
  startDate?: string | null
  endDate?: string | null
  endReason?: string | null
}

/**
 * Consistência de um vínculo isolado. Retorna lista de erros `{ path, message }`.
 * `today` é injetável para testes (formato AAAA-MM-DD, UTC).
 */
export function validateMembership(
  input: MembershipValidationInput,
  today: string = new Date().toISOString().slice(0, 10),
): { path: string; message: string }[] {
  const errors: { path: string; message: string }[] = []
  if (input.role === 'student' && !input.trainingLevel) {
    errors.push({
      path: 'trainingLevel',
      message: 'Informe o nível de formação para vínculos de estudante.',
    })
  }
  if (input.role && input.role !== 'student' && input.trainingLevel) {
    errors.push({
      path: 'trainingLevel',
      message: 'O nível de formação só se aplica a vínculos de estudante.',
    })
  }
  if (input.startDate && day(input.startDate) > today) {
    errors.push({ path: 'startDate', message: 'A data de início não pode estar no futuro.' })
  }
  if (input.endDate) {
    if (input.startDate && day(input.endDate) < day(input.startDate)) {
      errors.push({
        path: 'endDate',
        message: 'A data de término deve ser igual ou posterior à de início.',
      })
    }
    if (day(input.endDate) > today) {
      errors.push({
        path: 'endDate',
        message: 'Registre o término somente quando ele ocorrer (a data não pode estar no futuro).',
      })
    }
    if (!input.endReason) {
      errors.push({ path: 'endReason', message: 'Informe o motivo do encerramento.' })
    }
  } else if (input.endReason) {
    errors.push({
      path: 'endReason',
      message: 'O motivo do encerramento só se aplica a vínculos com data de término.',
    })
  }
  return errors
}
