import type { CollectionConfig } from 'payload'

import { isAdminOrEditor } from '../../access'
import { essayPublicWhere } from '../../lib/content/visibility'

/**
 * Matriz 14.3 (Editorial): somente `editor`/`admin` criam, editam e excluem ensaios; o
 * visitante lê apenas a versão principal publicada e já alcançada pela data (avaliado a cada
 * consulta, para que agendados apareçam exatamente na data). Versões nunca são públicas.
 */
export const essaysAccess: CollectionConfig['access'] = {
  read: (args) => (isAdminOrEditor(args) ? true : essayPublicWhere(new Date())),
  readVersions: isAdminOrEditor,
  create: isAdminOrEditor,
  update: isAdminOrEditor,
  delete: isAdminOrEditor,
}
