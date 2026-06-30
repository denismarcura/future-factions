import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { z } from "zod";

const Input = z.object({
  title: z.string().trim().min(1).max(200),
  category: z.string().trim().optional(),
});

export const improveTitle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }) => {
    const { createAiTextModel } = await import("./ai-gateway.server");
    const model = await createAiTextModel();

    const prompt = `Melhore o título do desafio de palpites abaixo, tornando-o mais chamativo, claro e engajador para participantes brasileiros. Mantenha curto (até 80 caracteres). Retorne APENAS o título melhorado, sem aspas extras, sem explicações e sem markdown.

Categoria: ${data.category || "Geral"}
Título atual: ${data.title}`;

    const { text } = await generateText({
      model,
      prompt,
    });

    const improved = text.trim().replace(/^["']|["']$/g, "").slice(0, 120);
    if (!improved) throw new Error("A IA não retornou um título válido. Tente novamente.");
    return { title: improved };
  });

const BannerInput = z.object({
  subtitle: z.string().trim().optional(),
  ctaLabel: z.string().trim().optional(),
  challengeTitle: z.string().trim().optional(),
  current: z.string().trim().optional(),
});

export const generateBannerTitle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => BannerInput.parse(input))
  .handler(async ({ data }) => {
    const { createAiTextModel } = await import("./ai-gateway.server");
    const model = await createAiTextModel();

    const prompt = `Você cria títulos de banners promocionais para o site "Desafio dos Palpites".
Gere UM título curto (até 60 caracteres), chamativo, em português brasileiro, sem aspas, sem emojis no início, sem markdown e sem explicações. Retorne APENAS o título.

Contexto:
- Subtítulo: ${data.subtitle || "(nenhum)"}
- Texto do botão: ${data.ctaLabel || "(nenhum)"}
- Desafio vinculado: ${data.challengeTitle || "(nenhum)"}
- Título atual: ${data.current || "(em branco)"}`;

    const { text } = await generateText({
      model,
      prompt,
    });

    const title = text.trim().replace(/^["']|["']$/g, "").split("\n")[0].slice(0, 80);
    if (!title) throw new Error("A IA não retornou um título válido. Tente novamente.");
    return { title };
  });
