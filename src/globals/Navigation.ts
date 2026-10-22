import type { GlobalConfig } from 'payload'

import { anyone, isAdminOrEditor } from '../access'
import { revalidateSiteLayout } from '../hooks/revalidate'
import { linkFields } from './shared'

/** Navegação principal (matriz 14.3: admin T · editor T · visitante L). */
export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Navegação',
  admin: { group: 'Site' },
  access: { read: anyone, update: isAdminOrEditor },
  hooks: { afterChange: [revalidateSiteLayout] },
  fields: [
    {
      name: 'items',
      type: 'array',
      label: 'Itens do menu principal',
      maxRows: 8,
      labels: { singular: 'Item', plural: 'Itens' },
      admin: {
        description:
          'Inclua apenas páginas que já existem. O menu aparece no cabeçalho e no menu do celular.',
      },
      fields: linkFields('Texto curto exibido no menu.'),
    },
  ],
}
