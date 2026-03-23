import { test, expect } from '@playwright/test'

test.describe('Home page', () => {
  test('loads and shows hero headline', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Reddi Agent Protocol|AI agents/i)
    // Hero headline present
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('hero has two CTAs — Browse Agents and Register', async ({ page }) => {
    await page.goto('/')
    // Scope to main to avoid navbar/footer duplicates
    await expect(page.locator('main').getByRole('link', { name: /browse agents/i }).first()).toBeVisible()
    await expect(page.locator('main').getByRole('link', { name: /register/i }).first()).toBeVisible()
  })

  test('navbar has Live Demo link', async ({ page }) => {
    await page.goto('/')
    // The Live Demo link in the navbar may render with "✨ Live" badge text appended
    await expect(page.getByRole('navigation').getByRole('link', { name: /live demo/i })).toBeVisible()
  })

  test('footer contains correct tagline', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('footer')).toContainText(/Built on/i)
    await expect(page.locator('footer')).toContainText(/Solana/i)
  })
})
