import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trophy } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { TrophyBadge } from "@/components/TrophyBadge";
import { USERS, formatTokens } from "@/lib/mock-data";

export const Route = createFileRoute("/ranking")({
  head: () => ({
    meta: [
      { title: "Ranking — EU ACHO QUE VAI DAR @#&" },
      { name: "description", content: "Veja os profetas no topo: ranking global, semanal, mensal e por cidade." },
    ],
  }),
  component: Ranking,
});

const TABS = ["Global", "Semana", "Mês", "Ano", "Cidade", "Estado", "Amigos"] as const;

function Ranking() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Global");
  const sorted = [...USERS].sort((a, b) => b.tokens - a.tokens);

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-black flex items-center gap-3">
          <Trophy className="h-7 w-7 text-gold" /> Ranking
        </h1>
        <p className="text-muted-foreground mt-1">Os profetas que estão dominando a fase de testes.</p>
      </header>

      <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 pb-3 mb-4">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 h-9 px-3.5 rounded-full text-xs font-bold border transition ${
              tab === t
                ? "bg-gradient-brand text-primary-foreground border-transparent shadow-glow"
                : "bg-card text-muted-foreground border-border/60 hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <section className="grid sm:grid-cols-3 gap-3 mb-6">
        {sorted.slice(0, 3).map((u, i) => {
          const position = (i + 1) as 1 | 2 | 3;
          return (
            <div
              key={u.id}
              className={`rounded-2xl bg-card border border-border/60 p-5 text-center ${
                i === 0 ? "shadow-glow-gold border-gold/60 sm:-translate-y-2" : ""
              }`}
            >
              <TrophyBadge
                position={position}
                size={i === 0 ? 94 : 82}
                className="mx-auto object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.28)]"
              />
              <img src={u.avatar} className="mx-auto mt-3 h-16 w-16 rounded-full border-2 border-border/60" alt="" />
              <div className="font-display font-black mt-2">{u.username}</div>
              <div className="text-xs text-muted-foreground">{u.level} · {u.city}/{u.state}</div>
              <div className="mt-3 font-display text-2xl font-black text-gradient-brand">
                {formatTokens(u.tokens)}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Tokens</div>
            </div>
          );
        })}
      </section>

      <section className="rounded-2xl bg-card border border-border/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-background/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left py-3 px-4 w-12">#</th>
              <th className="text-left py-3 px-4">Profeta</th>
              <th className="text-right py-3 px-4 hidden sm:table-cell">Acertos</th>
              <th className="text-right py-3 px-4 hidden md:table-cell">Taxa</th>
              <th className="text-right py-3 px-4">Tokens</th>
            </tr>
          </thead>
          <tbody>
            {sorted.slice(3).map((u, i) => {
              const total = u.acertos + u.erros;
              const rate = total ? Math.round((u.acertos / total) * 100) : 0;
              return (
                <tr key={u.id} className="border-t border-border/40 hover:bg-background/30">
                  <td className="py-3 px-4 font-display font-bold text-muted-foreground">{i + 4}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img src={u.avatar} className="h-8 w-8 rounded-full" alt="" />
                      <div>
                        <div className="font-semibold">{u.username}</div>
                        <div className="text-xs text-muted-foreground">{u.level} · {u.city}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums hidden sm:table-cell">{u.acertos}</td>
                  <td className="py-3 px-4 text-right tabular-nums hidden md:table-cell text-success font-semibold">{rate}%</td>
                  <td className="py-3 px-4 text-right tabular-nums font-display font-bold text-gold">{formatTokens(u.tokens)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}

