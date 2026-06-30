import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

const Input = z.object({
  challenge: z.string().trim().min(5).max(1000),
});

export const askAiOpinion = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<{ opinion: string; pick: string; confidence: string; reasoning: string }> => {
    const { createAiTextModel } = await import("./ai-gateway.server");
    const model = await createAiTextModel();

    const prompt = `Você é um analista esportivo e de palpites experiente, em português do Brasil. Dê uma SEGUNDA OPINIÃO sobre o desafio/palpite abaixo. Seja direto, equilibrado e honesto sobre incertezas.

Desafio do usuário:
"""${data.challenge}"""

Retorne APENAS um JSON válido (sem markdown) com:
{
  "pick": "Qual sua palpite principal (curto, máx 60 caracteres)",
  "confidence": "Alta | Média | Baixa",
  "opinion": "Sua opinião em 1-2 frases curtas",
  "reasoning": "Análise em até 4 linhas explicando o porquê (estatísticas, contexto, riscos)"
}`;

    const { text } = await generateText({
      model,
      prompt,
    });

    const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    const json = match ? match[0] : cleaned;

    let parsed: { pick?: string; confidence?: string; opinion?: string; reasoning?: string };
    try {
      parsed = JSON.parse(json);
    } catch {
      throw new Error("A IA retornou um formato inválido. Tente novamente.");
    }

    return {
      pick: String(parsed.pick ?? "").slice(0, 120).trim() || "—",
      confidence: String(parsed.confidence ?? "Média").trim(),
      opinion: String(parsed.opinion ?? "").trim(),
      reasoning: String(parsed.reasoning ?? "").trim(),
    };
  });
