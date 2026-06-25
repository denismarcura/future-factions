import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PalpiteCreditTx = {
  id: string;
  delta: number;
  reason: string;
  mission_id: string | null;
  challenge_id: string | null;
  created_at: string;
};

/** Returns the current user's palpite credits balance. */
export const getMyPalpiteCredits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("palpite_credits")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return { balance: (data?.palpite_credits as number | undefined) ?? 0 };
  });

/** Grants 1 palpite credit for a mission claim (idempotent per user+mission). */
export const grantCreditForMission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { missionId: string; challengeId?: string | null }) => input)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: balance, error } = await supabaseAdmin.rpc("grant_palpite_credit", {
      _user_id: context.userId,
      _delta: 1,
      _reason: "mission_claim",
      _mission_id: data.missionId,
      _challenge_id: data.challengeId ?? undefined,
    });
    if (error) throw error;
    return { balance: (balance as number) ?? 0 };
  });

/** Consumes 1 palpite credit when the user joins a challenge using credits instead of tokens. */
export const consumePalpiteCredit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { challengeId: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Atomic check-and-decrement
    const { data: rows, error: selErr } = await supabaseAdmin
      .from("profiles")
      .select("palpite_credits")
      .eq("id", context.userId)
      .maybeSingle();
    if (selErr) throw selErr;
    const current = (rows?.palpite_credits as number | undefined) ?? 0;
    if (current <= 0) {
      return { ok: false as const, balance: 0, reason: "no_credits" as const };
    }
    const { data: balance, error } = await supabaseAdmin.rpc("grant_palpite_credit", {
      _user_id: context.userId,
      _delta: -1,
      _reason: "challenge_join",
      _mission_id: undefined,
      _challenge_id: data.challengeId,
    });
    if (error) throw error;
    return { ok: true as const, balance: (balance as number) ?? 0 };
  });
