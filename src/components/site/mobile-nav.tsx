'use client'

import { MenuIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { SiteLink } from '@/lib/site/chrome'

import { NavLinks } from './nav-links'

/** Links de apoio no fim do menu do celular (contato e páginas legais). */
export const MOBILE_SECONDARY_LINKS: SiteLink[] = [
  { label: 'Contato', href: '/o-grupo/contato' },
  { label: 'Sobre o portal', href: '/sobre-o-portal' },
  { label: 'Privacidade', href: '/privacidade' },
  { label: 'Acessibilidade', href: '/acessibilidade' },
]

/**
 * Menu do celular (planejamento 16.2; revisão mobile-first pós-lançamento): painel lateral com
 * foco preso, fecha com Esc, pelo botão "Fechar menu" ou ao escolher um link; o foco volta ao
 * botão "Menu". Itens principais com alvos de toque de 48 px e links de apoio ao final.
 */
export function MobileNav({
  items,
  secondary = [],
  siteName,
}: {
  items: SiteLink[]
  secondary?: SiteLink[]
  siteName: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="default"
          className="min-h-11 shrink-0 px-3.5 lg:hidden"
          aria-label="Abrir menu"
        >
          <MenuIcon aria-hidden="true" />
          <span>Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        closeLabel="Fechar menu"
        aria-describedby="menu-descricao"
        className="gap-2 overflow-y-auto"
      >
        <SheetHeader className="border-b pr-14">
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription id="menu-descricao">{siteName}</SheetDescription>
        </SheetHeader>
        <nav aria-label="Menu principal (celular)" className="px-3 pt-1">
          <NavLinks items={items} orientation="vertical" onNavigate={() => setOpen(false)} />
        </nav>
        {secondary.length > 0 ? (
          <nav aria-label="Links de apoio" className="mx-3 mt-4 border-t px-3 pt-4 pb-6">
            <ul className="flex flex-col">
              {secondary.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="inline-flex min-h-11 w-full items-center rounded-md text-sm text-muted-foreground hover:text-primary hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
