import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
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

const Schema = z.object({
  name: z.string().min(3).max(120),
  subs: z
    .array(
      z.object({
        question: z.string().min(3).max(200),
        options: z.array(z.string().min(1).max(60)).min(2).max(3),
      }),
    )
    .min(1)
    .max(5),
});

export const generateChallenge = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data }) => {
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

    const prompt = `Você é um gerador de desafios de palpites em português do Brasil. Gere um desafio engajador.

Tema: ${data.theme}
Categoria: ${data.category || "Geral"}${data.subcategory ? `\nSub-categoria: ${data.subcategory}` : ""}${data.prizeName ? `\nPrêmio: ${data.prizeName}` : ""}${data.endsAt ? `\nEncerra em: ${data.endsAt}` : ""}

${data.userSubs?.length ? `Palpites já criados pelo usuário (mantenha-os iguais e apenas complete as opções se necessário):\n${userSubsText}\n` : ""}
Gere no total ${data.count} palpites (sub-categorias). ${remaining > 0 ? `Crie mais ${remaining} palpites complementares ao tema.` : "Use apenas os palpites do usuário."} Cada palpite deve:
- Ter uma pergunta clara, curta e objetiva.
- Ter 2 ou 3 opções de resposta mutuamente exclusivas (ex.: "Sim/Não", "Time A/Empate/Time B").
- Ser verificável após o encerramento.

Também crie um NOME curto (até 80 caracteres) e chamativo para o desafio.

Retorne estritamente o JSON estruturado pedido.`;

    const { experimental_output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      experimental_output: Output.object({ schema: Schema }),
      prompt,
    });

    if (!experimental_output) throw new Error("A IA não retornou um desafio válido. Tente novamente.");
    return experimental_output;
  });
