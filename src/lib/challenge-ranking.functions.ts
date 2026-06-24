import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export interface RankingRow {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  position: number;
  points: number;
  tokens: number;
  acertos: number;
  reasons: string[];
  first_palpite_at: string | null;
}

export interface ChallengeRanking {
  challenge: {
    id: string;
    title: string;
    image_url: string | null;
    home_team: string | null;
    away_team: string | null;
    home_score: number | null;
    away_score: number | null;
    is_draw: boolean | null;
    winner_team: string | null;
    apuration_status: string;
    closes_at: string | null;
    match_kickoff: string | null;
    result_confirmed_at: string | null;
  } | null;
  participants_count: number;
  ranking: RankingRow[];
}

/**
 * Public per-challenge ranking with tiebreak.
 * Order: points desc -> acertos desc -> first_palpite_at asc.
 */
export const getChallengeRanking = createServerFn({ method: "GET" })
  .inputValidator((data: { challengeId: string }) => data)
  .handler(async ({ data }): Promise<ChallengeRanking> => {
    const sb = publicClient();

    const { data: ch } = await sb
      .from("challenges")
      .select(
        "id,title,image_url,home_team,away_team,home_score,away_score,is_draw,winner_team,apuration_status,closes_at,match_kickoff,result_confirmed_at",
      )
      .eq("id", data.challengeId)
      .maybeSingle();

    if (!ch) {
      return { challenge: null, participants_count: 0, ranking: [] };
    }

    const { data: palpites } = await sb
      .from("palpites")
      .select("user_id, created_at")
      .eq("challenge_id", data.challengeId);

    const participantIds = new Set<string>((palpites ?? []).map((p) => p.user_id));

    const firstPalpiteByUser = new Map<string, string>();
    for (const p of palpites ?? []) {
      const prev = firstPalpiteByUser.get(p.user_id);
      if (!prev || p.created_at < prev) firstPalpiteByUser.set(p.user_id, p.created_at);
    }

    // winners table is no longer anon-readable; use admin client server-side
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: winners } = await supabaseAdmin
      .from("challenge_winners")
      .select("user_id, tokens, reason")
      .eq("challenge_id", data.challengeId);


    type Agg = { tokens: number; acertos: number; reasons: string[] };
    const aggByUser = new Map<string, Agg>();
    for (const uid of participantIds) {
      aggByUser.set(uid, { tokens: 0, acertos: 0, reasons: [] });
    }
    for (const w of winners ?? []) {
      const cur = aggByUser.get(w.user_id) ?? { tokens: 0, acertos: 0, reasons: [] };
      cur.tokens += w.tokens || 0;
      cur.acertos += 1;
      if (w.reason) cur.reasons.push(w.reason);
      aggByUser.set(w.user_id, cur);
    }

    const userIds = Array.from(aggByUser.keys());
    let profiles: Array<{ id: string; full_name: string | null; avatar_url: string | null }> = [];
    if (userIds.length > 0) {
      const { data: profs } = await sb
        .from("profiles")
        .select("id,full_name,avatar_url")
        .in("id", userIds);
      profiles = profs ?? [];
    }
    const profMap = new Map(profiles.map((p) => [p.id, p]));

    // Pontuação == tokens ganhos no desafio (motor genérico).
    const rows: Omit<RankingRow, "position">[] = userIds.map((uid) => {
      const agg = aggByUser.get(uid)!;
      const prof = profMap.get(uid);
      return {
        user_id: uid,
        full_name: prof?.full_name ?? null,
        avatar_url: prof?.avatar_url ?? null,
        points: agg.tokens, // pontos == tokens ganhos
        tokens: agg.tokens,
        acertos: agg.acertos,
        reasons: agg.reasons,
        first_palpite_at: firstPalpiteByUser.get(uid) ?? null,
      };
    });

    rows.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.acertos !== a.acertos) return b.acertos - a.acertos;
      const ta = a.first_palpite_at ? Date.parse(a.first_palpite_at) : Infinity;
      const tb = b.first_palpite_at ? Date.parse(b.first_palpite_at) : Infinity;
      return ta - tb;
    });

    const ranking: RankingRow[] = rows.map((r, i) => ({ ...r, position: i + 1 }));

    return {
      challenge: ch,
      participants_count: participantIds.size,
      ranking,
    };
  });
