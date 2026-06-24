// Token balance helpers (client-side).
// Balance = welcome bonus + mission claims - participations entry fees - redemptions (não rejeitadas).

import { supabase } from "@/integrations/supabase/client";
import { listMyClaims } from "@/lib/missions";
import { listParticipations } from "@/lib/my-participations";
import { listMyRedemptions } from "@/lib/prize-redemptions.functions";

export async function getTokenBalance(): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;
  const [{ data: prof }, claims, reds] = await Promise.all([
    supabase.from("profiles").select("welcome_bonus").eq("id", user.id).maybeSingle(),
    listMyClaims().catch(() => []),
    listMyRedemptions().catch(() => []),
  ]);
  const welcome = (prof?.welcome_bonus as number | undefined) ?? 0;
  const earned = claims.reduce((s, c) => s + (c.tokens_awarded ?? 0), 0);
  const spent = listParticipations().reduce((s, p) => s + (p.entryFee ?? 0), 0);
  const redeemed = reds
    .filter((r) => r.status !== "rejected")
    .reduce((s, r) => s + (r.cost_tokens ?? 0), 0);
  return welcome + earned - spent - redeemed;
}
