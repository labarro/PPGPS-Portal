/**
 * Categorias principais do blog (planejamento 8.8; Q7 — os dois eixos temáticos definidos pelo
 * coordenador, relatados em 22/10/2026). Descrições neutras, sem afirmações institucionais;
 * o coordenador pode reescrevê-las no painel (o seed nunca sobrescreve).
 */
export const CATEGORIES_SOURCE =
  'Eixos temáticos definidos pelo coordenador do grupo (Q7), 22/10/2026'

export const categoriesSeed = [
  {
    name: 'Bioética',
    slug: 'bioetica',
    primary: true,
    order: 1,
    description: 'Ensaios relacionados ao eixo temático Bioética do grupo.',
  },
  {
    name: 'Promoção da Saúde',
    slug: 'promocao-da-saude',
    primary: true,
    order: 2,
    description: 'Ensaios relacionados ao eixo temático Promoção da Saúde do grupo.',
  },
] as const
