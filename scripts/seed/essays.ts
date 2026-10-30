/**
 * CLI do seed de ensaios FICTÍCIOS (S05). Bloqueado em homologação e produção.
 * Uso: `pnpm seed:essays` (depois de `pnpm seed:content` e `pnpm seed:people`).
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import { seedEssays } from './essays-core'

const payload = await getPayload({ config })
const { created, kept } = await seedEssays(payload)
payload.logger.info(
  `[seed:essays] ${created.length} ensaio(s) fictício(s) criado(s); ${kept.length} mantido(s).`,
)
await payload.destroy()
