/**
 * Pré-visualização de rascunhos (Next Draft Mode). O botão "Pré-visualizar" do painel abre
 * `/next/preview?path=...`; a rota só ativa o modo rascunho para admin/editor autenticados
 * (cookie de sessão do painel). Sem segredo na URL.
 */
export const PREVIEW_ROUTE = '/next/preview'
export const EXIT_PREVIEW_ROUTE = '/next/exit-preview'

export const previewUrl = (path: string): string =>
  `${PREVIEW_ROUTE}?path=${encodeURIComponent(path)}`

/** Aceita somente caminhos internos do site público (evita redirecionamento aberto). */
export function safePreviewPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return null
  }
  if (/^\/(admin|api|next)(\/|$)/i.test(value)) return null
  return value
}
