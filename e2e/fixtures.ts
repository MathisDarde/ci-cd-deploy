import { test as base, expect, type APIRequestContext, type Page } from '@playwright/test'

export const API_URL = process.env.E2E_API_URL ?? `http://localhost:${process.env.API_PORT ?? 3001}`

interface Item {
  id: number
  name: string
  likes: number
}

/** Direct access to the Hono API, to set up and inspect the state behind the UI. */
export class WishlistApi {
  constructor(private readonly request: APIRequestContext) {}

  async list(): Promise<Item[]> {
    const response = await this.request.get(`${API_URL}/wishlist`)
    expect(response.ok()).toBe(true)
    return ((await response.json()) as { items: Item[] }).items
  }

  async add(id: number, name: string) {
    const response = await this.request.post(`${API_URL}/wishlist`, { data: { id, name } })
    expect(response.status(), `seeding ${name}`).toBe(201)
  }

  async clear() {
    for (const item of await this.list()) {
      await this.request.delete(`${API_URL}/wishlist/${item.id}`)
    }
  }
}

/** The first six Pokémon: a full team. */
export const STARTERS = [
  [1, 'bulbasaur'],
  [2, 'ivysaur'],
  [3, 'venusaur'],
  [4, 'charmander'],
  [5, 'charmeleon'],
  [6, 'charizard'],
] as const

export const test = base.extend<{ api: WishlistApi }>({
  api: async ({ request }, use) => {
    const api = new WishlistApi(request)
    // Every test starts from an empty wishlist, and leaves none behind.
    await api.clear()
    await use(api)
    await api.clear()
  },
})

export { expect }

/** Opens the catalog and waits for PokéAPI's Pokédex to be displayed. */
export async function openCatalog(page: Page, path = '/') {
  await page.goto(path)
  await expect(page.getByTestId('card-bulbasaur')).toBeVisible({ timeout: 45_000 })
}

export async function search(page: Page, query: string, label = 'Search') {
  await page.getByLabel(label, { exact: true }).fill(query)
}
