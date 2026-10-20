/**
 * Página pública provisória (S01). O layout público, a identidade visual e o aviso
 * permanente de portal não oficial entram na S02; o conteúdo do grupo, na S03.
 */
export default function HomePage() {
  return (
    <section className="placeholder" aria-labelledby="titulo">
      <h1 id="titulo">Bioética e Promoção da Saúde</h1>
      <p>Portal do grupo de pesquisa em construção.</p>
      <p className="notice">
        Este é um portal não oficial do grupo de pesquisa. Não representa a instituição de vínculo
        nem o programa de pós-graduação.
      </p>
    </section>
  )
}
