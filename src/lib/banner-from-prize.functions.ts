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

    const { generateAiImageEdit } = await import("./ai-gateway.server");
    const dataUrl = await generateAiImageEdit({
      prompt,
      imageDataUrl: data.prizeImageDataUrl,
      size: "1536x1024",
    });
    return { dataUrl };
  });
