import Link from 'next/link'

import { BLOG_BASE_PATH, categoryPath } from '@/lib/content/paths'
import { cn } from '@/lib/utils'

/** Navegação por categorias do blog (principais primeiro). */
export function BlogCategoriesNav({
  categories,
  currentSlug,
}: {
  categories: { id: number; name: string; slug: string }[]
  currentSlug?: string | null
}) {
  if (categories.length === 0) return null
  const items = [{ id: 0, name: 'Todos os ensaios', slug: '', href: BLOG_BASE_PATH }].concat(
    categories.map((category) => ({ ...category, href: categoryPath(category.slug) })),
  )
  return (
    <nav aria-label="Categorias do blog">
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => {
          const active = (currentSlug ?? '') === item.slug
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium transition-colors',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-background text-foreground hover:border-primary hover:text-primary',
                )}
              >
                {item.name}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
