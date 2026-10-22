'use client'

import * as Sentry from '@sentry/nextjs'
import { TriangleAlertIcon } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'

import { EmptyState } from '@/components/site/empty-state'
import { Button, buttonVariants } from '@/components/ui/button'

/** Erro inesperado (planejamento 16.6): sem detalhes técnicos para o visitante. */
export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold text-foreground">Algo deu errado</h1>
      <EmptyState
        icon={TriangleAlertIcon}
        title="Não foi possível carregar esta página"
        description={
          <>
            Tente novamente em instantes.
            {error.digest ? (
              <span className="mt-2 block text-sm">Código de referência: {error.digest}</span>
            ) : null}
          </>
        }
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button type="button" onClick={reset}>
              Tentar novamente
            </Button>
            <Link href="/" className={buttonVariants({ variant: 'outline' })}>
              Página inicial
            </Link>
          </div>
        }
      />
    </div>
  )
}
