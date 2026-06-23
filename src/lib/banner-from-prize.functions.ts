import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  prizeImageDataUrl: z.string().min(1),
  title: z.string().optional().default(""),
  prize: z.string().optional().default(""),
  deadline: z.string().optional().default(""),
  sponsorName: z.string().optional().default(""),
});

export const generateBannerFromPrize = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const lines: string[] = [];
    lines.push(
      `Crie um BANNER PROMOCIONAL HORIZONTAL (proporção 8:3, ideal para topo de página) para o "Desafio dos Palpites".`,
    );
    lines.push(
      `Use a IMAGEM DE REFERÊNCIA fornecida como base visual do prêmio — o produto da imagem DEVE aparecer em destaque no banner, mantendo cores, formato e identidade originais.`,
    );
    if (data.title.trim()) lines.push(`Título principal grande e legível: "${data.title}".`);
    if (data.prize.trim()) lines.push(`Selo destacando o prêmio: "${data.prize}".`);
    if (data.deadline.trim()) lines.push(`Data limite em destaque: ${data.deadline}.`);
    if (data.sponsorName.trim()) lines.push(`Patrocinador: ${data.sponsorName}.`);
    lines.push(`Inclua no rodapé o site www.desafiodospalpites.com.br.`);
    lines.push(
      `Estilo: pôster esportivo premium, alto contraste, tipografia bold sans-serif, iluminação cinematográfica, fundo com glow sutil. Sem marcas d'água, sem rostos humanos reais, sem logos de marcas existentes, somente texto em português.`,
    );

    const prompt = lines.join(" ");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        modalities: ["image", "text"],
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: data.prizeImageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      if (res.status === 429)
        throw new Error("Limite de requisições atingido. Tente novamente em alguns instantes.");
      if (res.status === 402)
        throw new Error("Créditos de IA esgotados. Adicione créditos para continuar.");
      throw new Error(`Falha ao gerar banner (${res.status}): ${txt.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: Array<{
        message?: {
          images?: Array<{ image_url?: { url?: string } }>;
          content?: unknown;
        };
      }>;
      data?: Array<{ b64_json?: string }>;
    };

    // Lovable AI Gateway returns generated images in choices[0].message.images
    const url = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (url) return { dataUrl: url };

    const b64 = json.data?.[0]?.b64_json;
    if (b64) return { dataUrl: `data:image/png;base64,${b64}` };

    throw new Error("A IA não retornou imagem. Tente novamente.");
  });
