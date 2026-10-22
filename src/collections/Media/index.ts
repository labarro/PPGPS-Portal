import type { CollectionConfig } from 'payload'

import { adminEditorOrPublic, isAdminOrEditor } from '../../access'
import { secureUpload } from '../../hooks/upload-security'
import { IMAGE_MIME_TYPES, LICENSE_OPTIONS, MEDIA_SOURCE_OPTIONS } from '../shared/upload-options'

/**
 * Mídia (S02): imagens com autorização, origem e acessibilidade registradas.
 *
 * - Tipos aceitos por magic bytes: JPEG, PNG, WebP, AVIF (até 10 MB). SVG bloqueado.
 * - `alt`, `credit`, `license` e `source` obrigatórios (Q12: origem do material).
 * - Leitura pública somente de imagens SEM pessoas identificáveis. Imagens com pessoas
 *   identificáveis exigem consentimento individual (`media.consentRecord`, S04) e, até lá,
 *   ficam restritas a admin/editor — inclusive o arquivo em `/api/media/file/...`.
 * - Arquivos servidos pela rota do Payload, que aplica este controle de acesso antes de ler
 *   o objeto no bucket privado (ADR-0011).
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Mídia', plural: 'Mídias' },
  admin: {
    group: 'Conteúdo',
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'credit', 'license', 'containsIdentifiablePeople'],
  },
  access: {
    read: adminEditorOrPublic({ containsIdentifiablePeople: { not_equals: true } }),
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  hooks: {
    beforeOperation: [secureUpload({ accept: IMAGE_MIME_TYPES })],
  },
  upload: {
    mimeTypes: [...IMAGE_MIME_TYPES],
    // Variantes de imagem ficam para quando houver páginas que as usem (S03+).
    // Recorte e ponto focal mantidos (planejamento 13.3: Media.focalPoint; mudança aditiva).
    crop: true,
    focalPoint: true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Texto alternativo',
      required: true,
      localized: true,
      maxLength: 300,
      admin: { description: 'Descreva a imagem para quem usa leitor de tela (obrigatório).' },
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Legenda',
      localized: true,
      maxLength: 500,
    },
    {
      name: 'credit',
      type: 'text',
      label: 'Crédito (autoria da imagem)',
      required: true,
      maxLength: 200,
    },
    {
      name: 'license',
      type: 'select',
      label: 'Licença ou autorização de uso',
      required: true,
      options: LICENSE_OPTIONS,
    },
    {
      name: 'source',
      type: 'select',
      label: 'Origem do material',
      required: true,
      options: MEDIA_SOURCE_OPTIONS,
    },
    {
      name: 'sourceNote',
      type: 'text',
      label: 'Detalhes da origem',
      maxLength: 300,
      admin: { description: 'Ex.: evento, data, quem forneceu ou URL da fonte.' },
    },
    {
      name: 'containsIdentifiablePeople',
      type: 'checkbox',
      label: 'Contém pessoas identificáveis',
      required: true,
      defaultValue: false,
      admin: {
        description:
          'Marque se alguém pode ser reconhecido. Nesse caso a imagem não é exibida publicamente até haver autorização individual registrada (S04).',
      },
    },
  ],
}
