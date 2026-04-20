import { test, expect } from "@playwright/test";

/**
 * BDD: Bucket H5 — Dogfood specialist + attestor gating flow
 */
test.describe("/dogfood page", () => {
  test("loads and shows controls", async ({ page }) => {
    await page.goto("/dogfood");
    await expect(page.getByTestId("dogfood-heading")).toBeVisible();
    await expect(page.getByTestId("dogfood-seed-btn")).toBeVisible();
    await expect(page.getByTestId("dogfood-run-pass-btn")).toBeVisible();
    await expect(page.getByTestId("dogfood-run-fail-btn")).toBeVisible();
  });

  test("forced pass run results in released escrow", async ({ page }) => {
    await page.goto("/dogfood");
    await page.getByTestId("dogfood-run-pass-btn").click();

    await expect(page.getByTestId("dogfood-status-card")).toContainText("ok", { timeout: 15000 });
    await expect(page.getByTestId("dogfood-json-output")).toContainText("\"status\": \"released\"");
  });

  test("forced fail run results in refunded escrow", async ({ page }) => {
    await page.goto("/dogfood");
    await page.getByTestId("dogfood-run-fail-btn").click();

    await expect(page.getByTestId("dogfood-status-card")).toContainText("ok", { timeout: 15000 });
    await expect(page.getByTestId("dogfood-json-output")).toContainText("\"status\": \"refunded\"");
  });
});

