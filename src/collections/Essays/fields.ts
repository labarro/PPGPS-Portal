import type { Field, FieldAccess } from 'payload'

import { fieldIsAdminOrEditor } from '../../access'
import { validateExternalUrl } from '../../lib/content/paths'
import {
  AUTHOR_ROLE_OPTIONS,
  DEVELOPMENT_STAGE_OPTIONS,
  ESSAY_LICENSES,
  NATURE_OPTIONS,
  validateDoi,
} from '../../lib/editorial/essay'
import {
  canEditChecklist,
  canEditContent,
  CHECKLIST_ITEMS,
  WORKFLOW_LABELS,
  WORKFLOW_STATES,
} from '../../lib/editorial/workflow'
import { essayEditor } from '../shared/rich-text'
import { slugField } from '../shared/slug-field'

/**
 * Acesso por campo dos ensaios (ficha S05):
 * - conteúdo: editável somente em Rascunho ou Devolvido (no painel aparece somente leitura
 *   nos demais estados; pela API a alteração é descartada);
 * - checklist: também durante a revisão;
 * - campos do fluxo: NUNCA editáveis diretamente — só o hook de transição os grava.
 */
const contentUpdate: FieldAccess = ({ doc }) => canEditContent(doc?.workflowStatus)
const checklistUpdate: FieldAccess = ({ doc, req }) =>
  fieldIsAdminOrEditor({ req }) && canEditChecklist(doc?.workflowStatus)
const never: FieldAccess = () => false

const contentAccess = { update: contentUpdate }
const workflowAccess = { create: never, update: never }
const internalAccess = { ...workflowAccess, read: fieldIsAdminOrEditor }

const content = (field: Field): Field =>
  ({ ...field, access: { ...('access' in field ? field.access : {}), ...contentAccess } }) as Field

const userRelation = (name: string, label: string): Field => ({
  name,
  type: 'relationship',
  relationTo: 'users',
  label,
  access: internalAccess,
  admin: { readOnly: true, position: 'sidebar' },
})

const dateField = (name: string, label: string, extra: Partial<Field> = {}): Field =>
  ({
    name,
    type: 'date',
    label,
    access: workflowAccess,
    admin: {
      readOnly: true,
      position: 'sidebar',
      date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd/MM/yyyy HH:mm' },
    },
    ...extra,
  }) as Field

export const essayFields: Field[] = [
  {
    type: 'tabs',
    tabs: [
      {
        label: 'Texto',
        fields: [
          {
            name: 'editorialNotice',
            type: 'ui',
            admin: {
              components: { Field: '/components/admin/editorial-notice#EditorialNotice' },
            },
          },
          content({
            name: 'title',
            type: 'text',
            label: 'Título',
            required: true,
            localized: true,
            maxLength: 160,
          }),
          content({
            name: 'subtitle',
            type: 'text',
            label: 'Subtítulo',
            localized: true,
            maxLength: 200,
          }),
          content({
            name: 'excerpt',
            type: 'textarea',
            label: 'Resumo (chamada)',
            localized: true,
            maxLength: 400,
            admin: {
              description:
                'Duas ou três frases. Usado nos cartões do blog, na home, no RSS e no SEO.',
            },
          }),
          content({
            name: 'cover',
            type: 'upload',
            relationTo: 'media',
            label: 'Imagem de capa',
            admin: {
              description:
                'Opcional. A imagem precisa ter crédito e licença; pessoas identificáveis exigem autorização de imagem.',
            },
          }),
          content({
            name: 'content',
            type: 'richText',
            label: 'Texto do ensaio',
            localized: true,
            editor: essayEditor,
          }),
        ],
      },
      {
        label: 'Autoria',
        fields: [
          content({
            name: 'authors',
            type: 'array',
            label: 'Autores (na ordem de exibição)',
            labels: { singular: 'Autor', plural: 'Autores' },
            maxRows: 20,
            admin: {
              description:
                'Integrantes cadastrados (pessoa) ou convidados externos. Os autores não têm conta: o texto é cadastrado em nome deles. O link para o perfil só aparece se a pessoa tiver autorização de perfil público.',
            },
            fields: [
              {
                type: 'row',
                fields: [
                  {
                    name: 'role',
                    type: 'select',
                    label: 'Papel',
                    required: true,
                    defaultValue: 'author',
                    options: AUTHOR_ROLE_OPTIONS.map(({ value, label }) => ({ value, label })),
                  },
                  {
                    name: 'person',
                    type: 'relationship',
                    relationTo: 'people',
                    label: 'Integrante cadastrado',
                    admin: {
                      condition: (_, sibling) => sibling?.role !== 'guest',
                    },
                  },
                ],
              },
              {
                name: 'name',
                type: 'text',
                label: 'Nome publicado',
                maxLength: 160,
                admin: {
                  description:
                    'Convidado: obrigatório. Integrante: opcional (vazio = nome completo do cadastro).',
                },
              },
              {
                name: 'bio',
                type: 'textarea',
                label: 'Minibiografia do convidado',
                maxLength: 400,
                admin: { condition: (_, sibling) => sibling?.role === 'guest' },
              },
            ],
          }),
        ],
      },
      {
        label: 'Referências',
        fields: [
          content({
            name: 'references',
            type: 'array',
            label: 'Referências bibliográficas',
            labels: { singular: 'Referência', plural: 'Referências' },
            maxRows: 200,
            admin: {
              description:
                'Exibidas ao final do ensaio, no estilo ABNT simplificado: AUTORES. Título. Fonte, editora, ano.',
            },
            fields: [
              {
                name: 'authors',
                type: 'text',
                label: 'Autores',
                maxLength: 500,
                admin: { description: 'Ex.: SOBRENOME, Nome; SOBRENOME, Nome.' },
              },
              {
                name: 'title',
                type: 'text',
                label: 'Título',
                required: true,
                maxLength: 500,
              },
              {
                type: 'row',
                fields: [
                  {
                    name: 'source',
                    type: 'text',
                    label: 'Fonte (periódico, livro, site)',
                    maxLength: 300,
                  },
                  { name: 'publisher', type: 'text', label: 'Editora/local', maxLength: 200 },
                  { name: 'year', type: 'number', label: 'Ano', min: 1500, max: 2100 },
                ],
              },
              {
                type: 'row',
                fields: [
                  {
                    name: 'doi',
                    type: 'text',
                    label: 'DOI',
                    maxLength: 200,
                    validate: (value: unknown) => validateDoi(value),
                  },
                  {
                    name: 'url',
                    type: 'text',
                    label: 'Endereço (URL)',
                    maxLength: 1000,
                    validate: (value: unknown) => validateExternalUrl(value),
                  },
                  {
                    name: 'accessedAt',
                    type: 'date',
                    label: 'Acesso em',
                    admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' } },
                  },
                ],
              },
            ],
          }),
        ],
      },
      {
        label: 'Classificação e SEO',
        fields: [
          content({
            name: 'nature',
            type: 'select',
            label: 'Natureza do texto',
            required: true,
            index: true,
            options: NATURE_OPTIONS.map(({ value, label }) => ({ value, label })),
            admin: {
              description: 'Obrigatória. Exibida como selo e no aviso editorial do ensaio.',
            },
          }),
          content({
            name: 'developmentStage',
            type: 'select',
            label: 'Estágio de desenvolvimento',
            defaultValue: 'essay',
            options: DEVELOPMENT_STAGE_OPTIONS.map(({ value, label }) => ({ value, label })),
          }),
          content({
            name: 'category',
            type: 'relationship',
            relationTo: 'categories',
            label: 'Categoria',
            required: true,
            index: true,
          }),
          content({
            name: 'tags',
            type: 'relationship',
            relationTo: 'tags',
            label: 'Tags',
            hasMany: true,
            maxRows: 12,
          }),
          content({
            name: 'license',
            type: 'select',
            label: 'Licença de uso',
            options: ESSAY_LICENSES.map(({ value, label }) => ({ value, label })),
            admin: {
              description:
                'Vazio = licença padrão das Configurações do site (sugerida: CC BY-NC-ND 4.0).',
            },
          }),
          content({
            name: 'correctionNote',
            type: 'textarea',
            label: 'Nota de correção (errata)',
            localized: true,
            maxLength: 600,
            admin: {
              description:
                'Para correções relevantes de texto já publicado: descreva o que mudou. Exibida no ensaio.',
            },
          }),
          content({
            name: 'seo',
            type: 'group',
            label: 'SEO',
            fields: [
              {
                name: 'title',
                type: 'text',
                label: 'Título para buscadores',
                localized: true,
                maxLength: 70,
                admin: { description: 'Opcional (vazio = título do ensaio).' },
              },
              {
                name: 'description',
                type: 'textarea',
                label: 'Descrição para buscadores',
                localized: true,
                maxLength: 160,
                admin: { description: 'Opcional (vazio = resumo).' },
              },
            ],
          }),
        ],
      },
      {
        label: 'Revisão',
        fields: [
          {
            name: 'checklist',
            type: 'group',
            label: 'Checklist editorial (obrigatório para aprovar)',
            access: { read: fieldIsAdminOrEditor, update: checklistUpdate },
            admin: {
              description:
                'Critérios de revisão do planejamento (15.2). Preencha durante a revisão; todos precisam estar marcados para aprovar.',
            },
            fields: CHECKLIST_ITEMS.map(({ name, label }) => ({
              name,
              type: 'checkbox' as const,
              label,
              defaultValue: false,
            })),
          },
          {
            name: 'internalNotes',
            type: 'textarea',
            label: 'Anotações internas',
            maxLength: 2000,
            access: { read: fieldIsAdminOrEditor, update: fieldIsAdminOrEditor },
            admin: {
              description:
                'Uso interno (nunca públicas). Ex.: origem do envio, termo de cessão recebido, contato com o autor.',
            },
          },
          {
            name: 'reviewHistory',
            type: 'array',
            label: 'Histórico editorial',
            labels: { singular: 'Registro', plural: 'Registros' },
            access: internalAccess,
            admin: {
              readOnly: true,
              description: 'Gerado automaticamente a cada ação do fluxo (somente leitura).',
            },
            fields: [
              {
                type: 'row',
                fields: [
                  {
                    name: 'from',
                    type: 'select',
                    label: 'De',
                    options: WORKFLOW_STATES.map((value) => ({
                      value,
                      label: WORKFLOW_LABELS[value],
                    })),
                  },
                  {
                    name: 'to',
                    type: 'select',
                    label: 'Para',
                    options: WORKFLOW_STATES.map((value) => ({
                      value,
                      label: WORKFLOW_LABELS[value],
                    })),
                  },
                  {
                    name: 'at',
                    type: 'date',
                    label: 'Data',
                    admin: { date: { pickerAppearance: 'dayAndTime' } },
                  },
                ],
              },
              {
                type: 'row',
                fields: [
                  { name: 'actor', type: 'relationship', relationTo: 'users', label: 'Usuário' },
                  { name: 'actorName', type: 'text', label: 'Responsável' },
                ],
              },
              { name: 'comment', type: 'textarea', label: 'Comentário de revisão' },
            ],
          },
        ],
      },
    ],
  },
  // ---------------------------------------------------------------- barra lateral
  {
    ...slugField(
      'title',
      'Gerado a partir do título. Alterar o endereço de um ensaio publicado cria 301 automático.',
    ),
    access: contentAccess,
  } as Field,
  {
    name: 'editorialActions',
    type: 'ui',
    admin: {
      position: 'sidebar',
      components: { Field: '/components/admin/editorial-actions#EditorialActions' },
    },
  },
  {
    name: 'workflowStatus',
    type: 'select',
    label: 'Situação editorial',
    required: true,
    defaultValue: 'draft',
    index: true,
    options: WORKFLOW_STATES.map((value) => ({ value, label: WORKFLOW_LABELS[value] })),
    access: workflowAccess,
    admin: {
      readOnly: true,
      position: 'sidebar',
      description: 'Muda somente pelas ações do fluxo editorial (acima).',
    },
  },
  dateField('publishedAt', 'Publicado em (ou publicação agendada para)', { index: true }),
  { ...(dateField('scheduledAt', 'Agendado para') as object), access: internalAccess } as Field,
  dateField('revisedAt', 'Última correção publicada em'),
  dateField('archivedAt', 'Arquivado em', { index: true }),
  {
    name: 'readingTime',
    type: 'number',
    label: 'Tempo de leitura (min)',
    min: 1,
    access: workflowAccess,
    admin: { readOnly: true, position: 'sidebar', description: 'Calculado a partir do texto.' },
  },
  userRelation('submittedBy', 'Enviado para revisão por'),
  { ...(dateField('submittedAt', 'Enviado em') as object), access: internalAccess } as Field,
  userRelation('approvedBy', 'Aprovado por'),
  { ...(dateField('approvedAt', 'Aprovado em') as object), access: internalAccess } as Field,
  userRelation('publishedBy', 'Publicado (ou agendado) por'),
  userRelation('archivedBy', 'Arquivado por'),
]
