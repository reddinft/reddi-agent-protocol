import { test, expect } from '@playwright/test'

test.describe('/register page', () => {
  test('loads with registration form', async ({ page }) => {
    await page.goto('/register')
    // The page heading is always present
    await expect(page.getByRole('heading', { name: /register your agent/i })).toBeVisible()
  })

  test('shows step indicator with wallet connect + register steps', async ({ page }) => {
    await page.goto('/register')
    // Step 1 "Connect Wallet" is visible in the step indicator
    await expect(page.getByText(/Connect Wallet/i).first()).toBeVisible()
    // "Register On-Chain" step is also shown
    await expect(page.getByText(/Register On-Chain/i).first()).toBeVisible()
  })

  test('shows 0.01 SOL registration fee in step indicator', async ({ page }) => {
    await page.goto('/register')
    // The step description "Pay 0.01 SOL" is in the step indicator (always visible)
    await expect(page.getByText(/0\.01 SOL/i).first()).toBeVisible()
  })
})
