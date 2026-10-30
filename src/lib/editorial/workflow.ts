/**
 * Fluxo editorial dos ensaios (planejamento 10.2 e 15.2; ficha S05) como MÁQUINA DE ESTADOS
 * PURA. É a única fonte das regras de transição: o serviço de transição, o endpoint REST, o
 * job de agendamento e o hook da coleção chamam estas funções — nenhum caminho as contorna.
 *
 * Rascunho → Em revisão → (Devolvido ↔ Em revisão) → Aprovado → Agendado/Publicado → Arquivado,
 * com restauração (Arquivado → Publicado), cancelamento de agendamento (Agendado → Aprovado) e
 * correção relevante de texto publicado (Publicado → Em revisão, nova versão; o texto publicado
 * continua no ar até a nova aprovação).
 */
export const WORKFLOW_STATES = [
  'draft',
  'in_review',
  'returned',
  'approved',
  'scheduled',
  'published',
  'archived',
] as const

export type WorkflowState = (typeof WORKFLOW_STATES)[number]

export const WORKFLOW_LABELS: Record<WorkflowState, string> = {
  draft: 'Rascunho',
  in_review: 'Em revisão',
  returned: 'Devolvido',
  approved: 'Aprovado',
  scheduled: 'Agendado',
  published: 'Publicado',
  archived: 'Arquivado',
}

/** Rótulo da AÇÃO que leva a cada estado (botões do painel e histórico). */
export const ACTION_LABELS: Record<string, string> = {
  'draft>in_review': 'Enviar para revisão',
  'returned>in_review': 'Reenviar para revisão',
  'published>in_review': 'Abrir correção (nova versão)',
  'in_review>returned': 'Devolver com comentários',
  'approved>returned': 'Revogar aprovação e devolver',
  'in_review>approved': 'Aprovar',
  'approved>scheduled': 'Agendar publicação',
  'approved>published': 'Publicar agora',
  'scheduled>published': 'Publicar agora',
  'scheduled>approved': 'Cancelar agendamento',
  'published>archived': 'Arquivar',
  'archived>published': 'Restaurar (republicar)',
}

export const actionLabel = (from: WorkflowState, to: WorkflowState): string =>
  ACTION_LABELS[`${from}>${to}`] ?? `${WORKFLOW_LABELS[from]} → ${WORKFLOW_LABELS[to]}`

export const TRANSITIONS: Record<WorkflowState, readonly WorkflowState[]> = {
  draft: ['in_review'],
  in_review: ['returned', 'approved'],
  returned: ['in_review'],
  approved: ['scheduled', 'published', 'returned'],
  scheduled: ['published', 'approved'],
  published: ['archived', 'in_review'],
  archived: ['published'],
}

/** Estados cuja versão fica na tabela principal como "publicada" (visível conforme a data). */
export const PUBLIC_STATES: readonly WorkflowState[] = ['scheduled', 'published', 'archived']

/** Estados em que o conteúdo pode ser editado (ficha S05: somente rascunho ou devolvido). */
export const CONTENT_EDITABLE_STATES: readonly WorkflowState[] = ['draft', 'returned']

/** Estados em que o checklist de revisão pode ser preenchido. */
export const CHECKLIST_EDITABLE_STATES: readonly WorkflowState[] = [
  'draft',
  'returned',
  'in_review',
]

export const isWorkflowState = (value: unknown): value is WorkflowState =>
  typeof value === 'string' && (WORKFLOW_STATES as readonly string[]).includes(value)

export const stateOf = (value: unknown): WorkflowState => (isWorkflowState(value) ? value : 'draft')

export const isPublicState = (state: WorkflowState): boolean => PUBLIC_STATES.includes(state)

export const canEditContent = (state: unknown): boolean =>
  CONTENT_EDITABLE_STATES.includes(stateOf(state))

export const canEditChecklist = (state: unknown): boolean =>
  CHECKLIST_EDITABLE_STATES.includes(stateOf(state))

/**
 * Como a transição é gravada:
 * - `publish`: a versão vai para a tabela principal como publicada (visível na data);
 * - `unpublish`: a tabela principal deixa de estar publicada (cancelamento de agendamento);
 * - `draft`: só uma nova versão de rascunho — o que está publicado continua no ar.
 */
export type SaveMode = 'draft' | 'publish' | 'unpublish'

export function saveModeFor(from: WorkflowState, to: WorkflowState): SaveMode {
  if (isPublicState(to)) return 'publish'
  if (from === 'scheduled') return 'unpublish'
  return 'draft'
}

/** Itens do checklist editorial (planejamento 15.2), todos obrigatórios para aprovar. */
export const CHECKLIST_ITEMS = [
  { name: 'natureIndicated', label: 'Natureza do texto corretamente indicada' },
  {
    name: 'groundedArguments',
    label: 'Argumentação fundamentada, com referências para afirmações factuais',
  },
  {
    name: 'noPersonalData',
    label: 'Sem dados pessoais de pacientes, participantes de pesquisa ou terceiros',
  },
  { name: 'imagesLicensed', label: 'Imagens com licença e crédito (ou sem imagens)' },
  { name: 'accessibleLanguage', label: 'Linguagem acessível' },
  { name: 'conflictsDeclared', label: 'Conflitos de interesse declarados (ou inexistentes)' },
  { name: 'noClinicalAdvice', label: 'Sem aconselhamento clínico individual' },
  {
    name: 'notInstitutionalPosition',
    label: 'Não apresentado como posição oficial da UniCesumar, do PPGPS ou do grupo',
  },
] as const

export type ChecklistKey = (typeof CHECKLIST_ITEMS)[number]['name']

export function missingChecklistItems(
  checklist: Partial<Record<ChecklistKey, boolean | null>> | null | undefined,
): string[] {
  return CHECKLIST_ITEMS.filter((item) => checklist?.[item.name] !== true).map((item) => item.label)
}

export type Actor = { kind: 'editorial'; userId: number | string } | { kind: 'scheduler' }

export type TransitionRequest = {
  from: WorkflowState
  to: WorkflowState
  actor: Actor
  now: Date
  comment?: string | null
  scheduledAt?: string | Date | null
  /** Pendências de completude do ensaio (ver `essayCompletenessErrors`). */
  completenessErrors?: string[]
  checklist?: Partial<Record<ChecklistKey, boolean | null>> | null
  /** Data de agendamento já gravada (usada pelo job). */
  currentScheduledAt?: string | null
  /** O ensaio já esteve publicado alguma vez (`publishedAt` anterior ao agora). */
  everPublished?: boolean
}

export type TransitionErrorCode =
  | 'invalid_transition'
  | 'forbidden_actor'
  | 'comment_required'
  | 'schedule_required'
  | 'schedule_in_past'
  | 'not_due'
  | 'incomplete'
  | 'checklist_incomplete'
  | 'already_published'

export type TransitionCheck =
  | { ok: true; mode: SaveMode }
  | { ok: false; code: TransitionErrorCode; message: string; details?: string[] }

export const MIN_COMMENT_LENGTH = 10
/** Antecedência mínima do agendamento (evita datas "no passado" por atraso do relógio). */
export const MIN_SCHEDULE_LEAD_MS = 60_000

const toDate = (value: string | Date | null | undefined): Date | null => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const fail = (code: TransitionErrorCode, message: string, details?: string[]): TransitionCheck => ({
  ok: false,
  code,
  message,
  ...(details ? { details } : {}),
})

/** Valida uma transição. Não grava nada: devolve o modo de gravação ou o motivo da recusa. */
export function checkTransition(request: TransitionRequest): TransitionCheck {
  const { from, to, actor, now } = request
  if (!isWorkflowState(from) || !isWorkflowState(to) || !TRANSITIONS[from].includes(to)) {
    return fail(
      'invalid_transition',
      `Transição não permitida: ${WORKFLOW_LABELS[from] ?? from} → ${WORKFLOW_LABELS[to] ?? to}.`,
    )
  }

  // O job de agendamento só conclui publicações agendadas cuja data já chegou.
  if (actor.kind === 'scheduler') {
    if (from !== 'scheduled' || to !== 'published') {
      return fail('forbidden_actor', 'O agendamento só pode publicar ensaios agendados.')
    }
    const due = toDate(request.currentScheduledAt)
    if (!due || due.getTime() > now.getTime()) {
      return fail('not_due', 'A data de publicação agendada ainda não chegou.')
    }
    return { ok: true, mode: saveModeFor(from, to) }
  }

  if (to === 'returned') {
    const comment = request.comment?.trim() ?? ''
    if (comment.length < MIN_COMMENT_LENGTH) {
      return fail(
        'comment_required',
        `Para devolver, escreva um comentário de revisão (mínimo de ${MIN_COMMENT_LENGTH} caracteres).`,
      )
    }
  }

  if (to === 'in_review' || to === 'approved' || (to === 'published' && from === 'approved')) {
    const errors = request.completenessErrors ?? []
    if (errors.length > 0) {
      return fail('incomplete', 'O ensaio está incompleto.', errors)
    }
  }

  if (to === 'approved') {
    const missing = missingChecklistItems(request.checklist)
    if (missing.length > 0) {
      return fail(
        'checklist_incomplete',
        'Confirme todos os itens do checklist editorial antes de aprovar.',
        missing,
      )
    }
  }

  if (to === 'scheduled') {
    if (request.everPublished) {
      return fail(
        'already_published',
        'Ensaio já publicado: a nova versão deve ser publicada imediatamente (não agendada).',
      )
    }
    const when = toDate(request.scheduledAt)
    if (!when) return fail('schedule_required', 'Informe a data e a hora da publicação.')
    if (when.getTime() < now.getTime() + MIN_SCHEDULE_LEAD_MS) {
      return fail(
        'schedule_in_past',
        'A publicação agendada deve ser pelo menos 1 minuto no futuro.',
      )
    }
  }

  return { ok: true, mode: saveModeFor(from, to) }
}

/** Transições que o usuário editorial pode tentar a partir de um estado (botões do painel). */
export const availableTransitions = (from: unknown): WorkflowState[] => [
  ...TRANSITIONS[stateOf(from)],
]

export type HistoryEntry = {
  from: WorkflowState
  to: WorkflowState
  at: string
  actor: number | string | null
  actorName: string
  comment: string | null
}

export type WorkflowSnapshot = {
  workflowStatus?: string | null
  publishedAt?: string | null
  scheduledAt?: string | null
  archivedAt?: string | null
  revisedAt?: string | null
  submittedBy?: unknown
  submittedAt?: string | null
  approvedBy?: unknown
  approvedAt?: string | null
  publishedBy?: unknown
  archivedBy?: unknown
  reviewHistory?: unknown[] | null
}

export type WorkflowPatch = Required<
  Pick<
    WorkflowSnapshot,
    | 'workflowStatus'
    | 'publishedAt'
    | 'scheduledAt'
    | 'archivedAt'
    | 'revisedAt'
    | 'submittedBy'
    | 'submittedAt'
    | 'approvedBy'
    | 'approvedAt'
    | 'publishedBy'
    | 'archivedBy'
  >
> & { reviewHistory: unknown[] }

const relId = (value: unknown): number | string | null => {
  if (value == null) return null
  if (typeof value === 'object') return (value as { id?: number | string }).id ?? null
  return value as number | string
}

/** Já esteve visível ao público (publicação passada). */
export function wasEverPublished(doc: WorkflowSnapshot, now: Date): boolean {
  const published = toDate(doc.publishedAt)
  const state = stateOf(doc.workflowStatus)
  if (!published) return false
  if (state === 'scheduled') return false
  return published.getTime() <= now.getTime()
}

/**
 * Campos do fluxo após uma transição válida (sem efeitos colaterais). Registra quem submeteu,
 * aprovou, publicou e arquivou e acrescenta a entrada ao histórico editorial.
 */
export function applyTransition(
  doc: WorkflowSnapshot,
  request: Pick<TransitionRequest, 'from' | 'to' | 'actor' | 'now' | 'comment' | 'scheduledAt'> & {
    actorName: string
  },
): WorkflowPatch {
  const { from, to, actor, now } = request
  const at = now.toISOString()
  const userId = actor.kind === 'editorial' ? actor.userId : null
  const patch: WorkflowPatch = {
    workflowStatus: to,
    publishedAt: doc.publishedAt ?? null,
    scheduledAt: doc.scheduledAt ?? null,
    archivedAt: doc.archivedAt ?? null,
    revisedAt: doc.revisedAt ?? null,
    submittedBy: relId(doc.submittedBy),
    submittedAt: doc.submittedAt ?? null,
    approvedBy: relId(doc.approvedBy),
    approvedAt: doc.approvedAt ?? null,
    publishedBy: relId(doc.publishedBy),
    archivedBy: relId(doc.archivedBy),
    reviewHistory: [...(doc.reviewHistory ?? [])],
  }

  switch (to) {
    case 'in_review':
      patch.submittedBy = userId
      patch.submittedAt = at
      // Nova rodada de revisão (inclusive correção de texto publicado): exige nova aprovação.
      patch.approvedBy = null
      patch.approvedAt = null
      break
    case 'returned':
      patch.approvedBy = null
      patch.approvedAt = null
      break
    case 'approved':
      patch.approvedBy = userId
      patch.approvedAt = at
      break
    case 'scheduled': {
      const when = toDate(request.scheduledAt)
      patch.scheduledAt = when ? when.toISOString() : null
      patch.publishedAt = patch.scheduledAt
      patch.publishedBy = userId
      break
    }
    case 'published':
      if (from === 'archived') {
        patch.archivedAt = null
        patch.archivedBy = null
      } else if (actor.kind === 'scheduler') {
        // Mantém a data agendada e quem agendou (autorizou) a publicação.
        patch.publishedAt = patch.scheduledAt ?? at
      } else if (wasEverPublished(doc, now)) {
        // Republicação após correção: preserva a data original e registra a revisão.
        patch.revisedAt = at
        patch.publishedBy = userId
      } else {
        patch.publishedAt = at
        patch.publishedBy = userId
      }
      break
    case 'archived':
      patch.archivedAt = at
      patch.archivedBy = userId
      break
  }

  if (from === 'scheduled' && to === 'approved') {
    patch.scheduledAt = null
    patch.publishedAt = null
    patch.publishedBy = null
  }

  patch.reviewHistory.push({
    from,
    to,
    at,
    actor: userId,
    actorName: request.actorName,
    comment: request.comment?.trim() || null,
  } satisfies HistoryEntry)
  return patch
}

/** Campos do fluxo: só mudam por transição (nunca pela edição comum, pela API ou pelo painel). */
export const WORKFLOW_FIELDS = [
  'workflowStatus',
  'publishedAt',
  'scheduledAt',
  'archivedAt',
  'revisedAt',
  'submittedBy',
  'submittedAt',
  'approvedBy',
  'approvedAt',
  'publishedBy',
  'archivedBy',
  'reviewHistory',
] as const
