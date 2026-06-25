import { createServerFn } from "@tanstack/react-start";

export type StreakPeriod = "7d" | "30d" | "total";

export type StreakRankingEntry = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  maxStreak: number;
  totalOpens: number;
  totalTokens: number;
  lastOpenAt: string | null;
};

export const getMysteryBoxRanking = createServerFn({ method: "GET" })
  .inputValidator((input: { period: StreakPeriod }) => input)
  .handler(async ({ data }): Promise<StreakRankingEntry[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let sinceIso: string | null = null;
    if (data.period === "7d") sinceIso = new Date(Date.now() - 7 * 86400_000).toISOString();
    else if (data.period === "30d") sinceIso = new Date(Date.now() - 30 * 86400_000).toISOString();

    let q = supabaseAdmin
      .from("mystery_box_opens")
      .select("user_id, opened_at, streak_day, tokens_awarded")
      .order("opened_at", { ascending: false })
      .limit(10000);
    if (sinceIso) q = q.gte("opened_at", sinceIso);

    const { data: rows, error } = await q;
    if (error) throw error;

    const map = new Map<string, StreakRankingEntry>();
    for (const r of (rows ?? []) as Array<{
      user_id: string;
      opened_at: string;
      streak_day: number;
      tokens_awarded: number;
    }>) {
      const cur = map.get(r.user_id);
      if (!cur) {
        map.set(r.user_id, {
          userId: r.user_id,
          name: "",
          avatarUrl: null,
          maxStreak: r.streak_day,
          totalOpens: 1,
          totalTokens: r.tokens_awarded,
          lastOpenAt: r.opened_at,
        });
      } else {
        cur.maxStreak = Math.max(cur.maxStreak, r.streak_day);
        cur.totalOpens += 1;
        cur.totalTokens += r.tokens_awarded;
        if (!cur.lastOpenAt || r.opened_at > cur.lastOpenAt) cur.lastOpenAt = r.opened_at;
      }
    }

    const ids = Array.from(map.keys());
    if (ids.length > 0) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", ids);
      for (const p of (profs ?? []) as Array<{ id: string; full_name: string | null; avatar_url: string | null }>) {
        const e = map.get(p.id);
        if (e) {
          e.name = p.full_name ?? "Palpiteiro";
          e.avatarUrl = p.avatar_url;
        }
      }
    }

    return Array.from(map.values())
      .sort((a, b) => b.maxStreak - a.maxStreak || b.totalOpens - a.totalOpens || b.totalTokens - a.totalTokens)
      .slice(0, 100)
      .map((e) => ({ ...e, name: e.name || "Palpiteiro" }));
  });
