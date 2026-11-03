'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import type { SiteLink } from '@/lib/site/chrome'
import { cn } from '@/lib/utils'

/**
 * Navegação interna de uma seção (ex.: "O grupo"): lista vertical fixa ao rolar no desktop e
 * pílulas que quebram em linhas no celular (todas visíveis, sem rolagem horizontal escondida).
 */
export function SectionNav({ label, items }: { label: string; items: SiteLink[] }) {
  const pathname = usePathname() ?? ''
  return (
    <nav aria-label={label} className="lg:sticky lg:top-28">
      <p className="mb-3 hidden text-sm font-semibold text-primary lg:block">{label}</p>
      <ul className="flex flex-wrap gap-2 lg:flex-col lg:flex-nowrap lg:gap-0 lg:border-l">
        {items.map((item) => {
          const current = pathname === item.href
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-11 items-center rounded-full border px-4 text-sm transition-colors lg:-ml-px lg:w-full lg:rounded-none lg:border-0 lg:border-l-2 lg:px-4 lg:whitespace-normal',
                  current
                    ? 'border-primary bg-primary text-primary-foreground lg:border-primary lg:bg-transparent lg:font-semibold lg:text-primary'
                    : 'border-border text-foreground hover:bg-secondary hover:text-primary lg:border-transparent lg:hover:border-input lg:hover:bg-transparent',
                )}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
