import { expect, test } from "@playwright/test";
import { connectMockWallet, enableMockWallet } from "./helpers/wallet";

test.describe("/register local simulation", () => {
  test("captures review and tx failure telemetry UI", async ({ page }) => {
    test.setTimeout(90_000);

    await enableMockWallet(page);
    await page.goto("/register");
    await connectMockWallet(page);

    await page.getByRole("button", { name: /continue to details/i }).click();

    await page.getByLabel(/Agent Name/i).fill("Telemetry Demo Agent");
    await page.getByLabel(/Endpoint URL/i).fill("https://demo-agent.example.com");
    await page.getByLabel(/Model Name/i).fill("qwen3:8b");

    const continueButton = page.getByRole("button", { name: /Review\s*&\s*Register/i });
    await continueButton.scrollIntoViewIfNeeded();
    await continueButton.click();

    await expect(page.getByRole("heading", { name: /Review & Confirm/i })).toBeVisible();
    await page.screenshot({
      path: "artifacts/register-local-sim/register-review.png",
      fullPage: true,
    });

    await page.getByRole("button", { name: /Register Agent/i }).click();

    await expect(page.getByText(/Registration transaction failed/i)).toBeVisible({ timeout: 15000 });
    await page.screenshot({
      path: "artifacts/register-local-sim/register-failed-with-telemetry.png",
      fullPage: true,
    });
  });
});
