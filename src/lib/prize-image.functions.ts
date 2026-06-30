import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  title: z.string().min(1),
  prize: z.string().optional().default(""),
  drawDate: z.string().optional().default(""),
  extraPrompt: z.string().optional().default(""),
});

export const generatePrizeImage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const lines: string[] = [];
    lines.push(`Pôster promocional quadrado 1:1 para o "Desafio dos Palpites".`);
    lines.push(`Título principal grande e legível: "${data.title}".`);
    if (data.prize.trim()) lines.push(`Subtítulo destacando o prêmio: "${data.prize}".`);
    lines.push(`Selo grande em verde brilhante: "GRATUITO".`);
    lines.push(`Slogan: "Acerte e ganhe".`);
    lines.push(`Website em destaque no rodapé: www.desafiodospalpites.com.br`);
    if (data.drawDate.trim()) lines.push(`Data do sorteio: ${data.drawDate}.`);
    lines.push(`Chamada secundária: "Faça missões e ganhe mais chances".`);
    lines.push(`Reserve uma faixa superior limpa para o logotipo da empresa (será sobreposto depois).`);
    lines.push(`Estilo: pôster gamer/esportivo moderno, paleta verde escuro, dourado e prata, alto contraste, tipografia bold sans-serif, tokens dourados brilhantes como elementos gráficos, fundo escuro com glow verde. Sem marca d'água, sem mãos, sem rostos humanos, sem logos genéricos.`);
    if (data.extraPrompt.trim()) lines.push(data.extraPrompt);

    const prompt = lines.join(" ");

    const { generateAiImage } = await import("./ai-gateway.server");
    const dataUrl = await generateAiImage({ prompt });
    return { dataUrl };
  });
