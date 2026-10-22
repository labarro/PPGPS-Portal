import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionAfterLoginHook,
  CollectionConfig,
  GlobalAfterChangeHook,
  GlobalConfig,
  PayloadRequest,
} from 'payload'

import { clientIp, truncateIp } from '../lib/security/ip'

/**
 * Auditoria transversal (planejamento 13.3 e 17.4; ficha S02).
 * Toda criação, edição e exclusão em coleções e globals, todo login e toda mudança de papel
 * gera um registro somente-inserção em `audit-logs`, na mesma transação da operação.
 * Nunca registra valores de campos: só os NOMES dos campos alterados.
 */
export const AUDIT_COLLECTION = 'audit-logs'

export const AUDIT_ACTIONS = [
  'create',
  'update',
  'delete',
  'login',
  'role_change',
  'publish',
  'unpublish',
  'export',
] as const

export type AuditAction = (typeof AUDIT_ACTIONS)[number]

/** Campos internos/sensíveis ignorados na comparação (não são "edições" de conteúdo). */
const IGNORED_FIELDS = new Set([
  'id',
  'createdAt',
  'updatedAt',
  'globalType',
  'hash',
  'salt',
  'password',
  'resetPasswordToken',
  'resetPasswordExpiration',
  'loginAttempts',
  'lockUntil',
  'sessions',
  'lastLoginAt',
  '_verified',
  '_verificationToken',
  'url',
  'thumbnailURL',
  '_strategy',
  'collection',
])

const stable = (value: unknown): string => JSON.stringify(value ?? null)

/** Nomes dos campos de primeiro nível que mudaram (sem valores). */
export function changedFields(
  previous: Record<string, unknown> | null | undefined,
  next: Record<string, unknown> | null | undefined,
): string[] {
  const keys = new Set([...Object.keys(previous ?? {}), ...Object.keys(next ?? {})])
  return [...keys]
    .filter((key) => !IGNORED_FIELDS.has(key))
    .filter((key) => stable(previous?.[key]) !== stable(next?.[key]))
    .sort()
}

export type AuditEntry = {
  action: AuditAction
  targetCollection: string
  documentId?: string | number | null
  diffSummary?: string | null
}

type AuditUser = { id?: string | number; email?: string | null; collection?: string } | null

export async function writeAudit(req: PayloadRequest, entry: AuditEntry): Promise<void> {
  const user = (req.user as AuditUser) ?? null
  const actor = user && (!user.collection || user.collection === 'users') ? user : null
  await req.payload.create({
    collection: AUDIT_COLLECTION,
    overrideAccess: true,
    req,
    data: {
      action: entry.action,
      targetCollection: entry.targetCollection,
      documentId: entry.documentId == null ? null : String(entry.documentId),
      userId: actor?.id == null ? null : String(actor.id),
      userEmail: actor?.email ?? null,
      diffSummary: entry.diffSummary ?? null,
      ip: truncateIp(clientIp(req.headers)),
      at: new Date().toISOString(),
    },
  })
}

export const auditAfterChange: CollectionAfterChangeHook = async ({
  collection,
  doc,
  operation,
  previousDoc,
  req,
}) => {
  if (operation === 'create') {
    await writeAudit(req, {
      action: 'create',
      targetCollection: collection.slug,
      documentId: doc.id,
      diffSummary: summarize(changedFields({}, doc)),
    })
    return doc
  }

  const fields = changedFields(previousDoc, doc)
  if (fields.length > 0) {
    await writeAudit(req, {
      action: 'update',
      targetCollection: collection.slug,
      documentId: doc.id,
      diffSummary: summarize(fields),
    })
  }
  return doc
}

export const auditAfterDelete: CollectionAfterDeleteHook = async ({ collection, doc, id, req }) => {
  await writeAudit(req, {
    action: 'delete',
    targetCollection: collection.slug,
    documentId: (doc as { id?: string | number } | undefined)?.id ?? id,
  })
  return doc
}

export const auditGlobalAfterChange: GlobalAfterChangeHook = async ({
  doc,
  global,
  previousDoc,
  req,
}) => {
  const fields = changedFields(previousDoc, doc)
  if (fields.length > 0) {
    await writeAudit(req, {
      action: 'update',
      targetCollection: `global:${global.slug}`,
      diffSummary: summarize(fields),
    })
  }
  return doc
}

export const auditAfterLogin: CollectionAfterLoginHook = async ({ collection, req, user }) => {
  // O usuário recém-autenticado é o autor do registro de login (o Payload já define
  // `req.user` antes deste hook; o valor abaixo só cobre chamadas sem usuário na requisição).
  if (!req.user) {
    req.user = { ...(user as object), collection: collection.slug } as PayloadRequest['user']
  }
  await writeAudit(req, {
    action: 'login',
    targetCollection: collection.slug,
    documentId: (user as { id?: string | number }).id,
  })
  return user
}

function summarize(fields: string[]): string | null {
  return fields.length > 0 ? `Campos: ${fields.join(', ')}` : null
}

/** Aplica os hooks de auditoria a todas as coleções (exceto a própria auditoria). */
export function withAudit(collections: CollectionConfig[]): CollectionConfig[] {
  return collections.map((collection) => {
    if (collection.slug === AUDIT_COLLECTION) return collection
    const hooks = collection.hooks ?? {}
    return {
      ...collection,
      hooks: {
        ...hooks,
        afterChange: [...(hooks.afterChange ?? []), auditAfterChange],
        afterDelete: [...(hooks.afterDelete ?? []), auditAfterDelete],
        ...(collection.auth ? { afterLogin: [...(hooks.afterLogin ?? []), auditAfterLogin] } : {}),
      },
    }
  })
}

export function withGlobalAudit(globals: GlobalConfig[]): GlobalConfig[] {
  return globals.map((global) => ({
    ...global,
    hooks: {
      ...global.hooks,
      afterChange: [...(global.hooks?.afterChange ?? []), auditGlobalAfterChange],
    },
  }))
}
