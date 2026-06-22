import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type WorldCupResultRow = {
  id: string;
  home_team: string;
  away_team: string;
  match_date: string;
  home_score: number;
  away_score: number;
  status: "agendado" | "em_andamento" | "encerrado";
  image_url: string | null;
  updated_at: string;
};

export const listWorldCupResults = createServerFn({ method: "GET" }).handler(
  async (): Promise<WorldCupResultRow[]> => {
    const sb = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { data, error } = await sb
      .from("world_cup_results")
      .select("id,home_team,away_team,match_date,home_score,away_score,status,image_url,updated_at")
      .order("match_date", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as WorldCupResultRow[];
  },
);

export const upsertWorldCupResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      id?: string;
      home_team: string;
      away_team: string;
      match_date: string;
      home_score: number;
      away_score: number;
      status: "agendado" | "em_andamento" | "encerrado";
      image_url?: string | null;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    if (data.id) {
      const { error } = await context.supabase
        .from("world_cup_results")
        .update({
          home_team: data.home_team,
          away_team: data.away_team,
          match_date: data.match_date,
          home_score: data.home_score,
          away_score: data.away_score,
          status: data.status,
          image_url: data.image_url ?? null,
        })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("world_cup_results").upsert(
        {
          home_team: data.home_team,
          away_team: data.away_team,
          match_date: data.match_date,
          home_score: data.home_score,
          away_score: data.away_score,
          status: data.status,
          image_url: data.image_url ?? null,
        },
        { onConflict: "home_team,away_team,match_date" },
      );
      if (error) throw new Error(error.message);
    }
    return { ok: true as const };
  });

export const deleteWorldCupResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { error } = await context.supabase
      .from("world_cup_results")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
