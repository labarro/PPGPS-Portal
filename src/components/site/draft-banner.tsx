import { EXIT_PREVIEW_ROUTE } from '@/lib/content/preview'

/** Faixa exibida somente a admin/editor no modo de pré-visualização (rascunhos visíveis). */
export function DraftBanner() {
  return (
    <div className="bg-secondary text-secondary-foreground" role="status">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm sm:px-6">
        <p>
          <strong>Pré-visualização:</strong> você está vendo rascunhos ainda não publicados.
        </p>
        {/* Rota de saída é um Route Handler: link comum (sem prefetch). */}
        <a
          href={EXIT_PREVIEW_ROUTE}
          className="inline-flex min-h-6 items-center rounded-sm font-medium underline underline-offset-4"
        >
          Sair da pré-visualização
        </a>
      </div>
    </div>
  )
}
