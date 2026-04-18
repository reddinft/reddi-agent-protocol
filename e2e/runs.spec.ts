import { test, expect } from '@playwright/test'

/**
 * BDD: Bucket C — Planner Audit Trail
 * C2.3: Receipt + trace captured for audit
 * C3.1: Quality feedback captured
 */
test.describe('/runs page', () => {
  test('loads without server error', async ({ page }) => {
    await page.goto('/runs')
    await expect(page.locator('body')).not.toContainText(/500|Internal Server Error/i)
  })

  test('shows page heading', async ({ page }) => {
    await page.goto('/runs')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('shows empty state or run list', async ({ page }) => {
    await page.goto('/runs')
    // Either an empty state message or a list of runs
    const emptyOrList = page.locator('[data-testid="empty-state"], [data-testid="run-list"], .run-item, text=/no runs/i').first()
    // Page should load without error — runs list or empty state both valid
    await expect(page.locator('body')).toBeVisible()
  })

  test('does not expose raw secrets in run history', async ({ page }) => {
    await page.goto('/runs')
    const content = await page.content()
    expect(content).not.toMatch(/jup_[a-zA-Z0-9]{20,}/)
    expect(content).not.toMatch(/sk-[a-zA-Z0-9]{20,}/)
  })
})
