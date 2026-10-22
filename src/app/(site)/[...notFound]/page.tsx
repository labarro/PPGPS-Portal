import { notFound } from 'next/navigation'

/**
 * Rotas públicas inexistentes renderizam a 404 do site (com cabeçalho e rodapé).
 * `/admin` e `/api` têm rotas próprias, mais específicas, e não passam por aqui.
 */
export default function CatchAllNotFound() {
  notFound()
}
