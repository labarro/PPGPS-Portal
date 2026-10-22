import type { CollectionConfig } from 'payload'

import { adminOrSelf, isAdmin, isAdminOrEditor } from '../../access'

/**
 * Matriz 14.3 — "Usuários e papéis": admin T · editor L (própria conta) · visitante —.
 * - Somente `admin` cria e exclui contas (sem cadastro público nem convites em massa).
 * - O editor lê e atualiza apenas a própria conta (ex.: troca de senha); `roles` e `active`
 *   só podem ser alterados pelo admin (acesso por campo em `fields.ts`).
 * - O primeiro usuário do banco vazio é criado pelo fluxo de bootstrap do Payload e vira `admin`.
 */
export const usersAccess: CollectionConfig['access'] = {
  admin: isAdminOrEditor,
  create: isAdmin,
  read: adminOrSelf,
  update: adminOrSelf,
  delete: isAdmin,
  unlock: isAdmin,
}
