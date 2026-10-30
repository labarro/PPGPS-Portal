/**
 * Importador de integrantes por CSV (ficha S04): `pnpm import:people <arquivo.csv> [--apply]`.
 *
 * - Sem `--apply`: pré-visualização (nada é gravado) com o relatório linha a linha.
 * - Com `--apply`: grava pessoas e vínculos (idempotente por ORCID/Lattes; reexecutar não
 *   duplica). Nunca cria consentimentos.
 *
 * Use SOMENTE a planilha validada pelo coordenador e guarde-a fora do repositório (dados
 * pessoais). Modelo de colunas: `docs/privacidade/registro-tratamento.md` §6.
 * Agentes nunca executam este script em produção (AGENTS.md §7).
 */
import { readFile, stat } from 'node:fs/promises'

import config from '@payload-config'
import { getPayload } from 'payload'

import { CSV_MAX_BYTES } from '../../src/lib/people/import-csv'
import { formatReport, importPeople } from './people-core'

const args = process.argv.slice(2).filter((arg) => arg !== '--')
const apply = args.includes('--apply')
const file = args.find((arg) => !arg.startsWith('--'))

if (!file) {
  throw new Error('Uso: pnpm import:people <arquivo.csv> [--apply]')
}
if ((await stat(file)).size > CSV_MAX_BYTES) {
  throw new Error(`Arquivo maior que ${CSV_MAX_BYTES} bytes.`)
}

const payload = await getPayload({ config })
const report = await importPeople(payload, await readFile(file, 'utf8'), { apply })
payload.logger.info(`\n${formatReport(report)}`)
await payload.destroy()
if (report.summary.errors > 0) process.exitCode = 1
