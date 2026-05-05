import { buildEconomicDemoDryRunPlan } from "@/lib/economic-demo/dry-run";
import { imageAdapterReadiness } from "@/lib/economic-demo/image-adapter";

export type PictureStoryboardEdgeStatus = "planned" | "blocked";

export type PictureStoryboardLedgerExpectation = {
  requiredSchemaVersion: "reddi.downstream-disclosure-ledger.v1";
  x402State: "planned" | "blocked_disabled_adapter";
  downstreamCallsExecuted: 0;
  disclosureScope: "storyboard_payload_only" | "disabled_image_adapter" | "validation_attestation";
  requiredFields: string[];
};

export type PictureStoryboardFrame = {
  frame: number;
  title: string;
  visualPrompt: string;
  negativePrompt: string;
  evidenceCaveat: string;
};

export type PictureStoryboardEdge = {
  step: number;
  profileId: string;
  capability: string;
  endpoint: string;
  walletAddress: string;
  priceUsdc: string;
  status: PictureStoryboardEdgeStatus;
  payloadClass: "visual_brief" | "image_generation_request" | "storyboard_validation" | "release_attestation";
  scopedPayload: string;
  expectedOutput: string;
  guardrail: string;
  disclosureLedgerExpectation: PictureStoryboardLedgerExpectation;
};

export type PictureStoryboardDesign = {
  schemaVersion: "reddi.economic-demo.picture-storyboard-design.v1";
  disclosureContract: "reddi.downstream-disclosure-ledger.v1";
  scenarioId: "picture";
  mode: "storyboard_no_image_generation";
  userRequest: string;
  downstreamCallsExecuted: 0;
  imageGenerationExecuted: 0;
  adapterReadiness: ReturnType<typeof imageAdapterReadiness>;
  orchestrator: {
    profileId: "tool-using-agent";
    separationRationale: string;
  };
  edges: PictureStoryboardEdge[];
  storyboard: PictureStoryboardFrame[];
  acceptanceCriteria: string[];
  guardrails: {
    noOpenAiImageGeneration: boolean;
    noFalImageGeneration: boolean;
    noPaidProviderRequests: boolean;
    noSigningOperations: boolean;
    noWalletMutation: boolean;
    noDevnetTransfer: boolean;
  };
  nextStep: string;
};

const LEDGER_FIELDS = [
  "calledAgentId",
  "walletAddress",
  "endpoint",
  "payloadClass",
  "payloadSummary",
  "payloadHash",
  "x402State",
  "attestorLinks",
  "moatProtection",
];

const STORYBOARD: PictureStoryboardFrame[] = [
  {
    frame: 1,
    title: "Market order arrives",
    visualPrompt:
      "Wide cinematic view of autonomous robot agents entering a neon Malatang night-market kitchen, task cards and tiny wallet glyphs hovering beside them.",
    negativePrompt: "No brand logos, no real people likenesses, no unsafe kitchen chaos, no misleading claim that this image was generated live.",
    evidenceCaveat: "Storyboard text only; no image model output exists in this dry-run.",
  },
  {
    frame: 2,
    title: "Specialists split the recipe",
    visualPrompt:
      "Three friendly agent chefs divide broth, noodles, vegetables, and spice-level tasks on a glowing workflow board with x402 receipt placeholders.",
    negativePrompt: "No gore, no copyrighted characters, no photorealistic celebrity likenesses.",
    evidenceCaveat: "Payload is a visual brief, not a generated asset.",
  },
  {
    frame: 3,
    title: "Attestor tastes the evidence",
    visualPrompt:
      "A verification agent with a clipboard checks prompt adherence, ingredient consistency, and disclosure-ledger entries before release.",
    negativePrompt: "No claim of real payment settlement; no hidden provider watermark removal.",
    evidenceCaveat: "Validation is planned against storyboard criteria until image generation is explicitly approved.",
  },
  {
    frame: 4,
    title: "Disclosure-complete handoff",
    visualPrompt:
      "Final hero composition: autonomous agents serving Malatang with transparent ledger ribbons showing called agents, payload classes, and planned x402 states.",
    negativePrompt: "No opaque downstream calls, no undisclosed adapter invocation, no real provider output implied.",
    evidenceCaveat: "Final output remains an image brief/storyboard; live OpenAI/Fal generation is disabled.",
  },
];

function plannedLedger(scope: PictureStoryboardLedgerExpectation["disclosureScope"]): PictureStoryboardLedgerExpectation {
  return {
    requiredSchemaVersion: "reddi.downstream-disclosure-ledger.v1",
    x402State: scope === "disabled_image_adapter" ? "blocked_disabled_adapter" : "planned",
    downstreamCallsExecuted: 0,
    disclosureScope: scope,
    requiredFields: LEDGER_FIELDS,
  };
}

export function buildPictureStoryboardDesign(): PictureStoryboardDesign {
  const plan = buildEconomicDemoDryRunPlan("picture");
  const adapterReadiness = imageAdapterReadiness();

  const edges: PictureStoryboardEdge[] = [
    {
      step: 1,
      profileId: "tool-using-agent",
      capability: "visual-workflow-planning",
      endpoint: plan.orchestrator.endpoint,
      walletAddress: plan.orchestrator.walletAddress,
      priceUsdc: plan.orchestrator.price.amount,
      status: "planned",
      payloadClass: "visual_brief",
      scopedPayload:
        "Convert the user prompt into a four-frame storyboard, explicit negative prompts, safety constraints, and evidence caveats before any image adapter can run.",
      expectedOutput: "Storyboard brief with no provider output and no image receipt.",
      guardrail: "The orchestrator may prepare adapter inputs but must not call OpenAI/Fal in storyboard mode.",
      disclosureLedgerExpectation: plannedLedger("storyboard_payload_only"),
    },
    {
      step: 2,
      profileId: "image-generation-adapter",
      capability: "image-generation",
      endpoint: "/api/economic-demo/image",
      walletAddress: "PendingAdapter11111111111111111111111111",
      priceUsdc: "0.00",
      status: "blocked",
      payloadClass: "image_generation_request",
      scopedPayload:
        "The exact adapter request remains disabled unless ENABLE_ECONOMIC_DEMO_IMAGE_GENERATION=true and an explicit live image-generation approval is recorded.",
      expectedOutput: "Blocked adapter result: image_generation_disabled.",
      guardrail: "No OpenAI or Fal.ai request is permitted in Phase 7 storyboard dry-run.",
      disclosureLedgerExpectation: plannedLedger("disabled_image_adapter"),
    },
    ...plan.edges
      .filter((edge) => edge.toProfileId === "vision-language-agent" || edge.toProfileId === "verification-validation-agent")
      .map((edge, index): PictureStoryboardEdge => ({
        step: index + 3,
        profileId: edge.toProfileId,
        capability: edge.capability,
        endpoint: edge.endpoint,
        walletAddress: edge.walletAddress,
        priceUsdc: edge.price.amount,
        status: "planned",
        payloadClass: edge.toProfileId === "vision-language-agent" ? "storyboard_validation" : "release_attestation",
        scopedPayload:
          edge.toProfileId === "vision-language-agent"
            ? "Validate the storyboard brief against the original prompt, negative prompts, and image-generation-disabled caveat."
            : "Issue release/refund/dispute guidance based on storyboard completeness and disabled-adapter disclosure.",
        expectedOutput:
          edge.toProfileId === "vision-language-agent"
            ? "Prompt-alignment review for storyboard mode, not generated-image analysis."
            : "Attestation guidance that release is safe only as a storyboard artifact.",
        guardrail: "Validate storyboard text only; do not request or infer generated image bytes.",
        disclosureLedgerExpectation: plannedLedger("validation_attestation"),
      })),
  ];

  return {
    schemaVersion: "reddi.economic-demo.picture-storyboard-design.v1",
    disclosureContract: "reddi.downstream-disclosure-ledger.v1",
    scenarioId: "picture",
    mode: "storyboard_no_image_generation",
    userRequest: "Give me a picture that shows autonomous agents cooking Malatang.",
    downstreamCallsExecuted: 0,
    imageGenerationExecuted: 0,
    adapterReadiness,
    orchestrator: {
      profileId: "tool-using-agent",
      separationRationale:
        "tool-using-agent owns adapter gating and storyboard preparation; the image-generation adapter stays blocked until a separately approved live image run.",
    },
    edges,
    storyboard: STORYBOARD,
    acceptanceCriteria: [
      "No OpenAI or Fal.ai image generation request is executed.",
      "The adapter edge is represented as blocked with an explicit disabled-adapter ledger expectation.",
      "Storyboard frames include positive prompts, negative prompts, and evidence caveats.",
      "Vision and verification specialists are planned for storyboard validation only.",
      "The design is honest that the final output is an image brief, not generated image evidence.",
    ],
    guardrails: {
      noOpenAiImageGeneration: true,
      noFalImageGeneration: true,
      noPaidProviderRequests: true,
      noSigningOperations: true,
      noWalletMutation: true,
      noDevnetTransfer: true,
    },
    nextStep:
      "Review the storyboard artifact locally, then request explicit approval only if a real OpenAI/Fal image-generation run is worth the spend and disclosure risk.",
  };
}
