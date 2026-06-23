import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { TrophyBadge } from "@/components/TrophyBadge";
import { RANKING_TOP100 } from "@/lib/mock-extra";
import { formatTokens } from "@/lib/mock-data";
import { Crown, Trophy, Users, Sparkles, Loader2 } from "lucide-react";
import { getTop100, type Top100Entry } from "@/lib/top100.functions";

export const Route = createFileRoute("/top100")({
  head: () => ({
    meta: [
      { title: "Top 100 — Desafio dos Palpites" },
      { name: "description", content: "Os 100 maiores criadores de desafios do mês. Snapshot fechado todo dia 10." },
    ],
  }),
  component: Top100Page,
});

function monthLabel(key: string | null) {
  if (!key) return "—";
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function Top100Page() {
  const fetcher = useServerFn(getTop100);
  const [data, setData] = useState<{ monthKey: string | null; entries: Top100Entry[] } | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetcher({ data: {} })
      .then((d) => setData(d))
      .catch(() => setData({ monthKey: null, entries: [] }))
      .finally(() => setLoading(false));
  }, [fetcher]);

  const real = data?.entries ?? [];
  const empty = real.length === 0;

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="font-display text-3xl sm:text-4xl font-black flex items-center gap-3">
          <Crown className="h-8 w-8 text-gold" /> Top <span className="text-gradient-gold">100</span> de Criadores
        </h1>
        <p className="text-muted-foreground mt-1">
          Ranking dos maiores criadores de desafios. Snapshot fechado todo dia 10. Mês: <strong>{monthLabel(data?.monthKey ?? null)}</strong>.
        </p>
        <div className="mt-3 rounded-xl border border-gold/40 bg-gold/5 p-3 text-xs text-muted-foreground">
          <strong className="text-gold">Como pontuar:</strong> cada desafio criado rende tokens conforme o número de participantes cadastrados —
          10 (4 tokens), 20 (10), 50 (20), 100 (50), mais de 100 (500). O 1º lugar do mês recebe prêmios especiais.
        </div>
      </header>

      {loading ? (
        <div className="py-12 grid place-items-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : empty ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center">
          <Sparkles className="h-10 w-10 mx-auto text-muted-foreground/60 mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum snapshot fechado ainda. O ranking oficial é publicado todo dia 10.</p>
          <p className="text-xs text-muted-foreground mt-1">Enquanto isso, veja os palpiteiros lendários da plataforma abaixo.</p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-3 gap-3 mb-6">
            {real.slice(0, 3).map((u, i) => {
              const styles = [
                "from-gold/30 to-gold/5 border-gold/50",
                "from-silver/20 to-silver/5 border-silver/40",
                "from-primary/20 to-primary/5 border-primary/40",
              ][i];
              const position = (i + 1) as 1 | 2 | 3;
              return (
                <div key={u.user_id} className={`rounded-2xl p-5 border bg-gradient-to-br ${styles} flex items-center gap-3`}>
                  <TrophyBadge position={position} size={i === 0 ? 90 : 78} className="shrink-0 object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.24)]" />
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="h-14 w-14 rounded-full border-2 border-gold/60" />
                  ) : (
                    <div className="h-14 w-14 rounded-full border-2 border-gold/60 bg-muted grid place-items-center text-xl font-black">{(u.full_name ?? "?").charAt(0)}</div>
                  )}
                  <div className="min-w-0">
                    <div className="font-display font-black truncate">{u.full_name ?? "Anônimo"}</div>
                    <div className="text-xs text-muted-foreground">{u.challenges_count} desafios · {u.total_participants} part.</div>
                    <div className="mt-1 text-gold font-bold tabular-nums">{formatTokens(u.points)} pontos</div>
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
                  <th className="text-left px-4 py-3">Criador</th>
                  <th className="text-right px-4 py-3">Desafios</th>
                  <th className="text-right px-4 py-3 hidden sm:table-cell">Participantes</th>
                  <th className="text-right px-4 py-3">Pontos</th>
                </tr>
              </thead>
              <tbody>
                {real.map((u) => (
                  <tr key={u.user_id} className="border-t border-border/60 hover:bg-background/40 transition">
                    <td className="px-4 py-3 font-display font-bold tabular-nums">
                      {u.rank <= 3 ? <Trophy className="h-4 w-4 text-gold inline" /> : null} {u.rank}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {u.avatar_url ? <img src={u.avatar_url} alt="" className="h-7 w-7 rounded-full" /> : <div className="h-7 w-7 rounded-full bg-muted" />}
                        <span className="font-medium truncate">{u.full_name ?? "Anônimo"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{u.challenges_count}</td>
                    <td className="px-4 py-3 text-right tabular-nums hidden sm:table-cell"><Users className="h-3 w-3 inline mr-1 text-muted-foreground" />{u.total_participants}</td>
                    <td className="px-4 py-3 text-right text-gold font-bold tabular-nums">{formatTokens(u.points)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {empty && (
        <div className="mt-6">
          <h2 className="font-display text-xl font-black mb-3">Palpiteiros lendários (referência)</h2>
          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-background/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">#</th>
                  <th className="text-left px-4 py-3">Palpiteiro</th>
                  <th className="text-right px-4 py-3">Tokens</th>
                </tr>
              </thead>
              <tbody>
                {RANKING_TOP100.slice(0, 20).map((u, i) => (
                  <tr key={u.id} className="border-t border-border/60">
                    <td className="px-4 py-3 tabular-nums">{i + 1}</td>
                    <td className="px-4 py-3 flex items-center gap-2"><img src={u.avatar} alt="" className="h-6 w-6 rounded-full" />{u.username}</td>
                    <td className="px-4 py-3 text-right text-gold font-bold tabular-nums">{formatTokens(u.tokens)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppShell>
  );
}
