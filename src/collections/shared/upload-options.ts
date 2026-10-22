import type { AllowedFileType } from '../../lib/uploads/file-signature'

export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const satisfies readonly AllowedFileType['mime'][]

export const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  ...IMAGE_MIME_TYPES,
] as const satisfies readonly AllowedFileType['mime'][]

export const LICENSE_OPTIONS = [
  { label: 'Uso autorizado pelo grupo (Q12)', value: 'group-authorized' },
  {
    label: 'Todos os direitos reservados (com autorização do titular)',
    value: 'all-rights-reserved',
  },
  { label: 'CC BY 4.0', value: 'cc-by' },
  { label: 'CC BY-SA 4.0', value: 'cc-by-sa' },
  { label: 'CC BY-NC 4.0', value: 'cc-by-nc' },
  { label: 'CC BY-NC-SA 4.0', value: 'cc-by-nc-sa' },
  { label: 'CC BY-ND 4.0', value: 'cc-by-nd' },
  { label: 'CC BY-NC-ND 4.0', value: 'cc-by-nc-nd' },
  { label: 'CC0 / domínio público', value: 'cc0' },
]

export const MEDIA_SOURCE_OPTIONS = [
  { label: 'Acervo do grupo', value: 'group-archive' },
  { label: 'Produção própria do portal', value: 'portal-production' },
  { label: 'Cedida por integrante (com autorização)', value: 'member-provided' },
  { label: 'Terceiros (com licença)', value: 'third-party' },
  { label: 'Domínio público', value: 'public-domain' },
]
