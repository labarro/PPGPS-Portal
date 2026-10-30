import type { CollectionConfig } from 'payload'

import { adminEditorOrPublic, isAdminOrEditor } from '../../access'
import { publicWhere } from '../../lib/content/visibility'

/**
 * Matriz 14.3: admin/editor gerenciam pessoas; visitante lê somente perfis autorizados
 * (`publicWhere('people')` = mesma regra de `canViewPublic`). Não há contas de integrantes
 * nem edição do próprio perfil (Q5, ADR-0010).
 */
export const peopleAccess: CollectionConfig['access'] = {
  read: adminEditorOrPublic(publicWhere('people')),
  create: isAdminOrEditor,
  update: isAdminOrEditor,
  delete: isAdminOrEditor,
}
