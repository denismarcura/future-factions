// Token balance helpers (client-side).
// Balance = welcome bonus + mission claims - participations entry fees.

import { supabase } from "@/integrations/supabase/client";
import { listMyClaims } from "@/lib/missions";
import { listParticipations } from "@/lib/my-participations";

export async function getTokenBalance(): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;
  const [{ data: prof }, claims] = await Promise.all([
    supabase.from("profiles").select("welcome_bonus").eq("id", user.id).maybeSingle(),
    listMyClaims().catch(() => []),
  ]);
  const welcome = (prof?.welcome_bonus as number | undefined) ?? 0;
  const earned = claims.reduce((s, c) => s + (c.tokens_awarded ?? 0), 0);
  const spent = listParticipations().reduce((s, p) => s + (p.entryFee ?? 0), 0);
  return welcome + earned - spent;
}
