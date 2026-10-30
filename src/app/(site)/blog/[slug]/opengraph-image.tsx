import { ImageResponse } from 'next/og'

import { getEssay, toEssayAuthors } from '@/lib/content/queries'
import { SLUG_PATTERN } from '@/lib/content/slug'
import { natureLabel } from '@/lib/editorial/essay'
import { SITE_FULL_NAME } from '@/lib/site/identity'

/**
 * Imagem Open Graph do ensaio (planejamento 16.7; ficha S05), gerada por `next/og`: selo de
 * natureza, título, autores e nome do grupo, em azul-marinho e branco. Sem logotipos e sem
 * fontes de terceiros. Ensaio inexistente ou não público → imagem genérica do blog.
 */
export const alt = 'Ensaio do blog do grupo de pesquisa'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const dynamic = 'force-dynamic'

const truncate = (value: string, max: number) =>
  value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value

export default async function OpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const essay = SLUG_PATTERN.test(slug) ? await getEssay(slug) : null
  const title = essay ? truncate(essay.title, 120) : 'Blog acadêmico'
  const authors = essay
    ? truncate(
        toEssayAuthors(essay.authors)
          .map((author) => author.name)
          .join(', '),
        110,
      )
    : ''
  const badge = essay ? natureLabel(essay.nature) : 'Ensaios'

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px 72px',
        background: '#071a33',
        color: '#ffffff',
      }}
    >
      <div style={{ display: 'flex' }}>
        <div
          style={{
            display: 'flex',
            border: '2px solid #9fb8d9',
            borderRadius: 6,
            padding: '8px 18px',
            fontSize: 26,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: '#c7d2e3',
          }}
        >
          {badge}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div
          style={{
            display: 'flex',
            fontSize: title.length > 70 ? 54 : 64,
            lineHeight: 1.12,
            fontWeight: 700,
          }}
        >
          {title}
        </div>
        {authors ? (
          <div style={{ display: 'flex', fontSize: 30, color: '#c7d2e3' }}>{authors}</div>
        ) : null}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          borderTop: '1px solid #9fb8d9',
          paddingTop: 24,
          fontSize: 24,
          color: '#c7d2e3',
        }}
      >
        <div style={{ display: 'flex', maxWidth: 900 }}>{SITE_FULL_NAME}</div>
        <div style={{ display: 'flex' }}>Sem revisão por pares</div>
      </div>
    </div>,
    size,
  )
}
