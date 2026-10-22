import type { Block } from 'payload'

import { contentEditor } from '../collections/shared/rich-text'
import { validateHref } from '../globals/shared'

/**
 * Blocos das páginas (S03): texto rico, chamada, lista de links e cartões. Sem HTML livre,
 * sem incorporações e sem imagens (imagens exigem as regras de mídia e consentimento).
 */
const hrefField = (required: boolean) => ({
  name: 'href',
  type: 'text' as const,
  label: 'Endereço',
  required,
  maxLength: 500,
  validate: (value: unknown) => (!required && !value ? true : validateHref(value)),
  admin: { description: 'Caminho interno (/linhas) ou endereço https://.' },
})

export const RichTextBlock: Block = {
  slug: 'richText',
  interfaceName: 'RichTextBlock',
  labels: { singular: 'Texto', plural: 'Textos' },
  fields: [
    {
      name: 'content',
      type: 'richText',
      label: 'Conteúdo',
      required: true,
      localized: true,
      editor: contentEditor,
    },
  ],
}

export const CalloutBlock: Block = {
  slug: 'callout',
  interfaceName: 'CalloutBlock',
  labels: { singular: 'Chamada', plural: 'Chamadas' },
  fields: [
    {
      name: 'tone',
      type: 'select',
      label: 'Estilo',
      required: true,
      defaultValue: 'info',
      options: [
        { label: 'Informativo (claro)', value: 'info' },
        { label: 'Destaque (azul-marinho)', value: 'emphasis' },
      ],
    },
    {
      name: 'title',
      type: 'text',
      label: 'Título',
      required: true,
      localized: true,
      maxLength: 120,
    },
    { name: 'text', type: 'textarea', label: 'Texto', localized: true, maxLength: 600 },
    {
      name: 'linkLabel',
      type: 'text',
      label: 'Texto do link',
      localized: true,
      maxLength: 60,
    },
    hrefField(false),
  ],
}

export const LinkListBlock: Block = {
  slug: 'linkList',
  interfaceName: 'LinkListBlock',
  labels: { singular: 'Lista de links', plural: 'Listas de links' },
  fields: [
    { name: 'title', type: 'text', label: 'Título', localized: true, maxLength: 120 },
    {
      name: 'links',
      type: 'array',
      label: 'Links',
      required: true,
      minRows: 1,
      maxRows: 20,
      labels: { singular: 'Link', plural: 'Links' },
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'Rótulo',
          required: true,
          localized: true,
          maxLength: 160,
        },
        hrefField(true),
        {
          name: 'description',
          type: 'text',
          label: 'Descrição',
          localized: true,
          maxLength: 240,
        },
      ],
    },
  ],
}

export const CardsBlock: Block = {
  slug: 'cards',
  interfaceName: 'CardsBlock',
  labels: { singular: 'Cartões', plural: 'Grupos de cartões' },
  fields: [
    { name: 'title', type: 'text', label: 'Título', localized: true, maxLength: 120 },
    {
      name: 'items',
      type: 'array',
      label: 'Cartões',
      required: true,
      minRows: 1,
      maxRows: 12,
      labels: { singular: 'Cartão', plural: 'Cartões' },
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Título',
          required: true,
          localized: true,
          maxLength: 120,
        },
        { name: 'text', type: 'textarea', label: 'Texto', localized: true, maxLength: 400 },
        hrefField(false),
      ],
    },
  ],
}

export const PAGE_BLOCKS: Block[] = [RichTextBlock, CalloutBlock, LinkListBlock, CardsBlock]
