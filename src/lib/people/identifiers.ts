import { z } from 'zod'

/**
 * Identificadores acadêmicos (planejamento 13.1 e 13.3; ficha S04, tarefa 1).
 * Armazenados normalizados e validados; únicos na coleção `people`.
 */

const ORCID_BODY = /^(\d{4})-?(\d{4})-?(\d{4})-?(\d{3}[\dX])$/

/** Dígito verificador ISO 7064 mod 11-2 dos 15 primeiros dígitos do ORCID. */
export function orcidCheckDigit(base15: string): string {
  let total = 0
  for (const char of base15) total = (total + Number(char)) * 2
  const remainder = total % 11
  const result = (12 - remainder) % 11
  return result === 10 ? 'X' : String(result)
}

/**
 * Normaliza um ORCID para `0000-0000-0000-000X`. Aceita o identificador puro ou a URL
 * `https://orcid.org/...`. Retorna `null` se o formato for inválido (sem checar o dígito).
 */
export function normalizeOrcid(value: string): string | null {
  const raw = value
    .trim()
    .replace(/^https?:\/\/(www\.)?orcid\.org\//i, '')
    .replace(/\/+$/, '')
    .toUpperCase()
  const match = ORCID_BODY.exec(raw)
  if (!match) return null
  return `${match[1]}-${match[2]}-${match[3]}-${match[4]}`
}

export function isValidOrcid(value: string): boolean {
  const normalized = normalizeOrcid(value)
  if (!normalized) return false
  const digits = normalized.replace(/-/g, '')
  return orcidCheckDigit(digits.slice(0, 15)) === digits[15]
}

export const orcidUrl = (orcid: string): string => `https://orcid.org/${orcid}`

const LATTES_ID = /^https?:\/\/lattes\.cnpq\.br\/(\d{16})\/?$/i
const LATTES_BUSCATEXTUAL =
  /^https?:\/\/buscatextual\.cnpq\.br\/buscatextual\/visualizacv\.do\?(?:[^#\s]*&)?id=([A-Z0-9]{10})(?:&[^#\s]*)?$/i

/**
 * Normaliza a URL do Currículo Lattes: `http://lattes.cnpq.br/<16 dígitos>` (forma pública
 * oficial, ainda em http) ou `http://buscatextual.cnpq.br/buscatextual/visualizacv.do?id=<id>`.
 */
export function normalizeLattesUrl(value: string): string | null {
  const raw = value.trim()
  const id = LATTES_ID.exec(raw)
  if (id) return `http://lattes.cnpq.br/${id[1]}`
  const search = LATTES_BUSCATEXTUAL.exec(raw)
  if (search) {
    return `http://buscatextual.cnpq.br/buscatextual/visualizacv.do?id=${search[1]!.toUpperCase()}`
  }
  return null
}

export const isValidLattesUrl = (value: string): boolean => normalizeLattesUrl(value) !== null

export const orcidSchema = z
  .string()
  .trim()
  .refine((value) => normalizeOrcid(value) !== null, {
    message: 'ORCID em formato inválido. Use 0000-0000-0000-0000 ou https://orcid.org/…',
  })
  .refine(isValidOrcid, { message: 'ORCID com dígito verificador inválido.' })
  .transform((value) => normalizeOrcid(value)!)

export const lattesSchema = z
  .string()
  .trim()
  .refine(isValidLattesUrl, {
    message:
      'Currículo Lattes inválido. Use http://lattes.cnpq.br/<16 dígitos> ou o endereço "buscatextual" do CNPq.',
  })
  .transform((value) => normalizeLattesUrl(value)!)

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ message: 'E-mail inválido.' }))

/** Mensagem do primeiro erro de um esquema Zod (para validação de campo do Payload). */
export function zodFieldValidate(schema: z.ZodType, value: unknown): true | string {
  if (value == null || value === '') return true
  const result = schema.safeParse(value)
  return result.success ? true : (result.error.issues[0]?.message ?? 'Valor inválido.')
}
