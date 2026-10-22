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
import type { GroupProfile, ResearchLine } from '../../src/payload-types'
import { groupProfileSeed, researchLinesSeed } from './data/institutional'

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
  if (homepage?.updatedAt && homepage.sections && homepage.sections.length > 0) {
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

  await payload.destroy()
}

// `payload run` encerra o processo assim que o import termina: o await de topo é obrigatório.
await main()
