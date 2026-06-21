import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

const Input = z.object({
  query: z.string().trim().min(1).max(200),
  items: z
    .array(
      z.object({
        id: z.string().min(1).max(80),
        title: z.string().min(1).max(300),
        category: z.string().max(80).optional(),
      }),
    )
    .min(1)
    .max(300),
});

export const aiSearchChallenges = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<{ ids: string[] }> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const list = data.items
      .map((it) => `${it.id} | ${it.category ?? "—"} | ${it.title}`)
      .join("\n");

    const prompt = `Você é um motor de busca semântica em português do Brasil para desafios de palpites.

Consulta do usuário: "${data.query}"

Lista de desafios disponíveis (formato: ID | CATEGORIA | TÍTULO):
${list}

Retorne APENAS um JSON válido (sem markdown) com os IDs dos desafios MAIS relevantes para a consulta, ordenados do mais para o menos relevante. Máximo 30 resultados. Se nada for relevante, retorne lista vazia.

Formato exato:
{"ids":["id1","id2","..."]}`;

    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      prompt,
    });

    const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    const json = match ? match[0] : cleaned;

    let parsed: { ids?: unknown };
    try {
      parsed = JSON.parse(json);
    } catch {
      return { ids: [] };
    }

    const validIds = new Set(data.items.map((it) => it.id));
    const ids = Array.isArray(parsed.ids)
      ? parsed.ids
          .map((x) => String(x).trim())
          .filter((id) => validIds.has(id))
          .slice(0, 30)
      : [];

    return { ids };
  });
