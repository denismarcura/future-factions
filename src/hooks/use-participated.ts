import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns the set of challenge IDs the current user has already submitted a palpite for.
 * Empty set when signed out. Listens for `ddp:palpite-submitted` to refresh.
 */
export function useParticipatedChallengeIds(): Set<string> {
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id;
      if (!uid) {
        if (active) setIds(new Set());
        return;
      }
      const { data } = await supabase
        .from("palpites")
        .select("challenge_id")
        .eq("user_id", uid);
      if (!active) return;
      setIds(new Set((data ?? []).map((r: any) => String(r.challenge_id))));
    }

    load();
    const onUpdate = () => load();
    const { data: sub } = supabase.auth.onAuthStateChange(load);
    window.addEventListener("ddp:palpite-submitted", onUpdate);
    return () => {
      active = false;
      sub.subscription.unsubscribe();
      window.removeEventListener("ddp:palpite-submitted", onUpdate);
    };
  }, []);

  return ids;
}
