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
    await expect(page.getByText("Predefined action").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /pay \$3\.33 usdc and run/i })).toBeVisible();

    await expect(page.getByTestId("communication-flow")).toContainText("end-user");
    await expect(page.getByTestId("communication-flow")).toContainText("agentic-workflow-system");
    await expect(page.getByTestId("communication-flow")).toContainText("return result");

    const paymentFlow = page.getByTestId("payment-flow");
    await expect(paymentFlow).toContainText("Upfront activity fee");
    await expect(paymentFlow).toContainText("Reserved copy specialist budget");
    await expect(paymentFlow).toContainText("Orchestrator retained markup");

    const runReport = page.getByTestId("run-report");
    await expect(runReport).toContainText("Run report");
    await expect(runReport).toContainText("Payment receipt");
    await expect(runReport).toContainText("Attested by");
    await expect(page.getByTestId("attestation-proof")).toContainText("Attestor validation chain");
    await expect(page.getByTestId("reputation-commit-reveal")).toContainText("Reputation commit-reveal impact");
    await expect(page.getByTestId("reputation-commit-reveal")).toContainText("commit tx");
    await expect(page.getByTestId("reputation-commit-reveal")).toContainText("reveal tx");

    await page.getByRole("button", { name: /pay with sol/i }).click();
    await page.getByRole("button", { name: /show jupiter boundary and run/i }).click();
    await expect(page.getByTestId("live-run-status")).toContainText("Live run timeline started");
    await expect(page.getByTestId("jupiter-swap-proof")).toBeVisible();
    await expect(page.getByTestId("jupiter-swap-proof")).toContainText("Jupiter swap proof lane");
    await expect(page.getByTestId("jupiter-swap-proof")).toContainText("Intended execution story");
    await expect(page.getByTestId("jupiter-swap-proof")).toContainText("signed devnet budget-lane tx, not Jupiter swap receipt");
    await expect(page.getByTestId("jupiter-swap-proof")).toContainText("Wallet-backed Jupiter attempt");
    await expect(page.getByTestId("jupiter-swap-proof")).toContainText(/slippage cap/i);
    await expect(runReport).toContainText("Jupiter swap before downstream payments");
    await expect(runReport).toContainText("public Jupiter devnet execution remains an explicit boundary");

    await expect(page.getByTestId("economic-final-output")).toBeVisible();
    await expect(page.getByText(/Wallet balance ledger/i)).toBeVisible();

    await page.screenshot({ path: "artifacts/playwright-economic-demo/upfront-funded-flow.png", fullPage: true });
  });
});
