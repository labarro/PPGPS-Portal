/**
 * Seed de integrantes FICTÍCIOS (S04) — local, E2E e previews. Idempotente: pessoas já
 * existentes (mesmo slug) são mantidas como estão. BLOQUEADO em homologação e produção:
 * lá só entram pessoas reais da planilha validada, com autorização individual (Q4/Q5).
 *
 * Uso: `pnpm seed:people` (depois de `pnpm seed:content`, que cria as linhas temáticas).
 * Núcleo reutilizável (CLI em `scripts/seed/people.ts`).
 */
import type { Payload } from 'payload'

import { resolveAppEnv } from '../../src/lib/env/app-env'
import { FICTITIOUS_SOURCE, peopleSeed, type SeedPerson } from './data/people'

export async function seedPeople(payload: Payload): Promise<{ created: string[]; kept: string[] }> {
  const env = resolveAppEnv(process.env.APP_ENV)
  if (env === 'production' || env === 'staging') {
    throw new Error(`Seed de integrantes fictícios bloqueado no ambiente "${env}".`)
  }

  const lines = await payload.find({
    collection: 'research-lines',
    limit: 50,
    depth: 0,
    overrideAccess: true,
    pagination: false,
  })
  const lineId = new Map(lines.docs.map((line) => [line.slug, line.id]))
  const context = { skipRevalidation: true }
  const created: string[] = []
  const kept: string[] = []
  const leaders: number[] = []

  for (const person of peopleSeed) {
    const existing = await payload.find({
      collection: 'people',
      where: { slug: { equals: person.slug } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (existing.docs[0]) {
      kept.push(person.slug)
      if (person.leader) leaders.push(existing.docs[0].id)
      continue
    }
    const id = await createPerson(payload, person, lineId, context)
    created.push(person.slug)
    if (person.leader) leaders.push(id)
  }

  // Líderes fictícios no perfil do grupo, só se ainda não houver líderes indicados.
  const profile = await payload.findGlobal({
    slug: 'group-profile',
    depth: 0,
    overrideAccess: true,
  })
  if (profile?.officialName && (profile.leaders ?? []).length === 0 && leaders.length > 0) {
    await payload.updateGlobal({
      slug: 'group-profile',
      data: { leaders, _status: 'published' },
      overrideAccess: true,
      context,
    })
  }
  return { created, kept }
}

async function createPerson(
  payload: Payload,
  person: SeedPerson,
  lineId: Map<string, number>,
  context: Record<string, unknown>,
): Promise<number> {
  const doc = await payload.create({
    collection: 'people',
    data: {
      fullName: person.fullName,
      slug: person.slug,
      citationName: person.citationName,
      shortBio: person.shortBio,
      orcid: person.orcid,
      lattesUrl: person.lattesUrl,
      publicEmail: person.publicEmail,
      expertise: person.expertise,
      affiliations: person.affiliations?.map((item) => ({ ...item, current: true })),
      visibility: 'public',
    },
    overrideAccess: true,
    context,
  })
  for (const membership of person.memberships) {
    await payload.create({
      collection: 'memberships',
      data: {
        person: doc.id,
        role: membership.role,
        trainingLevel: membership.trainingLevel,
        lines: membership.lines
          .map((slug) => lineId.get(slug))
          .filter((id): id is number => id != null),
        startDate: membership.startDate,
        endDate: membership.endDate,
        endReason: membership.endReason,
        source: 'manual',
        collectedAt: '2026-10-30',
      },
      overrideAccess: true,
      context,
    })
  }
  for (const consent of person.consents) {
    const record = await payload.create({
      collection: 'consent-records',
      data: {
        person: doc.id,
        scopes: consent.scopes,
        grantedAt: consent.grantedAt,
        method: 'digital_form',
        collectedBy: 'Coordenação (fictício)',
        notes: FICTITIOUS_SOURCE,
      },
      overrideAccess: true,
      context,
    })
    if (consent.revokedAt) {
      await payload.update({
        collection: 'consent-records',
        id: record.id,
        data: { revokedAt: consent.revokedAt },
        overrideAccess: true,
        context,
      })
    }
  }
  return doc.id
}
