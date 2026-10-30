import Link from 'next/link'

import type { DirectoryFilters } from '@/lib/people/directory'
import { MEMBERSHIP_ROLES, ROLE_PLURAL_LABELS, ROLE_SLUGS } from '@/lib/people/memberships'

import type { LineRef } from './person-card'

const selectClass =
  'h-11 w-full rounded-md border border-input bg-background px-3 text-base text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/**
 * Filtros do diretório (planejamento 16.3): formulário GET comum — funciona sem JavaScript,
 * reflete os filtros na URL (copiar e reabrir mantém o resultado) e usa rótulos visíveis.
 */
export function FilterBar({
  filters,
  lines,
  action,
}: {
  filters: DirectoryFilters
  lines: readonly LineRef[]
  action: string
}) {
  return (
    <form
      method="get"
      action={action}
      role="search"
      aria-label="Filtrar integrantes"
      className="grid gap-4 rounded-lg border bg-muted p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="filtro-situacao" className="text-sm font-medium">
          Situação
        </label>
        <select
          id="filtro-situacao"
          name="situacao"
          defaultValue={filters.status}
          className={selectClass}
        >
          <option value="atuais">Integrantes atuais</option>
          <option value="ex-integrantes">Ex-integrantes</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="filtro-papel" className="text-sm font-medium">
          Papel no grupo
        </label>
        <select
          id="filtro-papel"
          name="papel"
          defaultValue={filters.role ? ROLE_SLUGS[filters.role] : ''}
          className={selectClass}
        >
          <option value="">Todos os papéis</option>
          {MEMBERSHIP_ROLES.map((role) => (
            <option key={role} value={ROLE_SLUGS[role]}>
              {ROLE_PLURAL_LABELS[role]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="filtro-linha" className="text-sm font-medium">
          Linha temática
        </label>
        <select
          id="filtro-linha"
          name="linha"
          defaultValue={filters.line ?? ''}
          className={selectClass}
        >
          <option value="">Todas as linhas</option>
          {lines.map((line) => (
            <option key={line.id} value={line.slug}>
              {line.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-1">
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-base font-medium text-primary-foreground hover:bg-primary-hover"
        >
          Filtrar
        </button>
        <Link
          href={action}
          className="inline-flex min-h-11 items-center rounded-sm px-1 text-sm font-medium text-link underline underline-offset-4 hover:no-underline"
        >
          Limpar filtros
        </Link>
      </div>
    </form>
  )
}
