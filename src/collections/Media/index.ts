import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { adminEditorOrPublic, fieldIsAdminOrEditor, isAdminOrEditor } from '../../access'
import { grantsPhoto } from '../../lib/people/consent'
import { secureUpload } from '../../hooks/upload-security'
import { IMAGE_MIME_TYPES, LICENSE_OPTIONS, MEDIA_SOURCE_OPTIONS } from '../shared/upload-options'

/**
 * Mídia (S02): imagens com autorização, origem e acessibilidade registradas.
 *
 * - Tipos aceitos por magic bytes: JPEG, PNG, WebP, AVIF (até 10 MB). SVG bloqueado.
 * - `alt`, `credit`, `license` e `source` obrigatórios (Q12: origem do material).
 * - Leitura pública de imagens SEM pessoas identificáveis ou, quando há pessoas
 *   identificáveis, somente com autorização de foto vigente vinculada (`consentRecord`, S04;
 *   `publicConsent` é calculado). Sem isso ficam restritas a admin/editor — inclusive o
 *   arquivo em `/api/media/file/...`. A revogação retira a imagem imediatamente.
 * - Arquivos servidos pela rota do Payload, que aplica este controle de acesso antes de ler
 *   o objeto no bucket privado (ADR-0011).
 */

/** `publicConsent`: imagem com pessoas identificáveis e autorização de foto vigente. */
export const derivePublicConsent: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const merged = { ...(originalDoc ?? {}), ...data } as Record<string, unknown>
  const raw = merged.consentRecord
  const id = raw && typeof raw === 'object' ? (raw as { id?: number }).id : raw
  if (!merged.containsIdentifiablePeople || id == null) {
    data.publicConsent = false
    return data
  }
  const record = await req.payload
    .findByID({ collection: 'consent-records', id: id as number, depth: 0, overrideAccess: true, req })
    .catch(() => null)
  data.publicConsent = grantsPhoto(record)
  return data
}

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Mídia', plural: 'Mídias' },
  admin: {
    group: 'Conteúdo',
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'credit', 'license', 'containsIdentifiablePeople'],
  },
  access: {
    read: adminEditorOrPublic({
      or: [
        { containsIdentifiablePeople: { not_equals: true } },
        { publicConsent: { equals: true } },
      ],
    }),
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  hooks: {
    beforeOperation: [secureUpload({ accept: IMAGE_MIME_TYPES })],
    beforeChange: [derivePublicConsent],
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
          'Marque se alguém pode ser reconhecido. Nesse caso a imagem só é exibida publicamente com autorização de foto vigente vinculada abaixo.',
      },
    },
    {
      name: 'consentRecord',
      type: 'relationship',
      relationTo: 'consent-records',
      label: 'Autorização de imagem',
      access: { read: fieldIsAdminOrEditor },
      // Sem filtro de revogação: a referência histórica deve continuar válida após revogar.
      filterOptions: { scopes: { in: ['photo'] } },
      admin: {
        condition: (data) => !!data?.containsIdentifiablePeople,
        description:
          'Autorização individual com o escopo "Fotografia" (Consentimentos). Sem ela a imagem permanece privada.',
      },
    },
    {
      name: 'publicConsent',
      type: 'checkbox',
      label: 'Liberada por autorização de foto',
      defaultValue: false,
      index: true,
      access: { read: fieldIsAdminOrEditor, create: () => false, update: () => false },
      admin: { readOnly: true, position: 'sidebar', description: 'Calculado.' },
    },
  ],
}
