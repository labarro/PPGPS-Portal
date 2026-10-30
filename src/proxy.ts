import { type NextRequest, NextResponse } from 'next/server'

import { lookupRedirect } from './lib/content/redirect-db'
import type { RedirectHit } from './lib/content/redirect-lookup'
import { isProduction, isProtectedNonProduction, resolveAppEnv } from './lib/env/app-env'
import { PRODUCTION_HOST, PRODUCTION_SITE_URL } from './lib/env/server-url'
import { isAuthorized, readBasicAuthCredentials } from './lib/security/basic-auth'
import { NOINDEX_VALUE } from './lib/security/headers'

type Lookup = (pathname: string) => Promise<RedirectHit | null>

/**
 * Proxy (S01 + S03; ADR-0005):
 * - preview e homologação exigem autenticação básica (falha fechada se as credenciais
 *   não estiverem configuradas);
 * - qualquer ambiente fora da produção responde com `X-Robots-Tag: noindex`;
 * - endereços antigos de linhas/páginas (slug alterado) recebem 301 real (plugin de redirects).
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  return handleProxy(request, lookupRedirect)
}

/** Lógica do proxy com a consulta de redirecionamentos injetável (testes). */
export async function handleProxy(request: NextRequest, lookup: Lookup): Promise<NextResponse> {
  const env = resolveAppEnv(process.env.APP_ENV)

  if (!isProduction(env)) {
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
  }

  // Produção (ADR-0014): `www.bioeticaps.app` → apex canônico. Nunca fora da produção.
  if (isProduction(env) && request.nextUrl.hostname.toLowerCase() === `www.${PRODUCTION_HOST}`) {
    const target = new URL(
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
      PRODUCTION_SITE_URL,
    )
    return NextResponse.redirect(target, 308)
  }

  const redirect = await findRedirect(request, lookup)
  if (redirect) {
    const response = NextResponse.redirect(new URL(redirect.to, request.url), redirect.status)
    return isProduction(env) ? response : withNoindex(response)
  }

  return isProduction(env) ? NextResponse.next() : withNoindex(NextResponse.next())
}

async function findRedirect(request: NextRequest, lookup: Lookup): Promise<RedirectHit | null> {
  if (request.method !== 'GET' && request.method !== 'HEAD') return null
  try {
    return await lookup(request.nextUrl.pathname)
  } catch (error) {
    console.error('[proxy] Falha ao consultar redirecionamentos; seguindo sem redirecionar.', error)
    return null
  }
}

function withNoindex(response: NextResponse): NextResponse {
  response.headers.set('X-Robots-Tag', NOINDEX_VALUE)
  return response
}

export const config = {
  // Tudo, exceto os artefatos estáticos do Next (sem conteúdo do portal).
  matcher: ['/((?!_next/static|_next/image).*)'],
}
