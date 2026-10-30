import type { Payload } from 'payload'

import { orcidCheckDigit } from '@/lib/people/identifiers'

/**
 * Pessoas FICTÍCIAS para testes (AGENTS.md §8.6 e §9.2). Identificadores gerados fora das
 * faixas emitidas pelo ORCID (prefixo 0000-0000-) e Lattes com zeros à esquerda.
 */
export function fakeOrcid(seed: number): string {
  const base = `00000000${String(seed % 10_000_000).padStart(7, '0')}`
  const digits = `${base}${orcidCheckDigit(base)}`
  return digits.replace(/(\d{4})(\d{4})(\d{4})(\d{3}[\dX])/, '$1-$2-$3-$4')
}

export const fakeLattes = (seed: number): string =>
  `http://lattes.cnpq.br/${String(seed).padStart(16, '0')}`

/** ORCID com o mesmo corpo e dígito verificador trocado (sempre inválido). */
export function invalidOrcid(seed: number): string {
  const valid = fakeOrcid(seed)
  const last = valid.at(-1)
  const wrong = last === '0' ? '1' : '0'
  return `${valid.slice(0, -1)}${wrong}`
}

/** Remove pessoas, vínculos e autorizações de teste direto no banco (sem os bloqueios). */
export async function cleanupPeople(payload: Payload, slugLike: string): Promise<void> {
  const people = await payload.find({
    collection: 'people',
    where: { slug: { like: slugLike } },
    limit: 500,
    depth: 0,
    overrideAccess: true,
    pagination: false,
  })
  const ids = people.docs.map((doc) => doc.id)
  if (ids.length === 0) return
  await payload.db.deleteMany({ collection: 'memberships', where: { person: { in: ids } } })
  const consents = await payload.find({
    collection: 'consent-records',
    where: { person: { in: ids } },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
    pagination: false,
  })
  const consentIds = consents.docs.map((doc) => doc.id)
  if (consentIds.length > 0) {
    await payload.db.updateMany({
      collection: 'media',
      where: { consentRecord: { in: consentIds } },
      data: { consentRecord: null, publicConsent: false },
    })
    await payload.db.deleteMany({
      collection: 'consent-records',
      where: { id: { in: consentIds } },
    })
  }
  await payload.db.updateMany({
    collection: 'users',
    where: { person: { in: ids } },
    data: { person: null },
  })
  await payload.db.deleteMany({ collection: 'people', where: { id: { in: ids } } })
}
