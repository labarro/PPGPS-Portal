/**
 * Remoção de dados pessoais antes do envio de eventos ao Sentry (planejamento 17.7 — S02).
 * Remove usuário, IP, cookies, cabeçalhos de autenticação, corpo de requisição, parâmetros
 * de consulta e mascara e-mails, IPs e tokens em mensagens, exceções e breadcrumbs.
 */
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
const IPV4 = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g
const IPV6 = /\b(?:[0-9a-f]{1,4}:){2,7}[0-9a-f]{1,4}\b/gi
const RESET_PATH = /(\/reset\/)[^/?#\s"']+/gi
const BEARER = /\b(JWT|Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/g
const LONG_TOKEN = /\b[a-f0-9]{32,}\b/gi
const SENSITIVE_KEY =
  /^(ip|ip_address|ipaddress)$|pass|secret|token|authorization|cookie|session|e-?mail|cpf|phone|telefone/i

export function scrubText(value: string): string {
  return value
    .replace(EMAIL, '[e-mail removido]')
    .replace(RESET_PATH, '$1[token removido]')
    .replace(BEARER, '$1 [credencial removida]')
    .replace(LONG_TOKEN, '[token removido]')
    .replace(IPV4, '[ip removido]')
    .replace(IPV6, '[ip removido]')
}

function scrubValue(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[profundidade omitida]'
  if (typeof value === 'string') return scrubText(value)
  if (Array.isArray(value)) return value.map((item) => scrubValue(item, depth + 1))
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, inner] of Object.entries(value)) {
      out[key] = SENSITIVE_KEY.test(key) ? '[removido]' : scrubValue(inner, depth + 1)
    }
    return out
  }
  return value
}

/** Forma mínima do evento do Sentry usada aqui (evita acoplar aos tipos do SDK). */
export type ScrubbableEvent = {
  message?: string
  user?: unknown
  request?: {
    url?: string
    query_string?: unknown
    cookies?: unknown
    headers?: Record<string, string>
    data?: unknown
    env?: unknown
  }
  exception?: { values?: Array<{ value?: string }> }
  breadcrumbs?: Array<{ message?: string; data?: unknown }>
  extra?: Record<string, unknown>
  contexts?: Record<string, unknown>
  tags?: Record<string, unknown>
  server_name?: string
}

const ALLOWED_HEADERS = new Set(['content-type', 'accept', 'user-agent', 'referer'])

export function scrubEvent<T extends ScrubbableEvent>(event: T): T {
  delete event.user
  delete event.server_name

  if (event.message) event.message = scrubText(event.message)

  if (event.request) {
    const request = event.request
    delete request.cookies
    delete request.data
    delete request.env
    delete request.query_string
    if (request.url) request.url = scrubText(request.url.split('?')[0] ?? '')
    if (request.headers) {
      const kept: Record<string, string> = {}
      for (const [name, value] of Object.entries(request.headers)) {
        if (ALLOWED_HEADERS.has(name.toLowerCase())) kept[name] = scrubText(String(value))
      }
      request.headers = kept
    }
  }

  for (const exception of event.exception?.values ?? []) {
    if (exception.value) exception.value = scrubText(exception.value)
  }

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((crumb) => ({
      ...crumb,
      message: crumb.message ? scrubText(crumb.message) : crumb.message,
      data: crumb.data ? scrubValue(crumb.data) : crumb.data,
    }))
  }

  if (event.extra) event.extra = scrubValue(event.extra) as Record<string, unknown>
  if (event.contexts) event.contexts = scrubValue(event.contexts) as Record<string, unknown>
  if (event.tags) event.tags = scrubValue(event.tags) as Record<string, unknown>

  return event
}
