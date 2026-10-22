import type { CollectionConfig } from 'payload'

import { adminEditorOrPublic, isAdminOrEditor } from '../../access'
import { publicWhere } from '../../lib/content/visibility'

/** Matriz 14.3: admin/editor gerenciam; visitante lê somente linhas publicadas e ativas. */
export const researchLinesAccess: CollectionConfig['access'] = {
  read: adminEditorOrPublic(publicWhere('research-lines')),
  readVersions: isAdminOrEditor,
  create: isAdminOrEditor,
  update: isAdminOrEditor,
  delete: isAdminOrEditor,
}
