import AxeBuilder from '@axe-core/playwright'
import { expect, openCatalog, search, test } from './fixtures'

test.describe('accessibility', () => {
  for (const path of ['/pokemon/pikachu', '/wishlist']) {
    test(`${path} has no serious axe violation`, async ({ page }) => {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()
      const serious = violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
      expect(serious.map(v => `${v.id}: ${v.help}`)).toEqual([])
    })
  }

  test('the wishlist button works with the keyboard', async ({ page, api }) => {
    await page.goto('/pokemon/pikachu')
    const button = page.getByRole('button', { name: 'Add Pikachu to my wishlist' })
    await button.focus()
    await page.keyboard.press('Enter')
    await expect.poll(async () => (await api.list()).length).toBe(1)
  })
})

test.describe('mobile', () => {
  test('adds a Pokémon on a phone @mobile', async ({ page, api }) => {
    await openCatalog(page)
    await search(page, 'squirtle')
    await page.getByRole('button', { name: 'Add Squirtle to my wishlist' }).tap()
    await expect.poll(async () => (await api.list()).map(i => i.name)).toEqual(['squirtle'])
  })
})

test.describe('visual regression', () => {
  test('Pokémon page @visual', async ({ page }) => {
    await page.goto('/pokemon/pikachu')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('pokemon-pikachu.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
      // The artwork comes from a CDN: mask it, the layout is what matters.
      mask: [page.locator('img')],
    })
  })
})
