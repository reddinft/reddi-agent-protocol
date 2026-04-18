import { test, expect } from '@playwright/test'

/**
 * BDD: Bucket C — Planner-Native Specialist Consumption
 * C1.1: Planner policy includes budget/min-rep/privacy requirements
 * C1.2: Discovery returns candidate set
 * C2.1: x402 challenge-retry-payment loop UI
 * F1.7: Jupiter swap UI surface in planner
 */
test.describe('/planner page', () => {
  test('loads without server error', async ({ page }) => {
    await page.goto('/planner')
    await expect(page.locator('body')).not.toContainText(/500|Internal Server Error/i)
  })

  test('shows page heading', async ({ page }) => {
    await page.goto('/planner')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('shows step dots or progress indicator', async ({ page }) => {
    await page.goto('/planner')
    // Accept either .step-dot or any progress/step indicator
    const indicator = page.locator('.step-dot, [data-testid="progress"], [aria-label*="step" i]').first()
    await expect(indicator).toBeVisible()
  })

  test('has prompt input area', async ({ page }) => {
    await page.goto('/planner')
    const input = page.locator('textarea, input[type="text"]').first()
    await expect(input).toBeVisible()
  })

  test('execute button is present', async ({ page }) => {
    await page.goto('/planner')
    const btn = page.getByRole('button', { name: /find specialists|execute call|run specialist call/i }).first()
    await expect(btn).toBeVisible()
  })

  test('execute button disabled when prompt is empty', async ({ page }) => {
    await page.goto('/planner')
    const btn = page.getByRole('button', { name: /find specialists|execute call|run specialist call/i }).first()
    // Should be disabled or wallet-gated when no prompt
    const isDisabled = await btn.isDisabled()
    const hasWalletGate = await page.locator('text=/connect wallet/i').isVisible().catch(() => false)
    expect(isDisabled || hasWalletGate).toBe(true)
  })

  test('settlement mode selector is present', async ({ page }) => {
    await page.goto('/planner')
    // Privacy/settlement mode selector
    const selector = page.locator('select, [role="combobox"], [data-testid*="settlement" i], [data-testid*="privacy" i]').first()
    await expect(selector).toBeVisible()
  })

  test('page does not expose raw API keys or secrets', async ({ page }) => {
    await page.goto('/planner')
    const content = await page.content()
    expect(content).not.toMatch(/jup_[a-zA-Z0-9]{20,}/)
    expect(content).not.toMatch(/sk-[a-zA-Z0-9]{20,}/)
  })
})
