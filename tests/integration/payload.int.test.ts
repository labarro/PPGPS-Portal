import { randomUUID } from 'node:crypto'

import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'

const email = `int-${Date.now()}@example.com`
const password = randomUUID()

let payload: Payload

describe('Payload (integração com PostgreSQL)', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  afterAll(async () => {
    await payload.delete({ collection: 'users', where: { email: { equals: email } } })
    await payload.destroy()
  })

  it('inicializa com as coleções mínimas da S01', () => {
    const slugs = payload.config.collections.map((collection) => collection.slug)
    expect(slugs).toEqual(expect.arrayContaining(['users', 'media']))
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
    const user = await payload.create({
      collection: 'users',
      data: { email, password },
    })
    expect(user.email).toBe(email)

    const login = await payload.login({
      collection: 'users',
      data: { email, password },
    })
    expect(login.token).toBeTruthy()
    expect(login.user?.email).toBe(email)
  })

  it('registra as migrations aplicadas (schema não é sincronizado automaticamente)', async () => {
    const migrations = await payload.find({ collection: 'payload-migrations', limit: 100 })
    expect(migrations.totalDocs).toBeGreaterThan(0)
    expect(migrations.docs.every((migration) => migration.batch !== -1)).toBe(true)
  })
})
