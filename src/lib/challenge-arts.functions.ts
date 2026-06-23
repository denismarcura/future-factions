import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  format: z.enum(["feed", "banner", "story"]),
  sport: z.string().min(1),
  participants: z.string().optional().default(""),
  style: z.string().min(1),
  colors: z.array(z.string()).min(1),
  prize: z.string().optional().default(""),
  deadline: z.string().optional().default(""),
  headline: z.string().optional().default(""),
  sponsorName: z.string().optional().default(""),
});

const SIZE_MAP: Record<string, "1024x1536" | "1536x1024" | "1024x1024"> = {
  feed: "1024x1536",      // 4:5 vertical (close)
  banner: "1536x1024",    // 3:2 horizontal banner
  story: "1024x1536",     // 9:16 (closest portrait)
};

export const generateChallengeArt = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const orientation =
      data.format === "banner" ? "horizontal banner format" :
      data.format === "story" ? "vertical 9:16 story format" :
      "vertical 4:5 social feed post";

    const colorList = data.colors.join(", ");
    const lines: string[] = [];
    lines.push(`Arte promocional moderna para "Desafio dos Palpites" no formato ${orientation}.`);
    lines.push(`Modalidade: ${data.sport}.`);
    if (data.participants.trim()) lines.push(`Confronto / participantes em destaque: ${data.participants}.`);
    lines.push(`Estilo visual: ${data.style}.`);
    lines.push(`Paleta de cores principal (criar degradê harmônico): ${colorList}.`);
    if (data.headline.trim()) lines.push(`Título grande e legível em destaque: "${data.headline}".`);
    if (data.prize.trim()) lines.push(`Selo destacando o prêmio: "${data.prize}".`);
    if (data.deadline.trim()) lines.push(`Data limite para palpites em destaque: ${data.deadline}.`);
    if (data.sponsorName.trim()) lines.push(`Marca patrocinadora: ${data.sponsorName}.`);
    lines.push(`Inclua no rodapé o domínio www.desafiodospalpites.com.br.`);
    lines.push(`Tipografia sans-serif bold, alto contraste, design esportivo premium, iluminação cinematográfica, sem marcas d'água, sem rostos humanos reais, sem logos de marcas existentes, sem texto em outros idiomas além de português.`);

    const prompt = lines.join(" ");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-image-2",
        prompt,
        size: SIZE_MAP[data.format],
        quality: "low",
        n: 1,
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Limite de requisições atingido. Tente novamente em alguns instantes.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos para continuar.");
      throw new Error(`Falha ao gerar arte (${res.status}): ${txt.slice(0, 200)}`);
    }

    const json = (await res.json()) as { data?: Array<{ b64_json?: string }> };
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) throw new Error("A IA não retornou imagem. Tente novamente.");
    return { dataUrl: `data:image/png;base64,${b64}`, format: data.format };
  });
