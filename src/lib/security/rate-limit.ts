/**
 * Limite de taxa em janela deslizante, em memória (planejamento 17.4 e 17.7 — S02).
 *
 * Limitação conhecida (ADR-0011): o estado é por instância do servidor. Em ambiente
 * serverless, instâncias diferentes não compartilham contadores; o controle principal
 * contra força bruta continua sendo o bloqueio por conta (5 tentativas / 15 min), que é
 * persistido no banco. Este limitador reduz rajadas por IP sem custo adicional.
 */
export type RateLimitRule = {
  /** Número máximo de eventos na janela. */
  limit: number
  /** Duração da janela em milissegundos. */
  windowMs: number
}

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  /** Segundos até a próxima tentativa ser aceita (0 quando permitido). */
  retryAfterSeconds: number
}

export class SlidingWindowRateLimiter {
  private readonly hits = new Map<string, number[]>()

  constructor(
    private readonly now: () => number = Date.now,
    private readonly maxKeys = 10_000,
  ) {}

  hit(key: string, rule: RateLimitRule): RateLimitResult {
    const current = this.now()
    const windowStart = current - rule.windowMs
    const recent = (this.hits.get(key) ?? []).filter((time) => time > windowStart)

    if (recent.length >= rule.limit) {
      this.hits.set(key, recent)
      const oldest = recent[0] ?? current
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil((oldest + rule.windowMs - current) / 1000)),
      }
    }

    recent.push(current)
    this.hits.set(key, recent)
    this.evictIfNeeded(windowStart)
    return { allowed: true, remaining: rule.limit - recent.length, retryAfterSeconds: 0 }
  }

  reset(): void {
    this.hits.clear()
  }

  get size(): number {
    return this.hits.size
  }

  /** Evita crescimento ilimitado de memória: remove chaves expiradas e, se preciso, as mais antigas. */
  private evictIfNeeded(windowStart: number): void {
    if (this.hits.size <= this.maxKeys) return
    for (const [key, times] of this.hits) {
      if (times.every((time) => time <= windowStart)) this.hits.delete(key)
    }
    while (this.hits.size > this.maxKeys) {
      const first = this.hits.keys().next().value
      if (first === undefined) break
      this.hits.delete(first)
    }
  }
}

/** Regras por operação de autenticação (por IP de origem). */
export const AUTH_RATE_LIMITS = {
  login: { limit: 10, windowMs: 10 * 60_000 },
  forgotPassword: { limit: 5, windowMs: 15 * 60_000 },
  resetPassword: { limit: 10, windowMs: 15 * 60_000 },
} as const satisfies Record<string, RateLimitRule>

export type RateLimitedAuthOperation = keyof typeof AUTH_RATE_LIMITS

export const authRateLimiter = new SlidingWindowRateLimiter()
