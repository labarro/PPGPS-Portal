import {
  type CollectionAfterChangeHook,
  type CollectionAfterDeleteHook,
  type CollectionBeforeChangeHook,
  type CollectionConfig,
  type PayloadRequest,
  ValidationError,
} from 'payload'

import { runRevalidation } from '../../hooks/revalidate'
import { revalidationPlan } from '../../lib/content/cache-tags'
import {
  findOverlap,
  type MembershipLike,
  membershipLabel,
  membershipPeriod,
  validateMembership,
} from '../../lib/people/memberships'

const idOf = (value: unknown): number | string | null => {
  if (value == null) return null
  if (typeof value === 'object') return ((value as { id?: number | string }).id ?? null) as never
  return value as number | string
}

async function personName(req: PayloadRequest, id: number | string | null): Promise<string> {
  if (id == null) return ''
  const person = await req.payload
    .findByID({
      collection: 'people',
      id,
      depth: 0,
      overrideAccess: true,
      req,
      select: { fullName: true },
    })
    .catch(() => null)
  return person?.fullName ?? ''
}

/**
 * Consistência do vínculo (planejamento 13.3; ficha S04, tarefa 2): nível de formação só e
 * sempre para estudantes, datas coerentes e não futuras, motivo do encerramento, não
 * sobreposição do mesmo (pessoa, papel, nível). Calcula a situação e o título do painel.
 */
export const validateAndDeriveMembership: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  const merged = { ...(originalDoc ?? {}), ...data } as Record<string, unknown>
  const role = merged.role as string | undefined
  if (role !== 'student') {
    data.trainingLevel = null
    merged.trainingLevel = null
  }
  if (!merged.endDate) {
    data.endReason = null
    merged.endReason = null
  }

  // Nível de formação de não estudantes e motivo sem término são limpos acima (dados de
  // formulários antigos), não rejeitados.
  const errors = validateMembership({
    role,
    trainingLevel: merged.trainingLevel as string | null,
    startDate: merged.startDate as string | null,
    endDate: merged.endDate as string | null,
    endReason: merged.endReason as string | null,
  })
  if (errors.length > 0) throw new ValidationError({ errors })

  const personId = idOf(merged.person)
  if (personId != null && merged.startDate) {
    const others = await req.payload.find({
      collection: 'memberships',
      where: { person: { equals: personId } },
      limit: 200,
      depth: 0,
      overrideAccess: true,
      req,
      select: { role: true, trainingLevel: true, startDate: true, endDate: true },
    })
    const candidate: MembershipLike = {
      id: originalDoc?.id,
      role: role ?? '',
      trainingLevel: merged.trainingLevel as string | null,
      startDate: String(merged.startDate),
      endDate: (merged.endDate as string | null) ?? null,
    }
    const conflict = findOverlap(candidate, others.docs as unknown as MembershipLike[])
    if (conflict) {
      throw new ValidationError({
        errors: [
          {
            path: 'startDate',
            message: `Período sobreposto a outro vínculo "${membershipLabel(conflict)}" (${membershipPeriod(conflict)}) da mesma pessoa.`,
          },
        ],
      })
    }
  }

  data.status = merged.endDate ? 'ended' : 'active'
  const name = await personName(req, personId)
  data.displayTitle = `${name} - ${membershipLabel({
    role: role ?? '',
    trainingLevel: merged.trainingLevel as string | null,
  })} (${merged.startDate ? membershipPeriod({ startDate: String(merged.startDate), endDate: (merged.endDate as string | null) ?? null }) : ''})`
  return data
}

async function revalidatePeople(req: PayloadRequest, ids: (number | string | null)[]) {
  if (req.context?.skipRevalidation) return
  const unique = [...new Set(ids.filter((id): id is number | string => id != null).map(String))]
  for (const id of unique) {
    const person = await req.payload
      .findByID({
        collection: 'people',
        id,
        depth: 0,
        overrideAccess: true,
        req,
        select: { slug: true },
      })
      .catch(() => null)
    await runRevalidation(revalidationPlan('people', person), req)
  }
}

export const revalidateMembershipChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
}) => {
  await revalidatePeople(req, [idOf(doc.person), idOf(previousDoc?.person)])
  return doc
}

export const revalidateMembershipDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  await revalidatePeople(req, [idOf(doc.person)])
  return doc
}

export const membershipsHooks: CollectionConfig['hooks'] = {
  beforeChange: [validateAndDeriveMembership],
  afterChange: [revalidateMembershipChange],
  afterDelete: [revalidateMembershipDelete],
}
