import { test, expect } from '@playwright/test'

test.describe('/setup page', () => {
  test('loads with 4 template cards', async ({ page }) => {
    await page.goto('/setup')
    await expect(page.getByText(/Research Specialist/i)).toBeVisible()
    await expect(page.getByText(/Copy & Content/i)).toBeVisible()
    await expect(page.getByText(/Code Reviewer/i)).toBeVisible()
    await expect(page.getByText(/Strategic Advisor/i)).toBeVisible()
  })

  test('clicking Research card pre-fills system prompt', async ({ page }) => {
    await page.goto('/setup')
    await page.getByText(/Research Specialist/i).click()
    
    // System prompt textarea should be populated
    const promptArea = page.locator('textarea').first()
    await expect(promptArea).not.toBeEmpty()
    await expect(promptArea).toContainText(/research/i)
  })

  test('clicking Copy card pre-fills with copywriter prompt', async ({ page }) => {
    await page.goto('/setup')
    await page.getByText(/Copy & Content/i).click()
    
    const promptArea = page.locator('textarea').first()
    await expect(promptArea).toContainText(/copy|direct-response/i)
  })

  test('ollama pull command updates with selected model', async ({ page }) => {
    await page.goto('/setup')
    await page.getByText(/Research Specialist/i).click()
    
    // The ollama pull command in the CodeBlock should show qwen3:8b
    // Use the code block specifically (not the template card model tag)
    await expect(page.locator('code').filter({ hasText: /ollama pull qwen3:8b/i }).first()).toBeVisible()
  })

  test('ngrok and Cloudflare tabs both present', async ({ page }) => {
    await page.goto('/setup')
    // Tab buttons for expose options — use exact button role
    await expect(page.getByRole('button', { name: /^ngrok$/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /cloudflare tunnel/i })).toBeVisible()
  })

  test('Register CTA links to /register', async ({ page }) => {
    await page.goto('/setup')
    const registerLink = page.getByRole('link', { name: /register/i }).last()
    await expect(registerLink).toBeVisible()
    const href = await registerLink.getAttribute('href')
    expect(href).toContain('/register')
  })
})
