import { STARTERS, expect, openCatalog, search, test } from './fixtures'

test.describe('languages', () => {
  test('English is the default language', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-US')
    await expect(page.getByTestId('nav-wishlist')).toContainText('My wishlist')
  })

  test('switching language changes the UI and the URL', async ({ page }) => {
    await page.goto('/pokemon/charmander')
    await page.getByTestId('language-select').selectOption('fr')

    await expect(page).toHaveURL(/\/fr\/pokemon\/charmander$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Salamèche')
    await expect(page.getByTestId('nav-wishlist')).toContainText('Ma liste')

    await page.getByTestId('language-select').selectOption('de')
    await expect(page).toHaveURL(/\/de\/pokemon\/charmander$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Glumanda')

    await page.getByTestId('language-select').selectOption('es')
    await expect(page.getByTestId('nav-wishlist')).toContainText('Mi lista')
  })

  test('API error messages follow the selected language', async ({ page, api }) => {
    for (const [id, name] of STARTERS) await api.add(id, name)

    await openCatalog(page, '/fr')
    await search(page, 'pikachu', 'Recherche')
    await page.getByRole('button', { name: 'Ajouter Pikachu à ma liste' }).click()
    await expect(page.getByRole('alert')).toContainText(
      'Votre liste est pleine : 6 Pokémon maximum.',
    )

    await page.getByTestId('language-select').selectOption('de')
    // The search query is kept when switching language.
    await expect(page).toHaveURL(/\/de(\?q=pikachu)?$/)
    await search(page, 'pikachu', 'Suche')
    await page.getByRole('button', { name: 'Pikachu zur Wunschliste hinzufügen' }).click()
    await expect(page.getByRole('alert').last()).toContainText(
      'Deine Wunschliste ist voll: maximal 6 Pokémon.',
    )
  })
})
