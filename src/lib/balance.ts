// Token balance helpers (client-side).
// Balance = welcome bonus + mission claims - participations - redemptions (não rejeitadas).
//
// Débitos de participação são lidos do banco (token_transactions, reason='participation').
// Dados antigos salvos apenas no localStorage são incluídos como fallback,
// desduplicando por challenge_id para não contar duas vezes.

import { supabase } from "@/integrations/supabase/client";
import { listMyClaims } from "@/lib/missions";
import { listParticipations } from "@/lib/my-participations";
import { listMyRedemptions } from "@/lib/prize-redemptions.functions";

export async function getTokenBalance(): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const [{ data: prof }, claims, reds, { data: partTxs }] = await Promise.all([
    supabase.from("profiles").select("welcome_bonus").eq("id", user.id).maybeSingle(),
    listMyClaims().catch(() => []),
    listMyRedemptions().catch(() => []),
    supabase
      .from("token_transactions")
      .select("challenge_id, delta")
      .eq("user_id", user.id)
      .eq("reason", "participation")
      .lt("delta", 0),
  ]);

  const welcome = (prof?.welcome_bonus as number | undefined) ?? 0;
  const earned = claims.reduce((s, c) => s + (c.tokens_awarded ?? 0), 0);
  const redeemed = reds
    .filter((r) => r.status !== "rejected")
    .reduce((s, r) => s + (r.cost_tokens ?? 0), 0);

  // Débitos registrados no banco
  const dbDebits = (partTxs ?? []) as Array<{ challenge_id: string | null; delta: number }>;
  const dbChallengeIds = new Set(dbDebits.map((d) => d.challenge_id).filter(Boolean));
  const dbSpent = dbDebits.reduce((s, t) => s + Math.abs(t.delta), 0);

  // Débitos antigos apenas no localStorage (backward compat; não duplica os do banco)
  const localSpent = listParticipations()
    .filter((p) => !dbChallengeIds.has(p.id))
    .reduce((s, p) => s + (p.entryFee ?? 0), 0);

  return welcome + earned - dbSpent - localSpent - redeemed;
}
