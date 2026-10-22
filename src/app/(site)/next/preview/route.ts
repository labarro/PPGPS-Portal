import config from '@payload-config'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import { isAdminOrEditor } from '@/access'
import { safePreviewPath } from '@/lib/content/preview'

export const dynamic = 'force-dynamic'

/**
 * Ativa a pré-visualização de rascunhos (Draft Mode) para admin/editor autenticados no painel.
 * Visitante (ou conta inativa) recebe 403; o caminho precisa ser interno ao site público.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const path = safePreviewPath(url.searchParams.get('path'))
  if (!path) return new Response('Caminho de pré-visualização inválido.', { status: 400 })

  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user || !isAdminOrEditor({ req: { user } })) {
    return new Response('Pré-visualização disponível somente para a equipe editorial.', {
      status: 403,
    })
  }

  const draft = await draftMode()
  draft.enable()
  redirect(path)
}
