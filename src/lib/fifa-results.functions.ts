import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const FIFA_FIXTURES_URL =
  "https://www.fifa.com/pt/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures?country=BR&wtw-filter=ALL";

const FifaResultSchema = z.object({
  match_found: z.boolean(),
  status: z.string(),
  home_team: z.string(),
  away_team: z.string(),
  home_score: z.number().int().nullable(),
  away_score: z.number().int().nullable(),
  winner_team: z.string().nullable().optional(),
  is_draw: z.boolean().optional(),
  source_url: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

type FifaResult = z.infer<typeof FifaResultSchema>;

async function tryFetchFifaPage(): Promise<string | null> {
  try {
    const res = await fetch(FIFA_FIXTURES_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; DesafioDosPalpitesBot/1.0; +https://www.desafiodospalpites.com.br)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    // Strip scripts/styles + collapse whitespace; keep visible text up to ~40k chars
    const stripped = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return stripped.slice(0, 40000);
  } catch {
    return null;
  }
}

async function askAiForResult(args: {
  home: string;
  away: string;
  matchDate?: string | null;
  pageText: string | null;
}): Promise<FifaResult> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");

  const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
  const gateway = createLovableAiGatewayProvider(key);

  const ctx = args.pageText
    ? `Conteúdo extraído da página oficial da FIFA (use SOMENTE este texto):\n"""${args.pageText}"""`
    : `Não foi possível extrair o conteúdo da página oficial da FIFA neste momento. Se não tiver certeza absoluta do placar, devolva match_found=false e confidence=0.`;

  const prompt = `Você é um verificador de resultados esportivos.

Fonte oficial obrigatória: ${FIFA_FIXTURES_URL}

${ctx}

Procure a partida:
${args.home} x ${args.away}${args.matchDate ? `\nData esperada: ${args.matchDate}` : ""}

REGRAS:
- Nunca invente placar. Se houver dúvida, devolva match_found=false e confidence=0.
- "status" deve ser um destes: "aguardando_jogo", "jogo_em_andamento", "finalizado".
- Se finalizado, preencha home_score, away_score, winner_team (ou empty string em empate), is_draw.
- confidence é sua certeza real entre 0 e 1 (use 0.95+ apenas se viu o placar explicitamente no texto).

Retorne SOMENTE JSON válido, sem markdown, sem explicação. Formato:
{"match_found":true,"status":"finalizado","home_team":"${args.home}","away_team":"${args.away}","home_score":0,"away_score":0,"winner_team":"","is_draw":false,"source_url":"${FIFA_FIXTURES_URL}","confidence":0.95}`;

  const { text } = await generateText({
    model: gateway("google/gemini-3-flash-preview"),
    prompt,
  });

  const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  const json = match ? match[0] : cleaned;
  return FifaResultSchema.parse(JSON.parse(json));
}

// ===================== fetchFifaMatchResult =====================
export const fetchFifaMatchResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ challengeId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: ch, error: chErr } = await supabaseAdmin
      .from("challenges")
      .select("*")
      .eq("id", data.challengeId)
      .single();
    if (chErr || !ch) throw new Error("Desafio não encontrado");
    if (!ch.home_team || !ch.away_team) {
      throw new Error("Desafio sem times definidos (home_team/away_team)");
    }

    const pageText = await tryFetchFifaPage();
    let result: FifaResult;
    try {
      result = await askAiForResult({
        home: ch.home_team,
        away: ch.away_team,
        matchDate: ch.match_date,
        pageText,
      });
    } catch (e) {
      await supabaseAdmin.from("challenge_results_log").insert({
        challenge_id: ch.id,
        triggered_by: userId,
        source: FIFA_FIXTURES_URL,
        confidence: 0,
        status_at_check: "erro_na_consulta",
        error: e instanceof Error ? e.message : String(e),
      });
      await supabaseAdmin
        .from("challenges")
        .update({
          apuration_status: "erro_na_consulta",
          result_checked_at: new Date().toISOString(),
        })
        .eq("id", ch.id);
      throw e;
    }

    const confidentFinal =
      result.match_found &&
      result.status === "finalizado" &&
      result.confidence >= 0.9 &&
      result.home_score !== null &&
      result.away_score !== null;

    const newStatus = confidentFinal
      ? "resultado_encontrado"
      : result.match_found && result.status === "jogo_em_andamento"
        ? "jogo_em_andamento"
        : result.match_found && result.status === "aguardando_jogo"
          ? "aguardando_jogo"
          : "requer_revisao_manual";

    const updates: Record<string, any> = {
      result_source: FIFA_FIXTURES_URL,
      result_checked_at: new Date().toISOString(),
      result_payload_json: result as any,
      apuration_status: newStatus,
      match_status: result.status,
    };

    if (confidentFinal) {
      updates.home_score = result.home_score;
      updates.away_score = result.away_score;
      updates.is_draw = !!result.is_draw || result.home_score === result.away_score;
      updates.winner_team =
        result.home_score! > result.away_score!
          ? ch.home_team
          : result.away_score! > result.home_score!
            ? ch.away_team
            : "";
      updates.result_confirmed_at = new Date().toISOString();
    }

    await supabaseAdmin.from("challenges").update(updates as any).eq("id", ch.id);
    await supabaseAdmin.from("challenge_results_log").insert({
      challenge_id: ch.id,
      triggered_by: userId,
      source: FIFA_FIXTURES_URL,
      confidence: result.confidence,
      status_at_check: newStatus,
      payload: result as any,
    });

    return { ok: true, status: newStatus, result };
  });

// ===================== recalculateWinners =====================
export const recalculateWinners = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ challengeId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: ch } = await supabaseAdmin
      .from("challenges")
      .select("*")
      .eq("id", data.challengeId)
      .single();
    if (!ch) throw new Error("Desafio não encontrado");
    if (ch.home_score == null || ch.away_score == null) {
      throw new Error("Desafio ainda sem placar confirmado");
    }

    const home = ch.home_score;
    const away = ch.away_score;
    const total = home + away;
    const isDraw = home === away;
    const winnerTeam = isDraw ? "" : home > away ? ch.home_team : ch.away_team;

    const palpRes = await supabaseAdmin
      .from("palpites")
      .select("*")
      .eq("challenge_id", ch.id);
    const palpites = palpRes.data ?? [];

    type Pal = (typeof palpites)[number];
    const evaluate = (p: Pal): { correct: boolean; reason: string } => {
      switch (p.kind) {
        case "vencedor":
          return {
            correct: !isDraw && p.option_value === winnerTeam,
            reason: `acertou o vencedor (${winnerTeam})`,
          };
        case "empate":
          return { correct: isDraw, reason: "acertou o empate" };
        case "placar_exato":
          return {
            correct:
              p.predicted_home_score === home && p.predicted_away_score === away,
            reason: `acertou o placar exato ${home}×${away}`,
          };
        case "mais_2":
          return { correct: total > 2, reason: `acertou +2 gols (${total})` };
        case "menos_2":
          return { correct: total < 2, reason: `acertou -2 gols (${total})` };
        case "ambos_marcam":
          return {
            correct: home > 0 && away > 0,
            reason: "acertou ambos marcam",
          };
        default:
          return { correct: false, reason: "" };
      }
    };

    let winners = 0;
    for (const p of palpites) {
      const { correct, reason } = evaluate(p);
      await supabaseAdmin
        .from("palpites")
        .update({ is_correct: correct, evaluated_at: new Date().toISOString() })
        .eq("id", p.id);
      if (correct) {
        winners++;
        // upsert into challenge_winners
        await supabaseAdmin.from("challenge_winners").upsert(
          {
            challenge_id: ch.id,
            user_id: p.user_id,
            palpite_id: p.id,
            reason,
            tokens: 0, // calculated on release
            status: ch.is_physical_prize ? "aguardando_premio_fisico" : "pendente",
          },
          { onConflict: "palpite_id" },
        );
      } else {
        await supabaseAdmin
          .from("challenge_winners")
          .delete()
          .eq("palpite_id", p.id);
      }
    }

    return { ok: true, winners, total: palpites.length };
  });

// ===================== releaseTokens =====================
export const releaseTokens = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ challengeId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: ch } = await supabaseAdmin
      .from("challenges")
      .select("*")
      .eq("id", data.challengeId)
      .single();
    if (!ch) throw new Error("Desafio não encontrado");

    const pendRes = await supabaseAdmin
      .from("challenge_winners")
      .select("*")
      .eq("challenge_id", ch.id)
      .eq("status", "pendente");
    const pending = pendRes.data ?? [];

    if (pending.length === 0) {
      return { ok: true, released: 0, message: "Nada a liberar" };
    }

    const pool = Math.max(ch.prize_pool || 0, 0);
    const perWinner =
      pool > 0 ? Math.floor(pool / pending.length) : Math.max(ch.entry_fee || 100, 100);

    let released = 0;
    for (const w of pending) {
      await supabaseAdmin
        .from("challenge_winners")
        .update({
          tokens: perWinner,
          status: "liberado",
          released_at: new Date().toISOString(),
          released_by: userId,
        })
        .eq("id", w.id);
      await supabaseAdmin.from("token_transactions").insert({
        user_id: w.user_id,
        challenge_id: ch.id,
        winner_id: w.id,
        delta: perWinner,
        reason: `Você ganhou ${perWinner} tokens — ${w.reason} em ${ch.home_team} ${ch.home_score}×${ch.away_score} ${ch.away_team}`,
      });
      released++;
    }

    await supabaseAdmin
      .from("challenges")
      .update({ apuration_status: "apurado_automaticamente" })
      .eq("id", ch.id);

    return { ok: true, released, perWinner };
  });

// ===================== manualConfirmResult =====================
export const manualConfirmResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        challengeId: z.string().uuid(),
        home_score: z.number().int().min(0).max(50),
        away_score: z.number().int().min(0).max(50),
        observation: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ch } = await supabaseAdmin
      .from("challenges")
      .select("*")
      .eq("id", data.challengeId)
      .single();
    if (!ch) throw new Error("Desafio não encontrado");

    const isDraw = data.home_score === data.away_score;
    const winnerTeam = isDraw
      ? ""
      : data.home_score > data.away_score
        ? ch.home_team
        : ch.away_team;

    await supabaseAdmin
      .from("challenges")
      .update({
        home_score: data.home_score,
        away_score: data.away_score,
        is_draw: isDraw,
        winner_team: winnerTeam,
        match_status: "finalizado",
        apuration_status: "resultado_encontrado",
        result_source: "manual",
        result_confirmed_at: new Date().toISOString(),
        result_checked_at: new Date().toISOString(),
        result_payload_json: {
          manual: true,
          observation: data.observation ?? null,
          by: userId,
        } as any,
      })
      .eq("id", ch.id);

    await supabaseAdmin.from("challenge_results_log").insert({
      challenge_id: ch.id,
      triggered_by: userId,
      source: "manual",
      confidence: 1,
      status_at_check: "resultado_encontrado",
      payload: {
        manual: true,
        home_score: data.home_score,
        away_score: data.away_score,
        observation: data.observation ?? null,
      } as any,
    });

    return { ok: true };
  });

// ===================== listChallengesForAdmin =====================
export const listChallengesForAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const chRes = await supabaseAdmin
      .from("challenges")
      .select("*")
      .order("match_kickoff", { ascending: true, nullsFirst: false });
    const challenges = chRes.data ?? [];

    const ids = challenges.map((c) => c.id);
    const [palpRes, winRes] = await Promise.all([
      ids.length
        ? supabaseAdmin.from("palpites").select("challenge_id").in("challenge_id", ids)
        : Promise.resolve({ data: [] as { challenge_id: string }[] }),
      ids.length
        ? supabaseAdmin
            .from("challenge_winners")
            .select("challenge_id,status,tokens")
            .in("challenge_id", ids)
        : Promise.resolve({
            data: [] as { challenge_id: string; status: string; tokens: number }[],
          }),
    ]);
    const palpitesCount = palpRes.data ?? [];
    const winners = winRes.data ?? [];

    const palpCount: Record<string, number> = {};
    for (const p of palpitesCount) palpCount[p.challenge_id] = (palpCount[p.challenge_id] || 0) + 1;
    const winsCount: Record<string, { count: number; tokens: number; pending: number }> = {};
    for (const w of winners) {
      const r = (winsCount[w.challenge_id] ||= { count: 0, tokens: 0, pending: 0 });
      r.count++;
      r.tokens += w.tokens || 0;
      if (w.status === "pendente") r.pending++;
    }

    return challenges.map((c) => ({
      ...c,
      participants: palpCount[c.id] ?? 0,
      winners_count: winsCount[c.id]?.count ?? 0,
      winners_tokens: winsCount[c.id]?.tokens ?? 0,
      winners_pending: winsCount[c.id]?.pending ?? 0,
    }));
  });

// ===================== getChallengeLogs =====================
export const getChallengeLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ challengeId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const logsRes = await supabaseAdmin
      .from("challenge_results_log")
      .select("*")
      .eq("challenge_id", data.challengeId)
      .order("created_at", { ascending: false })
      .limit(50);
    return logsRes.data ?? [];
  });
