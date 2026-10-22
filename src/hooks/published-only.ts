import type { CollectionBeforeOperationHook, GlobalConfig, PayloadRequest } from 'payload'

import { isAdminOrEditor } from '../access'

type GlobalBeforeOperationHook = NonNullable<
  NonNullable<GlobalConfig['hooks']>['beforeOperation']
>[number]

/**
 * Defesa em profundidade contra vazamento de rascunhos (teste de vazamento, S03): quem não é
 * admin/editor nunca recebe a versão de rascunho, mesmo pedindo `?draft=true` na API.
 * O filtro de `read` (`_status = published`) continua sendo a regra principal.
 */
export function stripDraftForPublic<T>(args: T, req: Pick<PayloadRequest, 'user'>): T {
  if (!args || typeof args !== 'object' || isAdminOrEditor({ req })) return args
  if ((args as { draft?: unknown }).draft) return { ...args, draft: false }
  return args
}

export const publishedOnlyForPublic: CollectionBeforeOperationHook = ({ args, operation, req }) => {
  if (operation !== 'read') return args
  return stripDraftForPublic(args, req)
}

export const publishedOnlyForPublicGlobal: GlobalBeforeOperationHook = ({
  args,
  operation,
  req,
}) => {
  if (operation !== 'read') return args
  return stripDraftForPublic(args, req)
}
