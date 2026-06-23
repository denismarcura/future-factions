import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type RatingSummary = { challengeId: string; avg: number; count: number; mine?: number | null };

function publicClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const getRatings = createServerFn({ method: "GET" })
  .inputValidator((d: { ids: string[] }) => d)
  .handler(async ({ data }) => {
    if (!data.ids.length) return [] as RatingSummary[];
    const sb = publicClient();
    const { data: rows, error } = await sb
      .from("challenge_ratings" as never)
      .select("challenge_id, rating")
      .in("challenge_id", data.ids);
    if (error) throw new Error(error.message);
    const byId = new Map<string, { sum: number; count: number }>();
    for (const r of (rows ?? []) as Array<{ challenge_id: string; rating: number }>) {
      const cur = byId.get(r.challenge_id) ?? { sum: 0, count: 0 };
      cur.sum += r.rating;
      cur.count += 1;
      byId.set(r.challenge_id, cur);
    }
    return data.ids.map<RatingSummary>((id) => {
      const v = byId.get(id);
      return { challengeId: id, avg: v ? v.sum / v.count : 0, count: v?.count ?? 0 };
    });
  });

export const rateChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { challengeId: string; rating: number }) => {
    if (d.rating < 1 || d.rating > 5) throw new Error("Nota deve ser de 1 a 5");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("challenge_ratings" as never)
      .upsert(
        { challenge_id: data.challengeId, user_id: context.userId, rating: data.rating } as never,
        { onConflict: "challenge_id,user_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyRating = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { challengeId: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("challenge_ratings" as never)
      .select("rating")
      .eq("challenge_id", data.challengeId)
      .eq("user_id", context.userId)
      .maybeSingle();
    return { rating: (row as { rating: number } | null)?.rating ?? null };
  });
