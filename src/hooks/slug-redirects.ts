import type { CollectionAfterChangeHook, CollectionBeforeChangeHook, PayloadRequest } from 'payload'

import { type ContentCollection, normalizePath, pathForDocument } from '../lib/content/paths'

export const REDIRECTS_COLLECTION = 'redirects'

type SlugDoc = { id?: number | string; slug?: string | null; _status?: string | null }

const contextKey = (collection: string, id: number | string | undefined) =>
  `previousPublishedSlug:${collection}:${String(id ?? 'new')}`

/**
 * Antes de PUBLICAR, guarda o slug da versão publicada atual (tabela principal da coleção).
 * Com rascunhos, `originalDoc` pode ser o último rascunho — por isso a consulta direta.
 */
export const rememberPublishedSlug =
  (collection: ContentCollection): CollectionBeforeChangeHook =>
  async ({ data, operation, originalDoc, req }) => {
    if (operation !== 'update' || data?._status !== 'published' || !originalDoc?.id) return data
    const current = (await req.payload.db.findOne({
      collection,
      req,
      where: { id: { equals: originalDoc.id } },
    })) as SlugDoc | null
    if (current?._status === 'published' && current.slug) {
      req.context[contextKey(collection, originalDoc.id)] = current.slug
    }
    return data
  }

/**
 * Depois de publicar:
 * 1. remove redirecionamentos cuja origem é o endereço agora válido (evita desviar a página);
 * 2. se o slug publicado mudou, cria (ou atualiza) o 301 do endereço antigo para o novo e
 *    reaponta redirecionamentos antigos para o novo destino (sem cadeias).
 * Tudo na mesma transação da alteração (`req`).
 */
export const syncSlugRedirects =
  (collection: ContentCollection): CollectionAfterChangeHook =>
  async ({ doc, req }) => {
    const current = doc as SlugDoc
    if (current._status !== 'published' || !current.slug) return doc
    const key = contextKey(collection, current.id)
    const previousSlug = req.context[key] as string | undefined
    delete req.context[key]

    const newPath = normalizePath(pathForDocument(collection, current.slug))
    await deleteRedirectsFrom(req, newPath)

    if (previousSlug && previousSlug !== current.slug) {
      const oldPath = normalizePath(pathForDocument(collection, previousSlug))
      await retargetRedirects(req, oldPath, newPath)
      await upsertRedirect(req, oldPath, newPath)
    }
    return doc
  }

async function deleteRedirectsFrom(req: PayloadRequest, from: string) {
  await req.payload.delete({
    collection: REDIRECTS_COLLECTION,
    where: { from: { equals: from } },
    overrideAccess: true,
    req,
  })
}

async function retargetRedirects(req: PayloadRequest, oldTarget: string, newTarget: string) {
  await req.payload.update({
    collection: REDIRECTS_COLLECTION,
    where: { 'to.url': { equals: oldTarget } },
    data: { to: { url: newTarget } },
    overrideAccess: true,
    req,
  })
}

async function upsertRedirect(req: PayloadRequest, from: string, to: string) {
  const existing = await req.payload.find({
    collection: REDIRECTS_COLLECTION,
    where: { from: { equals: from } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  })
  const data = { from, to: { url: to }, type: '301' as const }
  if (existing.docs[0]) {
    await req.payload.update({
      collection: REDIRECTS_COLLECTION,
      id: existing.docs[0].id,
      data,
      overrideAccess: true,
      req,
    })
  } else {
    await req.payload.create({ collection: REDIRECTS_COLLECTION, data, overrideAccess: true, req })
  }
}
