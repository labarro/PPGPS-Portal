import type { PayloadRequest, Where } from 'payload'

import { grantsPhoto, personConsentFlags } from '../lib/people/consent'

/**
 * Sincroniza os campos calculados a partir das autorizações individuais (ficha S04):
 * - `people.consent*` (perfil público, foto, e-mail, situação);
 * - `media.publicConsent` (imagem com pessoa identificável liberada por autorização de foto).
 *
 * Executa na mesma transação da alteração da autorização (`req`). A atualização da pessoa
 * dispara os hooks de `people`, que revalidam imediatamente diretório, perfil, linhas,
 * `/o-grupo`, página inicial e sitemap (revogação com efeito imediato).
 */
export async function syncPersonConsent(req: PayloadRequest, personId: number | string) {
  const records = await req.payload.find({
    collection: 'consent-records',
    where: { person: { equals: personId } },
    limit: 500,
    depth: 0,
    pagination: false,
    overrideAccess: true,
    req,
    select: { scopes: true, grantedAt: true, revokedAt: true },
  })
  const flags = personConsentFlags(records.docs)
  const person = await req.payload
    .findByID({ collection: 'people', id: personId, depth: 0, overrideAccess: true, req })
    .catch(() => null)
  if (!person) return
  const unchanged =
    person.consentPublicProfile === flags.consentPublicProfile &&
    person.consentPhoto === flags.consentPhoto &&
    person.consentEmail === flags.consentEmail &&
    person.consentStatus === flags.consentStatus
  if (unchanged) return
  await req.payload.update({
    collection: 'people',
    id: personId,
    data: flags,
    overrideAccess: true,
    req,
  })
}

/** Recalcula `publicConsent` das mídias ligadas à autorização (ou órfãs, após exclusão). */
export async function syncMediaConsent(req: PayloadRequest, recordId: number | string | null) {
  const where: Where = recordId
    ? { consentRecord: { equals: recordId } }
    : { and: [{ publicConsent: { equals: true } }, { consentRecord: { exists: false } }] }
  const media = await req.payload.find({
    collection: 'media',
    where,
    limit: 500,
    depth: 1,
    pagination: false,
    overrideAccess: true,
    req,
  })
  for (const item of media.docs) {
    const record = typeof item.consentRecord === 'object' ? item.consentRecord : null
    const allowed = grantsPhoto(record)
    if (item.publicConsent === allowed) continue
    await req.payload.update({
      collection: 'media',
      id: item.id,
      data: { publicConsent: allowed },
      overrideAccess: true,
      req,
    })
  }
}
