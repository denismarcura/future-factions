import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { z } from "zod";

const InviteInput = z.object({
  inviterName: z.string().trim().min(1).max(100),
  challengeName: z.string().trim().min(1).max(200),
  palpites: z.array(z.string().trim().min(1).max(300)).max(10),
});

export const generateInviteText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InviteInput.parse(input))
  .handler(async ({ data }) => {
    const { createAiTextModel } = await import("./ai-gateway.server");
    const model = await createAiTextModel();

    const palpitesList = data.palpites.length
      ? data.palpites.map((p, i) => `${i + 1}. ${p}`).join("\n")
      : "(sem palpites cadastrados ainda)";

    const prompt = `Você escreve um e-mail curto, divertido e empolgante (em português do Brasil) para convidar um amigo a participar de um desafio de palpites na plataforma "Desafio dos Palpites".

Dados:
- Nome de quem convida: ${data.inviterName}
- Nome do desafio criado: ${data.challengeName}
- Palpites que o amigo poderá fazer:
${palpitesList}

Regras de escrita:
- Tom amigável, descontraído e motivador (sem ser apelativo).
- Máximo 140 palavras.
- Comece com "Olá!" (sem nome do destinatário).
- Mencione o nome de quem convida e o nome do desafio.
- Liste de forma rápida 2 ou 3 palpites para gerar curiosidade.
- Mencione que ao se cadastrar pelo convite o amigo já ganha 1.000 tokens de boas-vindas.
- Encerre com uma chamada para clicar no link do convite.
- Não use emojis em excesso (no máximo 2).
- Não inclua assunto, assinatura ou placeholders entre colchetes — só o corpo do e-mail.`;

    const { text } = await generateText({
      model,
      prompt,
    });

    return { text };
  });
