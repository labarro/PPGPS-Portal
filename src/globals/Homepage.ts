import type { GlobalConfig } from 'payload'

import { isAdminOrEditor } from '../access'
import { publishedOnlyForPublicGlobal } from '../hooks/published-only'
import { revalidateGlobal } from '../hooks/revalidate'
import {
  DEFAULT_HERO_ACTIONS,
  DEFAULT_HOME_SECTIONS,
  HOME_SECTION_OPTIONS,
  validateHomeSections,
} from '../lib/content/homepage'
import { PUBLISHED_GLOBAL_WHERE } from '../lib/content/visibility'
import { linkFields } from './shared'

/**
 * Página inicial (planejamento 8.1): seções ordenáveis (arraste) e ocultáveis. Seções de
 * módulos futuros existem no cadastro, mas só são exibidas quando o módulo existir e houver
 * conteúdo — até lá ficam ocultas no site, mesmo marcadas.
 */
export const Homepage: GlobalConfig = {
  slug: 'homepage',
  label: 'Página inicial',
  admin: {
    group: 'Site',
    description:
      'Ordem e visibilidade das seções da página inicial. Use "Publicar" para atualizar o site.',
  },
  versions: { drafts: true, max: 30 },
  access: {
    read: ({ req }) => (isAdminOrEditor({ req }) ? true : PUBLISHED_GLOBAL_WHERE),
    readVersions: isAdminOrEditor,
    update: isAdminOrEditor,
  },
  hooks: {
    beforeOperation: [publishedOnlyForPublicGlobal],
    afterChange: [revalidateGlobal('homepage')],
  },
  fields: [
    {
      name: 'hero',
      type: 'group',
      label: 'Destaque principal (hero)',
      fields: [
        {
          name: 'eyebrow',
          type: 'text',
          label: 'Chamada curta acima do nome',
          localized: true,
          maxLength: 60,
          defaultValue: 'Grupo de pesquisa',
        },
        {
          name: 'purpose',
          type: 'textarea',
          label: 'Frase de propósito',
          localized: true,
          maxLength: 400,
          admin: {
            description: 'Opcional. Se vazia, usa a frase de propósito do Perfil do grupo.',
          },
        },
        {
          name: 'actions',
          type: 'array',
          label: 'Chamadas (botões)',
          labels: { singular: 'Chamada', plural: 'Chamadas' },
          maxRows: 2,
          defaultValue: DEFAULT_HERO_ACTIONS,
          fields: linkFields('Ex.: Conheça as linhas temáticas.'),
        },
      ],
    },
    {
      name: 'sections',
      type: 'array',
      label: 'Seções',
      labels: { singular: 'Seção', plural: 'Seções' },
      maxRows: HOME_SECTION_OPTIONS.length,
      defaultValue: DEFAULT_HOME_SECTIONS,
      validate: (value: unknown) => validateHomeSections(value),
      admin: {
        description:
          'Arraste para reordenar; desmarque "Exibir" para ocultar. Seções sem conteúdo nunca aparecem.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'kind',
              type: 'select',
              label: 'Seção',
              required: true,
              options: HOME_SECTION_OPTIONS.map(({ label, value }) => ({ label, value })),
            },
            {
              name: 'enabled',
              type: 'checkbox',
              label: 'Exibir',
              defaultValue: true,
            },
          ],
        },
        {
          name: 'heading',
          type: 'text',
          label: 'Título da seção',
          localized: true,
          maxLength: 120,
          admin: { description: 'Opcional; há um título padrão para cada seção.' },
        },
        {
          name: 'intro',
          type: 'textarea',
          label: 'Texto de introdução',
          localized: true,
          maxLength: 400,
        },
      ],
    },
  ],
}
