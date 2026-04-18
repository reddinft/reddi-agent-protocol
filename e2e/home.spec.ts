import { test, expect } from '@playwright/test'

test.describe('Home page', () => {
  test('loads and shows hero headline', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Reddi Agent Protocol|AI agents/i)
    await expect(page.getByRole('heading', { name: /the trust layer for agent commerce/i })).toBeVisible()
  })

  test('hero has two CTAs', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: /register your agent/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /browse agents →/i })).toBeVisible()
  })

  test('navbar has marketplace link', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('navigation').getByRole('link', { name: /marketplace/i })).toBeVisible()
  })

  test('footer contains correct tagline', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText(/Trust the protocol, not the pitch\./i).first()).toBeVisible()
  })
})
