import type { CollectionConfig } from 'payload'

import { adminEditorOrPublic, isAdminOrEditor } from '../../access'
import { publicWhere } from '../../lib/content/visibility'

/** Matriz 14.3: admin/editor gerenciam; visitante lê somente páginas publicadas. */
export const pagesAccess: CollectionConfig['access'] = {
  read: adminEditorOrPublic(publicWhere('pages')),
  readVersions: isAdminOrEditor,
  create: isAdminOrEditor,
  update: isAdminOrEditor,
  delete: isAdminOrEditor,
}
