/**
 * Consentimentos individuais (planejamento 8.2, 10.5, 13.3 e 17.2; ficha S04).
 *
 * Escopos da S04: perfil público, foto e e-mail (os demais entram na S07). A autorização do
 * grupo informada pelo coordenador (Q4) NÃO substitui estes registros individuais.
 *
 * Regras de datas: concessão e revogação nunca no futuro; revogação após a concessão e
 * irreversível (nova autorização = novo registro). Assim a vigência não depende do relógio:
 * um registro é vigente enquanto não tiver `revokedAt`.
 */
export const CONSENT_SCOPES = ['public_profile', 'photo', 'email'] as const
export type ConsentScope = (typeof CONSENT_SCOPES)[number]

export const CONSENT_SCOPE_LABELS: Record<ConsentScope, string> = {
  public_profile: 'Perfil público',
  photo: 'Fotografia',
  email: 'E-mail público',
}

export const CONSENT_METHODS = ['signed_form', 'digital_form', 'email', 'other'] as const

export const CONSENT_METHOD_LABELS: Record<(typeof CONSENT_METHODS)[number], string> = {
  signed_form: 'Termo assinado',
  digital_form: 'Formulário digital',
  email: 'Mensagem de e-mail do titular',
  other: 'Outro meio (descrever nas observações)',
}

export const CONSENT_STATUSES = ['authorized', 'partial', 'revoked', 'none'] as const
export type ConsentStatus = (typeof CONSENT_STATUSES)[number]

export const CONSENT_STATUS_LABELS: Record<ConsentStatus, string> = {
  authorized: 'Perfil público autorizado',
  partial: 'Autorizações sem perfil público',
  revoked: 'Autorização revogada',
  none: 'Sem autorização registrada',
}

export type ConsentRecordLike = {
  scopes?: readonly (ConsentScope | string)[] | null
  grantedAt?: string | null
  revokedAt?: string | null
}

export const isConsentActive = (record: ConsentRecordLike): boolean =>
  !record.revokedAt && !!record.grantedAt

/** Escopos vigentes (união dos registros sem revogação). */
export function activeScopes(records: readonly ConsentRecordLike[]): Set<ConsentScope> {
  const scopes = new Set<ConsentScope>()
  for (const record of records) {
    if (!isConsentActive(record)) continue
    for (const scope of record.scopes ?? []) {
      if ((CONSENT_SCOPES as readonly string[]).includes(scope)) scopes.add(scope as ConsentScope)
    }
  }
  return scopes
}

export type PersonConsentFlags = {
  consentPublicProfile: boolean
  consentPhoto: boolean
  consentEmail: boolean
  consentStatus: ConsentStatus
}

/**
 * Situação de consentimento calculada de uma pessoa (campos somente leitura em `people`).
 * Foto e e-mail dependem também do perfil público: sem perfil público nada é exibido.
 */
export function personConsentFlags(records: readonly ConsentRecordLike[]): PersonConsentFlags {
  const scopes = activeScopes(records)
  const publicProfile = scopes.has('public_profile')
  let status: ConsentStatus = 'none'
  if (publicProfile) status = 'authorized'
  else if (scopes.size > 0) status = 'partial'
  else if (records.some((record) => record.revokedAt)) status = 'revoked'
  return {
    consentPublicProfile: publicProfile,
    consentPhoto: publicProfile && scopes.has('photo'),
    consentEmail: publicProfile && scopes.has('email'),
    consentStatus: status,
  }
}

/** Autorização de imagem vigente (para `media.consentRecord`). */
export const grantsPhoto = (record: ConsentRecordLike | null | undefined): boolean =>
  !!record && isConsentActive(record) && (record.scopes ?? []).includes('photo')

const day = (value: string): string => value.slice(0, 10)

export function validateConsentDates(
  input: { grantedAt?: string | null; revokedAt?: string | null },
  today: string = new Date().toISOString().slice(0, 10),
): { path: string; message: string }[] {
  const errors: { path: string; message: string }[] = []
  if (input.grantedAt && day(input.grantedAt) > today) {
    errors.push({ path: 'grantedAt', message: 'A data da autorização não pode estar no futuro.' })
  }
  if (input.revokedAt) {
    if (day(input.revokedAt) > today) {
      errors.push({ path: 'revokedAt', message: 'A data da revogação não pode estar no futuro.' })
    }
    if (input.grantedAt && day(input.revokedAt) < day(input.grantedAt)) {
      errors.push({
        path: 'revokedAt',
        message: 'A revogação deve ser igual ou posterior à autorização.',
      })
    }
  }
  return errors
}
