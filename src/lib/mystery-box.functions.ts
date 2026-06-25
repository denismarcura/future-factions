import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type MysteryBoxStatus = {
  canOpen: boolean;
  nextAvailableAt: string | null;
  lastOpenAt: string | null;
  currentStreak: number;
  totalOpens: number;
};

export type MysteryBoxResult =
  | {
      ok: true;
      tokens: number;
      base: number;
      loyaltyBonus: number;
      milestoneBonus: number;
      streakDay: number;
      nextAvailableAt: string;
    }
  | { ok: false; reason: "cooldown"; nextAvailableAt: string };

/** Returns status: when user can next open the mystery box and current streak. */
export const getMysteryBoxStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MysteryBoxStatus> => {
    const { data, error } = await context.supabase
      .from("mystery_box_opens")
      .select("opened_at, streak_day")
      .eq("user_id", context.userId)
      .order("opened_at", { ascending: false })
      .limit(50);
    if (error) throw error;

    const rows = (data ?? []) as Array<{ opened_at: string; streak_day: number }>;
    const last = rows[0] ?? null;
    const lastOpenAt = last?.opened_at ?? null;
    const nextAvailable = lastOpenAt ? new Date(new Date(lastOpenAt).getTime() + 24 * 60 * 60 * 1000) : null;
    const now = Date.now();
    const canOpen = !nextAvailable || nextAvailable.getTime() <= now;

    return {
      canOpen,
      nextAvailableAt: nextAvailable ? nextAvailable.toISOString() : null,
      lastOpenAt,
      currentStreak: last?.streak_day ?? 0,
      totalOpens: rows.length,
    };
  });

/** Opens the mystery box: enforces 24h cooldown, awards 100-500 + loyalty + 30-day milestone. */
export const openMysteryBox = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MysteryBoxResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("open_mystery_box", {
      _user_id: context.userId,
    });
    if (error) throw error;
    const r = (data ?? {}) as Record<string, unknown>;
    if (!r.ok) {
      return {
        ok: false,
        reason: "cooldown",
        nextAvailableAt: String(r.next_available_at ?? ""),
      };
    }
    return {
      ok: true,
      tokens: Number(r.tokens ?? 0),
      base: Number(r.base ?? 0),
      loyaltyBonus: Number(r.loyalty_bonus ?? 0),
      milestoneBonus: Number(r.milestone_bonus ?? 0),
      streakDay: Number(r.streak_day ?? 1),
      nextAvailableAt: String(r.next_available_at ?? ""),
    };
  });
