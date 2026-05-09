import { expect, test } from "@playwright/test";
import { connectMockWallet, enableMockWallet } from "./helpers/wallet";

test.describe("/register local simulation", () => {
  test("captures review and tx failure telemetry UI", async ({ page }) => {
    test.setTimeout(90_000);

    await enableMockWallet(page);
    await page.route("**/api/register/probe", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          status: "ollama_detected",
          models: ["qwen3:8b"],
          securityStatus: "x402_challenge_detected",
        }),
      });
    });
    await page.goto("/register");
    await connectMockWallet(page);

    await page.getByRole("button", { name: /continue to details/i }).click();

    await page.getByLabel(/Agent Name/i).fill("Telemetry Demo Agent");
    await page.getByLabel(/Endpoint URL/i).fill("https://demo-agent.example.com");
    await page.getByLabel(/Model Name/i).fill("qwen3:8b");
    await page.getByLabel(/Agent Description/i).fill("Telemetry test specialist with x402-gated demo endpoint.");
    await expect(page.getByText(/x402_challenge_detected|ollama_detected|reachable|ready/i).first()).toBeVisible({ timeout: 15000 }).catch(() => undefined);

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
