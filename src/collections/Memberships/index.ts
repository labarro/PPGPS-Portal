import type { CollectionConfig } from 'payload'

import { membershipsAccess } from './access'
import { membershipFields } from './fields'
import { membershipsHooks } from './hooks'

/**
 * Vínculos com o grupo (planejamento 8.2 e 13.3): papel, nível de formação (estudantes),
 * linhas temáticas e período. O papel em destaque e a condição de ex-integrante são
 * calculados (`src/lib/people/memberships.ts`); não existe campo fixo "tipo de pessoa".
 */
export const Memberships: CollectionConfig = {
  slug: 'memberships',
  labels: { singular: 'Vínculo', plural: 'Vínculos' },
  admin: {
    group: 'Integrantes',
    useAsTitle: 'displayTitle',
    defaultColumns: ['displayTitle', 'role', 'startDate', 'endDate', 'status'],
    description:
      'Histórico de participação no grupo. Um vínculo encerrado sem outro ativo torna a pessoa ex-integrante.',
  },
  defaultSort: '-startDate',
  access: membershipsAccess,
  hooks: membershipsHooks,
  fields: membershipFields,
}
