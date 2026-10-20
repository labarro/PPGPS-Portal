import type { CollectionConfig } from 'payload'

/**
 * Coleção mínima de contas de acesso (S01).
 *
 * Usa a autenticação padrão do Payload. Papéis, `active`, bloqueio por tentativas,
 * auditoria e recuperação de senha entram na S02 (fora do escopo da S01).
 * Conta de acesso ≠ pessoa acadêmica (ADR-0004).
 */
export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: 'Usuário',
    plural: 'Usuários',
  },
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [{ name: 'driftProbe', type: 'text' }],
}
