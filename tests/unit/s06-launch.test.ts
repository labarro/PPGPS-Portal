import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { LEGAL_DEFAULTS, RESPONSIBILITY_STATEMENT } from '@/lib/content/legal-defaults'
import { isLegalPageSlug, LEGAL_PAGES, pagePath, pathForDocument } from '@/lib/content/paths'
import type { RedirectHit } from '@/lib/content/redirect-lookup'
import { buildSitemap } from '@/lib/content/sitemap'
import { parseSender } from '@/lib/email/adapter'
import {
  isBlockedByMaintenance,
  isFirstRegisterBlocked,
  isMaintenanceMode,
} from '@/lib/security/maintenance'
import { handleProxy } from '@/proxy'

const noRedirect = vi.fn(async (): Promise<RedirectHit | null> => null)
const proxy = (path: string, method = 'GET', host = 'bioeticaps.app') =>
  handleProxy(new NextRequest(`https://${host}${path}`, { method }), noRedirect)

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('páginas legais (S06, RF-021)', () => {
  it('rotas de primeiro nível para os três slugs legais', () => {
    expect(LEGAL_PAGES.map((page) => page.href)).toEqual([
      '/privacidade',
      '/acessibilidade',
      '/sobre-o-portal',
    ])
    expect(pagePath('privacidade')).toBe('/privacidade')
    expect(pathForDocument('pages', 'sobre-o-portal')).toBe('/sobre-o-portal')
    expect(pagePath('historico')).toBe('/o-grupo/historico')
    expect(isLegalPageSlug('acessibilidade')).toBe(true)
    expect(isLegalPageSlug('contato')).toBe(false)
  })

  it('texto padrão sem e-mails, nomes de pessoas ou logotipos (nada inventado)', () => {
    const all = JSON.stringify(LEGAL_DEFAULTS) + RESPONSIBILITY_STATEMENT
    expect(all).not.toMatch(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/)
    expect(all).not.toMatch(/logo|laborat/i)
    expect(all).not.toMatch(/não oficial/i)
    for (const doc of Object.values(LEGAL_DEFAULTS)) {
      expect(doc.title.length).toBeGreaterThan(3)
      expect(doc.sections.length).toBeGreaterThan(1)
    }
    // Privacidade: direitos do titular, canal e transferência internacional.
    const privacy = JSON.stringify(LEGAL_DEFAULTS.privacidade)
    expect(privacy).toContain('Seus direitos')
    expect(privacy).toContain('/o-grupo/contato')
    expect(privacy).toContain('transferência internacional')
    expect(RESPONSIBILITY_STATEMENT).toContain('Grupo de Pesquisa em Bioética e Promoção da Saúde')
  })

  it('sitemap inclui as páginas legais e não as duplica em /o-grupo', () => {
    const items = buildSitemap(
      {
        profileUpdatedAt: null,
        lines: [],
        pages: [{ slug: 'privacidade', updatedAt: '2026-10-30T00:00:00.000Z' }],
      },
      'https://bioeticaps.app',
    )
    const urls = items.map((item) => item.url)
    expect(urls).toContain('https://bioeticaps.app/privacidade')
    expect(urls).toContain('https://bioeticaps.app/acessibilidade')
    expect(urls).toContain('https://bioeticaps.app/sobre-o-portal')
    expect(urls).not.toContain('https://bioeticaps.app/o-grupo/privacidade')
    expect(items.find((item) => item.url.endsWith('/privacidade'))?.lastModified).toBe(
      '2026-10-30T00:00:00.000Z',
    )
  })
})

describe('modo de manutenção (S06)', () => {
  it('liga somente com MAINTENANCE_MODE=true', () => {
    expect(isMaintenanceMode({ MAINTENANCE_MODE: 'true' })).toBe(true)
    expect(isMaintenanceMode({ MAINTENANCE_MODE: 'TRUE ' })).toBe(true)
    expect(isMaintenanceMode({ MAINTENANCE_MODE: '1' })).toBe(false)
    expect(isMaintenanceMode({})).toBe(false)
  })

  it('bloqueia escritas na API, exceto login/logout; leituras e páginas seguem', () => {
    expect(isBlockedByMaintenance('POST', '/api/essays')).toBe(true)
    expect(isBlockedByMaintenance('PATCH', '/api/globals/group-profile')).toBe(true)
    expect(isBlockedByMaintenance('DELETE', '/api/people/1')).toBe(true)
    expect(isBlockedByMaintenance('POST', '/api/essays/3/transition')).toBe(true)
    expect(isBlockedByMaintenance('POST', '/api/users/login')).toBe(false)
    expect(isBlockedByMaintenance('POST', '/api/users/logout/')).toBe(false)
    expect(isBlockedByMaintenance('GET', '/api/essays')).toBe(false)
    expect(isBlockedByMaintenance('POST', '/admin/collections/essays')).toBe(false)
  })

  it('proxy responde 503 às escritas e mantém o site no ar', async () => {
    vi.stubEnv('APP_ENV', 'production')
    vi.stubEnv('MAINTENANCE_MODE', 'true')
    const blocked = await proxy('/api/pages', 'POST')
    expect(blocked.status).toBe(503)
    expect(blocked.headers.get('Retry-After')).toBe('1800')
    expect((await blocked.json()).errors[0].message).toMatch(/manutenção/)
    expect((await proxy('/blog')).status).toBe(200)
    expect((await proxy('/api/users/login', 'POST')).status).toBe(200)
  })

  it('sem manutenção, escritas passam pelo proxy (o acesso continua no Payload)', async () => {
    vi.stubEnv('APP_ENV', 'production')
    vi.stubEnv('MAINTENANCE_MODE', '')
    expect((await proxy('/api/pages', 'POST')).status).toBe(200)
  })
})

describe('remetente do e-mail (S06)', () => {
  it('aceita endereço simples ou "Nome <endereço>"', () => {
    expect(parseSender('portal@exemplo.org', undefined)).toEqual({
      from: 'portal@exemplo.org',
      fromName: 'Portal Bioética e Promoção da Saúde',
    })
    expect(parseSender('Portal do Grupo <portal@exemplo.org>', undefined)).toEqual({
      from: 'portal@exemplo.org',
      fromName: 'Portal do Grupo',
    })
    expect(parseSender('"Grupo" <portal@exemplo.org>', 'Outro nome')).toEqual({
      from: 'portal@exemplo.org',
      fromName: 'Outro nome',
    })
    expect(parseSender(undefined, undefined).from).toBe('nao-responda@example.com')
  })
})

describe('cadastro do primeiro usuário (S06)', () => {
  it('bloqueado em produção, liberado fora dela', () => {
    expect(isFirstRegisterBlocked('production', '/api/users/first-register', {})).toBe(true)
    expect(isFirstRegisterBlocked('production', '/api/users/first-register/', {})).toBe(true)
    expect(isFirstRegisterBlocked('production', '/api/users/login', {})).toBe(false)
    expect(isFirstRegisterBlocked('local', '/api/users/first-register', {})).toBe(false)
    expect(isFirstRegisterBlocked('staging', '/api/users/first-register', {})).toBe(false)
    expect(
      isFirstRegisterBlocked('production', '/api/users/first-register', {
        ALLOW_FIRST_REGISTRATION: 'true',
      }),
    ).toBe(false)
  })

  it('proxy de produção responde 403', async () => {
    vi.stubEnv('APP_ENV', 'production')
    const response = await proxy('/api/users/first-register', 'POST')
    expect(response.status).toBe(403)
    expect(response.headers.get('X-Robots-Tag')).toBeNull()
  })
})
