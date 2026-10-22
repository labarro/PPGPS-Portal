'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

/** Último recurso para falhas no layout raiz: HTML mínimo, sem detalhes técnicos. */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: '3rem 1.5rem' }}>
        <main style={{ maxWidth: '40rem', margin: '0 auto', color: '#0f1b2d' }}>
          <h1 style={{ color: '#0b2545' }}>Algo deu errado</h1>
          <p>O portal está temporariamente indisponível. Tente novamente em instantes.</p>
          <p>
            {/* Recarga completa de propósito: o layout raiz falhou e não deve ser reaproveitado. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" style={{ color: '#1d4f91' }}>
              Voltar à página inicial
            </a>
          </p>
        </main>
      </body>
    </html>
  )
}
