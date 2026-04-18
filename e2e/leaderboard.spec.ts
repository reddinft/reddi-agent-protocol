import { test, expect } from "@playwright/test";

/**
 * BDD: Bucket G — Torque Retention Layer
 * G2.1: GET /api/torque/leaderboard returns ranked list
 * G2.2: /leaderboard page renders without server error
 * G2.3: /leaderboard page shows specialist wallet addresses or empty state
 * G2.4: /leaderboard page does not expose raw API tokens
 */
test.describe("/leaderboard page", () => {
  test("loads without server error", async ({ page }) => {
    await page.goto("/leaderboard");
    await expect(page.locator("body")).not.toContainText(/500|Internal Server Error/i);
  });

  test("shows page heading", async ({ page }) => {
    await page.goto("/leaderboard");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("shows leaderboard table or empty state", async ({ page }) => {
    await page.goto("/leaderboard");
    const hasTable = await page.locator("table").isVisible().catch(() => false);
    const hasEmptyState = await page.locator("text=/no rankings yet/i").isVisible().catch(() => false);
    expect(hasTable || hasEmptyState).toBe(true);
  });

  test("contains Torque attribution", async ({ page }) => {
    await page.goto("/leaderboard");
    await expect(page.locator("body")).toContainText(/torque/i);
  });

  test("does not expose raw API tokens", async ({ page }) => {
    await page.goto("/leaderboard");
    const content = await page.content();
    expect(content).not.toMatch(/TORQUE_API_TOKEN/);
    expect(content).not.toMatch(/Bearer [a-zA-Z0-9._-]{20,}/);
  });
});
