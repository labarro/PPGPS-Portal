import { describe, expect, it, vi } from 'vitest'

const revalidateTag = vi.fn()
const revalidatePath = vi.fn()
vi.mock('next/cache', () => ({ revalidateTag, revalidatePath, unstable_cache: vi.fn() }))

const {
  revalidateCollectionChange,
  revalidateCollectionDelete,
  revalidateGlobal,
  runRevalidation,
} = await import('@/hooks/revalidate')
const { publishedOnlyForPublic, publishedOnlyForPublicGlobal } =
  await import('@/hooks/published-only')
const { rememberPublishedSlug, syncSlugRedirects } = await import('@/hooks/slug-redirects')

type AnyHook = (args: Record<string, unknown>) => Promise<unknown> | unknown

function fakeReq(mainDoc: Record<string, unknown> | null = null) {
  const payload = {
    logger: { debug: vi.fn() },
    db: { findOne: vi.fn(async () => mainDoc) },
    find: vi.fn(async () => ({ docs: [] as { id: number }[] })),
    create: vi.fn(async () => ({})),
    update: vi.fn(async () => ({})),
    delete: vi.fn(async () => ({})),
  }
  return { payload, context: {} as Record<string, unknown>, user: null }
}

describe('hooks de revalidação', () => {
  it('revalida tags com expiração imediata e rotas', async () => {
    const req = fakeReq()
    const doc = { slug: 'bioetica' }
    await (revalidateCollectionChange('research-lines') as unknown as AnyHook)({
      doc,
      previousDoc: { slug: 'antiga' },
      req,
    })
    expect(revalidateTag).toHaveBeenCalledWith('research-line:antiga', { expire: 0 })
    expect(revalidatePath).toHaveBeenCalledWith('/linhas/bioetica', undefined)

    await (revalidateCollectionDelete('pages') as unknown as AnyHook)({ doc: { slug: 'p' }, req })
    expect(revalidateTag).toHaveBeenCalledWith('page:p', { expire: 0 })

    await (revalidateGlobal('homepage') as unknown as AnyHook)({ doc: {}, req })
    expect(revalidateTag).toHaveBeenCalledWith('homepage', { expire: 0 })
  })

  it('pula quando o contexto pede (seed) e ignora falhas fora do runtime do Next', async () => {
    revalidateTag.mockClear()
    const req = fakeReq()
    req.context.skipRevalidation = true
    expect(await runRevalidation({ tags: ['x'], paths: [] }, req as never)).toBe(false)
    expect(revalidateTag).not.toHaveBeenCalled()

    revalidateTag.mockImplementationOnce(() => {
      throw new Error('static generation store missing')
    })
    const other = fakeReq()
    expect(await runRevalidation({ tags: ['x'], paths: [] }, other as never)).toBe(false)
    expect(other.payload.logger.debug).toHaveBeenCalled()
  })
})

describe('hooks de leitura pública', () => {
  it('somente operações de leitura têm o rascunho removido para visitantes', () => {
    const read = (publishedOnlyForPublic as unknown as AnyHook)({
      args: { draft: true },
      operation: 'read',
      req: { user: null },
    })
    expect(read).toEqual({ draft: false })
    const update = (publishedOnlyForPublic as unknown as AnyHook)({
      args: { draft: true },
      operation: 'update',
      req: { user: null },
    })
    expect(update).toEqual({ draft: true })
    const global = (publishedOnlyForPublicGlobal as unknown as AnyHook)({
      args: { draft: true },
      operation: 'read',
      req: { user: null },
    })
    expect(global).toEqual({ draft: false })
    expect(
      (publishedOnlyForPublicGlobal as unknown as AnyHook)({
        args: { draft: true },
        operation: 'update',
        req: { user: null },
      }),
    ).toEqual({ draft: true })
  })
})

describe('redirecionamento automático ao mudar o slug publicado', () => {
  it('guarda o slug publicado antes de publicar e cria o 301 depois', async () => {
    const req = fakeReq({ id: 1, slug: 'antiga', _status: 'published' })
    const data = { _status: 'published', slug: 'nova' }
    await (rememberPublishedSlug('research-lines') as unknown as AnyHook)({
      data,
      operation: 'update',
      originalDoc: { id: 1 },
      req,
    })
    expect(req.context['previousPublishedSlug:research-lines:1']).toBe('antiga')

    await (syncSlugRedirects('research-lines') as unknown as AnyHook)({
      doc: { id: 1, slug: 'nova', _status: 'published' },
      req,
    })
    expect(req.payload.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { from: { equals: '/linhas/nova' } } }),
    )
    expect(req.payload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { 'to.url': { equals: '/linhas/antiga' } },
        data: { to: { url: '/linhas/nova' } },
      }),
    )
    expect(req.payload.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { from: '/linhas/antiga', to: { url: '/linhas/nova' }, type: '301' },
      }),
    )
  })

  it('atualiza o redirecionamento existente em vez de duplicar', async () => {
    const req = fakeReq()
    req.payload.find.mockResolvedValueOnce({ docs: [{ id: 9 }] })
    req.context['previousPublishedSlug:pages:2'] = 'a'
    await (syncSlugRedirects('pages') as unknown as AnyHook)({
      doc: { id: 2, slug: 'b', _status: 'published' },
      req,
    })
    expect(req.payload.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: 9,
        data: { from: '/o-grupo/a', to: { url: '/o-grupo/b' }, type: '301' },
      }),
    )
    expect(req.payload.create).not.toHaveBeenCalled()
  })

  it('rascunhos, criação e documentos nunca publicados não geram redirecionamento', async () => {
    const req = fakeReq({ id: 3, slug: 'x', _status: 'draft' })
    const hook = rememberPublishedSlug('pages') as unknown as AnyHook
    await hook({ data: { _status: 'draft' }, operation: 'update', originalDoc: { id: 3 }, req })
    await hook({ data: { _status: 'published' }, operation: 'create', req })
    await hook({
      data: { _status: 'published', slug: 'y' },
      operation: 'update',
      originalDoc: { id: 3 },
      req,
    })
    expect(req.context).toEqual({})
    expect(req.payload.db.findOne).toHaveBeenCalledTimes(1)

    await (syncSlugRedirects('pages') as unknown as AnyHook)({
      doc: { id: 3, slug: 'y', _status: 'draft' },
      req,
    })
    expect(req.payload.delete).not.toHaveBeenCalled()
    expect(req.payload.create).not.toHaveBeenCalled()
  })
})
