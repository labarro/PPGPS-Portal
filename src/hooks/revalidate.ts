import type { GlobalAfterChangeHook } from 'payload'

/**
 * Revalida o layout público quando globals do site mudam (Navigation, Footer, SiteSettings
 * afetam todas as páginas). Fora do runtime do Next (seed, testes, CLI) a chamada não se
 * aplica e é ignorada.
 */
export const revalidateSiteLayout: GlobalAfterChangeHook = async ({ doc, req }) => {
  try {
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/', 'layout')
  } catch (error) {
    req.payload.logger.debug({ err: error, msg: 'Revalidação ignorada fora do runtime do Next.' })
  }
  return doc
}
