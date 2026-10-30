import { timingSafeEqual } from 'node:crypto'

import { APIError, type Endpoint, type PayloadRequest } from 'payload'

import { isAdminOrEditor } from '../../access'
import { publishDueEssays, transitionEssay } from './transition'

/**
 * Endpoints do fluxo editorial (ficha S05):
 * - `POST /api/essays/:id/transition` — ações do painel (enviar, devolver, aprovar, agendar,
 *   publicar, arquivar, restaurar); somente `editor`/`admin`.
 * - `GET|POST /api/essays/publish-due` — conclui agendamentos vencidos; `editor`/`admin` ou
 *   o agendador externo com `Authorization: Bearer <CRON_SECRET>` (ex.: Vercel Cron, S06).
 */
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

function errorResponse(error: unknown) {
  if (error instanceof APIError) {
    return json(
      { message: error.message, ...((error.data as Record<string, unknown>) ?? {}) },
      error.status,
    )
  }
  throw error
}

async function readBody(req: PayloadRequest): Promise<Record<string, unknown>> {
  try {
    const body = typeof req.json === 'function' ? await req.json() : {}
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

const asText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value : null

export function hasValidCronSecret(
  authorization: string | null | undefined,
  secret = process.env.CRON_SECRET,
): boolean {
  if (!secret || secret.length < 16 || !authorization?.startsWith('Bearer ')) return false
  const received = Buffer.from(authorization.slice('Bearer '.length))
  const expected = Buffer.from(secret)
  return received.length === expected.length && timingSafeEqual(received, expected)
}

const transitionEndpoint: Endpoint = {
  path: '/:id/transition',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return json({ message: 'Autenticação necessária.' }, 401)
    if (!isAdminOrEditor({ req })) return json({ message: 'Acesso negado.' }, 403)
    const id = req.routeParams?.id as string | undefined
    if (!id) return json({ message: 'Ensaio não informado.' }, 400)
    const body = await readBody(req)
    try {
      const doc = await transitionEssay(req, {
        id,
        to: String(body.to ?? ''),
        comment: asText(body.comment),
        scheduledAt: asText(body.scheduledAt),
      })
      return json({
        doc: {
          id: doc.id,
          workflowStatus: doc.workflowStatus,
          publishedAt: doc.publishedAt ?? null,
          scheduledAt: doc.scheduledAt ?? null,
          archivedAt: doc.archivedAt ?? null,
        },
      })
    } catch (error) {
      return errorResponse(error)
    }
  },
}

const publishDueHandler: Endpoint['handler'] = async (req) => {
  const authorized =
    isAdminOrEditor({ req }) || hasValidCronSecret(req.headers.get('authorization'))
  if (!authorized) return json({ message: 'Acesso negado.' }, req.user ? 403 : 401)
  const result = await publishDueEssays(req.payload)
  return json(result)
}

export const essayEndpoints: Endpoint[] = [
  { path: '/publish-due', method: 'post', handler: publishDueHandler },
  { path: '/publish-due', method: 'get', handler: publishDueHandler },
  transitionEndpoint,
]
