import { useEffect, useState } from "react";
import { Users } from "lucide-react";

export function LiveUsersBadge() {
  const [count, setCount] = useState(15847);

  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => {
        const r = Math.random();
        let delta: number;
        if (r < 0.05) delta = Math.floor(Math.random() * 200) + 50; // spike up
        else if (r < 0.1) delta = -(Math.floor(Math.random() * 150) + 20); // drop
        else delta = Math.floor(Math.random() * 61) - 30; // -30..+30
        const next = Math.max(15200, Math.min(22000, c + delta));
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
