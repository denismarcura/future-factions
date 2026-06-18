import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { RANKING_TOP100 } from "@/lib/mock-extra";
import { formatTokens } from "@/lib/mock-data";
import { Crown, Trophy } from "lucide-react";

export const Route = createFileRoute("/top100")({
  head: () => ({
    meta: [
      { title: "Top 100 — Desafio dos Palpites" },
      { name: "description", content: "Os 100 maiores palpiteiros da plataforma." },
    ],
  }),
  component: Top100Page,
});

function Top100Page() {
  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="font-display text-3xl sm:text-4xl font-black flex items-center gap-3">
          <Crown className="h-8 w-8 text-gold" /> Top <span className="text-gradient-gold">100</span>
        </h1>
        <p className="text-muted-foreground mt-1">Lendas da plataforma. Suba sua posição acertando palpites.</p>
      </header>

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        {RANKING_TOP100.slice(0, 3).map((u, i) => {
          const styles = [
            "from-gold/30 to-gold/5 border-gold/50",
            "from-silver/20 to-silver/5 border-silver/40",
            "from-primary/20 to-primary/5 border-primary/40",
          ][i];
          const medal = ["🥇", "🥈", "🥉"][i];
          return (
            <div
              key={u.id}
              className={`rounded-2xl p-5 border bg-gradient-to-br ${styles} flex items-center gap-3`}
            >
              <div className="text-3xl">{medal}</div>
              <img src={u.avatar} alt="" className="h-14 w-14 rounded-full border-2 border-gold/60" />
              <div className="min-w-0">
                <div className="font-display font-black truncate">{u.username}</div>
                <div className="text-xs text-muted-foreground">{u.city}/{u.state}</div>
                <div className="mt-1 text-gold font-bold tabular-nums">{formatTokens(u.tokens)} Tokens</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-background/50 text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3">#</th>
              <th className="text-left px-4 py-3">Palpiteiro</th>
              <th className="text-left px-4 py-3 hidden sm:table-cell">Cidade</th>
              <th className="text-right px-4 py-3">Tokens</th>
              <th className="text-right px-4 py-3 hidden md:table-cell">Vitórias</th>
              <th className="text-right px-4 py-3 hidden md:table-cell">Desafios criados</th>
            </tr>
          </thead>
          <tbody>
            {RANKING_TOP100.map((u, i) => (
              <tr key={u.id} className="border-t border-border/60 hover:bg-background/40 transition">
                <td className="px-4 py-3 font-display font-bold tabular-nums">
                  {i < 3 ? <Trophy className="h-4 w-4 text-gold inline" /> : null} {i + 1}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <img src={u.avatar} alt="" className="h-7 w-7 rounded-full" />
                    <span className="font-medium truncate">{u.username}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{u.city}/{u.state}</td>
                <td className="px-4 py-3 text-right text-gold font-bold tabular-nums">{formatTokens(u.tokens)}</td>
                <td className="px-4 py-3 text-right tabular-nums hidden md:table-cell">{u.wins}</td>
                <td className="px-4 py-3 text-right tabular-nums hidden md:table-cell">{u.created}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
