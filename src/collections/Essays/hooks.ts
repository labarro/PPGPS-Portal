import {
  APIError,
  type CollectionAfterChangeHook,
  type CollectionAfterReadHook,
  type CollectionBeforeChangeHook,
  type CollectionBeforeDeleteHook,
  type CollectionBeforeOperationHook,
  type CollectionConfig,
  type PayloadRequest,
} from 'payload'

import { isAdminOrEditor } from '../../access'
import { writeAudit } from '../../hooks/audit'
import { publishedOnlyForPublic } from '../../hooks/published-only'
import { revalidateCollectionChange, revalidateCollectionDelete } from '../../hooks/revalidate'
import { rememberPublishedSlug, syncSlugRedirects } from '../../hooks/slug-redirects'
import { ESSAY_ADMIN_FIELDS } from '../../lib/content/visibility'
import {
  essayCompletenessErrors,
  normalizeDoi,
  readingTimeMinutes,
} from '../../lib/editorial/essay'
import { sanitizeLexical } from '../../lib/editorial/sanitize-lexical'
import {
  type Actor,
  actionLabel,
  applyTransition,
  canEditContent,
  checkTransition,
  isPublicState,
  stateOf,
  WORKFLOW_FIELDS,
  WORKFLOW_LABELS,
  type WorkflowState,
  wasEverPublished,
} from '../../lib/editorial/workflow'

/**
 * Hooks dos ensaios (ficha S05). As regras do fluxo vivem na máquina de estados pura
 * (`src/lib/editorial/workflow.ts`); aqui elas são IMPOSTAS a qualquer gravação — painel, API
 * REST, Local API, restauração de versão e job de agendamento:
 *
 * 1. Edição comum só grava rascunho (nova versão) e nunca altera os campos do fluxo.
 * 2. Publicar, agendar, arquivar, restaurar e cancelar agendamento exigem uma transição
 *    validada (contexto `essayTransition`, criado somente pelo serviço de transição).
 * 3. Conteúdo é higienizado no servidor e o tempo de leitura é recalculado.
 */
export const TRANSITION_CONTEXT = 'essayTransition'
const SAVE_MODE_CONTEXT = 'essaySaveMode'
const RESULT_CONTEXT = 'essayTransitionResult'

export type EssayTransitionContext = {
  id: number | string
  from: WorkflowState
  to: WorkflowState
  actor: Actor
  actorName: string
  now: string
  comment?: string | null
  scheduledAt?: string | null
}

type TransitionResult = { id: string; from: WorkflowState; to: WorkflowState; scheduler: boolean }

const relId = (value: unknown): number | string | null => {
  if (value == null) return null
  if (typeof value === 'object') return (value as { id?: number | string }).id ?? null
  return value as number | string
}

const forbidden = (message: string) => new APIError(message, 403, undefined, true)

/** Guarda se a operação grava rascunho ou a versão principal (o hook de dados não recebe isso). */
export const rememberSaveMode: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  if (operation === 'create' || operation === 'update') {
    req.context[SAVE_MODE_CONTEXT] = (args as { draft?: boolean }).draft ? 'draft' : 'main'
  }
  if (operation === 'restoreVersion') {
    // Restaurar versão antiga como publicada contornaria a aprovação: só como rascunho.
    if (!(args as { draft?: boolean }).draft) {
      throw forbidden(
        'Ensaios só podem ser restaurados como rascunho; depois, siga o fluxo editorial.',
      )
    }
    req.context[SAVE_MODE_CONTEXT] = 'draft'
  }
  return args
}

export function initialWorkflowFields(): Record<string, unknown> {
  return {
    workflowStatus: 'draft',
    publishedAt: null,
    scheduledAt: null,
    archivedAt: null,
    revisedAt: null,
    submittedBy: null,
    submittedAt: null,
    approvedBy: null,
    approvedAt: null,
    publishedBy: null,
    archivedBy: null,
    reviewHistory: [],
  }
}

/** Valores atuais dos campos do fluxo (relacionamentos como id), preservados na edição comum. */
function currentWorkflowFields(doc: Record<string, unknown> | undefined): Record<string, unknown> {
  const fields: Record<string, unknown> = {}
  for (const name of WORKFLOW_FIELDS) {
    const value = doc?.[name]
    if (name === 'reviewHistory') {
      fields[name] = Array.isArray(value)
        ? value.map((entry) => ({ ...entry, actor: relId((entry as { actor?: unknown }).actor) }))
        : []
    } else if (name.endsWith('By')) {
      fields[name] = relId(value)
    } else {
      fields[name] = value ?? (name === 'workflowStatus' ? 'draft' : null)
    }
  }
  return fields
}

export const enforceEditorialWorkflow: CollectionBeforeChangeHook = ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  const transition = req.context[TRANSITION_CONTEXT] as EssayTransitionContext | undefined
  const mode = req.context[SAVE_MODE_CONTEXT] ?? (data._status === 'draft' ? 'draft' : 'main')

  if (operation === 'create') {
    if (transition) throw forbidden('Transições editoriais não criam ensaios.')
    if (data._status === 'published') {
      throw forbidden('Ensaios são criados como rascunho e publicados pelo fluxo editorial.')
    }
    Object.assign(data, initialWorkflowFields())
    data._status = 'draft'
    return data
  }

  const original = (originalDoc ?? {}) as Record<string, unknown>

  if (!transition || String(transition.id) !== String(original.id)) {
    if (req.context.isRestoringVersion && !canEditContent(original.workflowStatus)) {
      throw forbidden('Versões antigas só podem ser restauradas em Rascunho ou Devolvido.')
    }
    if (mode !== 'draft') {
      throw forbidden(
        'Ensaios só são publicados, agendados, arquivados ou restaurados pelas ações do fluxo editorial.',
      )
    }
    Object.assign(data, currentWorkflowFields(original))
    return data
  }

  const from = stateOf(original.workflowStatus)
  if (from !== transition.from) {
    throw new APIError(
      `O ensaio mudou de situação (agora: ${WORKFLOW_LABELS[from]}). Recarregue a página.`,
      409,
      undefined,
      true,
    )
  }
  const now = new Date(transition.now)
  const check = checkTransition({
    from,
    to: transition.to,
    actor: transition.actor,
    now,
    comment: transition.comment,
    scheduledAt: transition.scheduledAt,
    completenessErrors: essayCompletenessErrors({ ...original, ...data }),
    checklist: (data.checklist ?? original.checklist) as never,
    currentScheduledAt: (original.scheduledAt as string | null) ?? null,
    everPublished: wasEverPublished(original, now),
  })
  if (!check.ok) {
    throw new APIError(check.message, 400, { code: check.code, details: check.details }, true)
  }
  const expected = check.mode === 'draft' ? 'draft' : 'main'
  if (mode !== expected) {
    throw forbidden('Modo de gravação incompatível com a transição editorial.')
  }

  Object.assign(
    data,
    applyTransition(currentWorkflowFields(original), {
      from,
      to: transition.to,
      actor: transition.actor,
      actorName: transition.actorName,
      now,
      comment: transition.comment,
      scheduledAt: transition.scheduledAt,
    }),
  )
  data._status = check.mode === 'publish' ? 'published' : 'draft'
  req.context[RESULT_CONTEXT] = {
    id: String(original.id),
    from,
    to: transition.to,
    scheduler: transition.actor.kind === 'scheduler',
  } satisfies TransitionResult
  return data
}

/** Higienização do texto rico, normalização de DOI e tempo de leitura (sempre no servidor). */
export const sanitizeEssayContent: CollectionBeforeChangeHook = ({ data }) => {
  if (data.content) data.content = sanitizeLexical(data.content) ?? data.content
  data.readingTime = readingTimeMinutes(data.content)
  if (Array.isArray(data.references)) {
    data.references = data.references.map((ref: Record<string, unknown>) => ({
      ...ref,
      doi: typeof ref.doi === 'string' && ref.doi ? (normalizeDoi(ref.doi) ?? ref.doi) : ref.doi,
    }))
  }
  return data
}

/** Integrante sem "nome publicado": usa o nome completo do cadastro (somente o nome sai no site). */
export const fillAuthorNames: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (!Array.isArray(data.authors)) return data
  const authors = data.authors as Record<string, unknown>[]
  for (const author of authors) {
    if (author.role === 'guest') {
      author.person = null
      continue
    }
    author.bio = null
    const personId = relId(author.person)
    if (personId == null || (typeof author.name === 'string' && author.name.trim())) continue
    const person = await req.payload
      .findByID({ collection: 'people', id: personId, depth: 0, overrideAccess: true, req })
      .catch(() => null)
    if (person?.fullName) author.name = person.fullName
  }
  return data
}

/**
 * Visitante: o vínculo do autor com um cadastro de pessoa só aparece quando a pessoa tem
 * perfil público (o acesso de `people` já filtra a população; ids nunca são expostos) e
 * reduzido a nome e endereço do perfil. Sem perfil público, só o nome publicado.
 */
export const hidePrivateAuthors: CollectionAfterReadHook = ({ doc, overrideAccess, req }) => {
  // Leituras internas do servidor (overrideAccess) e da equipe editorial veem tudo.
  if (overrideAccess || isAdminOrEditor({ req }) || !doc) return doc
  // Campos de array restritos voltam como lista vazia mesmo sem acesso: remove a chave.
  for (const name of ESSAY_ADMIN_FIELDS) delete doc[name]
  if (!Array.isArray(doc.authors)) return doc
  doc.authors = doc.authors.map((author: Record<string, unknown>) => {
    const person = author.person
    const publicPerson =
      person &&
      typeof person === 'object' &&
      typeof (person as { slug?: unknown }).slug === 'string'
        ? {
            id: (person as { id: number }).id,
            slug: (person as { slug: string }).slug,
            fullName: (person as { fullName?: string }).fullName,
          }
        : null
    return { ...author, person: publicPerson }
  })
  return doc
}

/** Auditoria de quem aprovou, publicou e executou cada transição (ficha S05). */
export const auditEditorialTransition: CollectionAfterChangeHook = async ({ doc, req }) => {
  const result = req.context[RESULT_CONTEXT] as TransitionResult | undefined
  if (!result || result.id !== String(doc.id)) return doc
  delete req.context[RESULT_CONTEXT]
  const action =
    result.to === 'approved' ? 'approve' : result.to === 'published' ? 'publish' : 'workflow'
  await writeAudit(req as PayloadRequest, {
    action,
    targetCollection: 'essays',
    documentId: doc.id,
    diffSummary: `${actionLabel(result.from, result.to)}: ${WORKFLOW_LABELS[result.from]} → ${WORKFLOW_LABELS[result.to]}${result.scheduler ? ' (publicação agendada, executada pelo sistema)' : ''}`,
  })
  return doc
}

/** Ensaio que já foi (ou será) público não é excluído: arquiva-se (exclusão lógica, 13.4). */
export const blockDeletePublishedEssay: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const [main, latest] = await Promise.all([
    req.payload.findByID({ collection: 'essays', id, depth: 0, overrideAccess: true, req }),
    req.payload.findByID({
      collection: 'essays',
      id,
      depth: 0,
      draft: true,
      overrideAccess: true,
      req,
    }),
  ])
  const touchedPublic = [main, latest].some(
    (doc) => doc && (doc.publishedAt || isPublicState(stateOf(doc.workflowStatus))),
  )
  if (touchedPublic) {
    throw new APIError(
      'Ensaios publicados ou agendados não são excluídos: use "Arquivar".',
      400,
      undefined,
      true,
    )
  }
}

export const essaysHooks: CollectionConfig['hooks'] = {
  beforeOperation: [publishedOnlyForPublic, rememberSaveMode],
  beforeChange: [
    enforceEditorialWorkflow,
    sanitizeEssayContent,
    fillAuthorNames,
    rememberPublishedSlug('essays'),
  ],
  afterChange: [
    syncSlugRedirects('essays'),
    auditEditorialTransition,
    revalidateCollectionChange('essays'),
  ],
  afterRead: [hidePrivateAuthors],
  beforeDelete: [blockDeletePublishedEssay],
  afterDelete: [revalidateCollectionDelete('essays')],
}
