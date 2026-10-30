import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'

import { cleanupAccounts, createAccount } from '../helpers/fixtures'

let payload: Payload

describe('Payload (integração com PostgreSQL)', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    // Em banco vazio a primeira conta vira admin (bootstrap); garante que exista uma antes.
    await createAccount(payload, ['admin'])
  })

  afterAll(async () => {
    await cleanupAccounts(payload)
  })

  it('inicializa com as coleções e globals da S02 à S05', () => {
    const slugs = payload.config.collections.map((collection) => collection.slug)
    expect(slugs).toEqual(
      expect.arrayContaining([
        'users',
        'media',
        'documents',
        'audit-logs',
        'research-lines',
        'pages',
        'redirects',
        'people',
        'memberships',
        'consent-records',
        // S05: blog acadêmico (e a fila de jobs do Payload para o agendamento).
        'essays',
        'categories',
        'tags',
        'payload-jobs',
      ]),
    )
    const globals = payload.config.globals.map((global) => global.slug)
    expect(globals).toEqual([
      'group-profile',
      'homepage',
      'navigation',
      'footer',
      'site-settings',
      'payload-jobs-stats',
    ])
  })

  it('não antecipa coleções de sprints futuras nem coleções removidas (ADR-0006)', () => {
    const slugs = payload.config.collections.map((collection) => collection.slug)
    for (const future of [
      'academic-completions',
      'alumni-profiles',
      'career-entries',
      'supervisions',
      'external-ids',
      'publications',
      'projects',
      'events',
      'programs',
      'research-groups',
      'laboratories',
    ]) {
      expect(slugs).not.toContain(future)
    }
  })

  it('declara pt-BR como idioma padrão e en como secundário', () => {
    const localization = payload.config.localization
    expect(localization && localization.defaultLocale).toBe('pt-BR')
    expect(localization && localization.localeCodes).toEqual(['pt-BR', 'en'])
  })

  it('mantém GraphQL desabilitado', () => {
    expect(payload.config.graphQL.disable).toBe(true)
  })

  it('cria um usuário e autentica com a senha', async () => {
    const account = await createAccount(payload, ['editor'])
    const login = await payload.login({
      collection: 'users',
      data: { email: account.email, password: account.password },
    })
    expect(login.token).toBeTruthy()
    expect(login.user?.email).toBe(account.email)
    expect(login.user?.roles).toEqual(['editor'])
  })

  it('registra as migrations aplicadas (schema não é sincronizado automaticamente)', async () => {
    const migrations = await payload.find({ collection: 'payload-migrations', limit: 100 })
    expect(migrations.totalDocs).toBeGreaterThanOrEqual(2)
    expect(migrations.docs.every((migration) => migration.batch !== -1)).toBe(true)
  })
})
