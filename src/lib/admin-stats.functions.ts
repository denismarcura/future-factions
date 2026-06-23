import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
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

export type AdminDashboard = {
  kpis: {
    users: number;
    companies: number;
    activeChallenges: number;
    closedChallenges: number;
    totalPredictions: number;
    tokensDistributed: number;
    dau: number;
    wau: number;
    mau: number;
    newUsers7d: number;
    newUsers30d: number;
  };
  topChallenges: { id: string; title: string; predictions: number }[];
  topCompanies: { name: string; challenges: number }[];
  series: {
    users: { date: string; value: number }[];
    predictions: { date: string; value: number }[];
    tokens: { date: string; value: number }[];
    signups: { date: string; value: number }[];
  };
};

function daysBack(n: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

function bucketByDay(rows: { d: string }[], days = 30) {
  const counts = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - i);
    counts.set(d.toISOString().slice(0, 10), 0);
  }
  for (const r of rows) {
    const k = r.d.slice(0, 10);
    if (counts.has(k)) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([date, value]) => ({ date, value }));
}

function bucketSumByDay(rows: { d: string; v: number }[], days = 30) {
  const counts = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - i);
    counts.set(d.toISOString().slice(0, 10), 0);
  }
  for (const r of rows) {
    const k = r.d.slice(0, 10);
    if (counts.has(k)) counts.set(k, (counts.get(k) ?? 0) + r.v);
  }
  return Array.from(counts.entries()).map(([date, value]) => ({ date, value }));
}

export const getAdminDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminDashboard> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin;

    const since30 = daysBack(30).toISOString();
    const since7 = daysBack(7).toISOString();
    const since1 = daysBack(1).toISOString();

    const [
      profilesCount,
      profilesRecent,
      challengesAll,
      corpAll,
      palpitesRecent,
      palpitesTotalCount,
      tokensRecent,
    ] = await Promise.all([
      sb.from("profiles").select("id", { count: "exact", head: true }),
      sb.from("profiles").select("created_at").gte("created_at", since30),
      sb.from("challenges").select("id, title, closes_at"),
      sb.from("corporate_challenges").select("company_name, status"),
      sb.from("palpites").select("user_id, challenge_id, created_at").gte("created_at", since30),
      sb.from("palpites").select("id", { count: "exact", head: true }),
      sb.from("token_transactions").select("delta, created_at").gte("created_at", since30),
    ]);

    const users = profilesCount.count ?? 0;
    const signups = (profilesRecent.data ?? []).map((r) => ({ d: r.created_at as string }));
    const newUsers7d = signups.filter((r) => r.d >= since7).length;
    const newUsers30d = signups.length;

    const challenges = challengesAll.data ?? [];
    const now = Date.now();
    const activeChallenges = challenges.filter(
      (c) => !c.closes_at || new Date(c.closes_at).getTime() > now,
    ).length;
    const closedChallenges = challenges.length - activeChallenges;

    const corp = corpAll.data ?? [];
    const companies = new Set(
      corp.map((r) => (r.company_name ?? "").trim().toLowerCase()).filter(Boolean),
    ).size;

    const palpRecent = (palpitesRecent.data ?? []).map((r) => ({
      d: r.created_at as string,
      user_id: r.user_id as string,
    }));
    const dau = new Set(palpRecent.filter((r) => r.d >= since1).map((r) => r.user_id)).size;
    const wau = new Set(palpRecent.filter((r) => r.d >= since7).map((r) => r.user_id)).size;
    const mau = new Set(palpRecent.map((r) => r.user_id)).size;
    const totalPredictions = palpitesTotal.count ?? 0;

    // top challenges
    const palpByChallenge = new Map<string, number>();
    for (const r of palpitesTotal.data ?? []) {
      const k = r.challenge_id as string;
      palpByChallenge.set(k, (palpByChallenge.get(k) ?? 0) + 1);
    }
    const topChallenges = challenges
      .map((c) => ({ id: c.id as string, title: c.title as string, predictions: palpByChallenge.get(c.id as string) ?? 0 }))
      .sort((a, b) => b.predictions - a.predictions)
      .slice(0, 5);

    const compMap = new Map<string, number>();
    for (const r of corp) {
      const n = (r.company_name ?? "").trim();
      if (!n) continue;
      compMap.set(n, (compMap.get(n) ?? 0) + 1);
    }
    const topCompanies = Array.from(compMap.entries())
      .map(([name, challenges]) => ({ name, challenges }))
      .sort((a, b) => b.challenges - a.challenges)
      .slice(0, 5);

    const tokensDistributed = (tokensTotal.data ?? []).reduce(
      (s, r) => s + Math.max(0, (r.delta as number) ?? 0),
      0,
    );

    const tokensRecentRows = (tokensRecent.data ?? []).map((r) => ({
      d: r.created_at as string,
      v: Math.max(0, (r.delta as number) ?? 0),
    }));

    return {
      kpis: {
        users,
        companies,
        activeChallenges,
        closedChallenges,
        totalPredictions,
        tokensDistributed,
        dau,
        wau,
        mau,
        newUsers7d,
        newUsers30d,
      },
      topChallenges,
      topCompanies,
      series: {
        users: bucketByDay(signups),
        predictions: bucketByDay(palpRecent.map((r) => ({ d: r.d }))),
        tokens: bucketSumByDay(tokensRecentRows),
        signups: bucketByDay(signups),
      },
    };
  });
