import { test, expect } from '@playwright/test'

test.describe('/runs page', () => {
  test('loads without crashing', async ({ page }) => {
    await page.goto('/runs')
    await expect(page.locator('body')).not.toContainText(/500|Internal Server Error/i)
  })

  test('shows page heading', async ({ page }) => {
    await page.goto('/runs')
    await expect(page.getByRole('heading', { name: /run history/i })).toBeVisible()
  })
})
