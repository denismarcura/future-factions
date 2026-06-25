import { useEffect, useState } from "react";
import { Ticket } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { getMyPalpiteCredits } from "@/lib/palpite-credits.functions";
import { supabase } from "@/integrations/supabase/client";

/**
 * Compact pill that shows the user's available "Créditos de Palpite".
 * Each credit lets the user join an active challenge without spending tokens.
 */
export function PalpiteCreditsBadge({ className = "" }: { className?: string }) {
  const fetchCredits = useServerFn(getMyPalpiteCredits);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session?.user) {
        if (active) setBalance(null);
        return;
      }
      try {
        const res = await fetchCredits();
        if (active) setBalance(res.balance);
      } catch {
        /* ignore */
      }
    }
    load();
    const onUpdate = () => load();
    window.addEventListener("ddp:palpite-credits-updated", onUpdate);
    const { data: sub } = supabase.auth.onAuthStateChange(load);
    return () => {
      active = false;
      window.removeEventListener("ddp:palpite-credits-updated", onUpdate);
      sub.subscription.unsubscribe();
    };
  }, [fetchCredits]);

  if (balance === null) return null;

  return (
    <span
      title="Créditos para participar de desafios"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-xs font-bold ${className}`}
    >
      <Ticket className="h-3.5 w-3.5" />
      {balance} {balance === 1 ? "crédito" : "créditos"}
    </span>
  );
}
