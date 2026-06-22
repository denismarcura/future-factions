import { useEffect, useState } from "react";
import { Users } from "lucide-react";

export function LiveUsersBadge() {
  const [count, setCount] = useState(1247);

  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => {
        // simulate fluctuation: mostly small +/- moves, occasional spikes
        const r = Math.random();
        let delta: number;
        if (r < 0.05) delta = Math.floor(Math.random() * 40) + 10; // spike up
        else if (r < 0.1) delta = -(Math.floor(Math.random() * 30) + 5); // drop
        else delta = Math.floor(Math.random() * 11) - 5; // -5..+5
        const next = Math.max(820, Math.min(2400, c + delta));
        return next;
      });
    }, 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mt-4 p-4 rounded-2xl glass-card border border-primary/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
      <div className="relative">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-primary font-bold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <Users className="h-3 w-3" /> Ao vivo
        </div>
        <div className="mt-2 font-display font-black text-3xl tabular-nums text-gradient-brand transition-all">
          {count.toLocaleString("pt-BR")}
        </div>
        <div className="text-[11px] text-muted-foreground mt-1">
          usuários ativos agora
        </div>
      </div>
    </div>
  );
}
