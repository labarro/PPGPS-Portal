import type { CollectionConfig } from 'payload'

import { personPath } from '../../lib/content/paths'
import { peopleAccess } from './access'
import { personFields } from './fields'
import { peopleHooks } from './hooks'

/**
 * Pessoas (planejamento 8.2 e 13.3; ADR-0004): indivíduo acadêmico, distinto de conta de
 * acesso. Perfil público SOMENTE com consentimento `public_profile` vigente — inclusive
 * docentes e líderes (Q4: a autorização do grupo não substitui a individual).
 * Cadastro e manutenção somente pelo coordenador (`editor`) e pelo desenvolvedor (`admin`).
 */
export const People: CollectionConfig = {
  slug: 'people',
  labels: { singular: 'Pessoa', plural: 'Pessoas' },
  admin: {
    group: 'Integrantes',
    useAsTitle: 'fullName',
    defaultColumns: ['fullName', 'slug', 'consentStatus', 'visibility', 'archivedAt', 'updatedAt'],
    listSearchableFields: ['fullName', 'citationName', 'orcid', 'lattesUrl'],
    description:
      'Integrantes e ex-integrantes do grupo. O perfil só aparece em /integrantes com autorização individual "Perfil público" vigente.',
    preview: (doc) => (typeof doc?.slug === 'string' ? personPath(doc.slug) : null),
  },
  defaultSort: 'fullName',
  access: peopleAccess,
  hooks: peopleHooks,
  fields: personFields,
}
