import type { Access, FieldAccess, PayloadRequest, Where } from 'payload'

import { type AccessUser, hasAnyRole, hasRole, isActiveUser } from './roles'

export * from './roles'

/**
 * Funções de acesso puras e reutilizáveis (AGENTS.md §4.3; planejamento 14.4).
 * Recebem `{ req }` do Payload e decidem apenas pelo usuário autenticado.
 * Funções de `read` com escopo retornam filtros (`Where`), não apenas booleanos.
 */

type WithReq = { req: Pick<PayloadRequest, 'user'> }

const userOf = (args: WithReq): AccessUser | null =>
  (args.req.user as unknown as AccessUser | null) ?? null

export const isAuthenticated = (args: WithReq): boolean => isActiveUser(userOf(args))

export const isAdmin = (args: WithReq): boolean => hasRole(userOf(args), 'admin')

export const isEditor = (args: WithReq): boolean => hasRole(userOf(args), 'editor')

export const isAdminOrEditor = (args: WithReq): boolean =>
  hasAnyRole(userOf(args), ['admin', 'editor'])

/** Leitura pública (visitante anônimo incluído). */
export const anyone: Access = () => true

/** Nega sempre (ex.: escrita em coleções imutáveis pela API). */
export const nobody: Access = () => false

/** `admin` vê tudo; demais usuários ativos veem apenas o próprio registro. */
export const adminOrSelf: Access = (args) => {
  const user = userOf(args)
  if (hasRole(user, 'admin')) return true
  if (!isActiveUser(user)) return false
  return { id: { equals: user.id } } satisfies Where
}

/**
 * `admin`/`editor` veem tudo; o visitante vê somente o que passa no filtro público.
 * Mantém a regra de visibilidade num único lugar por coleção (AGENTS.md §4.6).
 */
export const adminEditorOrPublic =
  (publicWhere: Where): Access =>
  (args) =>
    isAdminOrEditor(args) ? true : publicWhere

export const fieldIsAdmin: FieldAccess = (args) => isAdmin(args)

export const fieldIsAdminOrEditor: FieldAccess = (args) => isAdminOrEditor(args)
