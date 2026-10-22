import { getPayload } from 'payload'

import config from '../../src/payload.config'
import { configureTestDatabase, strongTestPassword } from './test-env'

/** Usuários fictícios usados pelos E2E (domínio example.com). */
export const E2E_EMAIL_DOMAIN = '@e2e.example.com'

export const loginUser = {
  email: `login${E2E_EMAIL_DOMAIN}`,
  // Senha aleatória por execução (sem literais que pareçam segredos).
  password: strongTestPassword(),
}

async function payloadClient() {
  configureTestDatabase()
  return getPayload({ config: await config })
}

export async function countUsers(): Promise<number> {
  const payload = await payloadClient()
  const { totalDocs } = await payload.count({ collection: 'users' })
  return totalDocs
}

/**
 * Limpeza direta no banco de TESTE (sem hooks): evita a proteção do "último administrador",
 * que existe para o uso real e não deve ser contornada por código da aplicação.
 */
export async function deleteUsersDirect(
  where: Parameters<Awaited<ReturnType<typeof payloadClient>>['db']['deleteMany']>[0]['where'],
): Promise<void> {
  const payload = await payloadClient()
  await payload.db.deleteMany({ collection: 'users', where })
}

export async function seedLoginUser(): Promise<void> {
  const payload = await payloadClient()
  await deleteUsersDirect({ email: { equals: loginUser.email } })
  await payload.create({
    collection: 'users',
    data: { ...loginUser, roles: ['admin'], active: true },
    context: { skipSetupEmail: true },
  })
}

export async function cleanupE2EUsers(): Promise<void> {
  await deleteUsersDirect({ email: { like: E2E_EMAIL_DOMAIN } })
}
