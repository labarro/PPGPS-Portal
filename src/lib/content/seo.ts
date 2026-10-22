import type { Metadata } from 'next'

import { SITE_FULL_NAME } from '../site/identity'

/**
 * Metadados por rota (planejamento 16.7): título no padrão do layout ("Título · nome curto"),
 * descrição, URL canônica, Open Graph e Twitter Card. A indexação fora da produção é
 * bloqueada no layout (`robots`) e no cabeçalho `X-Robots-Tag`.
 */
export function pageMetadata({
  title,
  description,
  path,
  siteName = SITE_FULL_NAME,
}: {
  title?: string
  description?: string | null
  path: string
  siteName?: string
}): Metadata {
  const desc = description?.trim() || undefined
  return {
    ...(title ? { title } : {}),
    ...(desc ? { description: desc } : {}),
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
      siteName,
      url: path,
      ...(title ? { title } : { title: siteName }),
      ...(desc ? { description: desc } : {}),
    },
    twitter: {
      card: 'summary',
      ...(title ? { title } : { title: siteName }),
      ...(desc ? { description: desc } : {}),
    },
  }
}

/** Corta descrições longas para o limite usual dos buscadores. */
export function metaDescription(text: string | null | undefined, max = 160): string | undefined {
  const clean = text?.replace(/\s+/g, ' ').trim()
  if (!clean) return undefined
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean
}
