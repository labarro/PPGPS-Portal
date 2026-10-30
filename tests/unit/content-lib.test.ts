import { afterEach, describe, expect, it, vi } from 'vitest'

import { updateAction } from '@/hooks/audit'
import { stripDraftForPublic } from '@/hooks/published-only'
import { cachedRead } from '@/lib/content/cache'
import { CACHE_TAGS, revalidationPlan } from '@/lib/content/cache-tags'
import {
  certificationLabel,
  formatDate,
  isoDate,
  referenceKindLabel,
  urlHost,
} from '@/lib/content/format'
import {
  AVAILABLE_SECTIONS,
  DEFAULT_HOME_SECTIONS,
  resolveHomeSections,
  validateHomeSections,
} from '@/lib/content/homepage'
import { breadcrumbJsonLd, organizationJsonLd, serializeJsonLd } from '@/lib/content/jsonld'
import {
  FIXED_GROUP_SLUGS,
  isRedirectCandidate,
  normalizePath,
  pathForDocument,
  validateExternalUrl,
  validateRedirectSource,
  validateRedirectTarget,
} from '@/lib/content/paths'
import { previewUrl, safePreviewPath } from '@/lib/content/preview'
import { createRedirectLookup, REDIRECT_CACHE_TTL_MS } from '@/lib/content/redirect-lookup'
import {
  hasFormat,
  headingLevel,
  internalLinkHref,
  isRichTextEmpty,
  leadingParagraphs,
  linkHref,
  plainText,
  safeHref,
  TEXT_FORMAT,
} from '@/lib/content/rich-text'
import { buildRobots } from '@/lib/content/robots'
import { metaDescription, pageMetadata } from '@/lib/content/seo'
import { buildSitemap } from '@/lib/content/sitemap'
import { slugify, validateSlug } from '@/lib/content/slug'
import { canViewPublic, publicWhere } from '@/lib/content/visibility'

describe('slugs (português sem acentos)', () => {
  it('normaliza títulos em português', () => {
    expect(slugify('Promoção da Saúde')).toBe('promocao-da-saude')
    expect(slugify('  Bioética & Envelhecimento!  ')).toBe('bioetica-envelhecimento')
    expect(slugify('a'.repeat(100))).toHaveLength(80)
  })

  it('valida o formato', () => {
    expect(validateSlug('bioetica')).toBe(true)
    expect(validateSlug('')).toMatch(/Informe/)
    expect(validateSlug('Com Espaço')).toMatch(/minúsculas/)
    expect(validateSlug('a'.repeat(81))).toMatch(/80/)
    expect(validateSlug(undefined)).toMatch(/Informe/)
  })
})

describe('rotas, caminhos e URLs', () => {
  it('monta rotas públicas por coleção', () => {
    expect(pathForDocument('research-lines', 'bioetica')).toBe('/linhas/bioetica')
    expect(pathForDocument('pages', 'equipe')).toBe('/o-grupo/equipe')
    expect(FIXED_GROUP_SLUGS).toEqual([
      'historico',
      'objetivos',
      'referencias-institucionais',
      'contato',
    ])
  })

  it('normaliza caminhos e identifica candidatos a redirecionamento', () => {
    expect(normalizePath('/Linhas/Bio%C3%A9tica/?x=1#y')).toBe('/linhas/bioética')
    expect(normalizePath('linhas')).toBe('/linhas')
    expect(normalizePath('/%E0%A4%A')).toBe('/%e0%a4%a')
    expect(isRedirectCandidate('/linhas/antiga')).toBe(true)
    expect(isRedirectCandidate('/o-grupo/x/')).toBe(true)
    expect(isRedirectCandidate('/linhas')).toBe(false)
    expect(isRedirectCandidate('/admin/x')).toBe(false)
  })

  it('valida URLs externas e destinos/origens de redirecionamento', () => {
    expect(validateExternalUrl('http://dgp.cnpq.br/dgp/espelhogrupo/1')).toBe(true)
    expect(validateExternalUrl('')).toBe(true)
    expect(validateExternalUrl('', { required: true })).toMatch(/Informe/)
    expect(validateExternalUrl('javascript:alert(1)')).toMatch(/https/)
    expect(validateExternalUrl('não é url')).toMatch(/inválido/)
    expect(validateExternalUrl(42)).toMatch(/inválido/)
    expect(validateRedirectTarget('/linhas/nova')).toBe(true)
    expect(validateRedirectTarget('https://exemplo.org')).toBe(true)
    expect(validateRedirectTarget('//evil.example')).not.toBe(true)
    expect(validateRedirectTarget('')).toMatch(/destino/)
    expect(validateRedirectSource('/linhas/antiga')).toBe(true)
    expect(validateRedirectSource('linhas')).toMatch(/"\/"/)
    expect(validateRedirectSource('/api/users')).toMatch(/reservado/)
    expect(validateRedirectSource(null)).toMatch(/origem/)
  })

  it('pré-visualização aceita somente caminhos internos do site', () => {
    expect(previewUrl('/linhas/bioetica')).toBe('/next/preview?path=%2Flinhas%2Fbioetica')
    expect(safePreviewPath('/o-grupo')).toBe('/o-grupo')
    for (const bad of [
      null,
      '',
      'https://evil.example',
      '//evil.example',
      '/\\evil',
      '/admin',
      '/api/users',
      '/next/preview',
    ]) {
      expect(safePreviewPath(bad)).toBeNull()
    }
  })
})

describe('visibilidade pública (função única)', () => {
  it('exige publicação; linhas também precisam estar ativas', () => {
    expect(canViewPublic('pages', { _status: 'published' })).toBe(true)
    expect(canViewPublic('pages', { _status: 'draft' })).toBe(false)
    expect(canViewPublic('pages', null)).toBe(false)
    expect(canViewPublic('pages', { _status: 'published', archivedAt: '2026-01-01' })).toBe(false)
    expect(canViewPublic('research-lines', { _status: 'published', active: true })).toBe(true)
    expect(canViewPublic('research-lines', { _status: 'published', active: false })).toBe(false)
  })

  it('o filtro de consulta segue a mesma regra', () => {
    expect(publicWhere('pages')).toEqual({ _status: { equals: 'published' } })
    expect(publicWhere('research-lines')).toEqual({
      and: [{ _status: { equals: 'published' } }, { active: { equals: true } }],
    })
  })

  it('visitante nunca recebe rascunho, mesmo pedindo draft=true', () => {
    const anonymous = { user: null }
    const editor = { user: { id: 1, roles: ['editor'], active: true } as never }
    expect(stripDraftForPublic({ draft: true }, anonymous)).toEqual({ draft: false })
    expect(stripDraftForPublic({ draft: false }, anonymous)).toEqual({ draft: false })
    expect(stripDraftForPublic({ draft: true }, editor)).toEqual({ draft: true })
    expect(stripDraftForPublic(undefined, anonymous)).toBeUndefined()
  })

  it('publicação é auditada como publish', () => {
    expect(updateAction({ _status: 'published' })).toBe('publish')
    expect(updateAction({ _status: 'draft' })).toBe('update')
    expect(updateAction(null)).toBe('update')
  })
})

describe('revalidação por tag', () => {
  it('perfil do grupo revalida o layout inteiro (home, /o-grupo/*, rodapé) e o sitemap', () => {
    const plan = revalidationPlan('group-profile')
    expect(plan.tags).toEqual([CACHE_TAGS.groupProfile, CACHE_TAGS.sitemap])
    expect(plan.paths).toEqual([{ path: '/', type: 'layout' }])
  })

  it('linha temática revalida lista, home, O grupo e as páginas do slug novo e antigo', () => {
    const plan = revalidationPlan('research-lines', { slug: 'nova' }, { slug: 'antiga' })
    expect(plan.tags).toEqual(
      expect.arrayContaining([
        'research-lines',
        'sitemap',
        'research-line:nova',
        'research-line:antiga',
      ]),
    )
    expect(plan.paths.map((p) => p.path)).toEqual(
      expect.arrayContaining(['/', '/linhas', '/o-grupo', '/linhas/nova', '/linhas/antiga']),
    )
  })

  it('páginas, home, layout e redirecionamentos', () => {
    expect(revalidationPlan('pages', { slug: 'p' }).tags).toEqual(['pages', 'sitemap', 'page:p'])
    expect(revalidationPlan('pages', { slug: 'p' }).paths[0]).toEqual({
      path: '/o-grupo',
      type: 'layout',
    })
    expect(revalidationPlan('homepage')).toEqual({ tags: ['homepage'], paths: [{ path: '/' }] })
    expect(revalidationPlan('site-chrome').tags).toEqual(['site-chrome'])
    expect(revalidationPlan('redirects')).toEqual({ tags: [], paths: [] })
  })

  it('cache de dados: fora do runtime do Next lê direto', async () => {
    const read = vi.fn(async () => 42)
    expect(await cachedRead(['k'], ['t'], read)).toBe(42)
    expect(read).toHaveBeenCalledOnce()
  })
})

describe('página inicial: seções ordenáveis e ocultáveis', () => {
  it('padrão: só as seções disponíveis até a S05, na ordem do cadastro', () => {
    expect(resolveHomeSections(null).map((s) => s.kind)).toEqual([
      'about',
      'research-lines',
      'editorial-highlights',
      'featured-members',
      'institutional-references',
    ])
    expect(DEFAULT_HOME_SECTIONS.filter((s) => s.enabled).map((s) => s.kind)).toEqual(
      AVAILABLE_SECTIONS,
    )
  })

  it('respeita ordem, ocultação, títulos e ignora seções futuras e repetidas', () => {
    const sections = resolveHomeSections([
      { kind: 'institutional-references', enabled: true, heading: ' Vínculos ' },
      { kind: 'agenda', enabled: true },
      { kind: 'about', enabled: false },
      { kind: 'research-lines', enabled: true, intro: ' Intro ' },
      { kind: 'research-lines', enabled: true },
    ])
    expect(sections).toEqual([
      { kind: 'institutional-references', heading: 'Vínculos', intro: null },
      { kind: 'research-lines', heading: 'Linhas temáticas', intro: 'Intro' },
    ])
  })

  it('valida seções repetidas', () => {
    expect(validateHomeSections(null)).toBe(true)
    expect(validateHomeSections('x')).toMatch(/inválida/)
    expect(validateHomeSections([{ kind: 'about' }, { kind: 'about' }])).toMatch(/Apresentação/)
    expect(validateHomeSections([{ kind: 'about' }, { kind: 'agenda' }])).toBe(true)
  })
})

describe('formatação', () => {
  it('datas UTC em pt-BR sem deslocamento de fuso', () => {
    expect(formatDate('2021-04-14T00:00:00.000Z')).toBe('14/04/2021')
    expect(formatDate(null)).toBeNull()
    expect(formatDate('inválida')).toBeNull()
    expect(isoDate('2021-04-14T12:00:00.000Z')).toBe('2021-04-14')
    expect(isoDate('x')).toBeNull()
    expect(isoDate(undefined)).toBeNull()
  })

  it('rótulos e hosts', () => {
    expect(certificationLabel('certified')).toBe('Certificado')
    expect(certificationLabel('x')).toBeNull()
    expect(certificationLabel(null)).toBeNull()
    expect(referenceKindLabel('program')).toBe('Programa de pós-graduação')
    expect(referenceKindLabel(undefined)).toBe('Referência')
    expect(urlHost('https://www.unicesumar.edu.br/x')).toBe('unicesumar.edu.br')
    expect(urlHost('x')).toBeNull()
    expect(urlHost(null)).toBeNull()
  })
})

describe('rich text (regras puras do renderizador)', () => {
  it('safeHref só aceita destinos seguros', () => {
    expect(safeHref('/linhas')).toBe('/linhas')
    expect(safeHref('#secao')).toBe('#secao')
    expect(safeHref('https://exemplo.org')).toBe('https://exemplo.org')
    expect(safeHref('mailto:grupo@example.com')).toBe('mailto:grupo@example.com')
    for (const bad of [
      'javascript:alert(1)',
      'JaVaScRiPt:alert(1)',
      'java\tscript:alert(1)',
      ' javascript:alert(1)',
      'data:text/html,<script>',
      'vbscript:x',
      '//evil.example',
      '',
      42,
    ]) {
      expect(safeHref(bad)).toBeNull()
    }
  })

  it('links internos do editor viram rotas públicas', () => {
    expect(internalLinkHref({ relationTo: 'research-lines', value: { slug: 'bioetica' } })).toBe(
      '/linhas/bioetica',
    )
    expect(internalLinkHref({ relationTo: 'pages', value: { slug: 'equipe' } })).toBe(
      '/o-grupo/equipe',
    )
    expect(internalLinkHref({ relationTo: 'pages', value: 3 })).toBeNull()
    expect(internalLinkHref({ relationTo: 'users', value: { slug: 'x' } })).toBeNull()
    expect(internalLinkHref(null)).toBeNull()
    expect(
      linkHref({
        type: 'link',
        fields: { linkType: 'internal', doc: { relationTo: 'pages', value: { slug: 'a' } } },
      }),
    ).toBe('/o-grupo/a')
    expect(
      linkHref({ type: 'link', fields: { linkType: 'custom', url: 'javascript:x' } }),
    ).toBeNull()
    expect(linkHref({ type: 'autolink', url: 'https://a.org' })).toBe('https://a.org')
  })

  it('formatação, títulos e texto puro', () => {
    expect(hasFormat(TEXT_FORMAT.bold | TEXT_FORMAT.italic, TEXT_FORMAT.italic)).toBe(true)
    expect(hasFormat('1', TEXT_FORMAT.bold)).toBe(false)
    expect(headingLevel('h2')).toBe(2)
    expect(headingLevel('h1')).toBe(2)
    expect(headingLevel('h4', 3)).toBe(5)
    expect(headingLevel('h6', 4)).toBe(6)
    expect(headingLevel(undefined)).toBe(2)

    const state = {
      root: {
        children: [
          {
            type: 'paragraph',
            children: [
              { type: 'text', text: 'Primeiro' },
              { type: 'linebreak' },
              { type: 'text', text: 'parágrafo.' },
            ],
          },
          { type: 'heading', tag: 'h2', children: [{ type: 'text', text: 'Título' }] },
          { type: 'paragraph', children: [{ type: 'text', text: 'Segundo parágrafo.' }] },
          { type: 'paragraph', children: [] },
        ],
      },
    }
    expect(plainText(state)).toBe('Primeiro parágrafo. Título Segundo parágrafo.')
    expect(plainText(state, 10)).toBe('Primeiro…')
    expect(leadingParagraphs(state)).toEqual(['Primeiro parágrafo.', 'Segundo parágrafo.'])
    expect(leadingParagraphs(state, 5)).toEqual(['Primeiro parágrafo.'])
    expect(isRichTextEmpty(state)).toBe(false)
    expect(isRichTextEmpty(null)).toBe(true)
    expect(isRichTextEmpty({ root: { children: [{ type: 'paragraph', children: [] }] } })).toBe(
      true,
    )
  })
})

describe('SEO: metadados, robots, sitemap e JSON-LD', () => {
  it('metadados com canônica, Open Graph e descrição limitada', () => {
    const meta = pageMetadata({
      title: 'Histórico',
      path: '/o-grupo/historico',
      description: ' D ',
    })
    expect(meta.title).toBe('Histórico')
    expect(meta.description).toBe('D')
    expect(meta.alternates?.canonical).toBe('/o-grupo/historico')
    expect(meta.openGraph).toMatchObject({ locale: 'pt_BR', url: '/o-grupo/historico' })
    expect(pageMetadata({ path: '/' }).openGraph?.title).toMatch(/Grupo de Pesquisa/)
    expect(metaDescription('a '.repeat(200))).toHaveLength(160)
    expect(metaDescription('  ')).toBeUndefined()
    expect(metaDescription('curta')).toBe('curta')
  })

  it('robots bloqueia tudo fora da produção; em produção, só admin/api/next', () => {
    expect(buildRobots('staging', 'https://h.example')).toEqual({
      rules: [{ userAgent: '*', disallow: '/' }],
    })
    const prod = buildRobots('production', 'https://portal.example.org/')
    expect(prod.sitemap).toBe('https://portal.example.org/sitemap.xml')
    expect(prod.rules).toEqual([
      { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/next'] },
    ])
  })

  it('sitemap com seções do grupo, linhas e páginas livres (sem duplicar seções fixas)', () => {
    const urls = buildSitemap(
      {
        profileUpdatedAt: '2026-10-20T00:00:00.000Z',
        lines: [{ slug: 'bioetica', updatedAt: '2026-10-21T00:00:00.000Z' }],
        pages: [
          { slug: 'historico', updatedAt: '2026-10-22T00:00:00.000Z' },
          { slug: 'equipe', updatedAt: '2026-10-22T00:00:00.000Z' },
        ],
      },
      'https://portal.example.org/',
    )
    const list = urls.map((u) => u.url)
    expect(list).toEqual([
      'https://portal.example.org/',
      'https://portal.example.org/o-grupo',
      'https://portal.example.org/o-grupo/historico',
      'https://portal.example.org/o-grupo/objetivos',
      'https://portal.example.org/o-grupo/referencias-institucionais',
      'https://portal.example.org/o-grupo/contato',
      'https://portal.example.org/linhas',
      'https://portal.example.org/linhas/bioetica',
      'https://portal.example.org/o-grupo/equipe',
      // S06: páginas legais (sempre presentes).
      'https://portal.example.org/privacidade',
      'https://portal.example.org/acessibilidade',
      'https://portal.example.org/sobre-o-portal',
    ])
    expect(urls[2]?.lastModified).toBe('2026-10-22T00:00:00.000Z')
    expect(
      buildSitemap({ profileUpdatedAt: null, lines: [], pages: [] }, 'https://a.org'),
    ).toHaveLength(4)
  })

  it('JSON-LD do grupo sem vínculo oficial (sem parentOrganization/memberOf) e sem dados pessoais', () => {
    const data = organizationJsonLd(
      {
        officialName: 'Grupo X',
        summary: 'Resumo',
        alternativeNames: [{ name: 'Nome DGP', source: 'DGP' }],
        acronym: 'GX',
        formationYear: 2021,
        dgpUrl: 'http://dgp.cnpq.br/dgp/espelhogrupo/1',
        predominantArea: 'Saúde Coletiva',
        contactEmail: null,
        institutionalReferences: [
          { name: 'Instituição', kind: 'institution', relationText: 'Texto', url: 'https://i.org' },
          { name: 'Parceira', kind: 'partner', relationText: 'Texto' },
        ],
      },
      'https://portal.example.org',
    )
    expect(data['@type']).toBe('ResearchOrganization')
    expect(data).not.toHaveProperty('parentOrganization')
    expect(data).not.toHaveProperty('memberOf')
    expect(data).not.toHaveProperty('email')
    expect(data.alternateName).toEqual(['Nome DGP', 'GX'])
    expect(data.sameAs).toEqual(['http://dgp.cnpq.br/dgp/espelhogrupo/1'])
    expect(data.mentions).toEqual([
      { '@type': 'Organization', name: 'Instituição', url: 'https://i.org' },
      { '@type': 'Organization', name: 'Parceira' },
    ])
    const minimal = organizationJsonLd({ officialName: 'G' } as never, 'https://a.org')
    expect(minimal).toEqual({
      '@context': 'https://schema.org',
      '@type': 'ResearchOrganization',
      '@id': 'https://a.org/#grupo',
      name: 'G',
      url: 'https://a.org',
    })
  })

  it('breadcrumbs e serialização segura (não fecha a tag script)', () => {
    const crumbs = breadcrumbJsonLd(
      [
        { name: 'Início', path: '/' },
        { name: 'Linhas', path: '/linhas' },
      ],
      'https://a.org',
    )
    expect(crumbs.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://a.org' },
      { '@type': 'ListItem', position: 2, name: 'Linhas', item: 'https://a.org/linhas' },
    ])
    const text = serializeJsonLd({ name: '</script><script>alert(1)</script> & \u2028' })
    expect(text).not.toContain('</script>')
    expect(text).not.toContain('<')
    expect(text).not.toContain('&')
    expect(JSON.parse(text).name).toBe('</script><script>alert(1)</script> & \u2028')
  })
})

describe('consulta de redirecionamentos do proxy (cache curto)', () => {
  let now = 0
  afterEach(() => {
    now = 0
  })

  it('só consulta caminhos com slug, normaliza e guarda acertos e faltas por pouco tempo', async () => {
    const query = vi.fn(async (from: string) =>
      from === '/linhas/antiga' ? { to: '/linhas/nova', type: '301' } : null,
    )
    const lookup = createRedirectLookup(query, () => now)
    expect(await lookup('/admin')).toBeNull()
    expect(query).not.toHaveBeenCalled()

    expect(await lookup('/Linhas/Antiga/')).toEqual({ to: '/linhas/nova', status: 301 })
    expect(await lookup('/linhas/antiga')).toEqual({ to: '/linhas/nova', status: 301 })
    expect(query).toHaveBeenCalledTimes(1)

    expect(await lookup('/linhas/outra')).toBeNull()
    now += REDIRECT_CACHE_TTL_MS.miss + 1
    await lookup('/linhas/outra')
    expect(query).toHaveBeenCalledTimes(3)
  })

  it('302 quando cadastrado como temporário; ignora destino igual à origem', async () => {
    const lookup = createRedirectLookup(async (from) =>
      from === '/linhas/t' ? { to: '/linhas', type: '302' } : { to: from, type: '301' },
    )
    expect(await lookup('/linhas/t')).toEqual({ to: '/linhas', status: 302 })
    expect(await lookup('/linhas/loop')).toBeNull()
  })
})
