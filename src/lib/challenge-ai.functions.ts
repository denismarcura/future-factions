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

type ChallengeInput = z.infer<typeof Input>;

export type GeneratedChallengeResult = {
  name: string;
  subs: { question: string; options: string[] }[];
};

export const generateChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Input.parse(input))
  .handler(async ({ data, context }): Promise<GeneratedChallengeResult> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let model: any;
    try {
      const { createAiTextModel } = await import("./ai-gateway.server");
      model = await createAiTextModel();
    } catch {
      return buildFallbackChallenge(data);
    }

    // Carrega a base de times/jogos cadastrados para ancorar a IA
    let teamsContext = "";
    try {
      const { data: matches } = await context.supabase
        .from("world_cup_results")
        .select("home_team, away_team, match_date, status")
        .order("match_date", { ascending: true })
        .limit(200);
      if (matches && matches.length) {
        const teamSet = new Set<string>();
        matches.forEach((m: { home_team: string; away_team: string }) => {
          if (m.home_team) teamSet.add(m.home_team);
          if (m.away_team) teamSet.add(m.away_team);
        });
        const teams = Array.from(teamSet).sort();
        const upcoming = matches
          .filter((m: { status: string }) => m.status !== "encerrado")
          .slice(0, 30)
          .map(
            (m: { home_team: string; away_team: string; match_date: string }) =>
              `${m.home_team} x ${m.away_team} (${m.match_date})`,
          );
        teamsContext = `\n\nBASE DE TIMES CADASTRADOS NA PLATAFORMA (use APENAS estes nomes — não invente times nem jogadores de times fora desta lista):\n${teams.join(", ")}\n${upcoming.length ? `\nJOGOS CADASTRADOS (use estes confrontos como referência ao criar perguntas):\n${upcoming.join("\n")}\n` : ""}`;
      }
    } catch {
      // segue sem contexto extra se a consulta falhar
    }

    const userSubsText = (data.userSubs ?? [])
      .map((s, i) => {
        const opts = (s.options ?? []).filter(Boolean);
        return `${i + 1}. ${s.question}${opts.length ? ` — opções: ${opts.join(" / ")}` : ""}`;
      })
      .join("\n");

    const existingQuestions = (data.userSubs ?? [])
      .map((s) => s.question.trim())
      .filter(Boolean);

    const remaining = Math.max(0, data.count - (data.userSubs?.length ?? 0));
    const variationSeed = Math.random().toString(36).slice(2, 10);

    const prompt = `Você é um gerador de desafios de palpites em português do Brasil. Use seu conhecimento real sobre o tema (times, jogadores, datas, fases, estádios) para gerar respostas concretas e variadas.

Tema: ${data.theme}
Categoria: ${data.category || "Geral"}${data.subcategory ? `\nSub-categoria: ${data.subcategory}` : ""}${data.prizeName ? `\nPrêmio: ${data.prizeName}` : ""}${data.endsAt ? `\nEncerra em: ${data.endsAt}` : ""}
Seed de variação (use para garantir respostas diferentes): ${variationSeed}${teamsContext}

${data.userSubs?.length ? `Palpites já criados pelo usuário (mantenha-os iguais, NÃO REPITA nem crie versões parecidas):\n${userSubsText}\n` : ""}${existingQuestions.length ? `\nPROIBIDO repetir ou parafrasear qualquer das perguntas acima. Crie perguntas COMPLETAMENTE diferentes em assunto e formato.\n` : ""}
Gere no total ${data.count} palpites. ${remaining > 0 ? `Crie mais ${remaining} palpites NOVOS e diferentes dos anteriores.` : "Use apenas os palpites do usuário."} Varie os ângulos: resultado, placar, primeiro/último gol, jogador destaque, número de cartões, escanteios, gol em qual tempo, autor do gol, defesa do goleiro, fase seguinte, etc. Cada palpite deve ter pergunta curta e de 2 até 10 opções mutuamente exclusivas. Crie também um NOME curto (até 80 caracteres) e chamativo.

REGRA CRÍTICA — USE APENAS TIMES/JOGOS CADASTRADOS:
- Se houver "BASE DE TIMES CADASTRADOS" acima, TODAS as perguntas e opções que citem times/seleções devem usar EXCLUSIVAMENTE nomes dessa lista. NUNCA mencione um time que não esteja na base.
- Se houver "JOGOS CADASTRADOS", baseie as perguntas APENAS nesses confrontos e datas. NÃO invente jogos (ex.: nada de "Brasil x Escócia" se esse confronto não estiver listado).
- Para perguntas de jogador, use apenas jogadores reais dos times presentes na base.
- Se o tema não casar com nenhum time/jogo da base, evite perguntas específicas de confronto e prefira perguntas gerais (ex.: "Qual seleção será o lanterna?" com opções entre os times cadastrados).

REGRA CRÍTICA — RESPOSTAS REAIS E CONTEXTUAIS:
- Quando a pergunta envolver NOME DE JOGADOR (ex.: "Quem faz o primeiro gol?", "Quem é o craque da partida?", "Quem dá a assistência?"), gere SEMPRE opções com jogadores reais dos times presentes na base (3 destaques por time, total ≥ 6 nomes) e adicione "Nenhum" no final. NUNCA responda Sim/Não para perguntas de jogador.
- Quando envolver TIME/SELEÇÃO (ex.: "Quem vence?"), opções devem ser os times reais do confronto cadastrado + "Empate" quando fizer sentido.
- Quando envolver HORÁRIO/ESTÁDIO/FASE, gere a resposta oficial conhecida com base no título e data limite.
- Quando envolver "quem avança", opções devem ser os dois times do confronto cadastrado.
- Para "número de gols/cartões/escanteios", use inteiros (ver abaixo).

REGRAS para opções numéricas:
- NUNCA use valores decimais (proibido: "2.5", "1.5", "0.5", "Mais de 2.5", "Menos de 2.5").
- Para "total de gols", use SEMPRE números inteiros (ex.: "1 gol", "2 gols", "3 gols", "4 ou mais"). Faixas também inteiras: "0 a 1", "2 a 3", "4 ou mais".

REGRAS para seleções/países:
- Sempre que uma opção for um país ou seleção nacional, prefixe com o emoji da bandeira correspondente seguido de um espaço (ex.: "🇧🇷 Brasil", "🇭🇷 Croácia", "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Escócia", "🇶🇦 Catar"). Use o emoji oficial — nunca texto entre colchetes.

Retorne APENAS um JSON válido (sem markdown, sem comentários) no formato exato:
{"name":"Nome curto","subs":[{"question":"Pergunta?","options":["A","B"]}, ...]}`;

    let text: string;
    try {
      const result = await generateText({
        model,
        prompt,
        temperature: 1.0,
      });
      text = result.text;
    } catch (error) {
      console.error("[challenge-ai] generation failed", error);
      return buildFallbackChallenge(data);
    }

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
          .slice(0, 10),
      }))
      .filter((s) => s.question.length > 0 && s.options.length >= 2);

    if (!subs.length) throw new Error("A IA não retornou palpites válidos. Tente novamente.");

    return {
      name: String(parsed.name ?? "").slice(0, 120).trim() || "Novo desafio",
      subs,
    };
  });

function buildFallbackChallenge(data: ChallengeInput): GeneratedChallengeResult {
  const existing = (data.userSubs ?? [])
    .map((s) => ({
      question: s.question.trim(),
      options: normalizeOptions(s.options),
    }))
    .filter((s) => s.question.length > 0 && s.options.length >= 2);

  const theme = data.theme.replace(/\s+/g, " ").trim();
  const titleBase = theme
    .replace(/[.!?]+$/g, "")
    .slice(0, 72)
    .trim();
  const templates = fallbackTemplates(theme, data.category);
  const needed = Math.max(0, data.count - existing.length);
  const generated = templates.slice(0, needed);

  return {
    name: titleBase ? `${titleBase}: Desafio de Palpites` : "Novo desafio de palpites",
    subs: [...existing, ...generated].slice(0, data.count),
  };
}

function normalizeOptions(options?: string[]) {
  const clean = (options ?? [])
    .map((o) => String(o).trim())
    .filter(Boolean)
    .slice(0, 10);
  return clean.length >= 2 ? clean : ["Sim", "Não"];
}

function fallbackTemplates(theme: string, category?: string) {
  const label = theme.replace(/[.!?]+$/g, "").trim() || category || "o desafio";
  return [
    {
      question: `Qual será o resultado principal de ${label}?`,
      options: ["Sim", "Não"],
    },
    {
      question: `Quantos acertos o vencedor terá em ${label}?`,
      options: ["1 acerto", "2 acertos", "3 acertos", "4 ou mais"],
    },
    {
      question: `Quando acontecerá o momento decisivo de ${label}?`,
      options: ["No início", "No meio", "No final", "Não acontecerá"],
    },
    {
      question: `Qual será o nível de dificuldade de ${label}?`,
      options: ["Fácil", "Médio", "Difícil", "Muito difícil"],
    },
    {
      question: `O desafio ${label} terá surpresa no resultado?`,
      options: ["Sim", "Não"],
    },
    {
      question: `Qual alternativa será mais escolhida pelos participantes?`,
      options: ["Primeira opção", "Segunda opção", "Terceira opção", "Outra"],
    },
    {
      question: `Como terminará ${label}?`,
      options: ["Resultado esperado", "Resultado apertado", "Grande surpresa", "Empate técnico"],
    },
    {
      question: `Quantas pessoas acertarão todos os palpites?`,
      options: ["Ninguém", "1 pessoa", "2 a 5 pessoas", "Mais de 5 pessoas"],
    },
    {
      question: `Qual será o critério mais importante para vencer?`,
      options: ["Acertos", "Velocidade", "Missões", "Convites"],
    },
    {
      question: `O prêmio ${dataPrizeLabel(category)} aumentará a disputa?`,
      options: ["Sim", "Não"],
    },
  ];
}

function dataPrizeLabel(category?: string) {
  return category ? `da categoria ${category}` : "oferecido";
}

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
    const { createAiTextModel } = await import("./ai-gateway.server");
    const model = await createAiTextModel();

    const { text } = await generateText({
      model,
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
    const { createAiTextModel } = await import("./ai-gateway.server");
    const model = await createAiTextModel();

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
      model,
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
    const { createAiTextModel } = await import("./ai-gateway.server");
    const model = await createAiTextModel();

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
      model,
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
    const { createAiTextModel } = await import("./ai-gateway.server");
    const model = await createAiTextModel();

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
      model,
      prompt,
    });
    return { text: text.trim() };
  });
