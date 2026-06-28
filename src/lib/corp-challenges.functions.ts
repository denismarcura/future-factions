import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CorpChallengeRecord = {
  id: string;
  ownerId: string | null;
  title: string;
  companyName: string | null;
  category: string | null;
  subcategory: string | null;
  description: string | null;
  subs: { id: string; question: string; options: string[] }[];
  prizeName: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  instagramArts: string[];
  tiebreaker: string | null;
  regulation: string | null;
  inviteRewardText: string | null;
  missions: CorporateMission[];
  startsAt: string;
  endsAt: string | null;
  status: string;
  participants: number;
  createdAt: string;
};

export type CorporateMission = {
  id: string;
  sponsorName: string;
  platform: string;
  actionType: string;
  title: string;
  link: string;
  tokens: number;
};

function normalizeMission(value: unknown, index: number, companyName?: string | null): CorporateMission | null {
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return null;
    const link = text.match(/https?:\/\/\S+/)?.[0] ?? text.replace(/^Seguir Instagram\s*/i, "").trim();
    return {
      id: `legacy-${index}`,
      sponsorName: companyName || "Empresa",
      platform: "instagram",
      actionType: "follow",
      title: "Seguir Instagram",
      link,
      tokens: 50,
    };
  }
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<CorporateMission>;
  if (!raw.link || !raw.platform) return null;
  return {
    id: String(raw.id ?? `mission-${index}`),
    sponsorName: String(raw.sponsorName ?? companyName ?? "Empresa"),
    platform: String(raw.platform),
    actionType: String(raw.actionType ?? "follow"),
    title: String(raw.title ?? "Abrir missão"),
    link: String(raw.link),
    tokens: Number(raw.tokens ?? 50),
  };
}

type Row = Database["public"]["Tables"]["corporate_challenges"]["Row"];

function rowToRecord(r: Row): CorpChallengeRecord {
  return {
    id: r.id,
    ownerId: r.owner_id,
    title: r.title,
    companyName: r.company_name,
    category: r.category,
    subcategory: r.subcategory,
    description: r.description,
    subs: (r.subs as CorpChallengeRecord["subs"]) ?? [],
    prizeName: r.prize_name,
    logoUrl: r.logo_url,
    bannerUrl: r.banner_url,
    instagramArts: (r.instagram_arts as string[]) ?? [],
    tiebreaker: r.tiebreaker,
    regulation: r.regulation,
    inviteRewardText: r.invite_reward_text,
    missions: ((r.missions as unknown[]) ?? [])
      .map((m, i) => normalizeMission(m, i, r.company_name))
      .filter((m): m is CorporateMission => Boolean(m)),
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    status: r.status,
    participants: r.participants,
    createdAt: r.created_at,
  };
}

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

const subSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(z.string()),
});

const corporateMissionSchema = z.object({
  id: z.string(),
  sponsorName: z.string(),
  platform: z.string(),
  actionType: z.string(),
  title: z.string(),
  link: z.string(),
  tokens: z.number(),
});

const createSchema = z.object({
  id: z.string().min(3),
  title: z.string().min(1),
  companyName: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  description: z.string().optional(),
  subs: z.array(subSchema),
  prizeName: z.string().optional(),
  logoUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  instagramArts: z.array(z.string()).optional(),
  tiebreaker: z.string().optional(),
  regulation: z.string().optional(),
  inviteRewardText: z.string().optional(),
  missions: z.array(z.union([z.string(), corporateMissionSchema])).optional(),
  endsAt: z.string().optional(),
});

export const createCorpChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("corporate_challenges")
      .insert({
        id: data.id,
        owner_id: userId,
        title: data.title,
        company_name: data.companyName ?? null,
        category: data.category ?? null,
        subcategory: data.subcategory ?? null,
        description: data.description ?? null,
        subs: data.subs,
        prize_name: data.prizeName ?? null,
        logo_url: data.logoUrl ?? null,
        banner_url: data.bannerUrl ?? null,
        instagram_arts: data.instagramArts ?? [],
        tiebreaker: data.tiebreaker ?? null,
        regulation: data.regulation ?? null,
        invite_reward_text: data.inviteRewardText ?? null,
        missions: data.missions ?? [],
        ends_at: data.endsAt ? new Date(data.endsAt).toISOString() : null,
        status: "ativo",
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return rowToRecord(row as Row);
  });

export const getCorpChallenge = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: row, error } = await sb
      .from("corporate_challenges")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? rowToRecord(row as Row) : null;
  });

export const listLatestCorpChallenges = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ limit: z.number().int().positive().max(50).optional() }).parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: rows, error } = await sb
      .from("corporate_challenges")
      .select("*")
      .eq("status", "ativo")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (rows ?? [])
      .map((r) => rowToRecord(r as Row))
      .slice(0, data.limit ?? 12);
  });

export const searchCorpChallenges = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ q: z.string().min(1).max(80), limit: z.number().int().positive().max(20).optional() }).parse(input),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    // Escape % and _ wildcards, plus commas which break the .or() list
    const safe = data.q.replace(/[,%_]/g, " ").trim();
    if (!safe) return [];
    const like = `%${safe}%`;
    const { data: rows, error } = await sb
      .from("corporate_challenges")
      .select("*")
      .or(
        [
          `title.ilike.${like}`,
          `company_name.ilike.${like}`,
          `category.ilike.${like}`,
          `subcategory.ilike.${like}`,
          `description.ilike.${like}`,
          `prize_name.ilike.${like}`,
        ].join(","),
      )
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 10);
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => rowToRecord(r as Row));
  });
