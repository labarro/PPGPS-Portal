'use client'

import { MenuIcon } from 'lucide-react'
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

/**
 * Menu do celular (planejamento 16.2): painel lateral com foco preso, fecha com Esc,
 * pelo botão "Fechar menu" ou ao escolher um link; o foco volta ao botão "Menu".
 */
export function MobileNav({ items, siteName }: { items: SiteLink[]; siteName: string }) {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="default" className="md:hidden" aria-label="Abrir menu">
          <MenuIcon aria-hidden="true" />
          <span>Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" closeLabel="Fechar menu" aria-describedby="menu-descricao">
        <SheetHeader className="border-b pr-14">
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription id="menu-descricao">{siteName}</SheetDescription>
        </SheetHeader>
        <nav aria-label="Menu principal (celular)" className="px-3">
          <NavLinks items={items} orientation="vertical" onNavigate={() => setOpen(false)} />
        </nav>
      </SheetContent>
    </Sheet>
  )
}
