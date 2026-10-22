import { RenderBlocks } from '@/components/blocks/render-blocks'
import { getPage } from '@/lib/content/queries'

/**
 * Conteúdo complementar de uma página fixa de "O grupo": blocos da página publicada (coleção
 * `pages`) cujo slug coincide com a seção (ex.: `historico`). Sem página publicada, nada aparece.
 */
export async function ComplementaryContent({ slug }: { slug: string }) {
  const page = await getPage(slug)
  if (!page?.layout || page.layout.length === 0) return null
  return (
    <div className="mt-14 border-t pt-12" data-testid={`complementary-${slug}`}>
      <RenderBlocks blocks={page.layout} />
    </div>
  )
}
