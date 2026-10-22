import { randomUUID } from 'node:crypto'

import { type CollectionBeforeOperationHook, ValidationError } from 'payload'

import { checkUpload, type UploadPolicy } from '../lib/uploads/file-signature'

/**
 * Upload seguro (planejamento 17.4; ficha S02):
 * - tipo real verificado por magic bytes (extensão e Content-Type do cliente são ignorados);
 * - limites por tipo (imagem 10 MB, PDF 25 MB);
 * - SVG, HTML, executáveis e qualquer formato fora da lista são rejeitados;
 * - nome de arquivo substituído por um identificador aleatório (sem dados do nome original).
 *
 * Roda em `beforeOperation`, antes de o Payload gerar os dados do arquivo e de o adaptador
 * de storage enviar qualquer byte ao bucket.
 */
export function secureUpload(policy: UploadPolicy): CollectionBeforeOperationHook {
  return ({ args, operation, req }) => {
    if (operation !== 'create' && operation !== 'update') return args
    const file = req.file
    if (!file) return args

    const data = file.data as Uint8Array | undefined
    const size = typeof file.size === 'number' && file.size > 0 ? file.size : (data?.length ?? 0)
    const result = checkUpload(data, size, policy)

    if (!result.ok) {
      throw new ValidationError({
        errors: [{ message: result.message, path: 'file' }],
      })
    }

    file.name = `${randomUUID()}.${result.type.ext}`
    file.mimetype = result.type.mime
    return args
  }
}
