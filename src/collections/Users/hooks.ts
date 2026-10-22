import {
  APIError,
  type CollectionAfterChangeHook,
  type CollectionAfterLoginHook,
  type CollectionBeforeChangeHook,
  type CollectionBeforeDeleteHook,
  type CollectionBeforeLoginHook,
  type CollectionBeforeOperationHook,
  type CollectionBeforeValidateHook,
  type PayloadRequest,
  ValidationError,
} from 'payload'

import { normalizeRoles, rolesChanged } from '../../access/roles'
import { writeAudit } from '../../hooks/audit'
import { buildPasswordEmail } from './email'
import { checkPassword } from '../../lib/auth/password-policy'
import { clientIp } from '../../lib/security/ip'
import {
  AUTH_RATE_LIMITS,
  authRateLimiter,
  type RateLimitedAuthOperation,
} from '../../lib/security/rate-limit'

const RATE_LIMITED = new Set<string>(Object.keys(AUTH_RATE_LIMITS))

/**
 * Limite de taxa (por IP) em login, recuperação e redefinição de senha via REST, e política
 * de senha em toda operação que define senha (criação, edição, primeiro usuário e redefinição).
 * Chamadas da Local API (scripts e testes) não passam por HTTP e não são limitadas.
 */
export const enforceAuthPolicies: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  if (RATE_LIMITED.has(operation) && req.payloadAPI === 'REST') {
    const op = operation as RateLimitedAuthOperation
    const ip = clientIp(req.headers) ?? 'desconhecido'
    const result = authRateLimiter.hit(`${op}:${ip}`, AUTH_RATE_LIMITS[op])
    if (!result.allowed) {
      throw new APIError(
        `Muitas tentativas. Aguarde ${Math.ceil(result.retryAfterSeconds / 60)} minuto(s) e tente novamente.`,
        429,
        undefined,
        true,
      )
    }
  }

  if (operation === 'create' || operation === 'update' || operation === 'resetPassword') {
    const data = (args as { data?: Record<string, unknown> }).data
    if (data && typeof data.password === 'string') {
      const email = typeof data.email === 'string' ? data.email : null
      const check = checkPassword(data.password, email)
      if (!check.ok) {
        throw new ValidationError({ errors: [{ message: check.message, path: 'password' }] })
      }
    }
  }

  return args
}

async function countActiveAdmins(req: PayloadRequest, excludeId?: number | string) {
  const { totalDocs } = await req.payload.count({
    collection: 'users',
    overrideAccess: true,
    req,
    where: {
      and: [
        { roles: { contains: 'admin' } },
        { active: { not_equals: false } },
        ...(excludeId == null ? [] : [{ id: { not_equals: excludeId } }]),
      ],
    },
  })
  return totalDocs
}

/** O primeiro usuário (bootstrap do painel) é sempre `admin` e ativo. */
export const firstUserIsAdmin: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (operation !== 'create' || !data) return data
  const { totalDocs } = await req.payload.count({ collection: 'users', overrideAccess: true, req })
  if (totalDocs === 0) {
    return { ...data, roles: ['admin'], active: true }
  }
  return { ...data, roles: normalizeRoles(data.roles) }
}

/** Impede remover o papel `admin` ou desativar o último administrador ativo. */
export const protectLastAdmin: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (operation !== 'update' || !originalDoc) return data
  const wasActiveAdmin =
    normalizeRoles(originalDoc.roles).includes('admin') && originalDoc.active !== false
  if (!wasActiveAdmin) return data
  const roles = data.roles === undefined ? originalDoc.roles : data.roles
  const active = data.active === undefined ? originalDoc.active : data.active
  const staysActiveAdmin = normalizeRoles(roles).includes('admin') && active !== false
  if (!staysActiveAdmin && (await countActiveAdmins(req, originalDoc.id)) === 0) {
    throw new ValidationError({
      errors: [
        {
          message: 'Não é possível remover o papel ou desativar o último administrador ativo.',
          path: 'roles',
        },
      ],
    })
  }
  return data
}

export const preventDeletingLastAdmin: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const user = await req.payload.findByID({
    collection: 'users',
    id,
    overrideAccess: true,
    req,
    depth: 0,
  })
  const isActiveAdmin = normalizeRoles(user?.roles).includes('admin') && user?.active !== false
  if (isActiveAdmin && (await countActiveAdmins(req, id)) === 0) {
    throw new APIError('Não é possível excluir o último administrador ativo.', 400, undefined, true)
  }
}

/** Contas desativadas não autenticam. */
export const blockInactiveLogin: CollectionBeforeLoginHook = ({ user }) => {
  if ((user as { active?: boolean | null }).active === false) {
    throw new APIError('Conta desativada. Procure o administrador do portal.', 403, undefined, true)
  }
  return user
}

export const recordLastLogin: CollectionAfterLoginHook = async ({ req, user }) => {
  await req.payload.update({
    collection: 'users',
    id: (user as { id: number | string }).id,
    data: { lastLoginAt: new Date().toISOString() },
    overrideAccess: true,
    req,
    context: { internalLoginUpdate: true },
  })
  return user
}

/** Auditoria `role_change` (planejamento 14.4) e e-mail para definição de senha da conta nova. */
export const auditRolesAndInvite: CollectionAfterChangeHook = async ({
  context,
  doc,
  operation,
  previousDoc,
  req,
}) => {
  const before = operation === 'create' ? [] : previousDoc?.roles
  if (rolesChanged(before, doc.roles)) {
    await writeAudit(req, {
      action: 'role_change',
      targetCollection: 'users',
      documentId: doc.id,
      diffSummary: `Papéis: ${normalizeRoles(before).join(', ') || '(nenhum)'} → ${
        normalizeRoles(doc.roles).join(', ') || '(nenhum)'
      }`,
    })
  }

  // Conta criada por um administrador: envia o link para o titular definir a própria senha.
  // O token é gerado na mesma transação da criação (a conta ainda não está confirmada).
  if (operation === 'create' && req.user && context.skipSetupEmail !== true) {
    const token = await req.payload.forgotPassword({
      collection: 'users',
      data: { email: doc.email },
      disableEmail: true,
      req,
    })
    if (token) {
      const message = buildPasswordEmail(doc, token, 'setup')
      await req.payload.sendEmail({ to: doc.email, ...message })
    }
  }
  return doc
}
