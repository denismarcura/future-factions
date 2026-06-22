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

export type CorpStats = {
  companies: number;
  activeChallenges: number;
  closedChallenges: number;
  totalParticipants: number;
};

export const getCorpStats = createServerFn({ method: "GET" }).handler(async (): Promise<CorpStats> => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("corporate_challenges")
    .select("status, participants, company_name");
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  const companies = new Set(
    rows.map((r) => (r.company_name ?? "").trim().toLowerCase()).filter(Boolean),
  );
  return {
    companies: companies.size,
    activeChallenges: rows.filter((r) => r.status === "ativo").length,
    closedChallenges: rows.filter((r) => r.status === "encerrado").length,
    totalParticipants: rows.reduce((s, r) => s + (r.participants ?? 0), 0),
  };
});
