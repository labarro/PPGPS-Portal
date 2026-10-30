import { slugify } from '../content/slug'
import { isValidLattesUrl, isValidOrcid, normalizeLattesUrl, normalizeOrcid } from './identifiers'
import {
  END_REASONS,
  type EndReason,
  type MembershipRole,
  MEMBERSHIP_ROLES,
  roleFromSlug,
  type TrainingLevel,
  validateMembership,
} from './memberships'

/**
 * Importação de integrantes por planilha CSV (ficha S04, tarefa 7) — parte pura: leitura do
 * CSV, normalização e validação de cada linha. A gravação idempotente fica em
 * `scripts/import/people-core.ts`.
 *
 * Uma linha = um vínculo. A mesma pessoa pode aparecer em várias linhas (ex.: mestrado
 * encerrado + pesquisadora ativa). A importação NUNCA cria consentimentos nem e-mails: as
 * pessoas entram sem perfil público até o registro das autorizações individuais.
 */
export const CSV_COLUMNS = [
  'nome_completo',
  'nome_citacao',
  'slug',
  'orcid',
  'lattes',
  'papel',
  'nivel_formacao',
  'linhas',
  'inicio',
  'termino',
  'motivo_termino',
  'fonte',
  'url_fonte',
  'data_coleta',
] as const

export const REQUIRED_COLUMNS = ['nome_completo', 'papel', 'inicio'] as const

export const CSV_MAX_ROWS = 2000
export const CSV_MAX_BYTES = 1_000_000

/** Parser CSV (RFC 4180): aspas, aspas duplicadas, quebras de linha em campos, `,` ou `;`. */
export function parseCsv(text: string): string[][] {
  const source = text.replace(/^\uFEFF/, '')
  const firstLine = source.split(/\r?\n/, 1)[0] ?? ''
  const delimiter =
    (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ','
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i]
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          quoted = false
        }
      } else {
        field += char
      }
      continue
    }
    if (char === '"' && field === '') {
      quoted = true
    } else if (char === delimiter) {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i += 1
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ''))
}

const TRAINING_ALIASES: Record<string, TrainingLevel> = {
  posdoc: 'postdoc',
  'pos-doutorado': 'postdoc',
  postdoc: 'postdoc',
  doutorado: 'doctorate',
  doctorate: 'doctorate',
  mestrado: 'masters',
  masters: 'masters',
  especializacao: 'specialization',
  mba: 'specialization',
  specialization: 'specialization',
  graduacao: 'undergraduate',
  'iniciacao-cientifica': 'undergraduate',
  ic: 'undergraduate',
  undergraduate: 'undergraduate',
  outro: 'other',
  other: 'other',
}

const END_REASON_ALIASES: Record<string, EndReason> = {
  saida: 'left',
  left: 'left',
  'conclusao-da-formacao': 'training_completed',
  conclusao: 'training_completed',
  training_completed: 'training_completed',
  'mudanca-de-papel': 'role_changed',
  role_changed: 'role_changed',
  outro: 'other',
  other: 'other',
}

const SOURCE_ALIASES: Record<string, 'dgp_transcription' | 'manual' | 'spreadsheet'> = {
  dgp: 'dgp_transcription',
  dgp_transcription: 'dgp_transcription',
  manual: 'manual',
  planilha: 'spreadsheet',
  spreadsheet: 'spreadsheet',
}

const key = (value: string) => slugify(value)

/** Data `AAAA-MM-DD` ou `DD/MM/AAAA` → `AAAA-MM-DD` (ou `null` se inválida). */
export function parseDate(value: string): string | null {
  const raw = value.trim()
  let year: number, month: number, day: number
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw)
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw)
  if (iso) [year, month, day] = [Number(iso[1]), Number(iso[2]), Number(iso[3])]
  else if (br) [day, month, year] = [Number(br[1]), Number(br[2]), Number(br[3])]
  else return null
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1) return null
  if (date.getUTCDate() !== day) return null
  return date.toISOString().slice(0, 10)
}

export type ImportRow = {
  line: number
  fullName: string
  citationName: string | null
  slug: string
  orcid: string | null
  lattesUrl: string | null
  role: MembershipRole
  trainingLevel: TrainingLevel | null
  lines: string[]
  startDate: string
  endDate: string | null
  endReason: EndReason | null
  source: 'dgp_transcription' | 'manual' | 'spreadsheet'
  sourceUrl: string | null
  collectedAt: string | null
}

export type RowResult = { line: number; row: ImportRow | null; errors: string[] }

/** Chave de identidade da pessoa: ORCID, depois Lattes, depois slug do nome. */
export const personKey = (row: Pick<ImportRow, 'orcid' | 'lattesUrl' | 'slug'>): string =>
  row.orcid ? `orcid:${row.orcid}` : row.lattesUrl ? `lattes:${row.lattesUrl}` : `slug:${row.slug}`

export function validateRows(
  table: string[][],
  options: { lineSlugs: readonly string[]; today?: string },
): { header: string[]; results: RowResult[]; headerErrors: string[] } {
  const [rawHeader = [], ...body] = table
  const header = rawHeader.map((cell) => cell.trim().toLowerCase())
  const headerErrors: string[] = []
  for (const column of REQUIRED_COLUMNS) {
    if (!header.includes(column)) headerErrors.push(`Coluna obrigatória ausente: ${column}`)
  }
  const unknown = header.filter((column) => !(CSV_COLUMNS as readonly string[]).includes(column))
  if (unknown.length > 0) headerErrors.push(`Colunas desconhecidas: ${unknown.join(', ')}`)
  if (body.length > CSV_MAX_ROWS) headerErrors.push(`Limite de ${CSV_MAX_ROWS} linhas excedido.`)
  if (headerErrors.length > 0) return { header, results: [], headerErrors }

  const results = body.map((cells, index): RowResult => {
    const line = index + 2
    const get = (column: (typeof CSV_COLUMNS)[number]) =>
      (cells[header.indexOf(column)] ?? '').trim()
    const errors: string[] = []

    const fullName = get('nome_completo').replace(/\s+/g, ' ')
    if (!fullName) errors.push('nome_completo vazio')
    if (fullName.length > 200) errors.push('nome_completo com mais de 200 caracteres')

    const rawOrcid = get('orcid')
    const orcid = rawOrcid ? normalizeOrcid(rawOrcid) : null
    if (rawOrcid && (!orcid || !isValidOrcid(rawOrcid))) errors.push(`ORCID inválido: ${rawOrcid}`)

    const rawLattes = get('lattes')
    const lattesUrl = rawLattes ? normalizeLattesUrl(rawLattes) : null
    if (rawLattes && !isValidLattesUrl(rawLattes)) errors.push(`Lattes inválido: ${rawLattes}`)

    const rawRole = key(get('papel'))
    const role =
      roleFromSlug(rawRole) ??
      ((MEMBERSHIP_ROLES as readonly string[]).includes(get('papel'))
        ? (get('papel') as MembershipRole)
        : null)
    if (!role) errors.push(`papel desconhecido: ${get('papel') || '(vazio)'}`)

    const rawLevel = key(get('nivel_formacao'))
    const trainingLevel = rawLevel ? (TRAINING_ALIASES[rawLevel] ?? null) : null
    if (rawLevel && !trainingLevel)
      errors.push(`nivel_formacao desconhecido: ${get('nivel_formacao')}`)

    const lines = get('linhas')
      .split('|')
      .map((value) => key(value))
      .filter(Boolean)
    const unknownLines = lines.filter((slug) => !options.lineSlugs.includes(slug))
    if (unknownLines.length > 0)
      errors.push(`linha temática desconhecida: ${unknownLines.join(', ')}`)

    const startDate = parseDate(get('inicio'))
    if (!startDate) errors.push(`data de início inválida: ${get('inicio') || '(vazia)'}`)
    const endDate = get('termino') ? parseDate(get('termino')) : null
    if (get('termino') && !endDate) errors.push(`data de término inválida: ${get('termino')}`)

    const rawReason = key(get('motivo_termino'))
    const endReason = rawReason ? (END_REASON_ALIASES[rawReason] ?? null) : null
    if (rawReason && !endReason) {
      errors.push(`motivo_termino desconhecido (use: ${END_REASONS.join(', ')})`)
    }

    const rawSource = key(get('fonte')) || 'planilha'
    const source = SOURCE_ALIASES[rawSource] ?? null
    if (!source) errors.push(`fonte desconhecida: ${get('fonte')}`)

    const sourceUrl = get('url_fonte') || null
    if (sourceUrl && !/^https?:\/\/\S+$/i.test(sourceUrl)) errors.push('url_fonte inválida')
    const collectedAt = get('data_coleta') ? parseDate(get('data_coleta')) : null
    if (get('data_coleta') && !collectedAt) errors.push('data_coleta inválida')

    const slug = key(get('slug') || fullName)
    if (!slug) errors.push('slug vazio')

    if (role && startDate) {
      for (const error of validateMembership(
        { role, trainingLevel, startDate, endDate, endReason },
        options.today,
      )) {
        errors.push(error.message)
      }
    }

    if (errors.length > 0 || !role || !startDate || !source) return { line, row: null, errors }
    return {
      line,
      errors,
      row: {
        line,
        fullName,
        citationName: get('nome_citacao') || null,
        slug,
        orcid,
        lattesUrl,
        role,
        trainingLevel: role === 'student' ? trainingLevel : null,
        lines,
        startDate,
        endDate,
        endReason: endDate ? endReason : null,
        source,
        sourceUrl,
        collectedAt,
      },
    }
  })

  // Mesma pessoa (ORCID/Lattes) com nomes diferentes no arquivo: provável erro de digitação.
  const names = new Map<string, string>()
  for (const result of results) {
    if (!result.row) continue
    const id = personKey(result.row)
    const previous = names.get(id)
    if (previous && previous !== result.row.fullName) {
      result.errors.push(`identificador repetido com outro nome ("${previous}")`)
      result.row = null
    } else {
      names.set(id, result.row.fullName)
    }
  }
  return { header, results, headerErrors }
}
