import {
  type CollectionAfterChangeHook,
  type CollectionAfterDeleteHook,
  type CollectionBeforeChangeHook,
  type CollectionConfig,
  ValidationError,
} from 'payload'

import { syncMediaConsent, syncPersonConsent } from '../../hooks/consent-sync'
import {
  CONSENT_SCOPE_LABELS,
  type ConsentScope,
  validateConsentDates,
} from '../../lib/people/consent'

const idOf = (value: unknown): number | string | null => {
  if (value == null) return null
  if (typeof value === 'object') return ((value as { id?: number | string }).id ?? null) as never
  return value as number | string
}

/**
 * Regras do registro (planejamento 10.5): datas não futuras e coerentes; titular imutável;
 * revogação irreversível; comprovante nunca público; escopos sem repetição.
 */
export const validateConsentRecord: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  const merged = { ...(originalDoc ?? {}), ...data } as Record<string, unknown>
  const errors = validateConsentDates({
    grantedAt: merged.grantedAt as string | null,
    revokedAt: merged.revokedAt as string | null,
  })

  if (operation === 'update' && originalDoc) {
    if ('person' in data && String(idOf(data.person)) !== String(idOf(originalDoc.person))) {
      errors.push({
        path: 'person',
        message: 'O titular não pode ser alterado. Registre uma nova autorização.',
      })
    }
    if (originalDoc.revokedAt && !merged.revokedAt) {
      errors.push({
        path: 'revokedAt',
        message: 'A revogação é definitiva. Para nova autorização, crie outro registro.',
      })
    }
  }

  const scopes = Array.isArray(merged.scopes) ? (merged.scopes as string[]) : []
  if (scopes.length === 0) {
    errors.push({ path: 'scopes', message: 'Selecione ao menos um escopo.' })
  }
  data.scopes = [...new Set(scopes)]

  const evidenceId = idOf(merged.evidence)
  if (evidenceId != null) {
    const evidence = await req.payload
      .findByID({ collection: 'documents', id: evidenceId, depth: 0, overrideAccess: true, req })
      .catch(() => null)
    if (!evidence || evidence.visibility === 'public') {
      errors.push({
        path: 'evidence',
        message: 'O comprovante deve ser um documento com visibilidade administrativa.',
      })
    }
  }

  if (errors.length > 0) throw new ValidationError({ errors })

  const person = await req.payload
    .findByID({
      collection: 'people',
      id: idOf(merged.person) as number,
      depth: 0,
      overrideAccess: true,
      req,
      select: { fullName: true },
    })
    .catch(() => null)
  const labels = (data.scopes as ConsentScope[]).map((scope) => CONSENT_SCOPE_LABELS[scope])
  data.displayTitle = `${person?.fullName ?? 'Titular'} - ${labels.join(', ')}${merged.revokedAt ? ' (revogada)' : ''}`
  return data
}

export const syncAfterConsentChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
}) => {
  if (req.context?.skipConsentSync) return doc
  await syncPersonConsent(req, idOf(doc.person)!)
  const previousPerson = idOf(previousDoc?.person)
  if (previousPerson != null && String(previousPerson) !== String(idOf(doc.person))) {
    await syncPersonConsent(req, previousPerson)
  }
  await syncMediaConsent(req, doc.id)
  return doc
}

export const syncAfterConsentDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const personId = idOf(doc.person)
  if (personId != null) await syncPersonConsent(req, personId)
  // A exclusão desfaz a referência nas mídias (FK "set null"): revisa as órfãs.
  await syncMediaConsent(req, null)
  return doc
}

export const consentRecordsHooks: CollectionConfig['hooks'] = {
  beforeChange: [validateConsentRecord],
  afterChange: [syncAfterConsentChange],
  afterDelete: [syncAfterConsentDelete],
}
