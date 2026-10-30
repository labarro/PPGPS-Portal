import type { TaskConfig } from 'payload'

import { publishDueEssays } from './transition'

/**
 * Tarefa da fila do Payload (AGENTS.md §4.10): conclui publicações agendadas vencidas.
 * Agendada a cada minuto na fila `editorial`; executada pelo `autoRun` em servidores
 * contínuos (local, Docker, `next start`) e, em hospedagem sem processo contínuo, pelo
 * endpoint `/api/essays/publish-due` (cron externo, S06) ou pelo painel ao abrir um ensaio.
 */
export const EDITORIAL_QUEUE = 'editorial'

export const publishScheduledEssaysTask: TaskConfig<'publishScheduledEssays'> = {
  slug: 'publishScheduledEssays',
  label: 'Publicar ensaios agendados',
  retries: 2,
  schedule: [{ cron: '* * * * *', queue: EDITORIAL_QUEUE }],
  handler: async ({ req }) => {
    const { published, failed } = await publishDueEssays(req.payload)
    return { output: { published: published.length, failed: failed.length } }
  },
  outputSchema: [
    { name: 'published', type: 'number' },
    { name: 'failed', type: 'number' },
  ],
}
