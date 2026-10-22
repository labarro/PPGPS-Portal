import { serializeJsonLd } from '@/lib/content/jsonld'

/**
 * Dados estruturados (JSON-LD). Único uso de `dangerouslySetInnerHTML` no site público:
 * o conteúdo NÃO é rich text nem HTML — é um objeto gerado pelo próprio código e serializado
 * por `serializeJsonLd`, que escapa `<`, `>` e `&` (não há como fechar a tag `<script>`).
 * O React escaparia as aspas do JSON se o passássemos como filho, invalidando os dados.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger -- JSON-LD serializado e escapado (ver acima)
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  )
}
