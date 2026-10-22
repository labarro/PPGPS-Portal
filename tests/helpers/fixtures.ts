import { randomUUID } from 'node:crypto'

import type { Payload } from 'payload'

import { strongTestPassword } from './test-env'

/** Contas FICTÍCIAS (example.com) para testes de integração. */
export type TestAccount = { id: number; email: string; password: string }

export const INT_DOMAIN = '@int.example.com'

export async function createAccount(
  payload: Payload,
  roles: ('admin' | 'editor')[],
  overrides: { active?: boolean; name?: string } = {},
): Promise<TestAccount> {
  const email = `${roles.join('-') || 'sem-papel'}-${randomUUID().slice(0, 8)}${INT_DOMAIN}`
  const password = strongTestPassword()
  const user = await payload.create({
    collection: 'users',
    data: { email, password, roles, active: overrides.active ?? true, name: overrides.name },
    context: { skipSetupEmail: true },
  })
  return { id: user.id, email, password }
}

/** Remove contas de teste direto no banco (sem a proteção do último admin). */
export async function cleanupAccounts(payload: Payload): Promise<void> {
  await payload.db.deleteMany({ collection: 'users', where: { email: { like: INT_DOMAIN } } })
}
