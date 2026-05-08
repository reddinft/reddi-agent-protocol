import { expect, test } from "@playwright/test";

test.describe("/economic-demo judge-facing story", () => {
  test("defaults to a no-wallet prompt-to-evidence flow with archive controls collapsed", async ({ page }) => {
    await page.goto("/economic-demo");

    await expect(page.getByRole("heading", { name: /run a paid-agent workflow/i })).toBeVisible();
    await expect(page.getByText(/No wallet is required in the default judge path/i)).toBeVisible();
    await expect(page.getByTestId("economic-proof-pills")).toContainText("30 hosted specialists");
    await expect(page.getByTestId("economic-proof-pills")).toContainText("No wallet required by default");

    await expect(page.getByRole("button", { name: /^run demo$/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /open evidence archive/i })).toBeVisible();
    await expect(page.getByText("Prompt template").first()).toBeVisible();

    const quote = page.getByTestId("economic-upfront-quote");
    await expect(quote).toBeVisible();
    await expect(quote).toContainText("Controlled hosted demo · no wallet required");
    await expect(quote).toContainText("payment claim");
    await expect(quote).toContainText("controlled / devnet only");
    await expect(quote).toContainText("does not claim mainnet payment");

    await expect(page.getByText(/connect wallet only for bounded devnet mode/i)).not.toBeVisible();
    await expect(page.getByRole("button", { name: /pay .* and run/i })).not.toBeVisible();

    const archive = page.getByTestId("economic-evidence-archive");
    await expect(archive).toBeVisible();
    await expect(archive).toContainText("Evidence archive and operator controls");
    await expect(page.getByRole("button", { name: /build dry-run economic graph/i })).not.toBeVisible();

    await page.getByRole("button", { name: /^run demo$/i }).click();
    await expect(page.getByTestId("live-run-status")).toContainText("Run timeline started");
    await expect(page.getByTestId("economic-final-output")).toBeVisible();
    await expect(page.getByTestId("webpage-live-workflow-evidence")).toBeVisible();
    await expect(page.getByTestId("webpage-live-workflow-evidence")).toContainText("multi_edge_paid_workflow_reached");

    await page.screenshot({ path: "artifacts/playwright-economic-demo/judge-story-flow.png", fullPage: true });
  });
});
