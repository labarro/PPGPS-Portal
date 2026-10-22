/**
 * Papéis do sistema (planejamento v1.3, seção 14.2; ADR-0010).
 *
 * - `admin`: desenvolvedor responsável (acesso total).
 * - `editor`: coordenador do grupo (todo o conteúdo; lê a auditoria; não gerencia usuários,
 *   papéis nem configurações técnicas).
 *
 * Não existem `researcher`, `group_manager` nem contas de integrantes (Q5).
 */
export const ROLES = ['admin', 'editor'] as const

export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador (desenvolvedor)',
  editor: 'Editor (coordenador do grupo)',
}

/** Forma mínima de usuário usada pelas funções de acesso (independe dos tipos gerados). */
export type AccessUser = {
  id: number | string
  roles?: readonly string[] | null
  active?: boolean | null
  collection?: string
}

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}

/** Conta ativa da coleção `users`. Contas desativadas não têm nenhum privilégio. */
export function isActiveUser(user: AccessUser | null | undefined): user is AccessUser {
  if (!user) return false
  if (user.collection && user.collection !== 'users') return false
  return user.active !== false
}

export function hasRole(user: AccessUser | null | undefined, role: Role): boolean {
  return isActiveUser(user) && Array.isArray(user.roles) && user.roles.includes(role)
}

export function hasAnyRole(user: AccessUser | null | undefined, roles: readonly Role[]): boolean {
  return roles.some((role) => hasRole(user, role))
}

/** Normaliza a lista de papéis (remove duplicados e valores desconhecidos, ordena). */
export function normalizeRoles(value: unknown): Role[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter(isRole))].sort()
}

export function rolesChanged(before: unknown, after: unknown): boolean {
  return normalizeRoles(before).join(',') !== normalizeRoles(after).join(',')
}
