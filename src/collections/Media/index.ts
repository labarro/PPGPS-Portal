import type { CollectionConfig } from 'payload'

/**
 * Coleção mínima de mídia (S01): upload básico, acesso padrão (somente usuários autenticados).
 *
 * Fora do escopo da S01 (entram na S02): storage R2, validação por magic bytes, limites de
 * tamanho, bloqueio de SVG, nomes aleatórios e campos `alt`/`credit`/`license`.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Mídia',
    plural: 'Mídias',
  },
  fields: [],
  upload: true,
}
