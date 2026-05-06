import { expect, test } from "@playwright/test";
import { connectMockWallet, enableMockWallet } from "./helpers/wallet";

test.describe("/economic-demo upfront funded consumer-agent flow", () => {
  test("records a deterministic proof of quote, payment route, agent flow, and budget reconciliation", async ({ page }) => {
    await enableMockWallet(page);
    await page.goto("/economic-demo");

    await expect(page.getByRole("heading", { name: /watch one user request become a paid agent workflow/i })).toBeVisible();
    await connectMockWallet(page);

    const quote = page.getByTestId("economic-upfront-quote");
    await expect(quote).toBeVisible();
    await expect(quote).toContainText("User funds the whole activity first");
    await expect(quote).toContainText("total quote");
    await expect(quote).toContainText("orchestrator markup");
    await expect(quote).toContainText("USDC direct");

    await expect(page.getByTestId("communication-flow")).toContainText("end-user");
    await expect(page.getByTestId("communication-flow")).toContainText("agentic-workflow-system");
    await expect(page.getByTestId("communication-flow")).toContainText("return result");

    const paymentFlow = page.getByTestId("payment-flow");
    await expect(paymentFlow).toContainText("Upfront activity fee");
    await expect(paymentFlow).toContainText("Reserved copy specialist budget");
    await expect(paymentFlow).toContainText("Orchestrator retained markup");

    await page.getByRole("button", { name: /pay with sol/i }).click();
    await expect(page.getByTestId("jupiter-swap-proof")).toBeVisible();
    await expect(page.getByTestId("jupiter-swap-proof")).toContainText("Jupiter swap proof lane");
    await expect(page.getByTestId("jupiter-swap-proof")).toContainText("slippage cap");

    await expect(page.getByTestId("economic-final-output")).toBeVisible();
    await expect(page.getByText(/Wallet balance ledger/i)).toBeVisible();

    await page.screenshot({ path: "artifacts/playwright-economic-demo/upfront-funded-flow.png", fullPage: true });
  });
});
