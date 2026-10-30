import { describe, expect, it } from 'vitest'

import { revalidationPlan } from '@/lib/content/cache-tags'
import { blogPostingJsonLd } from '@/lib/content/jsonld'
import { pageParam } from '@/lib/content/paging'
import {
  categoryPath,
  essayPath,
  isRedirectCandidate,
  pathForDocument,
  tagPath,
} from '@/lib/content/paths'
import { internalLinkHref, uploadImage } from '@/lib/content/rich-text'
import { buildSitemap } from '@/lib/content/sitemap'
import {
  canViewEssayPublic,
  canViewPublic,
  essayListedWhere,
  essayPublicWhere,
  isEssayListed,
  publicWhere,
} from '@/lib/content/visibility'
import {
  countWords,
  essayCompletenessErrors,
  essayDescription,
  essayNotice,
  formatReference,
  natureLabel,
  normalizeDoi,
  readingTimeLabel,
  readingTimeMinutes,
  resolveLicense,
  validateDoi,
} from '@/lib/editorial/essay'
import { buildAtom, buildRss, escapeXml, type FeedItem } from '@/lib/editorial/feed'
import { sanitizeLexical } from '@/lib/editorial/sanitize-lexical'
import {
  actionLabel,
  applyTransition,
  availableTransitions,
  CHECKLIST_ITEMS,
  checkTransition,
  missingChecklistItems,
  saveModeFor,
  TRANSITIONS,
  wasEverPublished,
  WORKFLOW_STATES,
  type WorkflowState,
} from '@/lib/editorial/workflow'
import { hasValidCronSecret } from '@/collections/Essays/endpoints'

type TestNode = Record<string, unknown> & { children: TestNode[]; tag?: string; textStyle?: string }

const NOW = new Date('2026-10-30T12:00:00.000Z')
const editor = { kind: 'editorial' as const, userId: 7 }
const scheduler = { kind: 'scheduler' as const }
const fullChecklist = Object.fromEntries(CHECKLIST_ITEMS.map((item) => [item.name, true]))

const text = (value: string) => ({ type: 'text', text: value, format: 0, version: 1 })
const doc = (...children: unknown[]) => ({ root: { type: 'root', children } })
const paragraph = (...children: unknown[]) => ({ type: 'paragraph', children })

describe('máquina de estados do fluxo editorial (S05)', () => {
  it('aceita somente as transições do planejamento 10.2', () => {
    expect(TRANSITIONS.draft).toEqual(['in_review'])
    expect(TRANSITIONS.in_review).toEqual(['returned', 'approved'])
    expect(TRANSITIONS.archived).toEqual(['published'])
    for (const from of WORKFLOW_STATES) {
      for (const to of WORKFLOW_STATES) {
        const allowed = TRANSITIONS[from].includes(to)
        const result = checkTransition({
          from,
          to,
          actor: editor,
          now: NOW,
          comment: 'Comentário de revisão suficiente.',
          scheduledAt: '2026-11-01T12:00:00.000Z',
          checklist: fullChecklist,
        })
        if (!allowed) expect(result).toMatchObject({ ok: false, code: 'invalid_transition' })
      }
    }
  })

  it('rejeita rascunho → publicado (e qualquer salto de etapa)', () => {
    for (const to of [
      'published',
      'approved',
      'scheduled',
      'archived',
      'returned',
    ] as WorkflowState[]) {
      expect(checkTransition({ from: 'draft', to, actor: editor, now: NOW })).toMatchObject({
        ok: false,
        code: 'invalid_transition',
      })
    }
  })

  it('devolução exige comentário de revisão', () => {
    expect(
      checkTransition({
        from: 'in_review',
        to: 'returned',
        actor: editor,
        now: NOW,
        comment: '  ',
      }),
    ).toMatchObject({ ok: false, code: 'comment_required' })
    expect(
      checkTransition({
        from: 'in_review',
        to: 'returned',
        actor: editor,
        now: NOW,
        comment: 'Rever a seção 2 e as referências.',
      }),
    ).toEqual({ ok: true, mode: 'draft' })
  })

  it('envio e aprovação exigem ensaio completo; aprovação exige checklist completo', () => {
    expect(
      checkTransition({
        from: 'draft',
        to: 'in_review',
        actor: editor,
        now: NOW,
        completenessErrors: ['Informe o título.'],
      }),
    ).toMatchObject({ ok: false, code: 'incomplete', details: ['Informe o título.'] })
    const partial = checkTransition({
      from: 'in_review',
      to: 'approved',
      actor: editor,
      now: NOW,
      checklist: { ...fullChecklist, noPersonalData: false },
    })
    expect(partial).toMatchObject({ ok: false, code: 'checklist_incomplete' })
    expect(missingChecklistItems({})).toHaveLength(CHECKLIST_ITEMS.length)
    expect(
      checkTransition({
        from: 'in_review',
        to: 'approved',
        actor: editor,
        now: NOW,
        checklist: fullChecklist,
      }),
    ).toEqual({ ok: true, mode: 'draft' })
  })

  it('agendamento exige data futura (≥ 1 min) e não vale para texto já publicado', () => {
    const base = { from: 'approved' as const, to: 'scheduled' as const, actor: editor, now: NOW }
    expect(checkTransition(base)).toMatchObject({ code: 'schedule_required' })
    expect(checkTransition({ ...base, scheduledAt: '2026-10-30T12:00:30.000Z' })).toMatchObject({
      code: 'schedule_in_past',
    })
    expect(checkTransition({ ...base, scheduledAt: 'data inválida' })).toMatchObject({
      code: 'schedule_required',
    })
    expect(
      checkTransition({ ...base, scheduledAt: '2026-11-01T00:00:00.000Z', everPublished: true }),
    ).toMatchObject({ code: 'already_published' })
    expect(checkTransition({ ...base, scheduledAt: '2026-11-01T00:00:00.000Z' })).toEqual({
      ok: true,
      mode: 'publish',
    })
  })

  it('o agendador só conclui agendamentos vencidos (relógio controlado)', () => {
    const request = {
      from: 'scheduled' as const,
      to: 'published' as const,
      actor: scheduler,
      currentScheduledAt: '2026-10-30T12:05:00.000Z',
    }
    expect(checkTransition({ ...request, now: NOW })).toMatchObject({ code: 'not_due' })
    expect(checkTransition({ ...request, now: new Date('2026-10-30T12:05:00.000Z') })).toEqual({
      ok: true,
      mode: 'publish',
    })
    expect(
      checkTransition({ from: 'approved', to: 'published', actor: scheduler, now: NOW }),
    ).toMatchObject({ code: 'forbidden_actor' })
    expect(
      checkTransition({ from: 'published', to: 'archived', actor: scheduler, now: NOW }),
    ).toMatchObject({ code: 'forbidden_actor' })
  })

  it('modo de gravação: públicos publicam; cancelar agendamento despublica; correção é rascunho', () => {
    expect(saveModeFor('approved', 'published')).toBe('publish')
    expect(saveModeFor('approved', 'scheduled')).toBe('publish')
    expect(saveModeFor('published', 'archived')).toBe('publish')
    expect(saveModeFor('archived', 'published')).toBe('publish')
    expect(saveModeFor('scheduled', 'approved')).toBe('unpublish')
    expect(saveModeFor('published', 'in_review')).toBe('draft')
    expect(saveModeFor('draft', 'in_review')).toBe('draft')
  })

  it('registra quem submeteu, aprovou, agendou/publicou e arquivou, com histórico', () => {
    let state = applyTransition(
      { workflowStatus: 'draft', reviewHistory: [] },
      { from: 'draft', to: 'in_review', actor: editor, actorName: 'Editora', now: NOW },
    )
    expect(state).toMatchObject({ workflowStatus: 'in_review', submittedBy: 7 })
    state = applyTransition(state, {
      from: 'in_review',
      to: 'returned',
      actor: { kind: 'editorial', userId: 8 },
      actorName: 'Admin',
      now: NOW,
      comment: '  Ajustar título.  ',
    })
    expect(state.reviewHistory.at(-1)).toMatchObject({ to: 'returned', comment: 'Ajustar título.' })
    state = applyTransition(state, {
      from: 'in_review',
      to: 'approved',
      actor: { kind: 'editorial', userId: 8 },
      actorName: 'Admin',
      now: NOW,
    })
    expect(state).toMatchObject({ approvedBy: 8, approvedAt: NOW.toISOString() })
    state = applyTransition(state, {
      from: 'approved',
      to: 'scheduled',
      actor: { kind: 'editorial', userId: 8 },
      actorName: 'Admin',
      now: NOW,
      scheduledAt: '2026-11-02T10:00:00.000Z',
    })
    expect(state).toMatchObject({
      workflowStatus: 'scheduled',
      scheduledAt: '2026-11-02T10:00:00.000Z',
      publishedAt: '2026-11-02T10:00:00.000Z',
      publishedBy: 8,
    })
    const due = new Date('2026-11-02T10:01:00.000Z')
    state = applyTransition(state, {
      from: 'scheduled',
      to: 'published',
      actor: scheduler,
      actorName: 'Sistema',
      now: due,
    })
    expect(state).toMatchObject({ publishedAt: '2026-11-02T10:00:00.000Z', publishedBy: 8 })
    expect(state.reviewHistory.at(-1)).toMatchObject({ actor: null, actorName: 'Sistema' })
    state = applyTransition(state, {
      from: 'published',
      to: 'archived',
      actor: editor,
      actorName: 'Editora',
      now: due,
    })
    expect(state).toMatchObject({ archivedAt: due.toISOString(), archivedBy: 7 })
    state = applyTransition(state, {
      from: 'archived',
      to: 'published',
      actor: editor,
      actorName: 'Editora',
      now: due,
    })
    expect(state).toMatchObject({ archivedAt: null, archivedBy: null, workflowStatus: 'published' })
    expect(state.reviewHistory).toHaveLength(7)
  })

  it('cancelar agendamento limpa data e publicador; correção preserva a data original', () => {
    const cancelled = applyTransition(
      {
        workflowStatus: 'scheduled',
        scheduledAt: '2026-11-02T10:00:00.000Z',
        publishedAt: '2026-11-02T10:00:00.000Z',
        publishedBy: 8,
      },
      { from: 'scheduled', to: 'approved', actor: editor, actorName: 'Editora', now: NOW },
    )
    expect(cancelled).toMatchObject({ scheduledAt: null, publishedAt: null, publishedBy: null })

    const published = { workflowStatus: 'approved', publishedAt: '2026-10-01T00:00:00.000Z' }
    expect(wasEverPublished(published, NOW)).toBe(true)
    const republished = applyTransition(published, {
      from: 'approved',
      to: 'published',
      actor: editor,
      actorName: 'Editora',
      now: NOW,
    })
    expect(republished).toMatchObject({
      publishedAt: '2026-10-01T00:00:00.000Z',
      revisedAt: NOW.toISOString(),
    })
    expect(wasEverPublished({ workflowStatus: 'scheduled', publishedAt: '2026-10-01' }, NOW)).toBe(
      false,
    )
  })

  it('rótulos de ação e transições disponíveis para o painel', () => {
    expect(availableTransitions('approved')).toEqual(['scheduled', 'published', 'returned'])
    expect(availableTransitions('desconhecido')).toEqual(['in_review'])
    expect(actionLabel('in_review', 'returned')).toBe('Devolver com comentários')
    expect(actionLabel('draft', 'archived')).toContain('→')
  })
})

describe('ensaios: regras puras (S05)', () => {
  it('tempo de leitura (200 palavras/min, mínimo 1)', () => {
    const words = Array.from({ length: 450 }, (_, index) => `palavra${index}`).join(' ')
    expect(readingTimeMinutes(doc(paragraph(text(words))))).toBe(3)
    expect(readingTimeMinutes(null)).toBe(1)
    expect(countWords('Saúde é direito — de todos.')).toBe(5)
    expect(readingTimeLabel(1)).toBe('1 minuto de leitura')
    expect(readingTimeLabel(4)).toBe('4 minutos de leitura')
  })

  it('completude: título, resumo, natureza, categoria, texto e autoria', () => {
    expect(essayCompletenessErrors({})).toEqual(
      expect.arrayContaining([
        'Informe o título.',
        'Indique a natureza do texto.',
        'Escolha a categoria.',
        'Registre ao menos um autor.',
      ]),
    )
    const complete = {
      title: 'T',
      excerpt: 'R',
      nature: 'review',
      category: 3,
      content: doc(paragraph(text('Texto'))),
      authors: [{ role: 'author', person: 1 }],
    }
    expect(essayCompletenessErrors(complete)).toEqual([])
    expect(
      essayCompletenessErrors({ ...complete, authors: [{ role: 'guest', name: ' ' }] }),
    ).toContain('Autor 1: informe o nome do convidado.')
    expect(
      essayCompletenessErrors({ ...complete, authors: [{ role: 'co_author', person: 2 }] }),
    ).toContain('Indique o autor principal (ou um autor convidado).')
    expect(essayCompletenessErrors({ ...complete, authors: [{ role: 'author' }] })[0]).toMatch(
      /integrante cadastrado/,
    )
  })

  it('aviso editorial sempre inclui ausência de revisão por pares e posição institucional', () => {
    for (const nature of ['reflective_essay', 'group_news', 'interview', undefined]) {
      const notice = essayNotice(nature, '  ')
      expect(notice.peerReview).toMatch(/Não passou por revisão por pares/)
      expect(notice.institutional).toMatch(/não representam necessariamente posição institucional/)
      expect(notice.complement).toBeNull()
    }
    expect(essayNotice('review', 'Pedidos de correção pelo contato.').complement).toBe(
      'Pedidos de correção pelo contato.',
    )
    expect(natureLabel('science_communication')).toBe('Divulgação científica')
    expect(natureLabel('xyz')).toBe('Ensaio')
  })

  it('licença: a do ensaio, senão a padrão configurada, senão CC BY-NC-ND', () => {
    expect(resolveLicense('cc-by', 'cc-by-nc').value).toBe('cc-by')
    expect(resolveLicense(null, 'cc-by-nc').value).toBe('cc-by-nc')
    expect(resolveLicense(null, null).value).toBe('cc-by-nc-nd')
  })

  it('DOI e referências estruturadas (ABNT simplificado)', () => {
    expect(normalizeDoi('https://doi.org/10.1590/ABC.123')).toBe('10.1590/abc.123')
    expect(normalizeDoi('doi:10.1000/xyz')).toBe('10.1000/xyz')
    expect(normalizeDoi('11.1/x')).toBeNull()
    expect(validateDoi('')).toBe(true)
    expect(validateDoi('abc')).toMatch(/DOI inválido/)
    const ref = formatReference({
      authors: 'SOBRENOME, Nome',
      title: 'Título da obra',
      source: 'Revista',
      year: 2020,
      doi: '10.1000/xyz',
      url: 'https://exemplo.org',
      accessedAt: '2026-10-01T00:00:00.000Z',
    })
    expect(ref).toEqual({
      lead: 'SOBRENOME, Nome.',
      title: 'Título da obra.',
      rest: 'Revista, 2020.',
      doi: '10.1000/xyz',
      url: 'https://exemplo.org',
      accessed: '01/10/2026',
    })
    expect(essayDescription('  ', doc(paragraph(text('Corpo do texto'))))).toBe('Corpo do texto')
  })
})

describe('higienização do texto rico (colagem e API)', () => {
  it('remove estilos, nós desconhecidos e links perigosos; mantém o texto', () => {
    const dirty = {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            textStyle: 'color: red',
            children: [
              {
                type: 'text',
                text: '<script>alert(1)</script>',
                format: 1,
                style: 'font-size: 40px',
              },
              {
                type: 'link',
                fields: { linkType: 'custom', url: 'javascript:alert(1)' },
                children: [{ type: 'text', text: 'clique' }],
              },
              {
                type: 'link',
                fields: { linkType: 'custom', url: 'https://exemplo.org', newTab: 'sim' },
                children: [{ type: 'text', text: 'fonte' }],
              },
              { type: 'mention', text: 'inline desconhecido' },
            ],
          },
          {
            type: 'html',
            html: '<img src=x onerror=alert(1)>',
            children: [{ type: 'text', text: 'html colado' }],
          },
          { type: 'heading', tag: 'h1', children: [text('Título grande')] },
          { type: 'heading', tag: 'h6', children: [text('Título pequeno')] },
          { type: 'upload', relationTo: 'documents', value: 1 },
          { type: 'upload', relationTo: 'media', value: 2 },
          {
            type: 'list',
            listType: 'check',
            children: [
              { type: 'listitem', children: [text('item')] },
              { type: 'paragraph', children: [text('intruso')] },
            ],
          },
          { type: 'iframe' },
        ],
      },
    }
    const clean = sanitizeLexical(dirty)!
    const json = JSON.stringify(clean)
    expect(json).not.toMatch(/javascript:|font-size|color: red|onerror|"html"|"iframe"|documents/)
    const [p, html, h1, h6, upload, list] = clean.root.children as [
      TestNode,
      TestNode,
      TestNode,
      TestNode,
      TestNode,
      TestNode,
    ]
    expect(p.textStyle).toBe('')
    expect(p.children[0]).toMatchObject({ text: '<script>alert(1)</script>', style: '', format: 1 })
    expect(p.children[1]).toMatchObject({ type: 'text', text: 'clique' })
    expect(p.children[2]).toMatchObject({
      type: 'link',
      fields: { url: 'https://exemplo.org', newTab: false },
    })
    expect(p.children[3]).toMatchObject({ type: 'text', text: 'inline desconhecido' })
    expect(html).toMatchObject({ type: 'paragraph', children: [{ text: 'html colado' }] })
    expect(h1.tag).toBe('h2')
    expect(h6.tag).toBe('h4')
    expect(upload).toMatchObject({ type: 'upload', relationTo: 'media', value: 2 })
    expect(list).toMatchObject({ listType: 'bullet', tag: 'ul' })
    expect(list.children).toHaveLength(1)
    expect(clean.root.children).toHaveLength(6)
  })

  it('links internos só para coleções públicas; estado inválido vira null', () => {
    const clean = sanitizeLexical(
      doc(
        paragraph({
          type: 'link',
          fields: { linkType: 'internal', doc: { relationTo: 'users', value: 1 } },
          children: [text('conta')],
        }),
        paragraph({
          type: 'link',
          fields: { linkType: 'internal', doc: { relationTo: 'essays', value: 2 } },
          children: [text('ensaio')],
        }),
      ),
    )!
    const [first, second] = clean.root.children as TestNode[]
    expect(first?.children[0]?.type).toBe('text')
    expect(second?.children[0]?.type).toBe('link')
    expect(sanitizeLexical(null)).toBeNull()
    expect(sanitizeLexical({ root: null })).toBeNull()
  })
})

describe('visibilidade pública dos ensaios', () => {
  const published = {
    _status: 'published',
    workflowStatus: 'published',
    publishedAt: '2026-10-01T00:00:00.000Z',
  }

  it('publicado e data alcançada: visível e listado', () => {
    expect(canViewEssayPublic(published, NOW)).toBe(true)
    expect(isEssayListed(published, NOW)).toBe(true)
    expect(canViewPublic('essays', published as never)).toBe(true)
  })

  it('agendado: invisível até a data, visível depois (sem depender do job)', () => {
    const scheduled = {
      ...published,
      workflowStatus: 'scheduled',
      publishedAt: '2026-10-30T12:05:00.000Z',
    }
    expect(canViewEssayPublic(scheduled, NOW)).toBe(false)
    expect(canViewEssayPublic(scheduled, new Date('2026-10-30T12:05:00.000Z'))).toBe(true)
    expect(isEssayListed(scheduled, new Date('2026-10-30T12:06:00.000Z'))).toBe(true)
  })

  it('arquivado: visível pela URL, fora das listagens; rascunho/revisão nunca', () => {
    const archived = {
      ...published,
      workflowStatus: 'archived',
      archivedAt: '2026-10-20T00:00:00.000Z',
    }
    expect(canViewEssayPublic(archived, NOW)).toBe(true)
    expect(isEssayListed(archived, NOW)).toBe(false)
    for (const workflowStatus of ['draft', 'in_review', 'returned', 'approved']) {
      expect(canViewEssayPublic({ ...published, workflowStatus }, NOW)).toBe(false)
    }
    expect(canViewEssayPublic({ ...published, _status: 'draft' }, NOW)).toBe(false)
    expect(canViewEssayPublic({ ...published, publishedAt: null }, NOW)).toBe(false)
    expect(canViewEssayPublic(null)).toBe(false)
  })

  it('filtros de consulta equivalentes (avaliados no instante da consulta)', () => {
    expect(essayPublicWhere(NOW)).toEqual({
      and: [
        { _status: { equals: 'published' } },
        { workflowStatus: { in: ['scheduled', 'published', 'archived'] } },
        { publishedAt: { less_than_equal: NOW.toISOString() } },
      ],
    })
    expect(JSON.stringify(essayListedWhere(NOW))).toContain('"archivedAt":{"exists":false}')
    expect(JSON.stringify(publicWhere('essays'))).toContain('less_than_equal')
  })
})

describe('rotas, cache, sitemap, feeds e SEO do blog', () => {
  it('rotas e candidatos a 301', () => {
    expect(essayPath('a')).toBe('/blog/a')
    expect(categoryPath('b')).toBe('/blog/categoria/b')
    expect(tagPath('c')).toBe('/blog/tag/c')
    expect(pathForDocument('essays', 'x')).toBe('/blog/x')
    expect(pathForDocument('categories', 'x')).toBe('/blog/categoria/x')
    expect(pathForDocument('tags', 'x')).toBe('/blog/tag/x')
    expect(isRedirectCandidate('/blog/antigo')).toBe(true)
    expect(isRedirectCandidate('/blog/categoria/antiga')).toBe(true)
    expect(isRedirectCandidate('/blog/tag/antiga/')).toBe(true)
    expect(isRedirectCandidate('/blog')).toBe(false)
    expect(isRedirectCandidate('/blog/x/y')).toBe(false)
    expect(internalLinkHref({ relationTo: 'essays', value: { slug: 'ensaio' } })).toBe(
      '/blog/ensaio',
    )
  })

  it('revalidação de ensaios e taxonomia', () => {
    const plan = revalidationPlan('essays', { slug: 'novo' }, { slug: 'antigo' })
    expect(plan.tags).toEqual(['essays', 'sitemap', 'essay:novo', 'essay:antigo'])
    expect(plan.paths).toEqual(
      expect.arrayContaining([
        { path: '/' },
        { path: '/blog', type: 'layout' },
        { path: '/integrantes', type: 'layout' },
        { path: '/blog/novo' },
      ]),
    )
    expect(revalidationPlan('categories').tags).toEqual(['essay-taxonomy', 'essays', 'sitemap'])
    expect(revalidationPlan('tags').paths).toContainEqual({ path: '/blog', type: 'layout' })
  })

  it('sitemap inclui blog, ensaios listáveis, categorias e tags', () => {
    const urls = buildSitemap(
      {
        profileUpdatedAt: null,
        lines: [],
        pages: [],
        essays: [{ slug: 'e1', updatedAt: '2026-10-01' }],
        categories: [{ slug: 'bioetica', updatedAt: '2026-10-01' }],
        tags: [{ slug: 'autonomia', updatedAt: '2026-10-01' }],
      },
      'https://portal.example.org/',
    ).map((item) => item.url)
    expect(urls).toEqual([
      'https://portal.example.org/',
      'https://portal.example.org/blog',
      'https://portal.example.org/blog/e1',
      'https://portal.example.org/blog/categoria/bioetica',
      'https://portal.example.org/blog/tag/autonomia',
    ])
    expect(
      buildSitemap({ profileUpdatedAt: null, lines: [], pages: [], essays: [] }, 'https://x.org'),
    ).toHaveLength(1)
  })

  const item: FeedItem = {
    title: 'Ensaio <b>"teste"</b> & cia',
    slug: 'ensaio-teste',
    excerpt: 'Resumo com <script>alert(1)</script>',
    nature: 'reflective_essay',
    publishedAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-02T10:00:00.000Z',
    authors: [{ name: 'Autora Fictícia' }, { name: "O'Neil" }],
    category: { name: 'Bioética', slug: 'bioetica' },
    tags: [{ name: 'Autonomia' }],
  }

  it('RSS 2.0 escapado, com autoria, categoria e natureza', () => {
    const xml = buildRss([item], { siteUrl: 'https://x.org/', title: 'Blog', description: 'D' })
    expect(xml).toContain('<rss version="2.0"')
    expect(xml).toContain('<link>https://x.org/blog/ensaio-teste</link>')
    expect(xml).toContain('Ensaio &lt;b&gt;&quot;teste&quot;&lt;/b&gt; &amp; cia')
    expect(xml).toContain('&lt;script&gt;')
    expect(xml).not.toContain('<script>')
    expect(xml).toContain('<dc:creator>Autora Fictícia, O&apos;Neil</dc:creator>')
    expect(xml).toContain('<category>Bioética</category>')
    expect(xml).toContain('[Ensaio reflexivo]')
    expect(xml).toContain('rel="self" type="application/rss+xml"')
    expect(buildRss([], { siteUrl: 'https://x.org', title: 'B', description: 'D' })).not.toContain(
      '<item>',
    )
  })

  it('Atom escapado', () => {
    const xml = buildAtom([item], { siteUrl: 'https://x.org', title: 'Blog', description: 'D' })
    expect(xml).toContain('<feed xmlns="http://www.w3.org/2005/Atom"')
    expect(xml).toContain('<author><name>Autora Fictícia</name></author>')
    expect(xml).toContain('<updated>2026-10-02T10:00:00.000Z</updated>')
    expect(xml).not.toContain('<script>')
    expect(escapeXml('a\u0001b')).toBe('ab')
  })

  it('JSON-LD BlogPosting com autoria e licença, sem perfil para quem não autorizou', () => {
    const data = blogPostingJsonLd(
      {
        title: 'Título',
        natureLabel: 'Resenha',
        publishedAt: '2026-10-01',
        authors: [
          { name: 'Com perfil', personSlug: 'com-perfil' },
          { name: 'Sem perfil', personSlug: null },
        ],
        licenseUrl: 'https://creativecommons.org/licenses/by-nc-nd/4.0/deed.pt-br',
        tags: ['a', 'b'],
      },
      { siteUrl: 'https://x.org', path: '/blog/t' },
    )
    expect(data).toMatchObject({
      '@type': 'BlogPosting',
      genre: 'Resenha',
      keywords: 'a, b',
      publisher: { '@id': 'https://x.org/#grupo' },
    })
    expect(data.author).toEqual([
      { '@type': 'Person', name: 'Com perfil', url: 'https://x.org/integrantes/com-perfil' },
      { '@type': 'Person', name: 'Sem perfil' },
    ])
  })

  it('paginação por query string e imagem do texto rico', () => {
    expect(pageParam('3')).toBe(3)
    expect(pageParam(['2'])).toBe(2)
    expect(pageParam('0')).toBe(1)
    expect(pageParam('-1')).toBe(1)
    expect(pageParam('abc')).toBe(1)
    expect(pageParam('99999')).toBe(1000)
    expect(pageParam(undefined)).toBe(1)
    expect(uploadImage({ type: 'upload', relationTo: 'media', value: 5 })).toBeNull()
    expect(
      uploadImage({
        type: 'upload',
        relationTo: 'media',
        value: { url: 'javascript:x', alt: 'a' } as never,
      }),
    ).toBeNull()
    expect(
      uploadImage({
        type: 'upload',
        relationTo: 'media',
        value: {
          url: '/api/media/file/a.png',
          alt: 'Descrição',
          credit: 'Fulano',
          width: 10,
        } as never,
      }),
    ).toEqual({
      url: '/api/media/file/a.png',
      alt: 'Descrição',
      width: 10,
      height: null,
      caption: null,
      credit: 'Fulano',
    })
  })

  it('segredo do cron: comparação segura e mínimo de 16 caracteres', () => {
    const secret = 'segredo-de-teste-com-32-caracteres'
    expect(hasValidCronSecret(`Bearer ${secret}`, secret)).toBe(true)
    expect(hasValidCronSecret(`Bearer ${secret}x`, secret)).toBe(false)
    expect(hasValidCronSecret(secret, secret)).toBe(false)
    expect(hasValidCronSecret('Bearer curto', 'curto')).toBe(false)
    expect(hasValidCronSecret(null, secret)).toBe(false)
    expect(hasValidCronSecret('Bearer x', undefined)).toBe(false)
  })
})
