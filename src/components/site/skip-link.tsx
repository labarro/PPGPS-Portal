/** "Pular para o conteúdo" (WCAG 2.4.1): primeiro elemento focável da página. */
export function SkipLink({ targetId = 'conteudo' }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only z-[60] rounded-md bg-primary px-4 py-3 font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
    >
      Pular para o conteúdo
    </a>
  )
}
