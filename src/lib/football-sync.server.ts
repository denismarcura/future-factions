// Server-only helpers that perform sync + auto-create challenges.
// Loaded dynamically inside handlers so it never ships to the browser bundle.

import { listMatches, mapStatus, utcToBrasil, type FdListOpts, type FdMatch } from "./football-data.server";

export type SyncResult = {
  ok: boolean;
  imported: number;
  updated: number;
  finalized: number;
  http_status: number;
  endpoint: string;
  error?: string;
};

export async function syncCompetitionMatches(
  code: string,
  opts: FdListOpts & { autoCreateChallenges?: boolean; autoUpdateResults?: boolean } = {},
): Promise<SyncResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const started = Date.now();
  const { autoCreateChallenges = false, autoUpdateResults = true, ...listOpts } = opts;

  const res = await listMatches(code, listOpts);
  const endpoint = `/competitions/${code}/matches`;

  if (!res.ok || !res.data) {
    await supabaseAdmin.from("football_sync_logs").insert({
      competition_code: code,
      endpoint,
      http_status: res.status,
      imported: 0,
      updated: 0,
      error_message: res.error ?? "unknown",
      duration_ms: Date.now() - started,
    });
    return {
      ok: false,
      imported: 0,
      updated: 0,
      finalized: 0,
      http_status: res.status,
      endpoint,
      error: res.error,
    };
  }

  const matches = res.data.matches ?? [];
  const competitionName = res.data.competition?.name ?? null;

  let imported = 0;
  let updated = 0;
  let finalized = 0;

  // Load existing rows in batch
  const externalIds = matches.map((m) => String(m.id));
  const existingRes = externalIds.length
    ? await supabaseAdmin
        .from("football_matches")
        .select("id, external_match_id, status, linked_challenge_id")
        .in("external_match_id", externalIds)
    : { data: [] as any[] };
  const existingMap = new Map<string, any>();
  for (const r of (existingRes.data ?? []) as any[]) existingMap.set(r.external_match_id, r);

  for (const m of matches) {
    const externalId = String(m.id);
    const row = {
      external_match_id: externalId,
      competition_code: code,
      competition_name: competitionName,
      season: listOpts.season ?? null,
      matchday: m.matchday ?? null,
      stage: m.stage ?? null,
      group_name: m.group ?? null,
      utc_date: m.utcDate,
      data_hora_brasil: utcToBrasil(m.utcDate),
      home_team_id: m.homeTeam?.id ?? null,
      home_team_name: m.homeTeam?.name ?? null,
      home_team_crest: m.homeTeam?.crest ?? null,
      away_team_id: m.awayTeam?.id ?? null,
      away_team_name: m.awayTeam?.name ?? null,
      away_team_crest: m.awayTeam?.crest ?? null,
      status: m.status,
      score_home: m.score?.fullTime?.home ?? null,
      score_away: m.score?.fullTime?.away ?? null,
      winner: m.score?.winner ?? null,
      last_updated_api: m.lastUpdated ?? new Date().toISOString(),
    };

    const existing = existingMap.get(externalId);
    if (!existing) {
      const ins = await supabaseAdmin.from("football_matches").insert(row).select("id").single();
      if (!ins.error) imported++;
      // Auto-create challenge
      if (autoCreateChallenges && ins.data?.id) {
        const challengeId = await createChallengeForMatch(externalId, m, competitionName);
        if (challengeId) {
          await supabaseAdmin
            .from("football_matches")
            .update({ linked_challenge_id: challengeId })
            .eq("id", ins.data.id);
        }
      }
    } else {
      const wasFinished = existing.status === "FINISHED";
      const becameFinished = !wasFinished && m.status === "FINISHED";
      const upd = await supabaseAdmin
        .from("football_matches")
        .update(row)
        .eq("external_match_id", externalId);
      if (!upd.error) updated++;
      if (becameFinished && autoUpdateResults) {
        if (existing.linked_challenge_id) {
          await finalizeChallenge(existing.linked_challenge_id, m);
          finalized++;
        }
      }
    }
  }

  await supabaseAdmin
    .from("football_competitions")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("code", code);

  await supabaseAdmin.from("football_sync_logs").insert({
    competition_code: code,
    endpoint,
    http_status: res.status,
    imported,
    updated,
    duration_ms: Date.now() - started,
  });

  return { ok: true, imported, updated, finalized, http_status: res.status, endpoint };
}

export async function createChallengeForMatch(
  externalId: string,
  match: FdMatch,
  competitionName: string | null,
): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Skip if a challenge already exists for this external match id
  const dup = await supabaseAdmin
    .from("challenges")
    .select("id")
    .eq("external_match_id", externalId)
    .maybeSingle();
  if (dup.data?.id) return dup.data.id;

  const kickoff = new Date(match.utcDate);
  const closesAt = new Date(kickoff.getTime() - 30 * 60 * 1000).toISOString();
  const home = match.homeTeam?.name ?? "Casa";
  const away = match.awayTeam?.name ?? "Fora";
  const title = `Palpite: ${home} x ${away}${competitionName ? ` — ${competitionName}` : ""}`;
  const description = `Qual será o resultado do jogo? Vitória ${home}, Empate ou Vitória ${away}?`;

  const ins = await supabaseAdmin
    .from("challenges")
    .insert({
      title,
      description,
      category: competitionName ?? "Futebol",
      entry_fee: 0,
      prize_pool: 0,
      closes_at: closesAt,
      is_physical_prize: false,
      home_team: home,
      away_team: away,
      match_kickoff: match.utcDate,
      match_date: match.utcDate.slice(0, 10),
      match_status: mapStatus(match.status),
      source: "football_data",
      external_match_id: externalId,
    })
    .select("id")
    .single();

  if (ins.error) {
    console.error("createChallengeForMatch failed", ins.error);
    return null;
  }
  return ins.data?.id ?? null;
}

export async function finalizeChallenge(challengeId: string, match: FdMatch) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const home = match.score?.fullTime?.home ?? null;
  const away = match.score?.fullTime?.away ?? null;
  const winner =
    match.score?.winner === "HOME_TEAM"
      ? match.homeTeam?.name ?? null
      : match.score?.winner === "AWAY_TEAM"
        ? match.awayTeam?.name ?? null
        : null;
  await supabaseAdmin
    .from("challenges")
    .update({
      match_status: "encerrado",
      home_score: home,
      away_score: away,
      winner_team: winner,
      is_draw: match.score?.winner === "DRAW",
      result_source: "football-data.org",
      result_checked_at: new Date().toISOString(),
      result_confirmed_at: new Date().toISOString(),
      result_payload_json: { source: "football-data", match } as any,
    })
    .eq("id", challengeId);
}
