import { test, expect } from '@playwright/test'

test.describe('/setup page', () => {
  test('loads with 5 workflow tabs', async ({ page }) => {
    await page.goto('/setup')
    await expect(page.getByRole('tab', { name: /connect/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /tools/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /skills/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /test/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /register/i })).toBeVisible()
  })

  test('connect tab shows endpoint URL input', async ({ page }) => {
    await page.goto('/setup')
    const endpointInput = page.locator('input[placeholder*="ngrok"]')
    await expect(endpointInput).toBeVisible()
    await expect(endpointInput).toHaveValue(/ngrok/)
  })

  test('skills tab contains default Research Specialist skill', async ({ page }) => {
    await page.goto('/setup')
    await page.getByRole('tab', { name: /skills/i }).click()
    await expect(page.getByText(/Research Specialist/i).first()).toBeVisible()
  })

  test('skills tab shows system prompt preview toggle', async ({ page }) => {
    await page.goto('/setup')
    await page.getByRole('tab', { name: /skills/i }).click()
    await expect(page.getByText(/Preview combined system prompt/i)).toBeVisible()
  })

  test('register tab links to /register', async ({ page }) => {
    await page.goto('/setup')
    await page.getByRole('tab', { name: /register/i }).click()
    const registerLink = page.getByRole('link', { name: /go to registration/i })
    await expect(registerLink).toBeVisible()
    const href = await registerLink.getAttribute('href')
    expect(href).toContain('/register')
  })

  test('Register CTA links to /register', async ({ page }) => {
    await page.goto('/setup')
    await page.getByRole('tab', { name: /register/i }).click()
    const registerLink = page.getByRole('link', { name: /go to registration/i })
    await expect(registerLink).toBeVisible()
    const href = await registerLink.getAttribute('href')
    expect(href).toContain('/register')
  })
})
