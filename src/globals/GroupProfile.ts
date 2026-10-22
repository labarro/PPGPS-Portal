import type { GlobalConfig } from 'payload'

import { isAdminOrEditor } from '../access'
import { contentEditor } from '../collections/shared/rich-text'
import { PUBLISHED_GLOBAL_WHERE } from '../lib/content/visibility'
import { validateExternalUrl } from '../lib/content/paths'
import { SITE_FULL_NAME } from '../lib/site/identity'
import { publishedOnlyForPublicGlobal } from '../hooks/published-only'
import { revalidateGlobal } from '../hooks/revalidate'

export const INSTITUTIONAL_REFERENCE_KINDS = [
  { label: 'Instituição', value: 'institution' },
  { label: 'Programa de pós-graduação', value: 'program' },
  { label: 'Unidade', value: 'unit' },
  { label: 'Instituição parceira', value: 'partner' },
  { label: 'Agência ou diretório', value: 'funder' },
] as const

export const CERTIFICATION_STATUSES = [
  { label: 'Certificado', value: 'certified' },
  { label: 'Não atualizado', value: 'not_updated' },
  { label: 'Em preenchimento', value: 'in_preparation' },
] as const

const urlField = (name: string, label: string, description?: string) => ({
  name,
  type: 'text' as const,
  label,
  maxLength: 500,
  validate: (value: unknown) => validateExternalUrl(value),
  admin: { description: description ?? 'Endereço completo, iniciado por https:// ou http://.' },
})

/**
 * Perfil do grupo (planejamento 13.3; ADR-0006): instância única que representa o grupo.
 * Referências institucionais são SOMENTE texto e link (sem logotipos, Q2). As linhas do DGP
 * são referência histórica, sem páginas próprias (Q7). `leadersText` é temporário (S04).
 * Rascunho e publicação: a publicação exige os campos obrigatórios (ex.: `leadersText`).
 */
export const GroupProfile: GlobalConfig = {
  slug: 'group-profile',
  label: 'Perfil do grupo',
  admin: {
    group: 'Grupo',
    description:
      'Identidade, apresentação, objetivos, histórico e referências do grupo. Salve como rascunho para revisar e use "Publicar" para atualizar o site.',
  },
  versions: { drafts: true, max: 50 },
  access: {
    read: ({ req }) => (isAdminOrEditor({ req }) ? true : PUBLISHED_GLOBAL_WHERE),
    readVersions: isAdminOrEditor,
    update: isAdminOrEditor,
  },
  hooks: {
    beforeOperation: [publishedOnlyForPublicGlobal],
    afterChange: [revalidateGlobal('group-profile')],
  },
  fields: [
    {
      name: 'provisionalTexts',
      type: 'checkbox',
      label: 'Contém textos provisórios',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description:
          'Marque enquanto apresentação, objetivos ou histórico forem provisórios (aguardam o coordenador, Q7). O site exibe um aviso discreto de "texto provisório".',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Identidade',
          fields: [
            {
              name: 'officialName',
              type: 'text',
              label: 'Nome oficial (exibição)',
              required: true,
              localized: true,
              maxLength: 160,
              defaultValue: SITE_FULL_NAME,
              admin: { description: 'Nome de exibição definido pelo coordenador (Q2).' },
            },
            {
              name: 'acronym',
              type: 'text',
              label: 'Sigla',
              maxLength: 20,
            },
            {
              name: 'alternativeNames',
              type: 'array',
              label: 'Nomes alternativos',
              labels: { singular: 'Nome alternativo', plural: 'Nomes alternativos' },
              maxRows: 10,
              admin: {
                description: 'Ex.: título registrado no DGP e variantes usadas por outras fontes.',
              },
              fields: [
                { name: 'name', type: 'text', label: 'Nome', required: true, maxLength: 200 },
                {
                  name: 'source',
                  type: 'text',
                  label: 'Fonte',
                  required: true,
                  maxLength: 300,
                  admin: {
                    description: 'Ex.: Espelho do grupo no DGP/CNPq, coletado em 19/10/2026.',
                  },
                },
              ],
            },
            {
              name: 'summary',
              type: 'textarea',
              label: 'Frase de propósito (resumo)',
              required: true,
              localized: true,
              maxLength: 400,
              admin: {
                description:
                  'Uma ou duas frases. Aparece no topo da página inicial, em "O grupo" e nos resultados de busca.',
              },
            },
            {
              name: 'leadersText',
              type: 'textarea',
              label: 'Liderança (texto temporário)',
              required: true,
              localized: true,
              maxLength: 600,
              admin: {
                description:
                  'Obrigatório para publicar. Temporário: será substituído pelos perfis autorizados dos líderes na S04. Nomes de pessoas só com autorização.',
              },
            },
          ],
        },
        {
          label: 'Apresentação',
          fields: [
            {
              name: 'description',
              type: 'richText',
              label: 'Apresentação do grupo',
              localized: true,
              editor: contentEditor,
            },
            {
              name: 'objectives',
              type: 'richText',
              label: 'Objetivos',
              localized: true,
              editor: contentEditor,
            },
            {
              name: 'history',
              type: 'richText',
              label: 'Histórico',
              localized: true,
              editor: contentEditor,
            },
          ],
        },
        {
          label: 'Registro no DGP',
          fields: [
            urlField('dgpUrl', 'Espelho do grupo no DGP/CNPq'),
            {
              name: 'dgpId',
              type: 'text',
              label: 'Identificador no DGP',
              maxLength: 32,
              validate: (value: unknown) =>
                value == null || value === '' || /^\d{6,20}$/.test(String(value))
                  ? true
                  : 'Use apenas os dígitos do identificador do espelho.',
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'certificationStatus',
                  type: 'select',
                  label: 'Situação no DGP',
                  options: [...CERTIFICATION_STATUSES],
                },
                {
                  name: 'certifiedAt',
                  type: 'date',
                  label: 'Data da situação',
                  admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' } },
                },
                {
                  name: 'formationYear',
                  type: 'number',
                  label: 'Ano de formação',
                  min: 1950,
                  max: 2100,
                },
              ],
            },
            {
              name: 'predominantArea',
              type: 'text',
              label: 'Área predominante',
              localized: true,
              maxLength: 200,
            },
            {
              name: 'dgpResearchLines',
              type: 'array',
              label: 'Linhas registradas no DGP (referência histórica)',
              labels: { singular: 'Linha do DGP', plural: 'Linhas do DGP' },
              maxRows: 20,
              admin: {
                description:
                  'Exibidas em "Histórico" como referência, sem páginas próprias e sem indicação de extinção (Q7).',
              },
              fields: [
                { name: 'name', type: 'text', label: 'Nome', required: true, maxLength: 300 },
                { name: 'source', type: 'text', label: 'Fonte', required: true, maxLength: 300 },
                {
                  name: 'collectedAt',
                  type: 'date',
                  label: 'Data de coleta',
                  required: true,
                  admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' } },
                },
                { name: 'note', type: 'text', label: 'Observação', maxLength: 300 },
              ],
            },
          ],
        },
        {
          label: 'Referências e contato',
          fields: [
            {
              name: 'institutionalReferences',
              type: 'array',
              label: 'Referências institucionais',
              labels: { singular: 'Referência', plural: 'Referências' },
              maxRows: 12,
              admin: {
                description:
                  'Somente texto e link — nenhum logotipo ou identidade visual institucional (Q2).',
              },
              fields: [
                { name: 'name', type: 'text', label: 'Nome', required: true, maxLength: 200 },
                {
                  name: 'kind',
                  type: 'select',
                  label: 'Tipo',
                  required: true,
                  options: [...INSTITUTIONAL_REFERENCE_KINDS],
                },
                {
                  name: 'relationText',
                  type: 'textarea',
                  label: 'Relação com o grupo',
                  required: true,
                  localized: true,
                  maxLength: 400,
                },
                urlField('url', 'Endereço'),
                {
                  name: 'showInFooter',
                  type: 'checkbox',
                  label: 'Exibir no rodapé',
                  defaultValue: false,
                },
              ],
            },
            {
              name: 'contactEmail',
              type: 'email',
              label: 'E-mail de contato do grupo',
              admin: {
                description:
                  'Somente um e-mail institucional do grupo. Nunca publique e-mail pessoal sem autorização do titular.',
              },
            },
            {
              name: 'responsibilityNote',
              type: 'textarea',
              label: 'Nota de responsabilidade (opcional)',
              localized: true,
              maxLength: 600,
              admin: { description: 'Texto discreto usado em "Sobre o portal" (S06).' },
            },
          ],
        },
        {
          label: 'Procedência',
          fields: [
            {
              name: 'source',
              type: 'text',
              label: 'Fonte dos dados transcritos',
              maxLength: 400,
              admin: {
                description: 'Ex.: Espelho do grupo no DGP/CNPq; coordenador do grupo (Q2).',
              },
            },
            {
              name: 'collectedAt',
              type: 'date',
              label: 'Data da coleta',
              admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' } },
            },
          ],
        },
      ],
    },
  ],
}
