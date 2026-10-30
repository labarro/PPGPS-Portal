import { isMaintenanceMode, MAINTENANCE_MESSAGE } from '@/lib/security/maintenance'

/**
 * Aviso de manutenção no topo do painel (S06). Componente de servidor: lê
 * `MAINTENANCE_MODE` em tempo de execução; sem manutenção, não renderiza nada.
 */
export function MaintenanceBanner() {
  if (!isMaintenanceMode()) return null
  return (
    <div
      role="status"
      style={{
        background: 'var(--theme-warning-100, #fff8e1)',
        borderBottom: '1px solid var(--theme-warning-400, #d9a400)',
        color: 'var(--theme-elevation-900, #1a1a1a)',
        padding: '10px 16px',
        textAlign: 'center',
        fontWeight: 600,
      }}
    >
      Modo de manutenção: painel somente leitura. {MAINTENANCE_MESSAGE}
    </div>
  )
}
