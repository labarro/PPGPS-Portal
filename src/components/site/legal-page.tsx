import Link from 'next/link'
import type { ReactNode } from 'react'

import { RenderBlocks } from '@/components/blocks/render-blocks'
import { PageHeader } from '@/components/site/page-header'
import { SectionTitle } from '@/components/site/section-title'
import { LEGAL_DEFAULTS, type LegalParagraph } from '@/lib/content/legal-defaults'
import type { LegalPageSlug } from '@/lib/content/paths'
import type { Page } from '@/payload-types'

const linkClass = 'text-link underline underline-offset-4 hover:no-underline'

function Paragraph({ value }: { value: LegalParagraph }) {
  if (typeof value === 'string') return <p>{value}</p>
  return (
    <p>
      {value.before}
      <Link href={value.link.href} className={linkClass}>
        {value.link.label}
      </Link>
      {value.after ?? ''}
    </p>
  )
}

/** Texto padrão (sem página publicada no CMS). */
function DefaultContent({ slug }: { slug: LegalPageSlug }) {
  const doc = LEGAL_DEFAULTS[slug]
  return (
    <div className="flex flex-col gap-10" data-testid="legal-default">
      {doc.sections.map((section, index) => {
        const id = `secao-${index + 1}`
        return (
          <section key={section.heading} aria-labelledby={id}>
            <SectionTitle id={id} className="text-xl sm:text-2xl">
              {section.heading}
            </SectionTitle>
            <div className="mt-4 flex flex-col gap-4 leading-relaxed">
              {(section.paragraphs ?? []).map((paragraph, i) => (
                <Paragraph key={i} value={paragraph} />
              ))}
              {section.items ? (
                <ul className="list-disc space-y-2 pl-6">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>
        )
      })}
    </div>
  )
}

/**
 * Página legal (S06, RF-021): conteúdo da página publicada no CMS com o mesmo slug ou, na sua
 * ausência, o texto padrão versionado. `prepend` é sempre exibido (ex.: nota de responsabilidade).
 */
export function LegalPage({
  slug,
  page,
  prepend,
}: {
  slug: LegalPageSlug
  page: Page | null
  prepend?: ReactNode
}) {
  const fallback = LEGAL_DEFAULTS[slug]
  const hasBlocks = !!page?.layout && page.layout.length > 0
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Início', href: '/' }, { label: page?.title || fallback.title }]}
        title={page?.title || fallback.title}
        lead={page?.summary || fallback.summary}
      />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {prepend}
        {hasBlocks ? <RenderBlocks blocks={page.layout} /> : <DefaultContent slug={slug} />}
      </div>
    </>
  )
}
