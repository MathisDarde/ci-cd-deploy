import { STARTERS, expect, openCatalog, search, test } from './fixtures'

test.describe('wishlist', () => {
  test('adds a Pokémon from the catalog, keeps it after a reload, then removes it', async ({
    page,
    api,
  }) => {
    await openCatalog(page)
    await search(page, 'pikachu')
    await page.getByRole('button', { name: 'Add Pikachu to my wishlist' }).click()

    await expect(page.getByTestId('notice')).toContainText('Pikachu added to your wishlist.')
    await expect(page.getByTestId('wishlist-count')).toHaveText('1')
    // Stored by the API, not only in the browser.
    await expect.poll(async () => (await api.list()).map(i => i.name)).toEqual(['pikachu'])

    await page.getByTestId('nav-wishlist').click()
    await expect(page.getByTestId('wishlist-item-pikachu')).toBeVisible()

    // Persistence: reload, the API still has it.
    await page.reload()
    await expect(page.getByTestId('wishlist-item-pikachu')).toBeVisible()
    await expect(page.getByTestId('wishlist-total')).toHaveText('1 / 6')

    await page.getByRole('button', { name: 'Remove Pikachu from my wishlist' }).click()
    await expect(page.getByText('Your wishlist is empty.')).toBeVisible()
    await expect.poll(() => api.list()).toEqual([])
  })

  test('refuses a 7th Pokémon with the API message', async ({ page, api }) => {
    for (const [id, name] of STARTERS) await api.add(id, name)

    await openCatalog(page)
    await expect(page.getByTestId('wishlist-count')).toHaveText('6')
    await search(page, 'pikachu')
    await page.getByRole('button', { name: 'Add Pikachu to my wishlist' }).click()

    await expect(page.getByRole('alert')).toContainText('Your wishlist is full: 6 Pokémon maximum.')
    await expect(page.getByTestId('wishlist-count')).toHaveText('6')
    expect(await api.list()).toHaveLength(6)
  })

  test('refuses a duplicate added meanwhile from another device', async ({ page, api }) => {
    await openCatalog(page)
    await search(page, 'pikachu')
    // The page still shows Pikachu as "not added" when another client adds it.
    await api.add(25, 'pikachu')
    await page.getByRole('button', { name: 'Add Pikachu to my wishlist' }).click()

    await expect(page.getByRole('alert')).toContainText('This Pokémon is already in your wishlist.')
    // The UI resynchronizes with the API.
    await expect(page.getByTestId('wishlist-count')).toHaveText('1')
    await expect(
      page.getByRole('button', { name: 'Remove Pikachu from my wishlist' }),
    ).toBeVisible()
    expect(await api.list()).toHaveLength(1)
  })

  test('likes a Pokémon of the wishlist', async ({ page, api }) => {
    await api.add(25, 'pikachu')
    await page.goto('/wishlist')

    const item = page.getByTestId('wishlist-item-pikachu')
    await expect(item.getByTestId('likes')).toHaveText('no likes')
    await item.getByRole('button', { name: 'Like Pikachu' }).click()
    await expect(item.getByTestId('likes')).toHaveText('1 like')
    await item.getByRole('button', { name: 'Like Pikachu' }).click()
    await expect(item.getByTestId('likes')).toHaveText('2 likes')

    await page.reload()
    await expect(page.getByTestId('wishlist-item-pikachu').getByTestId('likes')).toHaveText(
      '2 likes',
    )
    expect((await api.list())[0]?.likes).toBe(2)
  })
})
