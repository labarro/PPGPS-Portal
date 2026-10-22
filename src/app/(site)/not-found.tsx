import { SearchXIcon } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { Breadcrumbs } from '@/components/site/breadcrumbs'
import { EmptyState } from '@/components/site/empty-state'
import { buttonVariants } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Página não encontrada',
  robots: { index: false, follow: false },
}

/** 404 personalizada (planejamento 16.6): linguagem simples e caminho de volta. */
export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
      <Breadcrumbs items={[{ label: 'Início', href: '/' }, { label: 'Página não encontrada' }]} />
      <h1 className="font-serif text-3xl font-semibold text-foreground">Página não encontrada</h1>
      <EmptyState
        icon={SearchXIcon}
        title="Não encontramos este endereço"
        description="O link pode estar incorreto ou a página pode ter sido movida."
        action={
          <Link href="/" className={buttonVariants()}>
            Voltar à página inicial
          </Link>
        }
      />
    </div>
  )
}
