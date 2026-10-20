/**
 * Ambiente lógico da aplicação (ADR-0005): local, preview (por PR), staging (homologação)
 * ou production. Definido pela variável `APP_ENV` em cada ambiente.
 *
 * Regra de segurança: valor ausente ou desconhecido NUNCA é tratado como produção,
 * para que um ambiente mal configurado continue protegido e com `noindex`.
 */
export const APP_ENVS = ['local', 'preview', 'staging', 'production'] as const

export type AppEnv = (typeof APP_ENVS)[number]

export function resolveAppEnv(value: string | undefined): AppEnv {
  const normalized = value?.trim().toLowerCase()
  return (APP_ENVS as readonly string[]).includes(normalized ?? '')
    ? (normalized as AppEnv)
    : 'local'
}

export const isProduction = (env: AppEnv): boolean => env === 'production'

/** Ambientes publicados que não são produção: exigem autenticação básica e `noindex`. */
export const isProtectedNonProduction = (env: AppEnv): boolean =>
  env === 'preview' || env === 'staging'
