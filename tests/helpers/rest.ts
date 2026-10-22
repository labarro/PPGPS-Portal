import { handleEndpoints } from 'payload'

import config from '../../src/payload.config'

/**
 * Chama a API REST do Payload em processo (mesmo roteador usado pelo Next em /api),
 * sem subir servidor HTTP. Permite testar acesso como visitante anônimo e por papel.
 */
export function randomTestIp(): string {
  const octet = () => Math.floor(Math.random() * 254) + 1
  return `198.18.${octet()}.${octet()}`
}

export type RestOptions = {
  token?: string
  body?: unknown
  form?: FormData
  headers?: Record<string, string>
  ip?: string
}

export async function rest(method: string, path: string, options: RestOptions = {}) {
  const headers = new Headers(options.headers)
  if (options.token) headers.set('Authorization', `JWT ${options.token}`)
  // IP da faixa reservada a testes (198.18.0.0/15, RFC 2544). Aleatório por chamada, para que o limite de taxa só atue
  // nos testes que fixam o IP de propósito.
  headers.set('x-forwarded-for', options.ip ?? randomTestIp())

  let body: BodyInit | undefined
  if (options.form) {
    body = options.form
  } else if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(options.body)
  }

  const request = new Request(`http://localhost:3000/api${path}`, {
    method,
    headers,
    body,
    redirect: 'manual',
  })
  const response = await handleEndpoints({ config, request })
  return response
}

export async function restJson<T = Record<string, unknown>>(
  method: string,
  path: string,
  options: RestOptions = {},
): Promise<{ status: number; json: T; response: Response }> {
  const response = await rest(method, path, options)
  const text = await response.text()
  let json: T
  try {
    json = (text ? JSON.parse(text) : {}) as T
  } catch {
    json = { raw: text } as T
  }
  return { status: response.status, json, response }
}

export async function loginRest(email: string, password: string, ip?: string): Promise<string> {
  const { status, json } = await restJson<{ token?: string }>('POST', '/users/login', {
    body: { email, password },
    ip,
  })
  if (status !== 200 || !json.token) throw new Error(`Login falhou (${status})`)
  return json.token
}

/** Formulário multipart de upload no formato aceito pelo Payload (`_payload` + `file`). */
export function uploadForm(
  data: Record<string, unknown>,
  file: Uint8Array,
  filename: string,
  type: string,
) {
  const form = new FormData()
  form.append('_payload', JSON.stringify(data))
  form.append('file', new Blob([file], { type }), filename)
  return form
}
