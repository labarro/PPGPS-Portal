import type { GlobalConfig } from 'payload'

import { anyone, isAdminOrEditor } from '../access'
import { revalidateSiteLayout } from '../hooks/revalidate'
import { linkFields } from './shared'

/**
 * Rodapé (Q1: sem aviso ostensivo de portal não oficial; Q2: sem logotipos institucionais).
 * Referências institucionais marcadas para o rodapé virão do `GroupProfile` (S03).
 */
export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Rodapé',
  admin: { group: 'Site' },
  access: { read: anyone, update: isAdminOrEditor },
  hooks: { afterChange: [revalidateSiteLayout] },
  fields: [
    {
      name: 'about',
      type: 'textarea',
      label: 'Texto de apresentação curta',
      localized: true,
      maxLength: 400,
    },
    {
      name: 'contactEmail',
      type: 'email',
      label: 'E-mail de contato do grupo',
      admin: { description: 'Use um e-mail institucional do grupo, nunca um e-mail pessoal.' },
    },
    {
      name: 'links',
      type: 'array',
      label: 'Links',
      maxRows: 10,
      labels: { singular: 'Link', plural: 'Links' },
      fields: linkFields('Ex.: Espelho do grupo no DGP/CNPq.'),
    },
    {
      name: 'legalLinks',
      type: 'array',
      label: 'Páginas legais',
      maxRows: 6,
      labels: { singular: 'Página', plural: 'Páginas' },
      admin: {
        description: 'Privacidade, acessibilidade e "Sobre o portal" (páginas criadas na S06).',
      },
      fields: linkFields('Ex.: Privacidade.'),
    },
  ],
}
