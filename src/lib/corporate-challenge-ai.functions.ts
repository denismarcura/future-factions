import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { z } from "zod";

const Input = z.object({
  briefing: z.string().trim().min(5).max(800),
  companyName: z.string().trim().max(120).optional(),
  prizeHint: z.string().trim().max(200).optional(),
});

export type GeneratedCorporateChallenge = {
  title: string;
  subtitle: string;
  description: string;
  prizeName: string;
  prizeDescription: string;
  missions: string[];
  rules: string[];
  promoText: string;
};

export const generateCorporateChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<GeneratedCorporateChallenge> => {
    const { createAiTextModel } = await import("./ai-gateway.server");
    const model = await createAiTextModel();

    const prompt = `Você gera campanhas promocionais corporativas para a plataforma "Desafio dos Palpites" em pt-BR.

Empresa: ${data.companyName || "Empresa"}
Briefing: ${data.briefing}
${data.prizeHint ? `Sugestão de prêmio: ${data.prizeHint}` : ""}

Gere um desafio corporativo completo. Retorne APENAS JSON válido (sem markdown):
{
  "title": "Título curto e chamativo (até 70 chars)",
  "subtitle": "Subtítulo (até 100 chars)",
  "description": "Descrição completa do desafio (2-3 parágrafos)",
  "prizeName": "Nome do prêmio",
  "prizeDescription": "Descrição do prêmio",
  "missions": ["3 a 6 missões curtas que os participantes devem cumprir"],
  "rules": ["3 a 5 regras curtas de participação"],
  "promoText": "Texto promocional curto para redes sociais (até 280 chars, com até 3 emojis)"
}`;

    const { text } = await generateText({
      model,
      prompt,
    });
    const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    let parsed: Partial<GeneratedCorporateChallenge> = {};
    try {
      parsed = JSON.parse(match ? match[0] : cleaned);
    } catch {
      throw new Error("A IA retornou um formato inválido. Tente novamente.");
    }
    return {
      title: String(parsed.title ?? "").slice(0, 120),
      subtitle: String(parsed.subtitle ?? "").slice(0, 200),
      description: String(parsed.description ?? "").slice(0, 2000),
      prizeName: String(parsed.prizeName ?? "").slice(0, 200),
      prizeDescription: String(parsed.prizeDescription ?? "").slice(0, 800),
      missions: (Array.isArray(parsed.missions) ? parsed.missions : []).map((m) => String(m).slice(0, 200)).slice(0, 10),
      rules: (Array.isArray(parsed.rules) ? parsed.rules : []).map((r) => String(r).slice(0, 200)).slice(0, 10),
      promoText: String(parsed.promoText ?? "").slice(0, 400),
    };
  });
