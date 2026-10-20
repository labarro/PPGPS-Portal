import { type NextRequest, NextResponse } from 'next/server'

import { isProduction, isProtectedNonProduction, resolveAppEnv } from './lib/env/app-env'
import { isAuthorized, readBasicAuthCredentials } from './lib/security/basic-auth'
import { NOINDEX_VALUE } from './lib/security/headers'

/**
 * Proteção de ambientes não produtivos (S01; ADR-0005):
 * - preview e homologação exigem autenticação básica (falha fechada se as credenciais
 *   não estiverem configuradas);
 * - qualquer ambiente fora da produção responde com `X-Robots-Tag: noindex`.
 */
export function proxy(request: NextRequest): NextResponse {
  const env = resolveAppEnv(process.env.APP_ENV)

  if (isProduction(env)) {
    return NextResponse.next()
  }

  const credentials = readBasicAuthCredentials(process.env)
  const mustAuthenticate = isProtectedNonProduction(env) || credentials !== null

  if (mustAuthenticate) {
    if (!credentials) {
      return withNoindex(
        new NextResponse('Ambiente protegido sem credenciais configuradas.', { status: 503 }),
      )
    }

    if (!isAuthorized(request.headers.get('authorization'), credentials)) {
      return withNoindex(
        new NextResponse('Autenticação necessária.', {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Basic realm="Portal (ambiente restrito)", charset="UTF-8"',
            'Cache-Control': 'no-store',
          },
        }),
      )
    }
  }

  return withNoindex(NextResponse.next())
}

function withNoindex(response: NextResponse): NextResponse {
  response.headers.set('X-Robots-Tag', NOINDEX_VALUE)
  return response
}

export const config = {
  // Tudo, exceto os artefatos estáticos do Next (sem conteúdo do portal).
  matcher: ['/((?!_next/static|_next/image).*)'],
}
