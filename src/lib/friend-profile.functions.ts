import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function publicClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const getFriendProfile = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => z.object({ ref: z.string().min(4).max(40) }).parse(i))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const ref = data.ref.toLowerCase();

    // Resolve user by uuid prefix (or full uuid)
    const { data: profile } = await sb
      .from("profiles")
      .select("id, full_name, avatar_url, cidade, estado, created_at, instagram")
      .ilike("id", `${ref}%`)
      .limit(1)
      .maybeSingle();

    if (!profile) return null;
    const userId = profile.id as string;

    // Created challenges
    const { data: created } = await sb
      .from("challenges")
      .select("id, title, category, image_url, closes_at, prize_pool, apuration_status, match_status")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    const createdOpen = (created ?? []).filter(
      (c: any) => !c.closes_at || new Date(c.closes_at) > new Date(),
    );
    const createdClosed = (created ?? []).filter(
      (c: any) => c.closes_at && new Date(c.closes_at) <= new Date(),
    );

    // Participated (distinct challenges where user has a palpite)
    const { data: palpites } = await sb
      .from("palpites")
      .select("challenge_id")
      .eq("user_id", userId)
      .limit(500);
    const participatedIds = Array.from(new Set((palpites ?? []).map((p: any) => p.challenge_id)));
    let participated: any[] = [];
    if (participatedIds.length) {
      const { data: cs } = await sb
        .from("challenges")
        .select("id, title, category, image_url, closes_at")
        .in("id", participatedIds)
        .limit(50);
      participated = cs ?? [];
    }

    // Completed results (where user won)
    const { data: wins } = await sb
      .from("challenge_winners")
      .select("id, challenge_id, tokens, status, created_at, challenges(title, image_url, category)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    // Tokens earned (positive deltas)
    const { data: txs } = await sb
      .from("token_transactions")
      .select("delta")
      .eq("user_id", userId)
      .gt("delta", 0);
    const tokensEarned = (txs ?? []).reduce((s: number, t: any) => s + (t.delta ?? 0), 0);

    // Friends count = distinct users who have made palpites in challenges owned by this user
    let friendsCount = 0;
    if ((created ?? []).length > 0) {
      const ownedIds = (created ?? []).map((c: any) => c.id);
      const { data: parts } = await sb
        .from("palpites")
        .select("user_id")
        .in("challenge_id", ownedIds)
        .neq("user_id", userId)
        .limit(2000);
      friendsCount = new Set((parts ?? []).map((p: any) => p.user_id)).size;
    }

    // Public corporate opportunities (open)
    const { data: corp } = await sb
      .from("corporate_challenges")
      .select("id, title, company_name, category, prize_name, banner_url, logo_url, ends_at, status")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(12);

    return {
      profile,
      stats: {
        tokensEarned,
        friendsCount,
        createdCount: created?.length ?? 0,
        participatedCount: participatedIds.length,
        winsCount: wins?.length ?? 0,
      },
      createdOpen,
      createdClosed,
      participated,
      wins: wins ?? [],
      corpOpportunities: corp ?? [],
    };
  });

export const getChallengeInvite = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => z.object({ id: z.string().min(4).max(64) }).parse(i))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: ch } = await sb
      .from("challenges")
      .select("id, title, image_url, category, prize_pool, closes_at, owner_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!ch) return null;
    let ownerName: string | null = null;
    if (ch.owner_id) {
      const { data: p } = await sb
        .from("profiles")
        .select("full_name")
        .eq("id", ch.owner_id)
        .maybeSingle();
      ownerName = (p as any)?.full_name ?? null;
    }
    return { ...ch, owner_name: ownerName };
  });
