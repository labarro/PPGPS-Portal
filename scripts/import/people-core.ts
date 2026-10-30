import type { Payload, PayloadRequest } from 'payload'

import { type ImportRow, parseCsv, personKey, validateRows } from '../../src/lib/people/import-csv'

/**
 * Importação idempotente de integrantes (ficha S04, tarefa 7).
 *
 * - Identidade da pessoa por ORCID, depois Lattes; sem identificadores, pelo slug do nome
 *   (sinalizado no relatório para conferência).
 * - Vínculo idempotente por (pessoa, papel, nível, data de início).
 * - Pré-visualização (padrão) não grava nada; `apply` grava pessoa e vínculos de cada
 *   pessoa numa transação: erro numa linha não deixa registro parcial nem duplicado.
 * - Nunca cria consentimentos, e-mails ou fotos: pessoas importadas ficam SEM perfil público
 *   até o registro das autorizações individuais (Q4).
 * - Pessoas existentes não são sobrescritas: só identificadores vazios são completados.
 */
export type ImportAction =
  | 'criar pessoa'
  | 'pessoa existente (ORCID)'
  | 'pessoa existente (Lattes)'
  | 'pessoa existente (nome/slug - conferir)'
  | 'criar vínculo'
  | 'vínculo existente'
  | 'erro'

export type ImportReportLine = {
  line: number
  person: string
  actions: ImportAction[]
  errors: string[]
}

export type ImportReport = {
  applied: boolean
  headerErrors: string[]
  lines: ImportReportLine[]
  summary: {
    rows: number
    peopleCreated: number
    peopleMatched: number
    membershipsCreated: number
    membershipsExisting: number
    errors: number
  }
}

type PersonDoc = { id: number; slug: string; orcid?: string | null; lattesUrl?: string | null }

const day = (value: string | null | undefined) => (value ?? '').slice(0, 10)

async function findPerson(
  payload: Payload,
  row: ImportRow,
  req?: Partial<PayloadRequest>,
): Promise<{ doc: PersonDoc; by: ImportAction } | null> {
  const attempts: [Record<string, unknown> | null, ImportAction][] = [
    [row.orcid ? { orcid: { equals: row.orcid } } : null, 'pessoa existente (ORCID)'],
    [row.lattesUrl ? { lattesUrl: { equals: row.lattesUrl } } : null, 'pessoa existente (Lattes)'],
    [{ slug: { equals: row.slug } }, 'pessoa existente (nome/slug - conferir)'],
  ]
  for (const [where, by] of attempts) {
    if (!where) continue
    const result = await payload.find({
      collection: 'people',
      where: where as never,
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    })
    if (result.docs[0]) return { doc: result.docs[0] as PersonDoc, by }
  }
  return null
}

async function membershipExists(
  payload: Payload,
  personId: number,
  row: ImportRow,
  req?: Partial<PayloadRequest>,
) {
  const result = await payload.find({
    collection: 'memberships',
    where: { and: [{ person: { equals: personId } }, { role: { equals: row.role } }] },
    limit: 200,
    depth: 0,
    overrideAccess: true,
    req,
    select: { trainingLevel: true, startDate: true },
  })
  return result.docs.some(
    (doc) =>
      (doc.trainingLevel ?? null) === row.trainingLevel && day(doc.startDate) === row.startDate,
  )
}

export async function importPeople(
  payload: Payload,
  csv: string,
  options: { apply: boolean; today?: string },
): Promise<ImportReport> {
  const lines = await payload.find({
    collection: 'research-lines',
    limit: 50,
    depth: 0,
    overrideAccess: true,
    pagination: false,
  })
  const lineId = new Map(lines.docs.map((line) => [line.slug, line.id]))
  const { results, headerErrors } = validateRows(parseCsv(csv), {
    lineSlugs: [...lineId.keys()],
    today: options.today,
  })
  const report: ImportReport = {
    applied: options.apply,
    headerErrors,
    lines: [],
    summary: {
      rows: results.length,
      peopleCreated: 0,
      peopleMatched: 0,
      membershipsCreated: 0,
      membershipsExisting: 0,
      errors: headerErrors.length,
    },
  }
  if (headerErrors.length > 0) return report

  for (const result of results) {
    if (!result.row) {
      report.lines.push({ line: result.line, person: '', actions: ['erro'], errors: result.errors })
      report.summary.errors += 1
    }
  }

  // Agrupa as linhas válidas por pessoa (mesma transação por pessoa).
  const groups = new Map<string, ImportRow[]>()
  for (const result of results) {
    if (!result.row) continue
    const id = personKey(result.row)
    groups.set(id, [...(groups.get(id) ?? []), result.row])
  }

  for (const rows of groups.values()) {
    const first = rows[0]!
    const transactionID = options.apply ? await payload.db.beginTransaction() : null
    const req = transactionID ? ({ transactionID } as Partial<PayloadRequest>) : undefined
    const pending: ImportReportLine[] = []
    let createdPerson = false
    let matched = false
    let createdMemberships = 0
    let existingMemberships = 0
    try {
      const found = await findPerson(payload, first, req)
      let personId: number | null = found?.doc.id ?? null
      if (found) {
        matched = true
        if (options.apply) {
          const fill: Record<string, unknown> = {}
          if (!found.doc.orcid && first.orcid) fill.orcid = first.orcid
          if (!found.doc.lattesUrl && first.lattesUrl) fill.lattesUrl = first.lattesUrl
          if (Object.keys(fill).length > 0) {
            await payload.update({
              collection: 'people',
              id: found.doc.id,
              data: fill,
              overrideAccess: true,
              req,
              context: { skipRevalidation: true },
            })
          }
        }
      } else if (options.apply) {
        const created = await payload.create({
          collection: 'people',
          data: {
            fullName: first.fullName,
            citationName: first.citationName,
            slug: first.slug,
            orcid: first.orcid,
            lattesUrl: first.lattesUrl,
            visibility: 'public',
          },
          overrideAccess: true,
          req,
          context: { skipRevalidation: true },
        })
        personId = created.id
        createdPerson = true
      }

      for (const [index, row] of rows.entries()) {
        const actions: ImportAction[] = []
        if (index === 0) actions.push(found ? found.by : 'criar pessoa')
        const exists = personId != null && (await membershipExists(payload, personId, row, req))
        if (exists) {
          actions.push('vínculo existente')
          existingMemberships += 1
        } else {
          actions.push('criar vínculo')
          if (options.apply && personId != null) {
            await payload.create({
              collection: 'memberships',
              data: {
                person: personId,
                role: row.role,
                trainingLevel: row.trainingLevel,
                lines: row.lines.map((slug) => lineId.get(slug)!).filter(Boolean),
                startDate: row.startDate,
                endDate: row.endDate,
                endReason: row.endReason,
                source: row.source,
                sourceUrl: row.sourceUrl,
                collectedAt: row.collectedAt,
              },
              overrideAccess: true,
              req,
              context: { skipRevalidation: true },
            })
          }
          createdMemberships += 1
        }
        pending.push({ line: row.line, person: row.fullName, actions, errors: [] })
      }
      if (transactionID) await payload.db.commitTransaction(transactionID)
      report.lines.push(...pending)
      if (createdPerson || (!found && !options.apply)) report.summary.peopleCreated += 1
      if (matched) report.summary.peopleMatched += 1
      report.summary.membershipsCreated += createdMemberships
      report.summary.membershipsExisting += existingMemberships
    } catch (error) {
      if (transactionID) await payload.db.rollbackTransaction(transactionID)
      const message = error instanceof Error ? error.message : String(error)
      const details = (error as { data?: { errors?: { message?: string }[] } }).data?.errors
      const errors = details?.length ? details.map((item) => item.message ?? message) : [message]
      for (const row of rows) {
        report.lines.push({ line: row.line, person: row.fullName, actions: ['erro'], errors })
        report.summary.errors += 1
      }
    }
  }

  report.lines.sort((a, b) => a.line - b.line)
  return report
}

export function formatReport(report: ImportReport): string {
  const out: string[] = []
  out.push(report.applied ? 'IMPORTAÇÃO GRAVADA' : 'PRÉ-VISUALIZAÇÃO (nada foi gravado)')
  for (const error of report.headerErrors) out.push(`ERRO no cabeçalho: ${error}`)
  for (const line of report.lines) {
    const status =
      line.errors.length > 0 ? `ERRO: ${line.errors.join('; ')}` : line.actions.join(' + ')
    out.push(`linha ${line.line}: ${line.person || '-'} -> ${status}`)
  }
  const s = report.summary
  out.push(
    `Resumo: ${s.rows} linha(s); pessoas novas ${s.peopleCreated}, existentes ${s.peopleMatched}; ` +
      `vínculos novos ${s.membershipsCreated}, existentes ${s.membershipsExisting}; erros ${s.errors}.`,
  )
  out.push(
    'Nenhum consentimento foi criado: perfis só ficam públicos após as autorizações individuais.',
  )
  return out.join('\n')
}
