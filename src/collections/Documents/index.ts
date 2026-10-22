import type { CollectionConfig } from 'payload'

import { adminEditorOrPublic, isAdminOrEditor } from '../../access'
import { secureUpload } from '../../hooks/upload-security'
import { DOCUMENT_MIME_TYPES, LICENSE_OPTIONS } from '../shared/upload-options'

export const DOCUMENT_VISIBILITY = ['public', 'members', 'admin'] as const

/**
 * Documentos (S02; planejamento 13.3 e 17.1).
 *
 * - `visibility`: `public` (qualquer pessoa), `members` (reservado — sem contas de
 *   integrantes no MVP, Q5, logo equivale a restrito) e `admin` (somente admin/editor).
 * - Visitante só lê documentos `public`; o mesmo filtro vale para o arquivo em
 *   `/api/documents/file/...`, verificado antes de qualquer acesso ao bucket.
 * - Download por URL assinada de curta duração (5 min), gerada só após a verificação de
 *   acesso (ADR-0011). O bucket é privado e sem listagem pública.
 * - PDF até 25 MB; imagens (ex.: comprovantes digitalizados) até 10 MB.
 */
export const Documents: CollectionConfig = {
  slug: 'documents',
  labels: { singular: 'Documento', plural: 'Documentos' },
  admin: {
    group: 'Conteúdo',
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'visibility', 'license', 'updatedAt'],
  },
  access: {
    read: adminEditorOrPublic({ visibility: { equals: 'public' } }),
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  hooks: {
    beforeOperation: [secureUpload({ accept: DOCUMENT_MIME_TYPES })],
  },
  upload: {
    mimeTypes: [...DOCUMENT_MIME_TYPES],
    crop: false,
    focalPoint: false,
    // Documentos são baixados, nunca renderizados no contexto do site.
    modifyResponseHeaders: ({ headers }) => {
      headers.set('Content-Disposition', 'attachment')
      headers.set('X-Content-Type-Options', 'nosniff')
      headers.set('Cache-Control', 'private, no-store')
      return headers
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Título',
      required: true,
      localized: true,
      maxLength: 300,
    },
    {
      name: 'type',
      type: 'select',
      label: 'Tipo',
      required: true,
      options: [
        { label: 'Documento do grupo', value: 'group-document' },
        { label: 'Relatório', value: 'report' },
        { label: 'Termo ou autorização', value: 'authorization' },
        { label: 'Comprovante', value: 'evidence' },
        { label: 'Outro', value: 'other' },
      ],
    },
    {
      name: 'visibility',
      type: 'select',
      label: 'Visibilidade',
      required: true,
      defaultValue: 'admin',
      index: true,
      options: [
        { label: 'Pública', value: 'public' },
        { label: 'Integrantes (reservado; hoje equivale a restrito)', value: 'members' },
        { label: 'Administrativa (somente admin/editor)', value: 'admin' },
      ],
      admin: {
        position: 'sidebar',
        description:
          'Documentos não públicos só são baixados por admin/editor, via link temporário.',
      },
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
      type: 'text',
      label: 'Origem',
      maxLength: 300,
    },
  ],
}
