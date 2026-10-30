import {
  APIError,
  type CollectionAfterChangeHook,
  type CollectionBeforeChangeHook,
  type CollectionBeforeDeleteHook,
  type CollectionBeforeReadHook,
  type CollectionConfig,
  ValidationError,
} from 'payload'

import { isAdminOrEditor } from '../../access'
import { revalidateCollectionChange, revalidateCollectionDelete } from '../../hooks/revalidate'
import { rememberPublishedSlug, syncSlugRedirects } from '../../hooks/slug-redirects'
import { canShowEmail, canShowPhoto } from '../../lib/content/visibility'
import { grantsPhoto } from '../../lib/people/consent'

const idOf = (value: unknown): number | string | null => {
  if (value == null) return null
  if (typeof value === 'object') return ((value as { id?: number | string }).id ?? null) as never
  return value as number | string
}

/**
 * Antes de qualquer leitura por visitante (inclusive quando a pessoa é populada em outra
 * coleção ou global): foto só com escopo `photo` e e-mail só com escopo `email` vigentes
 * (`canViewPublic` — regra única). Depois, o acesso por campo remove os campos calculados.
 * Sem os campos necessários (ex.: `select` parcial), falha fechado.
 */
export const hidePrivateContactForPublic: CollectionBeforeReadHook = ({ doc, req }) => {
  if (isAdminOrEditor({ req })) return doc
  if (!canShowPhoto(doc)) doc.photo = null
  if (!canShowEmail(doc)) delete doc.publicEmail
  return doc
}

/**
 * Foto de perfil: mídia marcada como "contém pessoas identificáveis" e vinculada a uma
 * autorização de foto vigente DESTA pessoa (planejamento 17.3; ficha S04).
 */
export const validateProfilePhoto: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  const photoId = idOf(data.photo)
  if (!photoId || String(photoId) === String(idOf(originalDoc?.photo))) return data
  const fail = (message: string) => {
    throw new ValidationError({ errors: [{ message, path: 'photo' }] })
  }
  if (operation === 'create') {
    fail('Cadastre a pessoa e a autorização de foto antes de vincular a fotografia.')
  }
  const media = await req.payload.findByID({
    collection: 'media',
    id: photoId,
    depth: 1,
    overrideAccess: true,
    req,
  })
  if (!media?.containsIdentifiablePeople) {
    fail('A fotografia deve estar marcada como "contém pessoas identificáveis".')
  }
  const record = typeof media.consentRecord === 'object' ? media.consentRecord : null
  if (!record || String(idOf(record.person)) !== String(originalDoc?.id) || !grantsPhoto(record)) {
    fail('Vincule à mídia uma autorização de foto vigente desta pessoa (campo "Autorização").')
  }
  return data
}

/**
 * Exclusão física bloqueada quando há vínculos ou autorizações (planejamento 13.4):
 * use o arquivamento. A exclusão definitiva só ocorre a pedido do titular (LGPD), com
 * procedimento próprio.
 */
export const blockDeleteWithRelations: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const [memberships, consents] = await Promise.all([
    req.payload.count({
      collection: 'memberships',
      where: { person: { equals: id } },
      overrideAccess: true,
      req,
    }),
    req.payload.count({
      collection: 'consent-records',
      where: { person: { equals: id } },
      overrideAccess: true,
      req,
    }),
  ])
  if (memberships.totalDocs > 0 || consents.totalDocs > 0) {
    throw new APIError(
      'Esta pessoa tem vínculos ou autorizações registrados. Use "Arquivado em" para retirá-la do site.',
      400,
      undefined,
      true,
    )
  }
}

/** Nome alterado: atualiza o título dos vínculos e autorizações (exibidos no painel). */
export const refreshRelatedTitles: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  if (operation !== 'update' || doc.fullName === previousDoc?.fullName) return doc
  for (const collection of ['memberships', 'consent-records'] as const) {
    await req.payload.update({
      collection,
      where: { person: { equals: doc.id } },
      data: {},
      overrideAccess: true,
      req,
      context: { ...req.context, skipRevalidation: true },
    })
  }
  return doc
}

export const peopleHooks: CollectionConfig['hooks'] = {
  beforeRead: [hidePrivateContactForPublic],
  beforeChange: [validateProfilePhoto, rememberPublishedSlug('people')],
  beforeDelete: [blockDeleteWithRelations],
  afterChange: [
    syncSlugRedirects('people'),
    refreshRelatedTitles,
    revalidateCollectionChange('people'),
  ],
  afterDelete: [revalidateCollectionDelete('people')],
}
