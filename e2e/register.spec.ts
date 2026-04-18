import { test, expect } from '@playwright/test'

test.describe('/register page', () => {
  test('loads with registration form', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByRole('heading', { name: /connect your wallet/i })).toBeVisible()
  })

  test('shows connect-wallet prerequisite', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByRole('heading', { name: /connect your wallet/i })).toBeVisible()
  })

  test.skip('shows 0.01 SOL registration fee in step indicator', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByText(/0\.01 SOL/i).first()).toBeVisible()
  })

  test.skip('shows "Set up my first agent" guided setup button', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByRole('button', { name: /set up my first agent/i })).toBeVisible()
  })

  test.skip('guided setup modal opens on button click', async ({ page }) => {
    await page.goto('/register')
    await page.getByRole('button', { name: /set up my first agent/i }).click()
    await expect(page.getByText(/install ollama/i)).toBeVisible()
  })
})
