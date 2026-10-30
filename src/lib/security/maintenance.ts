import { type AppEnv, isProduction } from '../env/app-env'

type Env = Record<string, string | undefined>

/**
 * Modo de manutenção (S06; planejamento 17.7): ativado pela variável de ambiente
 * `MAINTENANCE_MODE=true` no deploy. O site continua no ar com aviso; o painel fica somente
 * leitura (toda escrita pela API é recusada com 503), exceto entrar e sair da conta.
 */
export function isMaintenanceMode(env: Env = process.env): boolean {
  return env.MAINTENANCE_MODE?.trim().toLowerCase() === 'true'
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/** Escritas permitidas mesmo em manutenção (sessão das contas administrativas). */
const MAINTENANCE_ALLOWED_WRITES = new Set([
  '/api/users/login',
  '/api/users/logout',
  '/api/users/refresh-token',
])

const normalize = (pathname: string) =>
  pathname.length > 1 ? pathname.replace(/\/+$/, '').toLowerCase() : pathname

export function isBlockedByMaintenance(method: string, pathname: string): boolean {
  if (SAFE_METHODS.has(method.toUpperCase())) return false
  const path = normalize(pathname)
  if (!path.startsWith('/api/')) return false
  return !MAINTENANCE_ALLOWED_WRITES.has(path)
}

export const MAINTENANCE_MESSAGE =
  'Portal em manutenção: alterações estão temporariamente suspensas. Tente novamente mais tarde.'

/**
 * Cadastro do primeiro usuário (S06): em produção, o formulário "criar primeiro usuário" do
 * Payload transformaria qualquer visitante em `admin` enquanto o banco não tiver contas.
 * A conta `admin` de produção é criada pelo pipeline (`pnpm users:bootstrap-admin`); o
 * endpoint só fica aberto com `ALLOW_FIRST_REGISTRATION=true` (nunca recomendado).
 */
export function isFirstRegisterBlocked(appEnv: AppEnv, pathname: string, env: Env = process.env) {
  if (!isProduction(appEnv)) return false
  if (env.ALLOW_FIRST_REGISTRATION === 'true') return false
  return normalize(pathname) === '/api/users/first-register'
}
