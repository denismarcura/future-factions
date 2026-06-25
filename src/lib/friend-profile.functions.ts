import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { inviteSlugFromProfile, normalizeInviteSlug } from "@/lib/invite-link";

function publicClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const getFriendProfile = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => z.object({ ref: z.string().min(3).max(40) }).parse(i))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const ref = normalizeInviteSlug(data.ref);

    // Resolve user by the new clean slug (domain.com.br/usuario), keeping
    // compatibility with old UUID-prefix links. Service role is used only here
    // to resolve public invite pages without exposing private columns below.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, avatar_url, cidade, estado, created_at, instagram, email, invite_slug")
      .order("created_at", { ascending: true })
      .limit(10000);

    const profile = (profiles ?? []).find((p: any) => {
      const storedSlug = normalizeInviteSlug(p.invite_slug);
      if (storedSlug && storedSlug === ref) return true;
      if (String(p.id).toLowerCase().startsWith(ref)) return true;
      return inviteSlugFromProfile({
        id: p.id,
        email: p.email,
        instagram: p.instagram,
        full_name: p.full_name,
      }) === ref;
    }) as any | undefined;

    if (!profile) return null;
    const userId = profile.id as string;
    const publicProfile = {
      id: profile.id,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      cidade: profile.cidade,
      estado: profile.estado,
      created_at: profile.created_at,
      instagram: profile.instagram,
      invite_slug: normalizeInviteSlug(profile.invite_slug) || inviteSlugFromProfile(profile),
    };

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

    // Completed results (where user won) — winners table is no longer anon-readable
    const { data: wins } = await supabaseAdmin
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
      profile: publicProfile,
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
    if (!ch) {
      const { data: corp } = await sb
        .from("corporate_challenges")
        .select("id, title, banner_url, logo_url, category, prize_name, ends_at, owner_id, company_name")
        .eq("id", data.id)
        .maybeSingle();
      if (!corp) return null;
      let ownerName: string | null = (corp as any).company_name ?? null;
      if ((corp as any).owner_id) {
        const { data: p } = await sb
          .from("profiles")
          .select("full_name")
          .eq("id", (corp as any).owner_id)
          .maybeSingle();
        ownerName = ownerName ?? ((p as any)?.full_name ?? null);
      }
      return {
        id: (corp as any).id,
        title: (corp as any).title,
        image_url: (corp as any).banner_url ?? (corp as any).logo_url,
        category: (corp as any).category,
        prize_pool: (corp as any).prize_name,
        closes_at: (corp as any).ends_at,
        owner_id: (corp as any).owner_id,
        owner_name: ownerName,
      };
    }
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
