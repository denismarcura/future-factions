import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

const ChallengeInput = z.object({
  title: z.string().trim().min(1).max(200),
  category: z.string().trim().max(80).optional(),
  closesAt: z.string().trim().max(40).optional(),
});

const InviteInput = z.object({
  inviterName: z.string().trim().min(1).max(100),
  channel: z.enum(["whatsapp", "email"]),
  link: z.string().trim().url(),
  myChallenges: z.array(ChallengeInput).max(5).default([]),
  expiringChallenges: z.array(ChallengeInput).max(5).default([]),
});

export const generateInvitePromoText = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InviteInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY não configurada.");

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const renderList = (label: string, items: typeof data.myChallenges) =>
      items.length
        ? `${label}:\n` +
          items
            .map((c, i) => {
              const meta = [c.category, c.closesAt ? `encerra ${c.closesAt}` : null]
                .filter(Boolean)
                .join(" · ");
              return `${i + 1}. ${c.title}${meta ? ` (${meta})` : ""}`;
            })
            .join("\n")
        : "";

    const minhas = renderList("Desafios que eu criei", data.myChallenges);
    const fechando = renderList("Desafios mais próximos do vencimento", data.expiringChallenges);

    const channelRules =
      data.channel === "whatsapp"
        ? `- Formato: mensagem curta de WhatsApp (até 140 palavras).
- Use 2 ou 3 emojis no máximo, com quebras de linha para facilitar a leitura.
- Use *asteriscos* para destacar 1 ou 2 palavras importantes (negrito do WhatsApp).
- Termine com o link em uma linha separada.`
        : `- Formato: corpo de e-mail (até 180 palavras).
- Use parágrafos curtos e bullets (•) quando listar coisas.
- Sem assunto, sem assinatura, sem placeholders entre colchetes.
- Comece com "Olá!" (sem nome do destinatário).
- Termine com o link em uma linha separada.`;

    const prompt = `Você escreve um convite (em português do Brasil) para um amigo entrar no "Desafio dos Palpites".

Contexto:
- Quem convida: ${data.inviterName}
- Canal: ${data.channel === "whatsapp" ? "WhatsApp" : "E-mail"}
- Link do convite: ${data.link}

A plataforma é 100% GRATUITA. O amigo pode:
- Criar desafios de palpites com os amigos dele.
- Criar desafios de palpites para o negócio dele (engajamento de clientes).
- Participar de desafios para concorrer a prêmios reais (iPhone, TV LED, PS5, Notebook, Camiseta da Copa).
- Ganha 1.000 tokens de boas-vindas ao se cadastrar pelo link acima.

${minhas || ""}
${fechando || ""}

Instruções:
- Tom amigável, animado e direto. Sem ser apelativo.
- Mencione o nome de quem convida.
- Se houver desafios meus, cite 1 ou 2 pelo nome (chamando para palpitar comigo).
- Se houver desafios próximos do vencimento, lembre que estão acabando.
- Destaque que é grátis e os 3 usos (criar com amigos, criar para o negócio, participar pra ganhar prêmios).
- Inclua o link exatamente como recebido.
${channelRules}

Retorne SOMENTE o texto final, sem comentários nem cabeçalhos.`;

    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      prompt,
    });

    return { text: text.trim() };
  });
