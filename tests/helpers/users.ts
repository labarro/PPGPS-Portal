import { getPayload } from 'payload'

import config from '../../src/payload.config'
import { configureTestDatabase } from './test-env'

/** Usuários fictícios usados pelos E2E (domínio example.com). */
export const E2E_EMAIL_DOMAIN = '@e2e.example.com'

export const loginUser = {
  email: `login${E2E_EMAIL_DOMAIN}`,
  password: 'senha-ficticia-e2e-123',
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

export async function seedLoginUser(): Promise<void> {
  const payload = await payloadClient()
  await payload.delete({ collection: 'users', where: { email: { equals: loginUser.email } } })
  await payload.create({ collection: 'users', data: loginUser })
}

export async function cleanupE2EUsers(): Promise<void> {
  const payload = await payloadClient()
  await payload.delete({ collection: 'users', where: { email: { like: E2E_EMAIL_DOMAIN } } })
}
