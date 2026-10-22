import { isIP } from 'node:net'

type HeaderSource = { get(name: string): string | null } | null | undefined

/**
 * IP do cliente. Na Vercel, `x-forwarded-for` é definido pela própria plataforma (o primeiro
 * valor é o cliente); `x-real-ip` é usado como alternativa. Valores inválidos são ignorados.
 */
export function clientIp(headers: HeaderSource): string | null {
  if (!headers) return null
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const candidates = [forwarded, headers.get('x-real-ip')?.trim()]
  for (const candidate of candidates) {
    if (candidate && isIP(candidate)) return candidate
  }
  return null
}

/**
 * IP truncado para a auditoria (minimização, planejamento 13.3):
 * IPv4 → /24 (último octeto zerado); IPv6 → /48.
 */
export function truncateIp(ip: string | null | undefined): string | null {
  if (!ip) return null
  const version = isIP(ip)
  if (version === 4) {
    const parts = ip.split('.')
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`
  }
  if (version === 6) {
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(ip)
    if (mapped?.[1]) return truncateIp(mapped[1])
    const [head = ''] = ip.split('::')
    const groups = head.split(':').filter(Boolean)
    while (groups.length < 3) groups.push('0')
    return `${groups.slice(0, 3).join(':')}::`
  }
  return null
}
