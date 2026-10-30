import type { Field } from 'payload'

import { fieldIsAdminOrEditor } from '../../access'
import { RESERVED_PERSON_SLUGS, validateExternalUrl } from '../../lib/content/paths'
import { validateSlug } from '../../lib/content/slug'
import { CONSENT_STATUS_LABELS, CONSENT_STATUSES } from '../../lib/people/consent'
import {
  emailSchema,
  lattesSchema,
  normalizeLattesUrl,
  normalizeOrcid,
  orcidSchema,
  zodFieldValidate,
} from '../../lib/people/identifiers'
import { contentEditor } from '../shared/rich-text'
import { slugField } from '../shared/slug-field'

const dayOnly = { date: { pickerAppearance: 'dayOnly' as const, displayFormat: 'dd/MM/yyyy' } }

/** Campos calculados: nunca editáveis pela API; leitura só por admin/editor. */
const computedAccess = {
  read: fieldIsAdminOrEditor,
  create: () => false,
  update: () => false,
}

const adminOnlyRead = { read: fieldIsAdminOrEditor }

const blankToNull = ({ value }: { value?: unknown }) =>
  typeof value === 'string' && value.trim() === '' ? null : value

export const EDUCATION_LEVELS = [
  { label: 'Graduação', value: 'bachelor' },
  { label: 'Especialização/MBA', value: 'specialization' },
  { label: 'Mestrado', value: 'masters' },
  { label: 'Doutorado', value: 'doctorate' },
  { label: 'Pós-doutorado', value: 'postdoc' },
  { label: 'Outro', value: 'other' },
] as const

const slug = slugField(
  'fullName',
  'Gerado a partir do nome completo. Alterar o endereço de um perfil público cria um redirecionamento 301.',
)

export const personFields: Field[] = [
  {
    type: 'tabs',
    tabs: [
      {
        label: 'Identificação',
        fields: [
          {
            name: 'fullName',
            type: 'text',
            label: 'Nome completo',
            required: true,
            index: true,
            maxLength: 200,
          },
          {
            name: 'citationName',
            type: 'text',
            label: 'Nome em citações',
            maxLength: 200,
            admin: { description: 'Ex.: SILVA, M. A. (como aparece nas publicações).' },
          },
          {
            name: 'nameVariants',
            type: 'array',
            label: 'Variantes do nome',
            labels: { singular: 'Variante', plural: 'Variantes' },
            maxRows: 10,
            admin: { description: 'Outras formas do nome usadas em publicações e cadastros.' },
            fields: [{ name: 'name', type: 'text', label: 'Nome', required: true, maxLength: 200 }],
          },
          {
            name: 'photo',
            type: 'upload',
            relationTo: 'media',
            label: 'Fotografia',
            filterOptions: { containsIdentifiablePeople: { equals: true } },
            admin: {
              description:
                'Só é exibida com autorização "Fotografia" vigente. A mídia deve estar marcada como "contém pessoas identificáveis" e vinculada a uma autorização de foto desta pessoa.',
            },
          },
          {
            name: 'shortBio',
            type: 'textarea',
            label: 'Mini-biografia',
            localized: true,
            maxLength: 400,
            admin: { description: 'Uma ou duas frases. Aparece no topo do perfil.' },
          },
          {
            name: 'academicBio',
            type: 'richText',
            label: 'Apresentação acadêmica',
            localized: true,
            editor: contentEditor,
          },
        ],
      },
      {
        label: 'Formação e atuação',
        fields: [
          {
            name: 'externalEducation',
            type: 'array',
            label: 'Formação',
            labels: { singular: 'Formação', plural: 'Formações' },
            maxRows: 20,
            fields: [
              {
                type: 'row',
                fields: [
                  {
                    name: 'level',
                    type: 'select',
                    label: 'Nível',
                    required: true,
                    options: [...EDUCATION_LEVELS],
                  },
                  {
                    name: 'year',
                    type: 'number',
                    label: 'Ano de conclusão',
                    min: 1950,
                    max: 2100,
                  },
                ],
              },
              { name: 'course', type: 'text', label: 'Curso', required: true, maxLength: 200 },
              {
                name: 'institution',
                type: 'text',
                label: 'Instituição',
                required: true,
                maxLength: 200,
              },
              { name: 'country', type: 'text', label: 'País', maxLength: 80 },
            ],
          },
          {
            name: 'expertise',
            type: 'text',
            hasMany: true,
            label: 'Áreas de atuação',
            maxRows: 15,
            maxLength: 120,
            admin: { description: 'Digite cada área e pressione Enter.' },
          },
          {
            name: 'affiliations',
            type: 'array',
            label: 'Afiliações',
            labels: { singular: 'Afiliação', plural: 'Afiliações' },
            maxRows: 10,
            admin: {
              description:
                'Referência textual (sem vínculo oficial). Ex.: "Docente" - "PPGPS" - "UniCesumar".',
            },
            fields: [
              {
                name: 'positionText',
                type: 'text',
                label: 'Cargo ou função',
                required: true,
                maxLength: 160,
              },
              {
                name: 'institutionText',
                type: 'text',
                label: 'Instituição',
                required: true,
                maxLength: 200,
              },
              { name: 'programText', type: 'text', label: 'Programa', maxLength: 200 },
              {
                name: 'url',
                type: 'text',
                label: 'Endereço',
                maxLength: 500,
                validate: (value: unknown) => validateExternalUrl(value),
              },
              { name: 'current', type: 'checkbox', label: 'Atual', defaultValue: true },
            ],
          },
        ],
      },
      {
        label: 'Perfis e contato',
        fields: [
          {
            name: 'lattesUrl',
            type: 'text',
            label: 'Currículo Lattes',
            unique: true,
            index: true,
            maxLength: 120,
            validate: (value: unknown) => zodFieldValidate(lattesSchema, value),
            hooks: {
              beforeValidate: [
                ({ value }) => {
                  const clean = blankToNull({ value })
                  if (typeof clean !== 'string') return clean
                  return normalizeLattesUrl(clean) ?? clean
                },
              ],
            },
            admin: { description: 'http://lattes.cnpq.br/<16 dígitos>' },
          },
          {
            name: 'orcid',
            type: 'text',
            label: 'ORCID',
            unique: true,
            index: true,
            maxLength: 40,
            validate: (value: unknown) => zodFieldValidate(orcidSchema, value),
            hooks: {
              beforeValidate: [
                ({ value }) => {
                  const clean = blankToNull({ value })
                  if (typeof clean !== 'string') return clean
                  return normalizeOrcid(clean) ?? clean
                },
              ],
            },
            admin: { description: '0000-0000-0000-0000 (dígito verificador conferido).' },
          },
          {
            name: 'otherProfiles',
            type: 'array',
            label: 'Outros perfis acadêmicos',
            labels: { singular: 'Perfil', plural: 'Perfis' },
            maxRows: 8,
            fields: [
              {
                name: 'label',
                type: 'text',
                label: 'Nome do perfil',
                required: true,
                maxLength: 80,
                admin: { description: 'Ex.: Google Acadêmico, ResearchGate.' },
              },
              {
                name: 'url',
                type: 'text',
                label: 'Endereço',
                required: true,
                maxLength: 500,
                validate: (value: unknown) => validateExternalUrl(value, { required: true }),
              },
            ],
          },
          {
            name: 'publicEmail',
            type: 'text',
            label: 'E-mail público',
            maxLength: 200,
            validate: (value: unknown) => zodFieldValidate(emailSchema, value),
            hooks: { beforeValidate: [blankToNull] },
            admin: {
              description:
                'Opcional. Só é exibido com autorização "E-mail público" vigente do titular. Nunca informe e-mail sem a opção do titular.',
            },
          },
        ],
      },
    ],
  },
  {
    ...slug,
    validate: (value: unknown) => {
      const base = validateSlug(value)
      if (base !== true) return base
      return RESERVED_PERSON_SLUGS.includes(String(value))
        ? 'Endereço reservado pelo portal. Escolha outro.'
        : true
    },
  } as Field,
  {
    name: 'visibility',
    type: 'select',
    label: 'Visibilidade',
    required: true,
    defaultValue: 'public',
    index: true,
    access: adminOnlyRead,
    options: [
      { label: 'Pública (se houver autorização de perfil)', value: 'public' },
      { label: 'Somente administração', value: 'admin' },
    ],
    admin: {
      position: 'sidebar',
      description:
        'Mesmo "Pública", o perfil só aparece no site com autorização "Perfil público" vigente.',
    },
  },
  {
    name: 'archivedAt',
    type: 'date',
    label: 'Arquivado em',
    index: true,
    access: adminOnlyRead,
    admin: {
      position: 'sidebar',
      description: 'Arquivar retira o perfil do site sem apagar registros (exclusão lógica).',
      ...dayOnly,
    },
  },
  {
    type: 'collapsible',
    label: 'Situação de consentimento (calculada)',
    admin: { position: 'sidebar' },
    fields: [
      {
        name: 'consentStatus',
        type: 'select',
        label: 'Situação',
        defaultValue: 'none',
        index: true,
        access: computedAccess,
        options: CONSENT_STATUSES.map((value) => ({ value, label: CONSENT_STATUS_LABELS[value] })),
        admin: {
          readOnly: true,
          description:
            'Calculada a partir das autorizações individuais registradas em "Consentimentos".',
        },
      },
      {
        name: 'consentPublicProfile',
        type: 'checkbox',
        label: 'Perfil público autorizado',
        defaultValue: false,
        index: true,
        access: computedAccess,
        admin: { readOnly: true },
      },
      {
        name: 'consentPhoto',
        type: 'checkbox',
        label: 'Fotografia autorizada',
        defaultValue: false,
        access: computedAccess,
        admin: { readOnly: true },
      },
      {
        name: 'consentEmail',
        type: 'checkbox',
        label: 'E-mail público autorizado',
        defaultValue: false,
        access: computedAccess,
        admin: { readOnly: true },
      },
    ],
  },
  {
    type: 'tabs',
    tabs: [
      {
        label: 'Vínculos e autorizações',
        description: 'Somente leitura aqui. Cadastre em "Vínculos" e em "Consentimentos".',
        fields: [
          {
            name: 'memberships',
            type: 'join',
            label: 'Vínculos com o grupo',
            collection: 'memberships',
            on: 'person',
            defaultLimit: 20,
            access: adminOnlyRead,
            admin: { defaultColumns: ['displayTitle', 'startDate', 'endDate', 'status'] },
          },
          {
            name: 'consents',
            type: 'join',
            label: 'Autorizações individuais',
            collection: 'consent-records',
            on: 'person',
            defaultLimit: 20,
            access: adminOnlyRead,
            admin: { defaultColumns: ['displayTitle', 'grantedAt', 'revokedAt'] },
          },
        ],
      },
    ],
  },
]
