import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

/** Encerra a pré-visualização e volta à página inicial (versão publicada). */
export async function GET(): Promise<Response> {
  const draft = await draftMode()
  draft.disable()
  redirect('/')
}
