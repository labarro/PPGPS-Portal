import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  PayloadRequest,
} from 'payload'

import { type RevalidationPlan, revalidationPlan } from '../lib/content/cache-tags'

type Entity = Parameters<typeof revalidationPlan>[0]

/**
 * Executa a revalidação (tags com expiração imediata + rotas). Fora do runtime do Next
 * (seed, testes, CLI) a chamada não se aplica e é ignorada: o cache das páginas expira
 * pelo tempo de segurança definido em `src/lib/content/queries.ts`.
 */
export async function runRevalidation(
  plan: RevalidationPlan,
  req: Pick<PayloadRequest, 'payload' | 'context'>,
): Promise<boolean> {
  if (req.context?.skipRevalidation) return false
  try {
    const { revalidatePath, revalidateTag } = await import('next/cache')
    for (const tag of plan.tags) revalidateTag(tag, { expire: 0 })
    for (const { path, type } of plan.paths) revalidatePath(path, type)
    return true
  } catch (error) {
    req.payload.logger.debug({ err: error, msg: 'Revalidação ignorada fora do runtime do Next.' })
    return false
  }
}

/** Globals do layout (Navigation, Footer, SiteSettings): afetam todas as páginas. */
export const revalidateSiteLayout: GlobalAfterChangeHook = async ({ doc, req }) => {
  await runRevalidation(revalidationPlan('site-chrome'), req)
  return doc
}

export const revalidateGlobal =
  (entity: Entity): GlobalAfterChangeHook =>
  async ({ doc, req }) => {
    await runRevalidation(revalidationPlan(entity), req)
    return doc
  }

export const revalidateCollectionChange =
  (entity: Entity): CollectionAfterChangeHook =>
  async ({ doc, previousDoc, req }) => {
    await runRevalidation(revalidationPlan(entity, doc, previousDoc), req)
    return doc
  }

export const revalidateCollectionDelete =
  (entity: Entity): CollectionAfterDeleteHook =>
  async ({ doc, req }) => {
    await runRevalidation(revalidationPlan(entity, doc), req)
    return doc
  }
