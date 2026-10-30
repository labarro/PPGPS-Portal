/**
 * CLI do seed de integrantes FICTÍCIOS (S04). Bloqueado em homologação e produção.
 * Uso: `pnpm seed:people` (depois de `pnpm seed:content`).
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import { seedPeople } from './people-core'

const payload = await getPayload({ config })
const { created, kept } = await seedPeople(payload)
payload.logger.info(
  `[seed:people] ${created.length} pessoa(s) fictícia(s) criada(s); ${kept.length} mantida(s).`,
)
await payload.destroy()
