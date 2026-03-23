import { test, expect } from '@playwright/test'

test.describe('/agents page', () => {
  test('loads without crashing', async ({ page }) => {
    await page.goto('/agents')
    // Should not show error page
    await expect(page.locator('body')).not.toContainText(/500|Internal Server Error/i)
  })

  test('shows filter controls', async ({ page }) => {
    await page.goto('/agents')
    // Agent type filter buttons — use first() to avoid strict mode violation
    await expect(page.getByRole('button', { name: /^all$/i }).first()).toBeVisible()
  })

  test('shows empty state or agent cards (index API may be offline)', async ({ page }) => {
    await page.goto('/agents')
    // Either shows cards or a "no agents" / loading state — not a crash
    const hasCards = await page.locator('[data-testid="agent-card"], .agent-card').count()
    const hasEmptyState = await page.getByText(/no agents|loading|connect/i).count()
    expect(hasCards + hasEmptyState).toBeGreaterThan(0)
  })
})
