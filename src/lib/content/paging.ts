/** Número da página a partir de `?pagina=` (inteiro entre 1 e 1000; valores inválidos → 1). */
export function pageParam(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw || !/^\d+$/.test(raw)) return 1
  const page = Number.parseInt(raw, 10)
  return page >= 1 ? Math.min(page, 1000) : 1
}
