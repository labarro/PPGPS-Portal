/**
 * Seções da página inicial (planejamento 8.1). As marcadas com `availableFrom` pertencem a
 * módulos de sprints futuras: ficam no cadastro para não exigir nova migration, mas o site só
 * as renderiza quando o módulo existir (`AVAILABLE_SECTIONS`).
 */
export const HOME_SECTION_OPTIONS = [
  { value: 'about', label: 'Apresentação do grupo', defaultHeading: 'O grupo' },
  { value: 'research-lines', label: 'Linhas temáticas', defaultHeading: 'Linhas temáticas' },
  {
    value: 'editorial-highlights',
    label: 'Destaques editoriais (disponível na S05)',
    defaultHeading: 'Destaques do blog',
    availableFrom: 'S05',
  },
  {
    value: 'featured-members',
    label: 'Integrantes em destaque (disponível na S04)',
    defaultHeading: 'Integrantes',
    availableFrom: 'S04',
  },
  {
    value: 'recent-publications',
    label: 'Produção recente (disponível na S08)',
    defaultHeading: 'Produção recente',
    availableFrom: 'S08',
  },
  {
    value: 'agenda',
    label: 'Agenda (disponível na S10)',
    defaultHeading: 'Agenda',
    availableFrom: 'S10',
  },
  {
    value: 'projects-impact',
    label: 'Projetos e impacto (disponível na S10)',
    defaultHeading: 'Projetos e impacto',
    availableFrom: 'S10',
  },
  {
    value: 'indicators',
    label: 'Indicadores públicos (disponível na S10)',
    defaultHeading: 'Indicadores',
    availableFrom: 'S10',
  },
  {
    value: 'institutional-references',
    label: 'Referências institucionais',
    defaultHeading: 'Referências institucionais',
  },
] as const

export type HomeSectionKind = (typeof HOME_SECTION_OPTIONS)[number]['value']

/** Seções que o site sabe exibir nesta versão (S03). */
export const AVAILABLE_SECTIONS: readonly HomeSectionKind[] = HOME_SECTION_OPTIONS.filter(
  (option) => !('availableFrom' in option),
).map((option) => option.value)

export const DEFAULT_HOME_SECTIONS = HOME_SECTION_OPTIONS.map((option) => ({
  kind: option.value,
  enabled: !('availableFrom' in option),
}))

export const DEFAULT_HERO_ACTIONS = [
  { label: 'Conheça as linhas temáticas', href: '/linhas' },
  { label: 'Conheça o grupo', href: '/o-grupo' },
]

export type HomeSection = {
  kind: HomeSectionKind
  enabled?: boolean | null
  heading?: string | null
  intro?: string | null
}

export type ResolvedHomeSection = { kind: HomeSectionKind; heading: string; intro: string | null }

export function validateHomeSections(value: unknown): true | string {
  if (value == null) return true
  if (!Array.isArray(value)) return 'Lista de seções inválida.'
  const kinds = value.map((item) => (item as { kind?: string })?.kind).filter(Boolean)
  const duplicated = kinds.find((kind, index) => kinds.indexOf(kind) !== index)
  if (duplicated) {
    const label = HOME_SECTION_OPTIONS.find((o) => o.value === duplicated)?.label ?? duplicated
    return `A seção "${label}" aparece mais de uma vez.`
  }
  return true
}

/**
 * Seções a renderizar, na ordem do cadastro: somente as marcadas como visíveis e disponíveis
 * nesta versão. Sem cadastro (ou cadastro vazio), usa a ordem padrão.
 */
export function resolveHomeSections(
  sections: readonly HomeSection[] | null | undefined,
): ResolvedHomeSection[] {
  const source: readonly HomeSection[] =
    sections && sections.length > 0 ? sections : DEFAULT_HOME_SECTIONS
  const seen = new Set<string>()
  const resolved: ResolvedHomeSection[] = []
  for (const section of source) {
    if (!section?.kind || seen.has(section.kind)) continue
    seen.add(section.kind)
    if (section.enabled === false) continue
    if (!AVAILABLE_SECTIONS.includes(section.kind)) continue
    const option = HOME_SECTION_OPTIONS.find((o) => o.value === section.kind)
    resolved.push({
      kind: section.kind,
      heading: section.heading?.trim() || option?.defaultHeading || section.kind,
      intro: section.intro?.trim() || null,
    })
  }
  return resolved
}
