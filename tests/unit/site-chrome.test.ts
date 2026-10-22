import { afterEach, describe, expect, it, vi } from 'vitest'

const findGlobal = vi.fn()
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: vi.fn(async () => ({ findGlobal })) }))
vi.mock('react', async (original) => ({
  ...(await original<typeof import('react')>()),
  cache: <T>(fn: T) => fn,
}))

const { DEFAULT_CHROME, getSiteChrome } = await import('@/lib/site/chrome')

describe('dados do layout público (globals)', () => {
  afterEach(() => {
    findGlobal.mockReset()
    delete process.env.NEXT_PHASE
  })

  it('lê os globals como visitante anônimo (overrideAccess: false)', async () => {
    findGlobal.mockImplementation(async ({ slug }: { slug: string }) => {
      if (slug === 'site-settings')
        return { siteName: 'Nome', shortName: 'Curto', defaultDescription: 'Desc' }
      if (slug === 'navigation')
        return {
          items: [
            { label: 'Blog', href: '/blog' },
            { label: '', href: '/x' },
          ],
        }
      return {
        about: 'Sobre',
        contactEmail: 'grupo@example.com',
        links: [],
        legalLinks: [{ label: 'Privacidade', href: '/privacidade' }],
      }
    })
    const chrome = await getSiteChrome()
    expect(findGlobal).toHaveBeenCalledWith(
      expect.objectContaining({ overrideAccess: false, slug: 'navigation' }),
    )
    expect(chrome.siteName).toBe('Nome')
    expect(chrome.navigation).toEqual([{ label: 'Blog', href: '/blog' }])
    expect(chrome.footer.legalLinks).toHaveLength(1)
  })

  it('usa valores padrão no build (sem banco) e em caso de falha', async () => {
    process.env.NEXT_PHASE = 'phase-production-build'
    expect(await getSiteChrome()).toBe(DEFAULT_CHROME)
    expect(findGlobal).not.toHaveBeenCalled()
    delete process.env.NEXT_PHASE

    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    findGlobal.mockRejectedValue(new Error('sem banco'))
    expect(await getSiteChrome()).toBe(DEFAULT_CHROME)
    spy.mockRestore()
  })

  it('menu vazio volta ao padrão (Início, O grupo, Linhas temáticas)', async () => {
    findGlobal.mockResolvedValue({ items: [], links: [], legalLinks: [] })
    const chrome = await getSiteChrome()
    expect(chrome.navigation).toEqual([
      { label: 'Início', href: '/' },
      { label: 'O grupo', href: '/o-grupo' },
      { label: 'Linhas temáticas', href: '/linhas' },
    ])
    expect(chrome.siteName).toBe(DEFAULT_CHROME.siteName)
  })
})
