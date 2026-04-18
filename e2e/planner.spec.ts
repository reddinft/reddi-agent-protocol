import { test, expect } from '@playwright/test'

test.describe('/planner page', () => {
  test('loads planner page', async ({ page }) => {
    await page.goto('/planner')
    await expect(page.locator('body')).not.toContainText(/500|Internal Server Error/i)
  })

  test('shows step dots progress indicator', async ({ page }) => {
    await page.goto('/planner')
    const dots = page.locator('.step-dot')
    await expect(dots).toHaveCount(4)
  })

  test('step 1 has prompt textarea', async ({ page }) => {
    await page.goto('/planner')
    await expect(page.locator('textarea').first()).toBeVisible()
  })
})
