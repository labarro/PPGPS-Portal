'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import type { SiteLink } from '@/lib/site/chrome'
import { cn } from '@/lib/utils'

const isExternal = (href: string) => /^(https?:|mailto:)/i.test(href)

export function isCurrent(pathname: string, href: string): boolean {
  if (isExternal(href)) return false
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** Lista de links de navegação com `aria-current="page"` no item ativo. */
export function NavLinks({
  items,
  orientation,
  onNavigate,
}: {
  items: SiteLink[]
  orientation: 'horizontal' | 'vertical'
  onNavigate?: () => void
}) {
  const pathname = usePathname() ?? '/'
  return (
    <ul
      className={cn(
        orientation === 'horizontal' ? 'flex items-center gap-1' : 'flex flex-col gap-1',
      )}
    >
      {items.map((item) => {
        const current = isCurrent(pathname, item.href)
        const external = isExternal(item.href)
        const className = cn(
          'inline-flex min-h-10 items-center rounded-md px-3 text-sm font-medium transition-colors',
          orientation === 'vertical' && 'w-full text-base',
          current
            ? 'bg-secondary text-primary underline decoration-2 underline-offset-8'
            : 'text-foreground hover:bg-secondary hover:text-primary',
        )
        return (
          <li key={`${item.href}-${item.label}`}>
            {external ? (
              <a
                href={item.href}
                className={className}
                rel="noopener noreferrer"
                onClick={onNavigate}
              >
                {item.label}
              </a>
            ) : (
              <Link
                href={item.href}
                className={className}
                aria-current={current ? 'page' : undefined}
                onClick={onNavigate}
              >
                {item.label}
              </Link>
            )}
          </li>
        )
      })}
    </ul>
  )
}
