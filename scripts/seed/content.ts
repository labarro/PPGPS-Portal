/**
 * Seed de CONTEÚDO INSTITUCIONAL da S03 (homologação, previews e local). Idempotente e
 * conservador: só preenche o que ainda não existe — nunca sobrescreve edições do coordenador.
 *
 * Uso: `pnpm seed:content`. Em produção, somente no pipeline de lançamento com
 * `SEED_CONTENT_ALLOW_PRODUCTION=true` (S06): mesmo conteúdo público verificado, textos
 * provisórios sinalizados, sem pessoas, ensaios ou qualquer dado fictício.
 * Fonte e data de cada dado: `scripts/seed/data/institutional.ts`.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import { DEFAULT_HERO_ACTIONS, DEFAULT_HOME_SECTIONS } from '../../src/lib/content/homepage'
import { LEGAL_DEFAULTS } from '../../src/lib/content/legal-defaults'
import { LEGAL_PAGES, type LegalPageSlug } from '../../src/lib/content/paths'
import { resolveAppEnv } from '../../src/lib/env/app-env'
import { DEFAULT_NAVIGATION } from '../../src/lib/site/chrome'
import type { GroupProfile, Page, ResearchLine } from '../../src/payload-types'
import { categoriesSeed } from './data/editorial'
import { groupProfileSeed, researchLinesSeed } from './data/institutional'
import { bulletList, heading, linkParagraph, paragraph, richText } from './lexical'

/** Menus padrão gravados pela S03 (antes de /integrantes) e pela S04 (antes de /blog). */
const LEGACY_NAVIGATION_HREFS = [
  ['/', '/o-grupo', '/linhas'].join('|'),
  ['/', '/o-grupo', '/linhas', '/integrantes'].join('|'),
]

/** Seções habilitadas nos padrões da S03 e da S04 (antes dos destaques do blog, S05). */
const LEGACY_ENABLED_SECTIONS = [
  ['about', 'research-lines', 'institutional-references'].join('|'),
  ['about', 'research-lines', 'featured-members', 'institutional-references'].join('|'),
]

/** Página legal (S06) em Lexical, a partir do texto padrão versionado. */
function legalLayout(slug: LegalPageSlug) {
  const doc = LEGAL_DEFAULTS[slug]
  const nodes = doc.sections.flatMap((section) => [
    heading(section.heading),
    ...(section.paragraphs ?? []).map((p) =>
      typeof p === 'string'
        ? paragraph(p)
        : linkParagraph(p.before, p.link.label, p.link.href, p.after ?? ''),
    ),
    ...(section.items ? [bulletList(section.items)] : []),
  ])
  return [{ blockType: 'richText' as const, content: richText(...nodes) }]
}

async function main(): Promise<void> {
  const env = resolveAppEnv(process.env.APP_ENV)
  // Produção (S06): somente com opt-in explícito do pipeline de lançamento. O seed é
  // idempotente e nunca sobrescreve edições; não cria pessoas, ensaios nem dados fictícios.
  if (env === 'production' && process.env.SEED_CONTENT_ALLOW_PRODUCTION !== 'true') {
    throw new Error(
      'Seed de conteúdo bloqueado em produção sem SEED_CONTENT_ALLOW_PRODUCTION=true (pipeline de lançamento).',
    )
  }

  const payload = await getPayload({ config })
  const context = { skipRevalidation: true }
  const log = (message: string) => payload.logger.info(`[seed:content] ${message}`)

  // Perfil do grupo: somente se nunca foi salvo (nem como rascunho).
  const profile = await payload.findGlobal({
    slug: 'group-profile',
    draft: true,
    overrideAccess: true,
    depth: 0,
  })
  if (profile?.officialName && profile.updatedAt) {
    log('Perfil do grupo já existe; mantido.')
  } else {
    await payload.updateGlobal({
      slug: 'group-profile',
      data: {
        ...(groupProfileSeed as unknown as Partial<GroupProfile>),
        _status: 'published',
      },
      overrideAccess: true,
      context,
    })
    log('Perfil do grupo publicado (textos provisórios marcados).')
  }

  // Linhas temáticas: somente se a coleção estiver vazia (o coordenador pode renomear slugs).
  const lines = await payload.count({ collection: 'research-lines', overrideAccess: true })
  if (lines.totalDocs > 0) {
    log(`Linhas temáticas já cadastradas (${lines.totalDocs}); mantidas.`)
  } else {
    for (const line of researchLinesSeed) {
      await payload.create({
        collection: 'research-lines',
        data: {
          ...(line as unknown as Partial<ResearchLine>),
          name: line.name,
          slug: line.slug,
          summary: line.summary,
          order: line.order,
          active: true,
          provisional: true,
          _status: 'published',
        },
        overrideAccess: true,
        context,
      })
      log(`Linha temática "${line.name}" publicada.`)
    }
  }

  // Página inicial: publica a configuração padrão (seções e chamadas) se ainda não existir.
  const homepage = await payload.findGlobal({
    slug: 'homepage',
    draft: true,
    overrideAccess: true,
    depth: 0,
  })
  const isLegacyDefault =
    !!homepage?.sections &&
    homepage.sections.length === DEFAULT_HOME_SECTIONS.length &&
    homepage.sections.every(
      (section, index) =>
        section.kind === DEFAULT_HOME_SECTIONS[index]?.kind && !section.heading && !section.intro,
    ) &&
    LEGACY_ENABLED_SECTIONS.includes(
      homepage.sections
        .filter((section) => section.enabled ?? true)
        .map((section) => section.kind)
        .join('|'),
    )
  if (homepage?.updatedAt && isLegacyDefault) {
    // Seções idênticas a um padrão anterior (nunca editadas): habilita as seções disponíveis
    // (S04: integrantes em destaque; S05: destaques do blog). O site só exibe cada seção
    // quando houver conteúdo público.
    await payload.updateGlobal({
      slug: 'homepage',
      data: { sections: DEFAULT_HOME_SECTIONS, _status: 'published' },
      overrideAccess: true,
      context,
    })
    log('Página inicial padrão atualizada com as seções disponíveis (integrantes e blog).')
  } else if (homepage?.updatedAt && homepage.sections && homepage.sections.length > 0) {
    log('Página inicial já configurada; mantida.')
  } else {
    await payload.updateGlobal({
      slug: 'homepage',
      data: {
        hero: { eyebrow: 'Grupo de pesquisa', actions: DEFAULT_HERO_ACTIONS },
        sections: DEFAULT_HOME_SECTIONS,
        _status: 'published',
      },
      overrideAccess: true,
      context,
    })
    log('Página inicial publicada com as seções padrão.')
  }

  // Menu principal: só quando ainda não há itens cadastrados.
  const navigation = await payload.findGlobal({
    slug: 'navigation',
    overrideAccess: true,
    depth: 0,
  })
  const currentHrefs = (navigation.items ?? []).map((item) => item.href).join('|')
  if (LEGACY_NAVIGATION_HREFS.includes(currentHrefs)) {
    // Menu idêntico a um padrão anterior (nunca editado): recebe "Integrantes" (S04) e "Blog" (S05).
    await payload.updateGlobal({
      slug: 'navigation',
      data: { items: DEFAULT_NAVIGATION },
      overrideAccess: true,
      context,
    })
    log('Menu padrão anterior atualizado (Integrantes e Blog).')
  } else if (navigation.items && navigation.items.length > 0) {
    log('Menu principal já configurado; mantido.')
  } else {
    await payload.updateGlobal({
      slug: 'navigation',
      data: { items: DEFAULT_NAVIGATION },
      overrideAccess: true,
      context,
    })
    log('Menu principal preenchido (Início, O grupo, Linhas temáticas, Integrantes, Blog).')
  }

  // Categorias do blog (S05): Bioética e Promoção da Saúde (Q7), somente se não houver nenhuma.
  const categories = await payload.count({ collection: 'categories', overrideAccess: true })
  if (categories.totalDocs > 0) {
    log(`Categorias do blog já cadastradas (${categories.totalDocs}); mantidas.`)
  } else {
    for (const category of categoriesSeed) {
      await payload.create({
        collection: 'categories',
        data: { ...category },
        overrideAccess: true,
        context,
      })
      log(`Categoria "${category.name}" criada.`)
    }
  }

  // Páginas legais (S06): cria somente as que ainda não existem (o coordenador edita no painel).
  for (const legal of LEGAL_PAGES) {
    const existing = await payload.count({
      collection: 'pages',
      where: { slug: { equals: legal.slug } },
      overrideAccess: true,
    })
    if (existing.totalDocs > 0) {
      log(`Página legal "${legal.slug}" já existe; mantida.`)
      continue
    }
    const doc = LEGAL_DEFAULTS[legal.slug]
    await payload.create({
      collection: 'pages',
      data: {
        title: doc.title,
        slug: legal.slug,
        summary: doc.summary,
        layout: legalLayout(legal.slug) as unknown as Page['layout'],
        _status: 'published',
      },
      overrideAccess: true,
      context,
    })
    log(`Página legal "${legal.slug}" publicada (texto padrão).`)
  }

  await payload.destroy()
}

// `payload run` encerra o processo assim que o import termina: o await de topo é obrigatório.
await main()
