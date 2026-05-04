export type ImageProvider = "openai" | "fal";

export type ImageGenerationRequest = {
  prompt: string;
  provider?: ImageProvider;
};

export type ImageGenerationResult = {
  provider: ImageProvider;
  model: string;
  imageUrl: string;
  receipt: string;
};

const DEFAULT_OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1";
const DEFAULT_FAL_IMAGE_MODEL = process.env.FAL_IMAGE_MODEL ?? "fal-ai/flux/schnell";

function requireEnabled() {
  if (process.env.ENABLE_ECONOMIC_DEMO_IMAGE_GENERATION !== "true") {
    throw new Error("image_generation_disabled");
  }
}

function pickProvider(requested?: ImageProvider): ImageProvider {
  if (requested) return requested;
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.FAL_KEY || process.env.FAL_API_KEY) return "fal";
  return "openai";
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

async function generateWithOpenAI(prompt: string): Promise<ImageGenerationResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("openai_key_missing");

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DEFAULT_OPENAI_IMAGE_MODEL,
      prompt,
      size: process.env.OPENAI_IMAGE_SIZE ?? "1024x1024",
      response_format: "b64_json",
    }),
    signal: AbortSignal.timeout(60_000),
  });

  const data = (await res.json().catch(() => ({}))) as {
    data?: Array<{ b64_json?: string; url?: string }>;
    error?: { message?: string };
  };
  if (!res.ok) throw new Error(data.error?.message ?? `openai_image_error_${res.status}`);

  const first = data.data?.[0];
  const imageUrl = first?.b64_json ? `data:image/png;base64,${first.b64_json}` : asString(first?.url);
  if (!imageUrl) throw new Error("openai_image_missing");

  return {
    provider: "openai",
    model: DEFAULT_OPENAI_IMAGE_MODEL,
    imageUrl,
    receipt: `openai:image:${Date.now()}`,
  };
}

async function generateWithFal(prompt: string): Promise<ImageGenerationResult> {
  const key = process.env.FAL_KEY ?? process.env.FAL_API_KEY;
  if (!key) throw new Error("fal_key_missing");

  const res = await fetch(`https://fal.run/${DEFAULT_FAL_IMAGE_MODEL}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      image_size: process.env.FAL_IMAGE_SIZE ?? "square_hd",
      num_images: 1,
    }),
    signal: AbortSignal.timeout(60_000),
  });

  const data = (await res.json().catch(() => ({}))) as {
    images?: Array<{ url?: string }>;
    image?: { url?: string };
    error?: string | { message?: string };
  };
  if (!res.ok) {
    const detail = typeof data.error === "string" ? data.error : data.error?.message;
    throw new Error(detail ?? `fal_image_error_${res.status}`);
  }

  const imageUrl = asString(data.images?.[0]?.url) ?? asString(data.image?.url);
  if (!imageUrl) throw new Error("fal_image_missing");

  return {
    provider: "fal",
    model: DEFAULT_FAL_IMAGE_MODEL,
    imageUrl,
    receipt: `fal:image:${Date.now()}`,
  };
}

export async function generateEconomicDemoImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
  requireEnabled();
  const prompt = request.prompt.trim();
  if (!prompt) throw new Error("prompt_required");

  const provider = pickProvider(request.provider);
  if (provider === "openai") return generateWithOpenAI(prompt);
  return generateWithFal(prompt);
}

export function imageAdapterReadiness() {
  return {
    enabled: process.env.ENABLE_ECONOMIC_DEMO_IMAGE_GENERATION === "true",
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
    falConfigured: Boolean(process.env.FAL_KEY || process.env.FAL_API_KEY),
    defaultOpenAIModel: DEFAULT_OPENAI_IMAGE_MODEL,
    defaultFalModel: DEFAULT_FAL_IMAGE_MODEL,
  };
}
