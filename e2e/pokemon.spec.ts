import { expect, test } from './fixtures'

test.describe('Pokémon page', () => {
  test('a direct URL shows the Pokémon and its information', async ({ page }) => {
    await page.goto('/pokemon/pikachu')

    await expect(page).toHaveTitle('Pikachu — PokéWishlist')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pikachu')
    const detail = page.getByTestId('pokemon-detail')
    await expect(detail).toContainText('No. 025')
    await expect(detail).toContainText('Electric')
    await expect(detail).toContainText('Mouse Pokémon')
    await expect(detail).toContainText('Speed')
  })

  test('the HTML is rendered by the server, without JavaScript', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto('/fr/pokemon/bulbasaur')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Bulbizarre')
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{30,}/)
    await context.close()
  })

  test('an unknown Pokémon gives a 404 page', async ({ page }) => {
    const response = await page.goto('/pokemon/missingno')
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found')
  })

  test('adds and likes from the Pokémon page', async ({ page, api }) => {
    await page.goto('/pokemon/eevee')
    await page.getByRole('button', { name: 'Add Eevee to my wishlist' }).click()
    await expect(page.getByTestId('notice')).toContainText('Eevee added to your wishlist.')

    await page.getByRole('button', { name: 'Like Eevee' }).click()
    await expect(page.getByTestId('likes')).toHaveText('1 like')
    await expect.poll(async () => (await api.list())[0]?.likes).toBe(1)
  })

  test('opens from the catalog', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Search', { exact: true }).fill('charmander')
    await page.getByTestId('card-charmander').getByRole('link').click()
    await expect(page).toHaveURL(/\/pokemon\/charmander$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Charmander')
  })
})
