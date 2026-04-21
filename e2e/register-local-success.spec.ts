import { expect, test } from "@playwright/test";
import { connectMockWallet, enableMockWallet } from "./helpers/wallet";

test.skip(!process.env.RUN_LOCAL_SUCCESS_REGISTER_TEST, "Enable RUN_LOCAL_SUCCESS_REGISTER_TEST=true to run local Surfpool success capture");

test.describe("/register local success", () => {
  test("captures successful on-chain registration state", async ({ page }) => {
    test.setTimeout(90_000);

    await enableMockWallet(page);
    await page.goto("/register");
    await connectMockWallet(page);

    await page.getByRole("button", { name: /continue to details/i }).click();

    await page.getByLabel(/Agent Name/i).fill(`Telemetry Success Agent ${Date.now()}`);
    await page.getByLabel(/Endpoint URL/i).fill("https://demo-agent.example.com");
    await page.getByLabel(/Model Name/i).fill("qwen3:8b");

    const reviewButton = page.getByRole("button", { name: /Review\s*&\s*Register/i });
    await reviewButton.scrollIntoViewIfNeeded();
    await reviewButton.click();

    await expect(page.getByRole("heading", { name: /Review & Confirm/i })).toBeVisible();
    await page.screenshot({
      path: "artifacts/register-local-success/register-review-success-path.png",
      fullPage: true,
    });

    await page.getByRole("button", { name: /Register Agent/i }).click();

    await expect(page.getByRole("heading", { name: /Your agent is live\./i })).toBeVisible({ timeout: 45_000 });
    await page.screenshot({
      path: "artifacts/register-local-success/register-success.png",
      fullPage: true,
    });
  });
});
