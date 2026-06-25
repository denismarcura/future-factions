import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listParticipations } from "@/lib/my-participations";

/**
 * Returns the set of challenge IDs the current user has already submitted a palpite for.
 * Combines:
 *  - Supabase `palpites` table (real DB inserts).
 *  - Local `ddp:my-participations` storage (mock/world-cup flow that doesn't hit the DB).
 * Listens for `ddp:palpite-submitted` and `ddp:participations-updated` to refresh.
 */
export function useParticipatedChallengeIds(): Set<string> {
  const [ids, setIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;

    function readLocal(): string[] {
      try {
        return listParticipations().map((p) => String(p.id));
      } catch {
        return [];
      }
    }

    async function load() {
      const local = readLocal();
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id;
      let remote: string[] = [];
      if (uid) {
        const { data } = await supabase
          .from("palpites")
          .select("challenge_id")
          .eq("user_id", uid);
        remote = (data ?? []).map((r: any) => String(r.challenge_id));
      }
      if (!active) return;
      setIds(new Set([...local, ...remote]));
    }

    load();
    const onUpdate = () => load();
    const { data: sub } = supabase.auth.onAuthStateChange(load);
    window.addEventListener("ddp:palpite-submitted", onUpdate);
    window.addEventListener("ddp:participations-updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      active = false;
      sub.subscription.unsubscribe();
      window.removeEventListener("ddp:palpite-submitted", onUpdate);
      window.removeEventListener("ddp:participations-updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  return ids;
}
