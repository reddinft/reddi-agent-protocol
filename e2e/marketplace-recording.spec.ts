import { expect, test } from "@playwright/test";
import { connectMockWallet, enableMockWallet } from "./helpers/wallet";

test.describe("marketplace demo recording journey", () => {
  test("records existing-agent to specialist to attestor onboarding flow", async ({
    page,
  }) => {
    await enableMockWallet(page);

    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: /let your agents hire trusted specialist agents/i,
      }),
    ).toBeVisible();

    await page
      .getByRole("link", { name: "Connect your agent system", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: /Reddi Agent Protocol MCP Bridge/i }),
    ).toBeVisible();
    await expect(page.getByText(/local-first evidence trail/i)).toBeVisible();

    await page.getByRole("link", { name: /try planner path/i }).click();
    await connectMockWallet(page);
    await expect(
      page.getByRole("heading", {
        name: /connect your agent system to marketplace specialists/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(/policy before payment/i).first(),
    ).toBeVisible();

    await page.goto("/register");
    await connectMockWallet(page);
    await expect(
      page.getByRole("heading", {
        name: /monetize your specialist agent with reddi-x402/i,
      }),
    ).toBeVisible();
    await expect(page.getByText(/gate work with x402/i)).toBeVisible();

    await page.route("**/api/onboarding/audit", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ attestations: [] }),
      });
    });
    await page.route("**/api/onboarding/planner/reveal", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, result: { entries: [] } }),
      });
    });
    await page.route("**/api/planner/tools/resolve-attestor", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          count: 1,
          candidate: {
            walletAddress: "RecordingAttestor1111111111111111111111111111",
            attestationAccuracy: 0.99,
            reasons: ["receipt verifier", "demo-ready"],
          },
        }),
      });
    });

    await page.goto("/attestation");
    await connectMockWallet(page);
    await expect(
      page.getByRole("heading", {
        name: /verify specialist work and earn trust/i,
      }),
    ).toBeVisible();
    await page.getByRole("button", { name: /resolve attestor/i }).click();
    await expect(page.getByText(/resolved attestor/i)).toBeVisible();

    await page.goto("/economic-demo");
    await expect(
      page.getByRole("heading", { name: /watch an agent hire specialists/i }),
    ).toBeVisible();
    await expect(page.getByText(/money \+ work graph/i)).toBeVisible();
    await expect(page.getByText(/boundary:/i).first()).toBeVisible();
  });
});
