import { expect, test } from "@playwright/test";

test.describe("/economic-demo judge-facing story", () => {
  test("defaults to a no-wallet prompt-to-evidence flow with archive controls collapsed", async ({
    page,
  }) => {
    await page.route(
      "**/api/economic-demo/hosted-challenge-probe",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ok: true,
            probe: {
              schemaVersion: "reddi.economic-demo.hosted-challenge-probe.v1",
              generatedAt: "2026-05-08T00:00:00.000Z",
              mode: "unpaid_402_challenge_probe",
              summary: {
                requested: 4,
                ok: 4,
                failed: 0,
                allChallengesObserved: true,
              },
              guardrails: {
                exactAllowlistedEndpointsOnly: true,
                noX402PaymentHeaderSent: true,
                noPaymentRetryAttempted: true,
                noSignerMaterialUsed: true,
                noDevnetTransfer: true,
                noMainnetTransfer: true,
              },
              claimBoundary:
                "Fresh unpaid hosted endpoint probe only: observes HTTP 402 x402 challenges from exact allowlisted Coolify specialist endpoints; sends no x402-payment header, performs no paid retry, uses no signer material, and makes no transfer or settlement claim.",
              results: [
                "planning-agent",
                "content-creation-agent",
                "code-generation-agent",
                "verification-validation-agent",
              ].map((profileId) => ({
                profileId,
                endpoint: `https://reddi-${profileId}.preview.reddi.tech/v1/chat/completions`,
                ok: true,
                observedAt: "2026-05-08T00:00:00.000Z",
                httpStatus: 402,
                x402HeaderPresent: true,
                challenge: {
                  version: "1",
                  network: "solana-devnet",
                  amount: "0.03",
                  currency: "USDC",
                  noncePresent: true,
                },
                error: null,
              })),
            },
          }),
        });
      },
    );

    await page.goto("/economic-demo");

    await expect(
      page.getByRole("heading", { name: /run a paid-agent workflow/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/No wallet is required in the default judge path/i),
    ).toBeVisible();
    await expect(page.getByTestId("economic-proof-pills")).toContainText(
      "30 hosted specialists",
    );
    await expect(page.getByTestId("economic-proof-pills")).toContainText(
      "No wallet required by default",
    );

    await expect(
      page.getByRole("button", { name: /^run demo$/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /open evidence archive/i }),
    ).toBeVisible();
    await page.getByRole("button", { name: /probe hosted 402s/i }).click();
    await expect(page.getByTestId("hosted-challenge-probe")).toContainText(
      "Observed 4/4 allowlisted x402 challenges",
    );
    await expect(page.getByTestId("hosted-challenge-probe")).toContainText(
      "no x402-payment header",
    );
    await expect(page.getByText("Prompt template").first()).toBeVisible();

    const quote = page.getByTestId("economic-upfront-quote");
    await expect(quote).toBeVisible();
    await expect(quote).toContainText(
      "Controlled hosted demo · no wallet required",
    );
    await expect(quote).toContainText("payment claim");
    await expect(quote).toContainText("controlled / devnet only");
    await expect(quote).toContainText("does not claim mainnet payment");

    await expect(
      page.getByText(/connect wallet only for bounded devnet mode/i),
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: /pay .* and run/i }),
    ).not.toBeVisible();

    const archive = page.getByTestId("economic-evidence-archive");
    await expect(archive).toBeVisible();
    await expect(archive).toContainText(
      "Evidence archive and operator controls",
    );
    await expect(
      page.getByRole("button", { name: /build dry-run economic graph/i }),
    ).not.toBeVisible();

    await page.getByRole("button", { name: /^run demo$/i }).click();
    await expect(page.getByTestId("live-run-status")).toContainText(
      "Controlled live-run timeline started",
    );
    await expect(
      page.getByTestId("controlled-live-run-envelope"),
    ).toContainText("prompt hash: sha256:");
    await expect(
      page.getByTestId("controlled-live-run-envelope"),
    ).toContainText("no production settlement claim");
    await expect(
      page.getByTestId("controlled-live-run-envelope"),
    ).toContainText("x402 challenges observed");
    await expect(page.getByTestId("economic-final-output")).toBeVisible();
    await expect(
      page.getByTestId("webpage-live-workflow-evidence"),
    ).toBeVisible();
    await expect(
      page.getByTestId("webpage-live-workflow-evidence"),
    ).toContainText("multi_edge_paid_workflow_reached");

    await page.screenshot({
      path: "artifacts/playwright-economic-demo/judge-story-flow.png",
      fullPage: true,
    });
  });
});
