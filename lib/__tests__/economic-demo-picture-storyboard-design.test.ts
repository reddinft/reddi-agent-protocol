import { buildPictureStoryboardDesign } from "@/lib/economic-demo/picture-storyboard-design";

describe("picture storyboard dry-run design", () => {
  const previousEnableFlag = process.env.ENABLE_ECONOMIC_DEMO_IMAGE_GENERATION;
  const previousOpenAiKey = process.env.OPENAI_API_KEY;
  const previousFalKey = process.env.FAL_KEY;
  const previousFalApiKey = process.env.FAL_API_KEY;

  beforeEach(() => {
    delete process.env.ENABLE_ECONOMIC_DEMO_IMAGE_GENERATION;
    delete process.env.OPENAI_API_KEY;
    delete process.env.FAL_KEY;
    delete process.env.FAL_API_KEY;
  });

  afterAll(() => {
    if (previousEnableFlag === undefined) delete process.env.ENABLE_ECONOMIC_DEMO_IMAGE_GENERATION;
    else process.env.ENABLE_ECONOMIC_DEMO_IMAGE_GENERATION = previousEnableFlag;
    if (previousOpenAiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousOpenAiKey;
    if (previousFalKey === undefined) delete process.env.FAL_KEY;
    else process.env.FAL_KEY = previousFalKey;
    if (previousFalApiKey === undefined) delete process.env.FAL_API_KEY;
    else process.env.FAL_API_KEY = previousFalApiKey;
  });

  it("keeps image generation disabled while producing a storyboard graph", () => {
    const design = buildPictureStoryboardDesign();

    expect(design.schemaVersion).toBe("reddi.economic-demo.picture-storyboard-design.v1");
    expect(design.disclosureContract).toBe("reddi.downstream-disclosure-ledger.v1");
    expect(design.mode).toBe("storyboard_no_image_generation");
    expect(design.downstreamCallsExecuted).toBe(0);
    expect(design.imageGenerationExecuted).toBe(0);
    expect(design.adapterReadiness.enabled).toBe(false);
    expect(design.orchestrator.profileId).toBe("tool-using-agent");
    expect(design.storyboard).toHaveLength(4);
    expect(design.storyboard.every((frame) => !frame.evidenceCaveat.toLowerCase().includes("generated image evidence"))).toBe(true);
  });

  it("represents the image adapter as blocked with disclosure-ledger expectations", () => {
    const design = buildPictureStoryboardDesign();
    const adapterEdge = design.edges.find((edge) => edge.profileId === "image-generation-adapter");

    expect(adapterEdge).toBeDefined();
    expect(adapterEdge?.status).toBe("blocked");
    expect(adapterEdge?.payloadClass).toBe("image_generation_request");
    expect(adapterEdge?.disclosureLedgerExpectation).toMatchObject({
      requiredSchemaVersion: "reddi.downstream-disclosure-ledger.v1",
      x402State: "blocked_disabled_adapter",
      downstreamCallsExecuted: 0,
      disclosureScope: "disabled_image_adapter",
    });
    expect(adapterEdge?.disclosureLedgerExpectation.requiredFields).toEqual(expect.arrayContaining(["payloadHash", "x402State", "attestorLinks"]));
  });

  it("plans vision and verification as storyboard-only validation", () => {
    const design = buildPictureStoryboardDesign();

    expect(design.edges.map((edge) => edge.profileId)).toEqual([
      "tool-using-agent",
      "image-generation-adapter",
      "vision-language-agent",
      "verification-validation-agent",
    ]);
    expect(design.edges.find((edge) => edge.profileId === "vision-language-agent")?.payloadClass).toBe("storyboard_validation");
    expect(design.edges.find((edge) => edge.profileId === "verification-validation-agent")?.payloadClass).toBe("release_attestation");
    expect(design.guardrails).toMatchObject({
      noOpenAiImageGeneration: true,
      noFalImageGeneration: true,
      noPaidProviderRequests: true,
      noSigningOperations: true,
      noWalletMutation: true,
      noDevnetTransfer: true,
    });
  });
});
