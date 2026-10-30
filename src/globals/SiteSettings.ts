import type { GlobalConfig } from 'payload'

import { anyone, fieldIsAdmin, isAdminOrEditor } from '../access'
import { revalidateSiteLayout } from '../hooks/revalidate'
import { DEFAULT_ESSAY_LICENSE, ESSAY_LICENSES } from '../lib/editorial/essay'
import { SITE_FULL_NAME, SITE_SHORT_NAME } from '../lib/site/identity'

/**
 * Configurações do site. Matriz 14.3: SEO e textos (admin T · editor T); configurações
 * técnicas (admin T · editor L) — protegidas por acesso de campo.
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Configurações do site',
  admin: { group: 'Site' },
  access: { read: anyone, update: isAdminOrEditor },
  hooks: { afterChange: [revalidateSiteLayout] },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      label: 'Nome do grupo (exibição)',
      required: true,
      defaultValue: SITE_FULL_NAME,
      localized: true,
      maxLength: 120,
      admin: { description: 'Nome definido pelo coordenador (Q2).' },
    },
    {
      name: 'shortName',
      type: 'text',
      label: 'Nome curto',
      required: true,
      defaultValue: SITE_SHORT_NAME,
      localized: true,
      maxLength: 60,
      admin: { description: 'Usado em títulos de página e no cabeçalho em telas pequenas.' },
    },
    {
      name: 'defaultDescription',
      type: 'textarea',
      label: 'Descrição padrão (SEO)',
      localized: true,
      maxLength: 300,
    },
    {
      name: 'editorial',
      type: 'group',
      label: 'Blog e ensaios',
      fields: [
        {
          name: 'defaultLicense',
          type: 'select',
          label: 'Licença padrão dos ensaios',
          required: true,
          defaultValue: DEFAULT_ESSAY_LICENSE,
          options: ESSAY_LICENSES.map(({ value, label }) => ({ value, label })),
          admin: {
            description:
              'Usada quando o ensaio não define licença própria (planejamento 15.5; política editorial a confirmar — Q8).',
          },
        },
        {
          name: 'noticeComplement',
          type: 'textarea',
          label: 'Complemento do aviso editorial',
          localized: true,
          maxLength: 400,
          admin: {
            description:
              'Opcional. Acrescentado ao aviso de natureza ensaística de todos os ensaios (ex.: canal para pedidos de correção). As frases sobre revisão por pares e posição institucional são fixas.',
          },
        },
      ],
    },
    {
      name: 'technical',
      type: 'group',
      label: 'Configurações técnicas (somente administrador)',
      access: { update: fieldIsAdmin },
      fields: [
        {
          name: 'showIndicators',
          type: 'checkbox',
          label: 'Exibir indicadores públicos',
          defaultValue: false,
          admin: { description: 'Reservado para indicadores (M2/V3).' },
        },
      ],
    },
  ],
}
