import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type Top100Entry = {
  rank: number;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  challenges_count: number;
  total_participants: number;
  points: number;
};

function publicClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export function pointsForParticipants(p: number): number {
  if (p >= 100 && p > 100) return 500;
  if (p >= 100) return 50;
  if (p >= 50) return 20;
  if (p >= 20) return 10;
  if (p >= 10) return 4;
  return 0;
}

export const getTop100 = createServerFn({ method: "GET" })
  .inputValidator((d: { monthKey?: string } | undefined) => d ?? {})
  .handler(async ({ data }) => {
    // top100_snapshots is no longer publicly readable; use admin client server-side.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin;
    let monthKey = data.monthKey;
    if (!monthKey) {
      const { data: latest } = await sb
        .from("top100_snapshots" as never)
        .select("month_key")
        .order("month_key", { ascending: false })
        .limit(1);
      monthKey = (latest?.[0] as { month_key?: string } | undefined)?.month_key;
    }
    if (!monthKey) return { monthKey: null, entries: [] as Top100Entry[] };
    const { data: rows, error } = await sb
      .from("top100_snapshots" as never)
      .select("rank, user_id, challenges_count, total_participants, points")
      .eq("month_key", monthKey)
      .order("rank", { ascending: true })
      .limit(100);
    if (error) throw new Error(error.message);
    const ids = (rows ?? []).map((r: { user_id: string }) => r.user_id);
    const { data: profs } = ids.length
      ? await sb.from("profiles").select("id, full_name, avatar_url").in("id", ids)
      : { data: [] as Array<{ id: string; full_name: string | null; avatar_url: string | null }> };

    const map = new Map((profs ?? []).map((p) => [p.id, p]));
    const entries: Top100Entry[] = (rows ?? []).map((r: { rank: number; user_id: string; challenges_count: number; total_participants: number; points: number }) => ({
      rank: r.rank,
      user_id: r.user_id,
      challenges_count: r.challenges_count,
      total_participants: r.total_participants,
      points: r.points,
      full_name: map.get(r.user_id)?.full_name ?? null,
      avatar_url: map.get(r.user_id)?.avatar_url ?? null,
    }));
    return { monthKey, entries };
  });
