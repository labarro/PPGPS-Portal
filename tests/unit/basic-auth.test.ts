import { describe, expect, it } from 'vitest'

import {
  isAuthorized,
  parseBasicAuthHeader,
  readBasicAuthCredentials,
  safeEqual,
} from '@/lib/security/basic-auth'

const encode = (value: string) => `Basic ${btoa(value)}`

describe('parseBasicAuthHeader', () => {
  it('lê usuário e senha (senha pode conter ":")', () => {
    expect(parseBasicAuthHeader(encode('revisor:se:nha'))).toEqual({
      user: 'revisor',
      password: 'se:nha',
    })
  })

  it.each([
    [null],
    [undefined],
    [''],
    ['Bearer abc'],
    ['Basic'],
    ['Basic %%%invalido%%%'],
    [`Basic ${btoa('semseparador')}`],
  ])('retorna null para cabeçalho inválido: %s', (header) => {
    expect(parseBasicAuthHeader(header)).toBeNull()
  })

  it('aceita o esquema sem diferenciar maiúsculas', () => {
    expect(parseBasicAuthHeader(`basic ${btoa('a:b')}`)).toEqual({ user: 'a', password: 'b' })
  })
})

describe('safeEqual', () => {
  it('compara conteúdo e tamanho', () => {
    expect(safeEqual('abc', 'abc')).toBe(true)
    expect(safeEqual('abc', 'abd')).toBe(false)
    expect(safeEqual('abc', 'abcd')).toBe(false)
    expect(safeEqual('', '')).toBe(true)
  })
})

describe('isAuthorized', () => {
  const expected = { user: 'revisor', password: 'segredo' }

  it('autoriza credenciais corretas', () => {
    expect(isAuthorized(encode('revisor:segredo'), expected)).toBe(true)
  })

  it('nega usuário ou senha incorretos e cabeçalho ausente', () => {
    expect(isAuthorized(encode('revisor:errado'), expected)).toBe(false)
    expect(isAuthorized(encode('outro:segredo'), expected)).toBe(false)
    expect(isAuthorized(null, expected)).toBe(false)
  })
})

describe('readBasicAuthCredentials', () => {
  it('exige usuário e senha não vazios', () => {
    expect(readBasicAuthCredentials({})).toBeNull()
    expect(readBasicAuthCredentials({ BASIC_AUTH_USER: 'a', BASIC_AUTH_PASSWORD: '' })).toBeNull()
    expect(readBasicAuthCredentials({ BASIC_AUTH_USER: ' ', BASIC_AUTH_PASSWORD: 'x' })).toBeNull()
    expect(readBasicAuthCredentials({ BASIC_AUTH_USER: 'a', BASIC_AUTH_PASSWORD: 'b' })).toEqual({
      user: 'a',
      password: 'b',
    })
  })
})
