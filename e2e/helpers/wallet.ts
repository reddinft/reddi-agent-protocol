import { expect, type Page } from "@playwright/test";

export const PLAYWRIGHT_WALLET_NAME = "Playwright Wallet";

export async function enableMockWallet(page: Page) {
  await page.addInitScript((walletName) => {
    window.localStorage.setItem("walletName", JSON.stringify(walletName));
  }, PLAYWRIGHT_WALLET_NAME);
}

export async function connectMockWallet(page: Page) {
  await expect(page.getByRole("button", { name: /[1-9A-HJ-NP-Za-km-z]{4}\.\.\.[1-9A-HJ-NP-Za-km-z]{4}/ })).toBeVisible({ timeout: 15000 });
}
