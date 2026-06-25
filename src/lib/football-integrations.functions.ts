import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export const listFootballCompetitions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("football_competitions")
      .select("*")
      .order("code", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertFootballCompetition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      id?: string;
      code: string;
      name: string;
      season?: number | null;
      active?: boolean;
      sync_frequency?: string;
      auto_create_challenges?: boolean;
      auto_update_results?: boolean;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const payload = {
      code: data.code,
      name: data.name,
      season: data.season ?? null,
      active: data.active ?? false,
      sync_frequency: data.sync_frequency ?? "daily",
      auto_create_challenges: data.auto_create_challenges ?? false,
      auto_update_results: data.auto_update_results ?? true,
    };
    if (data.id) {
      const { error } = await context.supabase
        .from("football_competitions")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase
        .from("football_competitions")
        .upsert(payload, { onConflict: "code" });
      if (error) throw new Error(error.message);
    }
    return { ok: true as const };
  });

export const syncFootballCompetition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: { code: string; season?: number; dateFrom?: string; dateTo?: string }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { syncCompetitionMatches } = await import("@/lib/football-sync.server");
    // Read competition flags
    const { data: comp } = await context.supabase
      .from("football_competitions")
      .select("auto_create_challenges, auto_update_results, season")
      .eq("code", data.code)
      .maybeSingle();
    const result = await syncCompetitionMatches(data.code, {
      season: data.season ?? comp?.season ?? undefined,
      dateFrom: data.dateFrom,
      dateTo: data.dateTo,
      autoCreateChallenges: comp?.auto_create_challenges ?? false,
      autoUpdateResults: comp?.auto_update_results ?? true,
    });
    return result;
  });

export const refreshFootballMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { externalId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { getMatch, mapStatus, utcToBrasil } = await import("@/lib/football-data.server");
    const { finalizeChallenge } = await import("@/lib/football-sync.server");
    const res = await getMatch(data.externalId);
    if (!res.ok || !res.data?.match) {
      throw new Error(res.error ?? "Falha ao consultar API");
    }
    const m = res.data.match;
    const { data: existing } = await context.supabase
      .from("football_matches")
      .select("status, linked_challenge_id")
      .eq("external_match_id", data.externalId)
      .maybeSingle();
    await context.supabase
      .from("football_matches")
      .update({
        status: m.status,
        score_home: m.score?.fullTime?.home ?? null,
        score_away: m.score?.fullTime?.away ?? null,
        winner: m.score?.winner ?? null,
        utc_date: m.utcDate,
        data_hora_brasil: utcToBrasil(m.utcDate),
        last_updated_api: new Date().toISOString(),
      })
      .eq("external_match_id", data.externalId);
    if (m.status === "FINISHED" && existing?.linked_challenge_id && existing.status !== "FINISHED") {
      await finalizeChallenge(existing.linked_challenge_id, m);
    }
    return { ok: true, status: mapStatus(m.status) };
  });

export const createChallengeForFootballMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { externalId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { getMatch } = await import("@/lib/football-data.server");
    const { createChallengeForMatch } = await import("@/lib/football-sync.server");
    const { data: row } = await context.supabase
      .from("football_matches")
      .select("competition_name, linked_challenge_id")
      .eq("external_match_id", data.externalId)
      .maybeSingle();
    if (row?.linked_challenge_id) return { ok: true, challengeId: row.linked_challenge_id };
    const res = await getMatch(data.externalId);
    if (!res.ok || !res.data?.match) throw new Error(res.error ?? "Falha");
    const id = await createChallengeForMatch(data.externalId, res.data.match, row?.competition_name ?? null);
    if (id) {
      await context.supabase
        .from("football_matches")
        .update({ linked_challenge_id: id })
        .eq("external_match_id", data.externalId);
    }
    return { ok: !!id, challengeId: id };
  });

export const listFootballMatches = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      competition?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
      offset?: number;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = context.supabase
      .from("football_matches")
      .select("*", { count: "exact" })
      .order("utc_date", { ascending: false });
    if (data.competition) q = q.eq("competition_code", data.competition);
    if (data.status) q = q.eq("status", data.status);
    if (data.dateFrom) q = q.gte("utc_date", data.dateFrom);
    if (data.dateTo) q = q.lte("utc_date", data.dateTo);
    const limit = data.limit ?? 50;
    const offset = data.offset ?? 0;
    q = q.range(offset, offset + limit - 1);
    const { data: rows, error, count } = await q;
    if (error) throw new Error(error.message);
    return { rows: rows ?? [], total: count ?? 0 };
  });

export const listFootballSyncLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("football_sync_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getFootballSyncDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const since7d = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

    const [compsRes, logsRes, errorsRes] = await Promise.all([
      context.supabase
        .from("football_competitions")
        .select("code, name, active, season, last_synced_at, auto_create_challenges, auto_update_results")
        .order("code"),
      context.supabase
        .from("football_sync_logs")
        .select("competition_code, http_status, imported, updated, error_message, created_at")
        .gte("created_at", since7d),
      context.supabase
        .from("football_sync_logs")
        .select("competition_code, http_status, error_message, endpoint, created_at")
        .not("error_message", "is", null)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const logs7d = logsRes.data ?? [];
    const byComp = new Map<string, {
      imported24h: number; updated24h: number; imported7d: number; updated7d: number;
      errors7d: number; calls7d: number; lastLogAt: string | null;
    }>();
    const totals = { imported24h: 0, updated24h: 0, imported7d: 0, updated7d: 0, errors7d: 0, calls7d: logs7d.length };

    for (const l of logs7d) {
      const code = l.competition_code ?? "—";
      const cur = byComp.get(code) ?? { imported24h: 0, updated24h: 0, imported7d: 0, updated7d: 0, errors7d: 0, calls7d: 0, lastLogAt: null };
      const isError = !!l.error_message || (l.http_status != null && l.http_status >= 400);
      cur.imported7d += l.imported ?? 0;
      cur.updated7d += l.updated ?? 0;
      cur.calls7d += 1;
      if (isError) cur.errors7d += 1;
      if (l.created_at >= since24h) {
        cur.imported24h += l.imported ?? 0;
        cur.updated24h += l.updated ?? 0;
      }
      if (!cur.lastLogAt || l.created_at > cur.lastLogAt) cur.lastLogAt = l.created_at;
      byComp.set(code, cur);

      totals.imported7d += l.imported ?? 0;
      totals.updated7d += l.updated ?? 0;
      if (isError) totals.errors7d += 1;
      if (l.created_at >= since24h) {
        totals.imported24h += l.imported ?? 0;
        totals.updated24h += l.updated ?? 0;
      }
    }

    const competitions = (compsRes.data ?? []).map((c: any) => ({
      ...c,
      stats: byComp.get(c.code) ?? { imported24h: 0, updated24h: 0, imported7d: 0, updated7d: 0, errors7d: 0, calls7d: 0, lastLogAt: null },
    }));

    return { competitions, totals, recentErrors: errorsRes.data ?? [] };
  });
