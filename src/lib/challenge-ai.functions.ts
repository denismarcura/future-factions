import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

const Input = z.object({
  theme: z.string().trim().min(3).max(500),
  category: z.string().trim().optional(),
  subcategory: z.string().trim().optional(),
  userSubs: z
    .array(
      z.object({
        question: z.string().trim().min(1).max(200),
        options: z.array(z.string().trim().min(1).max(60)).min(2).max(3).optional(),
      }),
    )
    .max(5)
    .optional(),
  count: z.number().int().min(1).max(5).default(5),
  prizeName: z.string().trim().max(120).optional(),
  endsAt: z.string().trim().optional(),
});

export type GeneratedChallengeResult = {
  name: string;
  subs: { question: string; options: string[] }[];
};

export const generateChallenge = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }): Promise<GeneratedChallengeResult> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const userSubsText = (data.userSubs ?? [])
      .map((s, i) => {
        const opts = (s.options ?? []).filter(Boolean);
        return `${i + 1}. ${s.question}${opts.length ? ` — opções: ${opts.join(" / ")}` : ""}`;
      })
      .join("\n");

    const remaining = Math.max(0, data.count - (data.userSubs?.length ?? 0));

    const prompt = `Você é um gerador de desafios de palpites em português do Brasil.

Tema: ${data.theme}
Categoria: ${data.category || "Geral"}${data.subcategory ? `\nSub-categoria: ${data.subcategory}` : ""}${data.prizeName ? `\nPrêmio: ${data.prizeName}` : ""}${data.endsAt ? `\nEncerra em: ${data.endsAt}` : ""}

${data.userSubs?.length ? `Palpites já criados pelo usuário (mantenha-os iguais):\n${userSubsText}\n` : ""}
Gere no total ${data.count} palpites. ${remaining > 0 ? `Crie mais ${remaining} palpites complementares.` : "Use apenas os palpites do usuário."} Cada palpite deve ter pergunta curta e 2 ou 3 opções mutuamente exclusivas. Crie também um NOME curto (até 80 caracteres) e chamativo para o desafio.

Retorne APENAS um JSON válido (sem markdown, sem comentários) no formato exato:
{"name":"Nome curto","subs":[{"question":"Pergunta?","options":["A","B"]}, ...]}`;

    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      prompt,
    });

    const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    const json = match ? match[0] : cleaned;

    let parsed: { name?: string; subs?: { question?: string; options?: string[] }[] };
    try {
      parsed = JSON.parse(json);
    } catch {
      throw new Error("A IA retornou um formato inválido. Tente novamente.");
    }

    const subs = (parsed.subs ?? [])
      .slice(0, data.count)
      .map((s) => ({
        question: String(s.question ?? "").slice(0, 200).trim(),
        options: (Array.isArray(s.options) ? s.options : ["Sim", "Não"])
          .map((o) => String(o).slice(0, 60).trim())
          .filter(Boolean)
          .slice(0, 3),
      }))
      .filter((s) => s.question.length > 0 && s.options.length >= 2);

    if (!subs.length) throw new Error("A IA não retornou palpites válidos. Tente novamente.");

    return {
      name: String(parsed.name ?? "").slice(0, 120).trim() || "Novo desafio",
      subs,
    };
  });

// Improve a free-form description (e.g. private challenge invite description)
export const improveDescription = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      text: z.string().trim().min(1).max(2000),
      context: z.string().trim().max(200).optional(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      prompt: `Reescreva a descrição abaixo de um desafio privado de palpites em português do Brasil. Tom amigável, claro e empolgante. Máximo 300 caracteres. Sem emojis em excesso (máx 2). Retorne APENAS o texto reescrito, sem aspas nem markdown.${data.context ? `\nContexto: ${data.context}` : ""}\n\nDescrição:\n${data.text}`,
    });
    return { text: text.trim().replace(/^["']|["']$/g, "") };
  });

// WhatsApp invite text generator
export const generateWhatsAppInvite = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      inviterName: z.string().trim().max(100).optional(),
      challengeName: z.string().trim().min(1).max(200),
      description: z.string().trim().max(500).optional(),
      prizeName: z.string().trim().max(200).optional(),
      link: z.string().trim().max(300).optional(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const prompt = `Escreva uma mensagem de WhatsApp curta (em português do Brasil) convidando alguém para participar de um desafio de palpites GRATUITO na plataforma "Desafio dos Palpites".

Dados:
- Quem convida: ${data.inviterName || "Um amigo"}
- Nome do desafio: ${data.challengeName}
${data.description ? `- Sobre o desafio: ${data.description}` : ""}
${data.prizeName ? `- Prêmio: ${data.prizeName}` : ""}
${data.link ? `- Link de cadastro: ${data.link}` : "- Link de cadastro: [LINK]"}

Regras:
- Tom amigável, descontraído, empolgante.
- Máximo 120 palavras.
- Explique brevemente como funciona (palpitar, acertar, ganhar tokens/prêmios).
- Diga claramente que é 100% GRATUITO, sem dinheiro real.
- Mencione quem está convidando e o nome do desafio.
- Finalize com o link de cadastro.
- Pode usar até 3 emojis (⚽🏆🎯🔥👀).
- Retorne APENAS o texto da mensagem.`;

    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      prompt,
    });
    return { text: text.trim() };
  });
