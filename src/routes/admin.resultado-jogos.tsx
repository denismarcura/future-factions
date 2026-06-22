import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { WORLD_CUP_RESULTS, type WCResult } from "@/lib/world-cup-matches";
import { Trophy, Radio } from "lucide-react";

export const Route = createFileRoute("/admin/resultado-jogos")({
  head: () => ({ meta: [{ title: "Resultado dos Jogos — Admin" }] }),
  component: Page,
});

function Page() {
  const grouped = WORLD_CUP_RESULTS.reduce<Record<string, WCResult[]>>((acc, r) => {
    (acc[r.date] = acc[r.date] || []).push(r);
    return acc;
  }, {});
  const dates = Object.keys(grouped).sort((a, b) => {
    const [da, ma, ya] = a.split("/").map(Number);
    const [db, mb, yb] = b.split("/").map(Number);
    return new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime();
  });

  const totals = {
    total: WORLD_CUP_RESULTS.length,
    encerrados: WORLD_CUP_RESULTS.filter((r) => r.status === "encerrado").length,
    aoVivo: WORLD_CUP_RESULTS.filter((r) => r.status === "em_andamento").length,
  };

  return (
    <AppShell>
      <section className="mb-6">
        <Link to="/admin" className="text-xs text-muted-foreground hover:text-primary">
          ← Admin
        </Link>
        <h1 className="font-display text-3xl font-black mt-1 flex items-center gap-2">
          <Trophy className="h-7 w-7 text-gold" /> Resultado dos Jogos
        </h1>
        <p className="text-sm text-muted-foreground">
          Placar oficial dos jogos da Copa do Mundo 2026. Os cards de desafio com a mesma partida exibem automaticamente o placar final.
        </p>
      </section>

      <section className="grid grid-cols-3 gap-3 mb-6">
        {[
          { k: "Jogos cadastrados", v: totals.total },
          { k: "Encerrados", v: totals.encerrados },
          { k: "Em andamento", v: totals.aoVivo },
        ].map((s) => (
          <div key={s.k} className="rounded-xl glass-card p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.k}</div>
            <div className="font-display text-2xl font-black mt-1">{s.v}</div>
          </div>
        ))}
      </section>

      <div className="space-y-6">
        {dates.map((d) => (
          <section key={d}>
            <h2 className="font-display font-black text-lg mb-2">{d}</h2>
            <div className="grid gap-2">
              {grouped[d].map((r, i) => {
                const winner =
                  r.homeScore > r.awayScore ? "home" : r.awayScore > r.homeScore ? "away" : "draw";
                return (
                  <div
                    key={i}
                    className="rounded-xl glass-card p-4 flex items-center gap-4 flex-wrap"
                  >
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      <span className={`text-sm font-bold truncate ${winner === "home" ? "text-primary" : ""}`}>
                        {r.home}
                      </span>
                      <span className="font-display text-2xl font-black tabular-nums text-gradient-brand">
                        {r.homeScore} <span className="text-muted-foreground">×</span> {r.awayScore}
                      </span>
                      <span className={`text-sm font-bold truncate ${winner === "away" ? "text-primary" : ""}`}>
                        {r.away}
                      </span>
                    </div>
                    {r.status === "encerrado" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 font-bold uppercase tracking-wider text-[10px]">
                        Encerrado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/15 text-destructive border border-destructive/30 font-bold uppercase tracking-wider text-[10px] animate-pulse">
                        <Radio className="h-3 w-3" /> Ao vivo
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
