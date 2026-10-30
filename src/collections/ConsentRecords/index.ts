import type { CollectionConfig } from 'payload'

import { consentRecordsAccess } from './access'
import { consentRecordFields } from './fields'
import { consentRecordsHooks } from './hooks'

/**
 * Autorizações individuais por escopo (planejamento 10.5, 13.3 e 17.2): perfil público,
 * fotografia e e-mail público (S04). Registro com data, meio, comprovante privado e
 * revogação. A visibilidade pública das pessoas e imagens é calculada a partir daqui.
 * A autorização do grupo (Q4/Q12) não substitui estes registros.
 */
export const ConsentRecords: CollectionConfig = {
  slug: 'consent-records',
  labels: { singular: 'Consentimento', plural: 'Consentimentos' },
  admin: {
    group: 'Integrantes',
    useAsTitle: 'displayTitle',
    defaultColumns: ['displayTitle', 'grantedAt', 'method', 'revokedAt'],
    description:
      'Autorizações individuais dos titulares. Dados administrativos: nunca exibidos no site.',
  },
  defaultSort: '-grantedAt',
  access: consentRecordsAccess,
  hooks: consentRecordsHooks,
  fields: consentRecordFields,
}
