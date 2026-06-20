import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

const Input = z.object({
  category: z.string().trim().min(1).max(100),
  count: z.number().int().min(1).max(10).default(5),
  context: z.string().trim().max(500).optional(),
});

export type GeneratedChallenge = {
  title: string;
  description: string;
  options: string[];
  minTokens: number;
};

export const generateChallenges = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const prompt = `Gere ${data.count} desafios de palpites em português do Brasil para a categoria "${data.category}"${data.context ? ` (contexto: ${data.context})` : ""}.

Cada desafio deve ter:
- "title": pergunta curta e clara (máx 80 caracteres)
- "description": frase explicativa breve (máx 160 caracteres)
- "options": array com 2 a 4 opções de resposta curtas (até 30 caracteres cada)
- "minTokens": número inteiro entre 10 e 200 representando o custo do palpite

Retorne APENAS um JSON válido no formato:
{"challenges":[{"title":"...","description":"...","options":["A","B"],"minTokens":50}, ...]}

Não inclua comentários, texto fora do JSON, nem markdown.`;

    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      prompt,
    });

    const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    const json = match ? match[0] : cleaned;

    let parsed: { challenges: GeneratedChallenge[] };
    try {
      parsed = JSON.parse(json);
    } catch {
      throw new Error("A IA retornou um formato inválido. Tente novamente.");
    }

    const out = (parsed.challenges ?? []).slice(0, data.count).map((c) => ({
      title: String(c.title ?? "").slice(0, 120),
      description: String(c.description ?? "").slice(0, 200),
      options: (Array.isArray(c.options) ? c.options : ["Sim", "Não"])
        .map((o) => String(o).slice(0, 40))
        .filter(Boolean)
        .slice(0, 4),
      minTokens: Math.max(10, Math.min(200, Number(c.minTokens) || 50)),
    }));

    return { challenges: out };
  });
