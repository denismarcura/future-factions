import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
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
        options: z.array(z.string().trim().min(1).max(60)).min(2).max(10).optional(),
      }),
    )
    .max(10)
    .optional(),
  count: z.number().int().min(1).max(10).default(5),
  prizeName: z.string().trim().max(120).optional(),
  endsAt: z.string().trim().optional(),
});

export type GeneratedChallengeResult = {
  name: string;
  subs: { question: string; options: string[] }[];
};

export const generateChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
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

REGRAS IMPORTANTES para opções numéricas:
- NUNCA use valores decimais (proibido: "2.5", "1.5", "0.5", "Mais de 2.5", "Menos de 2.5").
- Para "total de gols", use SEMPRE números inteiros como opções (ex.: "1 gol", "2 gols", "3 gols", "4 ou mais"). Se for usar faixa, use inteiros: "0 a 1", "2 a 3", "4 ou mais".
- Para qualquer pergunta de quantidade (gols, escanteios, cartões, pontos), use apenas inteiros.

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
  .middleware([requireSupabaseAuth])
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
  .middleware([requireSupabaseAuth])
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

// Critérios de desempate generator
export const generateTiebreaker = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      base: z.string().trim().max(500).optional(),
      challengeName: z.string().trim().max(200).optional(),
      category: z.string().trim().max(100).optional(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const prompt = `Escreva os "Critérios de Desempate" para um desafio de palpites em português do Brasil.
${data.challengeName ? `Desafio: ${data.challengeName}` : ""}
${data.category ? `Categoria: ${data.category}` : ""}
${data.base ? `Base do organizador: ${data.base}` : ""}

Regras:
- 3 a 5 critérios numerados, claros e objetivos.
- Comece com o critério mais relevante (ex.: maior número de acertos).
- Inclua um último critério de sorteio em caso de empate persistente.
- Tom formal, sem emojis. Sem aspas, sem markdown.
- Retorne APENAS o texto.`;

    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      prompt,
    });
    return { text: text.trim() };
  });

// Regulamento generator
export const generateRegulation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      companyName: z.string().trim().max(200).optional(),
      challengeName: z.string().trim().min(1).max(200),
      category: z.string().trim().max(100).optional(),
      prizeName: z.string().trim().max(300).optional(),
      endsAt: z.string().trim().max(50).optional(),
      tiebreaker: z.string().trim().max(2000).optional(),
      extras: z.string().trim().max(1000).optional(),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const prompt = `Gere um "Regulamento Oficial" para a promoção/desafio de palpites abaixo, em português do Brasil.

Dados:
- Empresa organizadora: ${data.companyName || "Organizador"}
- Nome do desafio: ${data.challengeName}
${data.category ? `- Categoria: ${data.category}` : ""}
${data.prizeName ? `- Prêmio: ${data.prizeName}` : ""}
${data.endsAt ? `- Encerramento dos palpites: ${data.endsAt}` : ""}
${data.tiebreaker ? `- Critérios de desempate fornecidos:\n${data.tiebreaker}` : ""}
${data.extras ? `- Observações do organizador: ${data.extras}` : ""}

Estruture com as seções numeradas:
1. Do Objeto
2. Da Participação (gratuita, sem dinheiro real, +18, aceite obrigatório destes termos)
3. Do Período (datas e encerramento)
4. Da Mecânica (como palpitar e pontuar)
5. Da Premiação
6. Dos Critérios de Desempate
7. Da Entrega do Prêmio (responsabilidade do organizador)
8. Das Disposições Gerais
   - A plataforma Desafio dos Palpites atua apenas como intermediadora tecnológica.
   - Não há garantia de entrega de prêmios oferecidos por terceiros pela plataforma.
   - O organizador é o único responsável pela premiação e entrega.
   - A plataforma pode remover desafios ou suspender contas em caso de fraude ou conteúdo inadequado.
9. Do Foro

Tom formal, claro, sem emojis, sem markdown (apenas títulos numerados e parágrafos). Retorne APENAS o texto do regulamento.`;

    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      prompt,
    });
    return { text: text.trim() };
  });
