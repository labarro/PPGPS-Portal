import { describe, expect, it } from 'vitest'

import {
  collectionPrefix,
  assertStorageForEnv,
  resolveStorageConfig,
  sanitizePrefix,
  StorageConfigError,
  storageRequired,
} from '@/lib/storage/config'
import { checkUpload, detectFileType, MB } from '@/lib/uploads/file-signature'

import { FAKE_EXE, jpegOfSize, SVG_WITH_SCRIPT, TINY_PDF, TINY_PNG } from '../helpers/files'

const IMAGES = { accept: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const }
const DOCS = { accept: ['application/pdf', 'image/png'] as const }

const webp = Uint8Array.from(
  [...'RIFF']
    .map((c) => c.charCodeAt(0))
    .concat(
      [0, 0, 0, 0],
      [...'WEBPVP8 '].map((c) => c.charCodeAt(0)),
    ),
)
const avif = Uint8Array.from([
  0,
  0,
  0,
  0x1c,
  ...[...'ftypavif'].map((c) => c.charCodeAt(0)),
  0,
  0,
  0,
  0,
])
const heic = Uint8Array.from([
  0,
  0,
  0,
  0x1c,
  ...[...'ftypheic'].map((c) => c.charCodeAt(0)),
  0,
  0,
  0,
  0,
])
const html = new TextEncoder().encode('<!doctype html><script>alert(1)</script>')
const zip = Uint8Array.from([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
const pdfWithPrefix = new TextEncoder().encode('lixo antes %PDF-1.4 ...')

describe('detecção do tipo real por magic bytes', () => {
  it('reconhece os formatos aceitos', () => {
    expect(detectFileType(TINY_PNG)?.mime).toBe('image/png')
    expect(detectFileType(jpegOfSize(64))?.mime).toBe('image/jpeg')
    expect(detectFileType(webp)?.mime).toBe('image/webp')
    expect(detectFileType(avif)?.mime).toBe('image/avif')
    expect(detectFileType(TINY_PDF)?.mime).toBe('application/pdf')
  })

  it('não reconhece executáveis, SVG, HTML, ZIP, HEIC nem PDF com lixo no início', () => {
    for (const bytes of [FAKE_EXE, SVG_WITH_SCRIPT, html, zip, heic, pdfWithPrefix]) {
      expect(detectFileType(bytes)).toBeNull()
    }
    expect(detectFileType(new Uint8Array(4))).toBeNull()
    expect(detectFileType(undefined)).toBeNull()
  })
})

describe('política de upload', () => {
  it('rejeita .exe renomeado e SVG', () => {
    expect(checkUpload(FAKE_EXE, FAKE_EXE.length, IMAGES)).toMatchObject({
      ok: false,
      reason: 'unknown_type',
    })
    expect(checkUpload(SVG_WITH_SCRIPT, SVG_WITH_SCRIPT.length, IMAGES)).toMatchObject({
      ok: false,
    })
  })

  it('rejeita tipo válido fora da coleção', () => {
    expect(checkUpload(TINY_PDF, TINY_PDF.length, IMAGES)).toMatchObject({
      ok: false,
      reason: 'type_not_allowed',
    })
  })

  it('aplica 10 MB para imagens e 25 MB para PDF', () => {
    const img = jpegOfSize(16)
    expect(checkUpload(img, 10 * MB, IMAGES).ok).toBe(true)
    expect(checkUpload(img, 10 * MB + 1, IMAGES)).toMatchObject({ ok: false, reason: 'too_large' })
    expect(checkUpload(TINY_PDF, 25 * MB, DOCS).ok).toBe(true)
    expect(checkUpload(TINY_PDF, 25 * MB + 1, DOCS)).toMatchObject({
      ok: false,
      reason: 'too_large',
    })
  })

  it('rejeita arquivo vazio', () => {
    expect(checkUpload(new Uint8Array(), 0, IMAGES)).toMatchObject({ ok: false, reason: 'empty' })
  })

  it('retorna extensão canônica para o nome aleatório', () => {
    const result = checkUpload(TINY_PNG, TINY_PNG.length, IMAGES)
    expect(result.ok && result.type.ext).toBe('png')
  })
})

describe('configuração do storage', () => {
  const base = {
    S3_BUCKET: 'ppgps-preview',
    S3_ENDPOINT: 'https://conta.r2.cloudflarestorage.com',
    S3_ACCESS_KEY_ID: 'id-ficticio',
    S3_SECRET_ACCESS_KEY: 'segredo-ficticio',
  }

  it('sem bucket, o storage fica desabilitado', () => {
    expect(resolveStorageConfig({})).toBeNull()
  })

  it('lê a configuração com região padrão "auto" e caminho por path-style', () => {
    expect(resolveStorageConfig({ ...base, S3_PREFIX: '/PR-12/' })).toMatchObject({
      bucket: 'ppgps-preview',
      region: 'auto',
      forcePathStyle: true,
      rootPrefix: 'pr-12',
    })
  })

  it('exige credenciais completas', () => {
    expect(() => resolveStorageConfig({ S3_BUCKET: 'x' })).toThrow(StorageConfigError)
  })

  it('nunca usa o bucket de backups para uploads', () => {
    expect(() => resolveStorageConfig({ ...base, S3_BUCKET: 'ppgps-backups' })).toThrow(/backups/)
  })

  it('prefixos isolam ambientes e coleções', () => {
    expect(sanitizePrefix(' pr-7//../x ')).toBe('pr-7/x')
    expect(collectionPrefix('pr-7', 'media')).toBe('pr-7/media')
    expect(collectionPrefix('', 'documents')).toBe('documents')
  })

  it('fora do ambiente local o storage é obrigatório', () => {
    expect(storageRequired('local')).toBe(false)
    expect(storageRequired('preview')).toBe(true)
    expect(storageRequired('staging')).toBe(true)
    expect(() => assertStorageForEnv({ APP_ENV: 'staging' })).toThrow(StorageConfigError)
    expect(assertStorageForEnv({ APP_ENV: 'local' })).toBeNull()
  })
})
