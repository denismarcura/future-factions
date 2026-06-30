import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/apurar-copa")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!expected || apikey !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const ELIGIBLE = [
          "aguardando_jogo",
          "jogo_em_andamento",
          "aguardando_resultado",
          "resultado_encontrado",
        ];

        const chRes = await supabaseAdmin
          .from("challenges")
          .select("id, home_team, away_team, match_date, match_kickoff, apuration_status, is_physical_prize, prize_pool, entry_fee, home_score, away_score, home_flag_code, away_flag_code")
          .in("apuration_status", ELIGIBLE as any)
          .not("home_team", "is", null)
          .not("away_team", "is", null)
          .limit(50);
        const challenges = chRes.data ?? [];

        let processed = 0;
        let confirmed = 0;
        let manualReview = 0;

        for (const ch of challenges) {
          try {
            const r = await runCheck(ch.id);
            processed++;
            if (r.confidentFinal) confirmed++;
            else if (r.newStatus === "requer_revisao_manual") manualReview++;
          } catch (e) {
            console.error("apurar-copa error", ch.id, e);
          }
        }

        return Response.json({
          ok: true,
          processed,
          confirmed,
          manualReview,
          checkedAt: new Date().toISOString(),
        });
      },
    },
  },
});

// Runs the full check + apurar + release for one challenge using admin client.
async function runCheck(challengeId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { FIFA_FIXTURES_URL } = await import("@/lib/fifa-results.functions");

  const { data: ch } = await supabaseAdmin
    .from("challenges")
    .select("*")
    .eq("id", challengeId)
    .single();
  if (!ch || !ch.home_team || !ch.away_team) {
    return { skipped: true, newStatus: ch?.apuration_status, confidentFinal: false };
  }

  // Fetch FIFA page
  let pageText: string | null = null;
  try {
    const res = await fetch(FIFA_FIXTURES_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; DesafioDosPalpitesBot/1.0; +https://www.desafiodospalpites.com.br)",
        Accept: "text/html",
      },
    });
    if (res.ok) {
      const html = await res.text();
      pageText = html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 40000);
    }
  } catch {}

  const { createAiTextModel } = await import("@/lib/ai-gateway.server");
  const { generateText } = await import("ai");
  const model = await createAiTextModel();

  const prompt = `Você é um verificador de resultados esportivos.
Fonte oficial: ${FIFA_FIXTURES_URL}

${pageText ? `Conteúdo extraído da página:\n"""${pageText}"""` : "Sem acesso ao conteúdo da página neste momento. Se não tiver certeza, retorne match_found=false e confidence=0."}

Procure: ${ch.home_team} x ${ch.away_team}${ch.match_date ? `\nData: ${ch.match_date}` : ""}

Nunca invente placar. status ∈ {aguardando_jogo, jogo_em_andamento, finalizado}.
Retorne SOMENTE JSON: {"match_found":true,"status":"finalizado","home_team":"","away_team":"","home_score":0,"away_score":0,"winner_team":"","is_draw":false,"source_url":"${FIFA_FIXTURES_URL}","confidence":0.95}`;

  let result: any;
  try {
    const { text } = await generateText({
      model,
      prompt,
    });
    const cleaned = text.replace(/```json\s*|\s*```/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    result = JSON.parse(match ? match[0] : cleaned);
  } catch (e) {
    await supabaseAdmin.from("challenge_results_log").insert({
      challenge_id: ch.id,
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
    return { newStatus: "erro_na_consulta", confidentFinal: false };
  }

  const confidentFinal =
    !!result.match_found &&
    result.status === "finalizado" &&
    typeof result.confidence === "number" &&
    result.confidence >= 0.9 &&
    typeof result.home_score === "number" &&
    typeof result.away_score === "number";

  const newStatus = confidentFinal
    ? "apurado_automaticamente"
    : result.match_found && result.status === "jogo_em_andamento"
      ? "jogo_em_andamento"
      : result.match_found && result.status === "aguardando_jogo"
        ? "aguardando_jogo"
        : "requer_revisao_manual";

  const updates: any = {
    result_source: FIFA_FIXTURES_URL,
    result_checked_at: new Date().toISOString(),
    result_payload_json: result,
    apuration_status: newStatus,
    match_status: result.status,
  };

  if (confidentFinal) {
    updates.home_score = result.home_score;
    updates.away_score = result.away_score;
    updates.is_draw = result.home_score === result.away_score;
    updates.winner_team =
      result.home_score > result.away_score
        ? ch.home_team
        : result.away_score > result.home_score
          ? ch.away_team
          : "";
    updates.result_confirmed_at = new Date().toISOString();
  }

  await supabaseAdmin.from("challenges").update(updates).eq("id", ch.id);
  await supabaseAdmin.from("challenge_results_log").insert({
    challenge_id: ch.id,
    source: FIFA_FIXTURES_URL,
    confidence: result.confidence,
    status_at_check: newStatus,
    payload: result,
  });

  if (confidentFinal) {
    await apurarEDistribuir(ch.id);
  }

  return { newStatus, confidentFinal };
}

async function apurarEDistribuir(challengeId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: ch } = await supabaseAdmin
    .from("challenges")
    .select("*")
    .eq("id", challengeId)
    .single();
  if (!ch || ch.home_score == null || ch.away_score == null) return;

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

  for (const p of palpites) {
    let correct = false;
    let reason = "";
    switch (p.kind) {
      case "vencedor":
        correct = !isDraw && p.option_value === winnerTeam;
        reason = `acertou o vencedor (${winnerTeam})`;
        break;
      case "empate":
        correct = isDraw;
        reason = "acertou o empate";
        break;
      case "placar_exato":
        correct = p.predicted_home_score === home && p.predicted_away_score === away;
        reason = `acertou o placar exato ${home}×${away}`;
        break;
      case "mais_2":
        correct = total > 2;
        reason = `acertou +2 gols (${total})`;
        break;
      case "menos_2":
        correct = total < 2;
        reason = `acertou -2 gols (${total})`;
        break;
      case "ambos_marcam":
        correct = home > 0 && away > 0;
        reason = "acertou ambos marcam";
        break;
    }
    await supabaseAdmin
      .from("palpites")
      .update({ is_correct: correct, evaluated_at: new Date().toISOString() })
      .eq("id", p.id);
    if (correct) {
      await supabaseAdmin.from("challenge_winners").upsert(
        {
          challenge_id: ch.id,
          user_id: p.user_id,
          palpite_id: p.id,
          reason,
          tokens: 0,
          status: ch.is_physical_prize ? "aguardando_premio_fisico" : "pendente",
        },
        { onConflict: "palpite_id" },
      );
    } else {
      await supabaseAdmin.from("challenge_winners").delete().eq("palpite_id", p.id);
    }
  }

  // Auto release tokens only for non-physical prizes
  if (!ch.is_physical_prize) {
    const pendRes = await supabaseAdmin
      .from("challenge_winners")
      .select("*")
      .eq("challenge_id", ch.id)
      .eq("status", "pendente");
    const pending = pendRes.data ?? [];
    if (pending.length > 0) {
      const pool = Math.max(ch.prize_pool || 0, 0);
      const perWinner =
        pool > 0
          ? Math.floor(pool / pending.length)
          : Math.max(ch.entry_fee || 100, 100);
      for (const w of pending) {
        await supabaseAdmin
          .from("challenge_winners")
          .update({
            tokens: perWinner,
            status: "liberado",
            released_at: new Date().toISOString(),
          })
          .eq("id", w.id);
        await supabaseAdmin.from("token_transactions").insert({
          user_id: w.user_id,
          challenge_id: ch.id,
          winner_id: w.id,
          delta: perWinner,
          reason: `Você ganhou ${perWinner} tokens — ${w.reason} em ${ch.home_team} ${ch.home_score}×${ch.away_score} ${ch.away_team}`,
        });
      }
    }
  }
}
