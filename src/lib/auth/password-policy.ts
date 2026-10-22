import { COMMON_PASSWORDS, COMMON_STEMS } from './common-passwords'

/**
 * Política de senha (planejamento 14.1 e 17.7 — S02):
 * - mínimo de 12 e máximo de 128 caracteres;
 * - recusa senhas comuns, repetitivas ou sequenciais;
 * - recusa senhas iguais ao e-mail (ou à parte local dele).
 */
export const PASSWORD_MIN_LENGTH = 12
export const PASSWORD_MAX_LENGTH = 128

export type PasswordCheck = { ok: true } | { ok: false; message: string }

const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const commonSet = new Set(COMMON_PASSWORDS.map(normalize))

function isSequential(value: string): boolean {
  if (value.length < 4) return false
  let ascending = true
  let descending = true
  for (let i = 1; i < value.length; i += 1) {
    const diff = value.charCodeAt(i) - value.charCodeAt(i - 1)
    if (diff !== 1) ascending = false
    if (diff !== -1) descending = false
  }
  return ascending || descending
}

/** Senha formada por um mesmo bloco repetido (ex.: "abcabcabcabc"). */
function isRepeatedBlock(value: string): boolean {
  for (let size = 1; size <= value.length / 2; size += 1) {
    if (value.length % size !== 0) continue
    const block = value.slice(0, size)
    if (block.repeat(value.length / size) === value) return true
  }
  return false
}

/** Remove radicais comuns, dígitos e símbolos: o que sobra é a parte "imprevisível". */
function meaningfulRemainder(value: string): string {
  let rest = value
  for (const stem of COMMON_STEMS) rest = rest.split(stem).join('')
  return rest.replace(/[^a-z]/g, '')
}

export function checkPassword(password: unknown, email?: string | null): PasswordCheck {
  if (typeof password !== 'string' || password.length === 0) {
    return { ok: false, message: 'Informe uma senha.' }
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      ok: false,
      message: `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`,
    }
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return {
      ok: false,
      message: `A senha deve ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`,
    }
  }

  const normalized = normalize(password)
  const compact = normalized.replace(/\s+/g, '')

  if (commonSet.has(normalized) || commonSet.has(compact)) {
    return { ok: false, message: 'Esta senha é muito comum. Escolha outra.' }
  }
  if (isRepeatedBlock(compact) || isSequential(compact)) {
    return { ok: false, message: 'A senha não pode ser repetitiva ou sequencial.' }
  }
  if (meaningfulRemainder(compact).length < 4) {
    return {
      ok: false,
      message: 'A senha é previsível (palavra comum seguida de números). Escolha outra.',
    }
  }

  if (email) {
    const mail = normalize(email)
    const local = mail.split('@')[0] ?? ''
    if (compact === mail || (local.length >= 4 && compact.includes(local))) {
      return { ok: false, message: 'A senha não pode conter o seu e-mail.' }
    }
  }

  return { ok: true }
}
