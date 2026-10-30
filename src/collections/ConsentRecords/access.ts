import type { CollectionConfig } from 'payload'

import { isAdminOrEditor } from '../../access'

/**
 * Consentimentos (matriz 14.3): somente admin/editor; NUNCA públicos (nem por API, nem
 * populados em outras coleções); nunca copiados para fora da produção (ADR-0005).
 */
export const consentRecordsAccess: CollectionConfig['access'] = {
  read: isAdminOrEditor,
  create: isAdminOrEditor,
  update: isAdminOrEditor,
  delete: isAdminOrEditor,
}
