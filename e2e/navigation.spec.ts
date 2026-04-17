import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('all 7 routes load with 200', async ({ page }) => {
    const routes = ['/', '/agents', '/register', '/setup', '/onboarding', '/customize', '/dashboard']
    for (const route of routes) {
      const response = await page.goto(route)
      expect(response?.status(), `${route} should return 200`).toBe(200)
    }
  })

  test('navbar links navigate correctly', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /live demo/i }).click()
    await expect(page).toHaveURL(/\/demo/)
  })
})
