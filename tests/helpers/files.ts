/** Arquivos FICTÍCIOS mínimos para testes de upload (sem dados reais). */

// PNG 1×1 transparente válido.
export const TINY_PNG = Uint8Array.from(
  Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  ),
)

// PDF mínimo válido (uma página em branco).
export const TINY_PDF = Uint8Array.from(
  Buffer.from(
    [
      '%PDF-1.4',
      '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj',
      '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj',
      '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 72 72]>>endobj',
      'xref',
      '0 4',
      '0000000000 65535 f ',
      '0000000009 00000 n ',
      '0000000052 00000 n ',
      '0000000101 00000 n ',
      'trailer<</Size 4/Root 1 0 R>>',
      'startxref',
      '160',
      '%%EOF',
      '',
    ].join('\n'),
    'latin1',
  ),
)

// Cabeçalho de executável Windows (MZ) seguido de bytes quaisquer: simula ".exe renomeado".
export const FAKE_EXE = Uint8Array.from([
  0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0xff, 0xff, 0x00, 0x00,
  0xb8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
])

export const SVG_WITH_SCRIPT = new TextEncoder().encode(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><script>alert(1)</script></svg>',
)

/** "Imagem" JPEG com o tamanho pedido (cabeçalho válido + preenchimento). */
export function jpegOfSize(bytes: number): Uint8Array {
  const data = new Uint8Array(bytes)
  data.set([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01])
  return data
}
