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

export const editorUser = {
  email: `editor${E2E_EMAIL_DOMAIN}`,
  password: strongTestPassword(),
}

/** Conta fictícia com o papel `editor` (coordenador) para os E2E de edição de conteúdo. */
export async function seedEditorUser(): Promise<void> {
  const payload = await payloadClient()
  await deleteUsersDirect({ email: { equals: editorUser.email } })
  await payload.create({
    collection: 'users',
    data: { ...editorUser, roles: ['editor'], active: true },
    context: { skipSetupEmail: true },
  })
}

/** Remove conteúdo criado pelos E2E (slugs com o prefixo informado) e seus redirecionamentos. */
export async function cleanupE2EContent(slugPrefix: string): Promise<void> {
  const payload = await payloadClient()
  for (const collection of ['research-lines', 'pages'] as const) {
    await payload.delete({
      collection,
      where: { slug: { like: slugPrefix } },
      overrideAccess: true,
      context: { skipRevalidation: true },
    })
  }
  await payload.delete({
    collection: 'redirects',
    where: { from: { like: slugPrefix } },
    overrideAccess: true,
  })
}
