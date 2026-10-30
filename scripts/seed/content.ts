/**
 * Seed de CONTEÚDO INSTITUCIONAL da S03 (homologação, previews e local). Idempotente e
 * conservador: só preenche o que ainda não existe — nunca sobrescreve edições do coordenador.
 *
 * Uso: `pnpm seed:content`. Bloqueado em produção (a carga de produção é da S06).
 * Fonte e data de cada dado: `scripts/seed/data/institutional.ts`.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import { DEFAULT_HERO_ACTIONS, DEFAULT_HOME_SECTIONS } from '../../src/lib/content/homepage'
import { resolveAppEnv } from '../../src/lib/env/app-env'
import { DEFAULT_NAVIGATION } from '../../src/lib/site/chrome'
import type { GroupProfile, ResearchLine } from '../../src/payload-types'
import { groupProfileSeed, researchLinesSeed } from './data/institutional'

/** Menu padrão gravado pela S03 (antes de existir /integrantes). */
const S03_NAVIGATION_HREFS = ['/', '/o-grupo', '/linhas'].join('|')

async function main(): Promise<void> {
  const env = resolveAppEnv(process.env.APP_ENV)
  if (env === 'production') {
    throw new Error('Seed de conteúdo bloqueado em produção (carga de produção: S06).')
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
  const isS03Default =
    !!homepage?.sections &&
    homepage.sections.length === DEFAULT_HOME_SECTIONS.length &&
    homepage.sections.every(
      (section, index) =>
        section.kind === DEFAULT_HOME_SECTIONS[index]?.kind &&
        !section.heading &&
        !section.intro &&
        (section.enabled ?? true) ===
          (section.kind === 'featured-members' ? false : DEFAULT_HOME_SECTIONS[index]?.enabled),
    )
  if (homepage?.updatedAt && isS03Default) {
    // Seções idênticas ao padrão da S03: habilita "Integrantes em destaque" (disponível na S04).
    // O site só exibe a seção quando houver perfis autorizados.
    await payload.updateGlobal({
      slug: 'homepage',
      data: { sections: DEFAULT_HOME_SECTIONS, _status: 'published' },
      overrideAccess: true,
      context,
    })
    log('Página inicial padrão da S03 atualizada com "Integrantes em destaque".')
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
  if (currentHrefs === S03_NAVIGATION_HREFS) {
    // Menu idêntico ao padrão da S03 (nunca editado): recebe o item "Integrantes" (S04).
    await payload.updateGlobal({
      slug: 'navigation',
      data: { items: DEFAULT_NAVIGATION },
      overrideAccess: true,
      context,
    })
    log('Menu padrão da S03 atualizado com "Integrantes".')
  } else if (navigation.items && navigation.items.length > 0) {
    log('Menu principal já configurado; mantido.')
  } else {
    await payload.updateGlobal({
      slug: 'navigation',
      data: { items: DEFAULT_NAVIGATION },
      overrideAccess: true,
      context,
    })
    log('Menu principal preenchido (Início, O grupo, Linhas temáticas, Integrantes).')
  }

  await payload.destroy()
}

// `payload run` encerra o processo assim que o import termina: o await de topo é obrigatório.
await main()
