import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { anthropic as createAnthropic } from "@ai-sdk/anthropic";

// ── Key resolution: banco primeiro, .env como fallback ───────────────────────
// keyName:  nome da linha em api_settings (ex: "anthropic_api_key")
// envVar:   nome da variável de ambiente fallback (ex: "ANTHROPIC_API_KEY")
async function resolveKey(keyName: string, envVar: string): Promise<string | undefined> {
  try {
    const { getApiSetting } = await import("@/lib/api-settings.functions");
    const dbValue = await getApiSetting(keyName);
    if (dbValue) return dbValue;
  } catch {
    // DB indisponível — segue para env
  }
  return process.env[envVar] || undefined;
}

// ── Lovable Gateway (mantido para compatibilidade) ────────────────────────────
export function createLovableAiGatewayProvider(lovableApiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
}

// ── Modelo de texto ───────────────────────────────────────────────────────────
// Prioridade: anthropic_api_key (DB) → ANTHROPIC_API_KEY (env)
//          → lovable_api_key (DB) → LOVABLE_API_KEY (env)
export async function createAiTextModel() {
  const anthropicKey = await resolveKey("anthropic_api_key", "ANTHROPIC_API_KEY");
  if (anthropicKey) {
    return createAnthropic("claude-sonnet-4-6", { apiKey: anthropicKey });
  }
  const lovableKey = await resolveKey("lovable_api_key", "LOVABLE_API_KEY");
  if (!lovableKey) {
    throw new Error(
      "Configure ANTHROPIC_API_KEY ou LOVABLE_API_KEY para usar funções de IA de texto.",
    );
  }
  return createLovableAiGatewayProvider(lovableKey)("google/gemini-3-flash-preview");
}

// ── Geração de imagem (texto → imagem) ───────────────────────────────────────
// Prioridade: openai_api_key (DB) → OPENAI_API_KEY (env)
//          → lovable_api_key (DB) → LOVABLE_API_KEY (env)
export async function generateAiImage(params: {
  prompt: string;
  size?: "1024x1024" | "1536x1024" | "1024x1536";
  quality?: "low" | "medium" | "high" | "standard";
}): Promise<string> {
  const openaiKey = await resolveKey("openai_api_key", "OPENAI_API_KEY");
  if (openaiKey) {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: params.prompt,
        size: params.size ?? "1024x1024",
        quality: params.quality === "high" ? "high" : "low",
        n: 1,
        output_format: "b64_json",
      }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throwImageError(res.status, txt);
    }
    const json = (await res.json()) as { data?: Array<{ b64_json?: string }> };
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) throw new Error("A IA não retornou imagem. Tente novamente.");
    return `data:image/png;base64,${b64}`;
  }

  const lovableKey = await resolveKey("lovable_api_key", "LOVABLE_API_KEY");
  if (!lovableKey) {
    throw new Error(
      "Configure OPENAI_API_KEY ou LOVABLE_API_KEY para usar geração de imagens.",
    );
  }
  const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-image-2",
      prompt: params.prompt,
      size: params.size ?? "1024x1024",
      quality: params.quality ?? "low",
      n: 1,
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throwImageError(res.status, txt);
  }
  const json = (await res.json()) as { data?: Array<{ b64_json?: string }> };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error("A IA não retornou imagem. Tente novamente.");
  return `data:image/png;base64,${b64}`;
}

// ── Edição de imagem (imagem + texto → imagem) ────────────────────────────────
// Usado para banner com imagem de referência.
export async function generateAiImageEdit(params: {
  prompt: string;
  imageDataUrl: string;
  size?: "1024x1024" | "1536x1024" | "1024x1536";
}): Promise<string> {
  const openaiKey = await resolveKey("openai_api_key", "OPENAI_API_KEY");
  if (openaiKey) {
    const [header, b64] = params.imageDataUrl.split(",");
    const mimeType = header.match(/data:(.*?);/)?.[1] ?? "image/png";
    const buffer = Buffer.from(b64, "base64");

    const formData = new FormData();
    formData.append("model", "gpt-image-1");
    formData.append("prompt", params.prompt);
    formData.append("n", "1");
    formData.append("size", params.size ?? "1536x1024");
    formData.append(
      "image[]",
      new Blob([buffer], { type: mimeType }),
      "reference.png",
    );

    const res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}` },
      body: formData,
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throwImageError(res.status, txt, "banner");
    }
    const json = (await res.json()) as {
      data?: Array<{ b64_json?: string; url?: string }>;
    };
    const imgB64 = json.data?.[0]?.b64_json;
    if (imgB64) return `data:image/png;base64,${imgB64}`;
    const url = json.data?.[0]?.url;
    if (url) return url;
    throw new Error("A IA não retornou imagem. Tente novamente.");
  }

  const lovableKey = await resolveKey("lovable_api_key", "LOVABLE_API_KEY");
  if (!lovableKey) {
    throw new Error(
      "Configure OPENAI_API_KEY ou LOVABLE_API_KEY para usar geração de imagens.",
    );
  }
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3.1-flash-image-preview",
      modalities: ["image", "text"],
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: params.prompt },
            { type: "image_url", image_url: { url: params.imageDataUrl } },
          ],
        },
      ],
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throwImageError(res.status, txt, "banner");
  }
  const json = (await res.json()) as {
    choices?: Array<{
      message?: {
        images?: Array<{ image_url?: { url?: string } }>;
      };
    }>;
    data?: Array<{ b64_json?: string }>;
  };
  const url = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (url) return url;
  const b64 = json.data?.[0]?.b64_json;
  if (b64) return `data:image/png;base64,${b64}`;
  throw new Error("A IA não retornou imagem. Tente novamente.");
}

function throwImageError(status: number, txt: string, type = "imagem"): never {
  if (status === 429)
    throw new Error("Limite de requisições atingido. Tente novamente em alguns instantes.");
  if (status === 402)
    throw new Error("Créditos de IA esgotados. Adicione créditos para continuar.");
  throw new Error(`Falha ao gerar ${type} (${status}): ${txt.slice(0, 200)}`);
}
