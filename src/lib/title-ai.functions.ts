import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

const Input = z.object({
  title: z.string().trim().min(1).max(200),
  category: z.string().trim().optional(),
});

export const improveTitle = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const prompt = `Melhore o título do desafio de palpites abaixo, tornando-o mais chamativo, claro e engajador para participantes brasileiros. Mantenha curto (até 80 caracteres). Retorne APENAS o título melhorado, sem aspas extras, sem explicações e sem markdown.

Categoria: ${data.category || "Geral"}
Título atual: ${data.title}`;

    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      prompt,
    });

    const improved = text.trim().replace(/^["']|["']$/g, "").slice(0, 120);
    if (!improved) throw new Error("A IA não retornou um título válido. Tente novamente.");
    return { title: improved };
  });
