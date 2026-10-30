import type { CollectionConfig } from 'payload'

import { adminEditorOrPublic, isAdminOrEditor } from '../../access'
import { publicWhere } from '../../lib/content/visibility'

/** Vínculos seguem a pessoa: o visitante só lê vínculos de perfis autorizados. */
export const membershipsAccess: CollectionConfig['access'] = {
  read: adminEditorOrPublic(publicWhere('memberships')),
  create: isAdminOrEditor,
  update: isAdminOrEditor,
  delete: isAdminOrEditor,
}
