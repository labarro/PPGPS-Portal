import Link from 'next/link'
import type { ReactNode } from 'react'

import { RichText } from '@/components/rich-text/rich-text'
import { isExternalHref, safeHref } from '@/lib/content/rich-text'
import { cn } from '@/lib/utils'
import type { CalloutBlock, CardsBlock, LinkListBlock, Page, RichTextBlock } from '@/payload-types'

type LayoutBlock = NonNullable<Page['layout']>[number]

function SmartLink({
  href,
  className,
  children,
}: {
  href: string | null | undefined
  className?: string
  children: ReactNode
}) {
  const safe = safeHref(href)
  if (!safe) return <span className={className}>{children}</span>
  if (isExternalHref(safe)) {
    return (
      <a href={safe} rel="noopener noreferrer" className={className}>
        {children}
        <span className="sr-only"> (site externo)</span>
      </a>
    )
  }
  return (
    <Link href={safe} className={className}>
      {children}
    </Link>
  )
}

function Callout({ block }: { block: CalloutBlock }) {
  const emphasis = block.tone === 'emphasis'
  return (
    <aside
      className={cn(
        'rounded-lg p-6 sm:p-8',
        emphasis ? 'surface-inverse bg-inverse text-inverse-foreground' : 'border bg-secondary',
      )}
    >
      <h2 className={cn('font-serif text-2xl font-semibold', emphasis ? '' : 'text-primary')}>
        {block.title}
      </h2>
      {block.text ? (
        <p
          className={cn(
            'mt-3 max-w-2xl leading-relaxed',
            emphasis ? 'text-inverse-muted-foreground' : 'text-foreground',
          )}
        >
          {block.text}
        </p>
      ) : null}
      {block.href && block.linkLabel ? (
        <SmartLink
          href={block.href}
          className={cn(
            'mt-5 inline-flex min-h-11 items-center rounded-md px-5 text-sm font-medium',
            emphasis
              ? 'bg-background text-primary hover:bg-secondary'
              : 'bg-primary text-primary-foreground hover:bg-primary-hover',
          )}
        >
          {block.linkLabel}
        </SmartLink>
      ) : null}
    </aside>
  )
}

function LinkList({ block }: { block: LinkListBlock }) {
  return (
    <section>
      {block.title ? (
        <h2 className="font-serif text-2xl font-semibold text-primary">{block.title}</h2>
      ) : null}
      <ul className="mt-4 divide-y border-y">
        {block.links.map((link) => (
          <li key={link.id ?? link.href} className="py-4">
            <SmartLink
              href={link.href}
              className="inline-flex min-h-6 items-center rounded-sm font-medium text-link underline underline-offset-4 hover:no-underline"
            >
              {link.label}
            </SmartLink>
            {link.description ? (
              <p className="mt-1 text-sm text-muted-foreground">{link.description}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}

function Cards({ block }: { block: CardsBlock }) {
  return (
    <section>
      {block.title ? (
        <h2 className="font-serif text-2xl font-semibold text-primary">{block.title}</h2>
      ) : null}
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {block.items.map((item) => (
          <li key={item.id ?? item.title} className="relative rounded-lg border p-6">
            <h3 className="font-serif text-xl font-semibold text-primary">
              {item.href ? (
                <SmartLink
                  href={item.href}
                  className="rounded-sm underline-offset-4 after:absolute after:inset-0 hover:underline"
                >
                  {item.title}
                </SmartLink>
              ) : (
                item.title
              )}
            </h3>
            {item.text ? (
              <p className="mt-2 leading-relaxed text-muted-foreground">{item.text}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Renderiza os blocos de `pages` (S03). Blocos desconhecidos são ignorados. */
export function RenderBlocks({ blocks }: { blocks: LayoutBlock[] | null | undefined }) {
  if (!blocks || blocks.length === 0) return null
  return (
    <div className="flex flex-col gap-10">
      {blocks.map((block) => {
        const key = block.id ?? `${block.blockType}`
        switch (block.blockType) {
          case 'richText':
            return <RichText key={key} data={(block as RichTextBlock).content} />
          case 'callout':
            return <Callout key={key} block={block as CalloutBlock} />
          case 'linkList':
            return <LinkList key={key} block={block as LinkListBlock} />
          case 'cards':
            return <Cards key={key} block={block as CardsBlock} />
          default:
            return null
        }
      })}
    </div>
  )
}
