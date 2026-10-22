import type { CollectionConfig } from 'payload'

import { resolveAppEnv } from '../../lib/env/app-env'
import { usersAccess } from './access'
import { buildPasswordEmail, RESET_TOKEN_TTL_MS } from './email'
import { userFields } from './fields'
import {
  auditRolesAndInvite,
  blockInactiveLogin,
  enforceAuthPolicies,
  firstUserIsAdmin,
  preventDeletingLastAdmin,
  protectLastAdmin,
  recordLastLogin,
} from './hooks'

export { RESET_TOKEN_TTL_MS }
/** Bloqueio após 5 tentativas inválidas, por 15 minutos (planejamento 14.1). */
export const MAX_LOGIN_ATTEMPTS = 5
export const LOCK_TIME_MS = 15 * 60 * 1000
/** Sessão expira após 2 h sem renovação (o painel renova enquanto há atividade). */
export const SESSION_TTL_SECONDS = 2 * 60 * 60

/**
 * Contas de acesso (S02). Conta ≠ pessoa acadêmica (ADR-0004); `users.person` entra na S04.
 * Papéis: `admin` (desenvolvedor) e `editor` (coordenador) — ADR-0010, Q5.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Usuário', plural: 'Usuários' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'roles', 'active', 'lastLoginAt'],
    group: 'Administração',
  },
  access: usersAccess,
  auth: {
    maxLoginAttempts: MAX_LOGIN_ATTEMPTS,
    lockTime: LOCK_TIME_MS,
    tokenExpiration: SESSION_TTL_SECONDS,
    useSessions: true,
    // Cookie HttpOnly, SameSite=Lax; Secure fora do ambiente local (http).
    cookies: { sameSite: 'Lax', secure: resolveAppEnv(process.env.APP_ENV) !== 'local' },
    forgotPassword: {
      expiration: RESET_TOKEN_TTL_MS,
      generateEmailSubject: (args) =>
        buildPasswordEmail(args?.user, String(args?.token ?? '')).subject,
      generateEmailHTML: (args) => buildPasswordEmail(args?.user, String(args?.token ?? '')).html,
    },
  },
  hooks: {
    beforeOperation: [enforceAuthPolicies],
    beforeValidate: [firstUserIsAdmin],
    beforeChange: [protectLastAdmin],
    beforeDelete: [preventDeletingLastAdmin],
    beforeLogin: [blockInactiveLogin],
    afterLogin: [recordLastLogin],
    afterChange: [auditRolesAndInvite],
  },
  fields: userFields,
}
