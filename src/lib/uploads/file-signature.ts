/**
 * Detecção do tipo REAL do arquivo pelos primeiros bytes ("magic bytes"), independente da
 * extensão ou do `Content-Type` informados pelo cliente (planejamento 17.4).
 *
 * Só reconhece os formatos aceitos pelo portal. Qualquer outro conteúdo (executáveis, SVG,
 * HTML, scripts, arquivos compactados etc.) resulta em `null` e é rejeitado.
 */
export type AllowedFileType = {
  mime: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif' | 'application/pdf'
  ext: 'jpg' | 'png' | 'webp' | 'avif' | 'pdf'
  kind: 'image' | 'pdf'
}

const ascii = (bytes: Uint8Array, start: number, end: number): string =>
  String.fromCharCode(...bytes.subarray(start, end))

const startsWith = (bytes: Uint8Array, signature: readonly number[], offset = 0): boolean =>
  bytes.length >= offset + signature.length &&
  signature.every((byte, index) => bytes[offset + index] === byte)

export function detectFileType(input: Uint8Array | null | undefined): AllowedFileType | null {
  if (!input || input.length < 12) return null
  const bytes = input

  if (startsWith(bytes, [0xff, 0xd8, 0xff])) {
    return { mime: 'image/jpeg', ext: 'jpg', kind: 'image' }
  }
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { mime: 'image/png', ext: 'png', kind: 'image' }
  }
  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP') {
    return { mime: 'image/webp', ext: 'webp', kind: 'image' }
  }
  if (ascii(bytes, 4, 8) === 'ftyp') {
    const brand = ascii(bytes, 8, 12)
    if (brand === 'avif' || brand === 'avis') {
      return { mime: 'image/avif', ext: 'avif', kind: 'image' }
    }
    return null
  }
  // PDF: "%PDF-" deve estar no início (não aceitamos lixo antes do cabeçalho).
  if (ascii(bytes, 0, 5) === '%PDF-') {
    return { mime: 'application/pdf', ext: 'pdf', kind: 'pdf' }
  }
  return null
}

export const MB = 1024 * 1024

/** Limites por tipo (planejamento 17.4): imagens 10 MB, PDF 25 MB. */
export const MAX_BYTES: Record<AllowedFileType['kind'], number> = {
  image: 10 * MB,
  pdf: 25 * MB,
}

export type UploadPolicy = {
  /** MIME types aceitos nesta coleção (subconjunto dos reconhecidos acima). */
  accept: readonly AllowedFileType['mime'][]
}

export type UploadCheck =
  | { ok: true; type: AllowedFileType }
  | {
      ok: false
      reason: 'unknown_type' | 'type_not_allowed' | 'too_large' | 'empty'
      message: string
    }

export function checkUpload(
  data: Uint8Array | null | undefined,
  size: number,
  policy: UploadPolicy,
): UploadCheck {
  if (!data || data.length === 0 || size <= 0) {
    return { ok: false, reason: 'empty', message: 'Arquivo vazio ou ilegível.' }
  }
  const type = detectFileType(data)
  if (!type) {
    return {
      ok: false,
      reason: 'unknown_type',
      message:
        'Tipo de arquivo não permitido: o conteúdo não corresponde a JPEG, PNG, WebP, AVIF ou PDF (SVG e executáveis são bloqueados).',
    }
  }
  if (!policy.accept.includes(type.mime)) {
    return {
      ok: false,
      reason: 'type_not_allowed',
      message: `Tipo de arquivo não permitido nesta coleção (${type.mime}).`,
    }
  }
  const max = MAX_BYTES[type.kind]
  if (size > max) {
    return {
      ok: false,
      reason: 'too_large',
      message: `Arquivo muito grande: o limite para ${type.kind === 'pdf' ? 'PDF' : 'imagens'} é ${max / MB} MB.`,
    }
  }
  return { ok: true, type }
}
