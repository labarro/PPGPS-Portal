import { getPayload } from 'payload'

import config from '../../src/payload.config'
import { configureTestDatabase } from './test-env'

/**
 * Remove ensaios de teste (slug com o prefixo) direto no banco de TESTE, inclusive versões e
 * redirecionamentos: ensaios publicados não são excluíveis pela aplicação (arquivamento).
 */
export async function cleanupE2EEssays(slugPrefix: string): Promise<void> {
  configureTestDatabase()
  const payload = await getPayload({ config: await config })
  const essays = await payload.find({
    collection: 'essays',
    where: { slug: { like: slugPrefix } },
    draft: true,
    limit: 500,
    depth: 0,
    pagination: false,
    overrideAccess: true,
  })
  const ids = essays.docs.map((doc) => doc.id)
  if (ids.length > 0) {
    await payload.db.deleteVersions({ collection: 'essays', where: { parent: { in: ids } } })
    await payload.db.deleteMany({ collection: 'essays', where: { id: { in: ids } } })
  }
  await payload.delete({
    collection: 'redirects',
    where: { from: { like: slugPrefix } },
    overrideAccess: true,
  })
}
