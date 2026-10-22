import type { PayloadRequest } from 'payload'
import { describe, expect, it } from 'vitest'

import {
  adminEditorOrPublic,
  adminOrSelf,
  anyone,
  fieldIsAdmin,
  fieldIsAdminOrEditor,
  isAdmin,
  isAdminOrEditor,
  isAuthenticated,
  isEditor,
  nobody,
} from '@/access'
import { hasRole, normalizeRoles, ROLES, rolesChanged } from '@/access/roles'

type User = { id: number; roles?: string[] | null; active?: boolean | null; collection?: string }

const req = (user: User | null) => ({ req: { user } as unknown as PayloadRequest })

const admin: User = { id: 1, roles: ['admin'], active: true, collection: 'users' }
const editor: User = { id: 2, roles: ['editor'], active: true, collection: 'users' }
const inactiveAdmin: User = { id: 3, roles: ['admin'], active: false, collection: 'users' }
const noRoles: User = { id: 4, roles: [], active: true, collection: 'users' }
const researcher: User = { id: 5, roles: ['researcher'], active: true, collection: 'users' }
const otherCollection: User = { id: 6, roles: ['admin'], active: true, collection: 'customers' }
const anonymous = null

describe('papéis', () => {
  it('existem somente admin e editor (sem researcher nem group_manager)', () => {
    expect([...ROLES]).toEqual(['admin', 'editor'])
  })

  it('normaliza papéis e ignora valores desconhecidos', () => {
    expect(normalizeRoles(['editor', 'admin', 'editor', 'researcher'])).toEqual(['admin', 'editor'])
    expect(normalizeRoles(undefined)).toEqual([])
    expect(normalizeRoles('admin')).toEqual([])
  })

  it('detecta mudança de papéis independentemente da ordem', () => {
    expect(rolesChanged(['admin', 'editor'], ['editor', 'admin'])).toBe(false)
    expect(rolesChanged(['editor'], ['admin'])).toBe(true)
    expect(rolesChanged([], ['editor'])).toBe(true)
  })

  it('conta desativada ou de outra coleção não tem papel', () => {
    expect(hasRole(inactiveAdmin, 'admin')).toBe(false)
    expect(hasRole(otherCollection, 'admin')).toBe(false)
    expect(hasRole(researcher, 'editor')).toBe(false)
  })
})

describe('funções de acesso por papel', () => {
  const cases: [string, User | null, Record<string, boolean>][] = [
    [
      'admin',
      admin,
      { isAuthenticated: true, isAdmin: true, isEditor: false, isAdminOrEditor: true },
    ],
    [
      'editor',
      editor,
      { isAuthenticated: true, isAdmin: false, isEditor: true, isAdminOrEditor: true },
    ],
    [
      'admin desativado',
      inactiveAdmin,
      { isAuthenticated: false, isAdmin: false, isEditor: false, isAdminOrEditor: false },
    ],
    [
      'conta sem papel',
      noRoles,
      { isAuthenticated: true, isAdmin: false, isEditor: false, isAdminOrEditor: false },
    ],
    [
      'papel inexistente (researcher)',
      researcher,
      { isAuthenticated: true, isAdmin: false, isEditor: false, isAdminOrEditor: false },
    ],
    [
      'visitante anônimo',
      anonymous,
      { isAuthenticated: false, isAdmin: false, isEditor: false, isAdminOrEditor: false },
    ],
  ]

  it.each(cases)('%s', (_label, user, expected) => {
    expect(isAuthenticated(req(user))).toBe(expected.isAuthenticated)
    expect(isAdmin(req(user))).toBe(expected.isAdmin)
    expect(isEditor(req(user))).toBe(expected.isEditor)
    expect(isAdminOrEditor(req(user))).toBe(expected.isAdminOrEditor)
  })

  it('acesso por campo: só admin altera campos técnicos', () => {
    expect(fieldIsAdmin(req(admin) as never)).toBe(true)
    expect(fieldIsAdmin(req(editor) as never)).toBe(false)
    expect(fieldIsAdminOrEditor(req(editor) as never)).toBe(true)
    expect(fieldIsAdminOrEditor(req(anonymous) as never)).toBe(false)
  })
})

describe('funções de leitura com filtro (where)', () => {
  it('adminOrSelf: admin vê tudo; editor só a própria conta; anônimo nada', () => {
    expect(adminOrSelf(req(admin) as never)).toBe(true)
    expect(adminOrSelf(req(editor) as never)).toEqual({ id: { equals: 2 } })
    expect(adminOrSelf(req(inactiveAdmin) as never)).toBe(false)
    expect(adminOrSelf(req(anonymous) as never)).toBe(false)
  })

  it('adminEditorOrPublic: visitante recebe o filtro público', () => {
    const access = adminEditorOrPublic({ visibility: { equals: 'public' } })
    expect(access(req(admin) as never)).toBe(true)
    expect(access(req(editor) as never)).toBe(true)
    expect(access(req(anonymous) as never)).toEqual({ visibility: { equals: 'public' } })
    expect(access(req(inactiveAdmin) as never)).toEqual({ visibility: { equals: 'public' } })
  })

  it('anyone e nobody', () => {
    expect(anyone(req(anonymous) as never)).toBe(true)
    expect(nobody(req(admin) as never)).toBe(false)
  })
})
