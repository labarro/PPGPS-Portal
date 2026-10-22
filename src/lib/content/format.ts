/**
 * Formatação de dados do grupo para exibição (pt-BR). Datas são armazenadas em UTC e
 * exibidas sem conversão de fuso, para que "14/04/2021" não vire "13/04/2021".
 */
export function formatDate(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(date)
}

export function isoDate(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10)
}

const CERTIFICATION_LABELS: Record<string, string> = {
  certified: 'Certificado',
  not_updated: 'Não atualizado',
  in_preparation: 'Em preenchimento',
}

export const certificationLabel = (value: string | null | undefined): string | null =>
  value ? (CERTIFICATION_LABELS[value] ?? null) : null

const REFERENCE_KIND_LABELS: Record<string, string> = {
  institution: 'Instituição',
  program: 'Programa de pós-graduação',
  unit: 'Unidade',
  partner: 'Instituição parceira',
  funder: 'Agência ou diretório',
}

export const referenceKindLabel = (value: string | null | undefined): string =>
  (value && REFERENCE_KIND_LABELS[value]) || 'Referência'

/** Host legível de uma URL (ex.: "dgp.cnpq.br"), usado como texto auxiliar de links externos. */
export function urlHost(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    return new URL(value).host.replace(/^www\./, '')
  } catch {
    return null
  }
}
