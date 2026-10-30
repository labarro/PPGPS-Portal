import { APIError, createLocalReq, type Payload, type PayloadRequest } from 'payload'

import type { Essay } from '../../payload-types'

import { isAdminOrEditor } from '../../access'
import { essayCompletenessErrors } from '../../lib/editorial/essay'
import {
  type Actor,
  checkTransition,
  isWorkflowState,
  stateOf,
  type WorkflowState,
  wasEverPublished,
} from '../../lib/editorial/workflow'
import { type EssayTransitionContext, TRANSITION_CONTEXT } from './hooks'

/**
 * Serviço ÚNICO de transição editorial (ficha S05). Usado pelo endpoint REST
 * (`POST /api/essays/:id/transition`), pelo painel (botões de ação) e pelo job de agendamento.
 * Valida a transição na máquina de estados, grava no modo correto (rascunho × versão
 * principal) e deixa o hook da coleção revalidar tudo de novo — inclusive o acesso da coleção
 * (`overrideAccess: false` para usuários; o agendador só pode concluir agendamentos vencidos).
 */
export class EditorialError extends APIError {
  constructor(message: string, status: number, data?: Record<string, unknown>) {
    super(message, status, data, true)
  }
}

export type TransitionInput = {
  id: number | string
  to: string
  comment?: string | null
  scheduledAt?: string | null
  /** Relógio injetável (testes de agendamento). */
  now?: Date
}

type UserLike = { id: number | string; name?: string | null; email?: string | null }

export async function transitionEssay(
  req: PayloadRequest,
  input: TransitionInput,
  actorKind: Actor['kind'] = 'editorial',
): Promise<Essay> {
  const { payload } = req
  const user = req.user as UserLike | null
  if (actorKind === 'editorial' && !isAdminOrEditor({ req })) {
    throw new EditorialError(
      'Somente o coordenador (editor) ou o administrador alteram ensaios.',
      user ? 403 : 401,
    )
  }
  if (!isWorkflowState(input.to)) {
    throw new EditorialError('Situação editorial desconhecida.', 400, {
      code: 'invalid_transition',
    })
  }
  const now = input.now ?? new Date()
  const current = await payload
    .findByID({
      collection: 'essays',
      id: input.id,
      depth: 0,
      draft: true,
      overrideAccess: true,
      req,
    })
    .catch(() => null)
  if (!current) throw new EditorialError('Ensaio não encontrado.', 404)

  const from = stateOf(current.workflowStatus)
  const to = input.to as WorkflowState

  // Agendamento vencido e ainda não concluído pelo job: conclui primeiro (como o agendador) e
  // só então aplica a ação pedida — ex.: arquivar um ensaio cuja publicação agendada já ocorreu.
  const due = current.scheduledAt ? new Date(current.scheduledAt).getTime() <= now.getTime() : false
  if (actorKind === 'editorial' && from === 'scheduled' && due) {
    const schedulerReq = await createLocalReq({ context: { ...req.context } }, payload)
    schedulerReq.user = null
    const published = await transitionEssay(
      schedulerReq,
      { id: current.id, to: 'published', now },
      'scheduler',
    )
    if (to === 'published') return published
    return transitionEssay(req, { ...input, now })
  }
  const actor: Actor =
    actorKind === 'scheduler' ? { kind: 'scheduler' } : { kind: 'editorial', userId: user!.id }
  const check = checkTransition({
    from,
    to,
    actor,
    now,
    comment: input.comment,
    scheduledAt: input.scheduledAt,
    completenessErrors: essayCompletenessErrors(current),
    checklist: current.checklist as never,
    currentScheduledAt: current.scheduledAt ?? null,
    everPublished: wasEverPublished(current, now),
  })
  if (!check.ok) {
    throw new EditorialError(check.message, 400, { code: check.code, details: check.details })
  }

  const context: EssayTransitionContext = {
    id: current.id,
    from,
    to,
    actor,
    actorName:
      actorKind === 'scheduler'
        ? 'Sistema (publicação agendada)'
        : user?.name || user?.email || 'Usuário',
    now: now.toISOString(),
    comment: input.comment ?? null,
    scheduledAt: input.scheduledAt ?? null,
  }
  req.context[TRANSITION_CONTEXT] = context
  try {
    return await payload.update({
      collection: 'essays',
      id: current.id,
      draft: check.mode === 'draft',
      data: (check.mode === 'publish'
        ? { _status: 'published' }
        : check.mode === 'unpublish'
          ? { _status: 'draft' }
          : {}) as never,
      depth: 0,
      req,
      overrideAccess: actorKind === 'scheduler',
    })
  } finally {
    delete req.context[TRANSITION_CONTEXT]
  }
}

/**
 * Conclui as publicações agendadas cuja data chegou (Agendado → Publicado). A visibilidade
 * pública não depende disto — o ensaio aparece na data pela regra de visibilidade —, mas o
 * job mantém a situação editorial, o histórico e a auditoria coerentes.
 */
export async function publishDueEssays(
  payload: Payload,
  options: { now?: Date; req?: PayloadRequest } = {},
): Promise<{ published: (number | string)[]; failed: (number | string)[] }> {
  const now = options.now ?? new Date()
  const due = await payload.find({
    collection: 'essays',
    where: {
      and: [
        { workflowStatus: { equals: 'scheduled' } },
        { _status: { equals: 'published' } },
        { scheduledAt: { less_than_equal: now.toISOString() } },
      ],
    },
    depth: 0,
    limit: 100,
    pagination: false,
    overrideAccess: true,
    select: { workflowStatus: true },
  })
  const published: (number | string)[] = []
  const failed: (number | string)[] = []
  for (const essay of due.docs) {
    // Requisição própria por ensaio, sem usuário: o agendador não herda permissões de ninguém.
    const req = await createLocalReq({ context: { ...(options.req?.context ?? {}) } }, payload)
    req.user = null
    try {
      await transitionEssay(req, { id: essay.id, to: 'published', now }, 'scheduler')
      published.push(essay.id)
    } catch (error) {
      failed.push(essay.id)
      payload.logger.warn({
        err: error,
        msg: `[editorial] Falha ao publicar ensaio agendado ${essay.id}.`,
      })
    }
  }
  return { published, failed }
}
