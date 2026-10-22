import type { Field } from 'payload'

/**
 * Link interno (começa com "/") ou externo HTTPS. Bloqueia `javascript:`, `data:` etc.
 */
export function validateHref(value: unknown): true | string {
  if (typeof value !== 'string' || value.trim() === '') return 'Informe o endereço do link.'
  const href = value.trim()
  if (href.startsWith('/') && !href.startsWith('//')) return true
  if (/^https:\/\/[^\s]+$/i.test(href)) return true
  if (/^mailto:[^\s@]+@[^\s@]+$/i.test(href)) return true
  return 'Use um caminho interno (ex.: /blog), um endereço https:// ou mailto:.'
}

export const linkFields = (labelHint: string): Field[] => [
  {
    name: 'label',
    type: 'text',
    label: 'Rótulo',
    required: true,
    localized: true,
    maxLength: 60,
    admin: { description: labelHint },
  },
  {
    name: 'href',
    type: 'text',
    label: 'Endereço',
    required: true,
    validate: (value: unknown) => validateHref(value),
    admin: { description: 'Caminho interno (/blog) ou endereço https://.' },
  },
]
