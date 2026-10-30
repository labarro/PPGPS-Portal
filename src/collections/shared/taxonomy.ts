import {
  APIError,
  type CollectionBeforeDeleteHook,
  type CollectionConfig,
  type Field,
} from 'payload'

import { anyone, isAdminOrEditor } from '../../access'
import { revalidateCollectionChange, revalidateCollectionDelete } from '../../hooks/revalidate'
import { rememberPublishedSlug, syncSlugRedirects } from '../../hooks/slug-redirects'
import { slugField } from './slug-field'

/**
 * Taxonomia do blog (planejamento 8.8 e 13.3; ficha S05): categorias e tags criadas somente
 * por `editor`/`admin` (sem moderação de terceiros, Q5). Leitura pública (nomes e descrições
 * não são dados pessoais). Alterar o slug cria 301 (mecanismo da S03).
 */
export type TaxonomySlug = 'categories' | 'tags'

export const taxonomyAccess: CollectionConfig['access'] = {
  read: anyone,
  create: isAdminOrEditor,
  update: isAdminOrEditor,
  delete: isAdminOrEditor,
}

export function taxonomyFields(collection: TaxonomySlug): Field[] {
  return [
    {
      name: 'name',
      type: 'text',
      label: 'Nome',
      required: true,
      localized: true,
      maxLength: 80,
    },
    slugField(
      'name',
      'Gerado a partir do nome. Alterar o endereço cria um redirecionamento 301 automático.',
    ),
    {
      name: 'description',
      type: 'textarea',
      label: 'Descrição',
      localized: true,
      maxLength: 300,
      admin: {
        description: `Opcional. Exibida no topo da página da ${collection === 'categories' ? 'categoria' : 'tag'}.`,
      },
    },
  ]
}

/** Exclusão bloqueada enquanto houver ensaios (inclusive rascunhos) usando o termo. */
export const blockDeleteWhenUsed =
  (collection: TaxonomySlug): CollectionBeforeDeleteHook =>
  async ({ id, req }) => {
    const field = collection === 'categories' ? 'category' : 'tags'
    const where = { [field]: { in: [id] } }
    const [published, drafts] = await Promise.all([
      req.payload.count({ collection: 'essays', where, overrideAccess: true, req }),
      req.payload.find({
        collection: 'essays',
        where,
        draft: true,
        limit: 1,
        depth: 0,
        overrideAccess: true,
        req,
      }),
    ])
    if (published.totalDocs > 0 || drafts.totalDocs > 0) {
      throw new APIError(
        `Há ensaios usando ${collection === 'categories' ? 'esta categoria' : 'esta tag'}. Altere-os antes de excluir.`,
        400,
        undefined,
        true,
      )
    }
  }

export function taxonomyHooks(collection: TaxonomySlug): CollectionConfig['hooks'] {
  return {
    beforeChange: [rememberPublishedSlug(collection)],
    beforeDelete: [blockDeleteWhenUsed(collection)],
    afterChange: [syncSlugRedirects(collection), revalidateCollectionChange(collection)],
    afterDelete: [revalidateCollectionDelete(collection)],
  }
}
