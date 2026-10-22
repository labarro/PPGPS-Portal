import { expect } from 'vitest'

import { restJson } from './rest'

/**
 * PADRÃO DE TESTE DE VAZAMENTO (S03; AGENTS.md §8.3), reutilizável por toda coleção nova:
 * 1. crie dados com marcadores únicos em estados NÃO públicos (rascunho, inativo, restrito);
 * 2. colete todas as superfícies públicas (`publicCollectionSurfaces`/`publicGlobalSurfaces`,
 *    páginas, sitemap);
 * 3. `expectNoLeak` garante que nenhum marcador nem campo administrativo aparece.
 */
export type Surface = { label: string; status: number; text: string }

/** Campos que nunca podem aparecer em respostas públicas. */
export const ADMIN_FIELD_PATTERN =
  /"(hash|salt|resetPasswordToken|resetPasswordExpiration|loginAttempts|lockUntil|sessions|_verificationToken)"/

async function surface(label: string, path: string): Promise<Surface> {
  const { status, json } = await restJson('GET', path)
  return { label: `GET /api${path}`, status, text: JSON.stringify(json) }
}

/** Respostas anônimas da API REST de uma coleção, inclusive tentativas de obter rascunhos. */
export async function publicCollectionSurfaces(
  collection: string,
  ids: (number | string)[] = [],
): Promise<Surface[]> {
  const paths = [
    `/${collection}?limit=100&depth=2`,
    `/${collection}?limit=100&draft=true`,
    `/${collection}?where[_status][equals]=draft&draft=true`,
    `/${collection}/versions?limit=100`,
    ...ids.flatMap((id) => [
      `/${collection}/${id}?depth=2`,
      `/${collection}/${id}?draft=true`,
      `/${collection}/versions?where[parent][equals]=${id}`,
    ]),
  ]
  return Promise.all(paths.map((path) => surface(collection, path)))
}

/** Respostas anônimas da API REST de um global com rascunhos. */
export async function publicGlobalSurfaces(slug: string): Promise<Surface[]> {
  return Promise.all(
    [
      `/globals/${slug}?depth=2`,
      `/globals/${slug}?draft=true`,
      `/globals/${slug}/versions?limit=100`,
    ].map((path) => surface(slug, path)),
  )
}

export function expectNoLeak(surfaces: Surface[], secrets: string[]): void {
  for (const item of surfaces) {
    for (const secret of secrets) {
      expect(item.text, `${item.label} expôs "${secret}"`).not.toContain(secret)
    }
    expect(item.text, `${item.label} expôs campo administrativo`).not.toMatch(ADMIN_FIELD_PATTERN)
    // Versões (histórico/rascunhos) nunca são públicas.
    if (item.label.includes('/versions')) {
      expect(item.status, `${item.label} deveria ser negado`).toBe(403)
    }
  }
}
