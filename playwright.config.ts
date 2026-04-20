// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 1,
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:3010',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'on',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ],
  webServer: {
    command: 'NEXT_PUBLIC_ENABLE_PLAYWRIGHT_WALLET=true node node_modules/next/dist/bin/next dev --port 3010',
    url: 'http://127.0.0.1:3010',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
