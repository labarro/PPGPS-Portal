import { isMaintenanceMode } from '@/lib/security/maintenance'

/** Aviso discreto no site durante o modo de manutenção (S06). */
export function MaintenanceNotice() {
  if (!isMaintenanceMode()) return null
  return (
    <div
      role="status"
      data-testid="maintenance-notice"
      className="border-b bg-secondary px-4 py-3 text-center text-sm text-foreground"
    >
      O portal está em manutenção. O conteúdo continua disponível para leitura, mas pode estar
      temporariamente desatualizado.
    </div>
  )
}
