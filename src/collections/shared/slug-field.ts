import type { Field, FieldHook } from 'payload'

import { slugify, validateSlug } from '../../lib/content/slug'

/** Gera o slug a partir do campo de origem quando vazio; normaliza o informado. */
export const formatSlug =
  (sourceField: string): FieldHook =>
  ({ data, originalDoc, value }) => {
    if (typeof value === 'string' && value.trim() !== '') return slugify(value)
    const source = data?.[sourceField] ?? originalDoc?.[sourceField]
    if (typeof source === 'string' && source.trim() !== '') return slugify(source)
    return value
  }

export function slugField(sourceField: string, description: string): Field {
  return {
    name: 'slug',
    type: 'text',
    label: 'Endereço (slug)',
    required: true,
    unique: true,
    index: true,
    maxLength: 80,
    validate: (value: unknown) => validateSlug(value),
    hooks: { beforeValidate: [formatSlug(sourceField)] },
    admin: {
      position: 'sidebar',
      description,
    },
  }
}
