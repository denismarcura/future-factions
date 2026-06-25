import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Gift, Flame, Trophy, Coins, ArrowLeft } from "lucide-react";
import { getMysteryBoxRanking, type StreakPeriod } from "@/lib/mystery-box-ranking.functions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const Route = createFileRoute("/ranking-caixa-misteriosa")({
  head: () => ({
    meta: [
      { title: "Ranking Caixa Misteriosa — Top 100 Fidelidade" },
      { name: "description", content: "Top 100 jogadores com maior sequência de aberturas da Caixa Misteriosa. Filtre por 7 dias, 30 dias ou geral." },
    ],
  }),
  component: RankingCaixaPage,
});

const PERIODS: { id: StreakPeriod; label: string }[] = [
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "total", label: "Geral" },
];

function medal(pos: number) {
  if (pos === 1) return { emoji: "🥇", cls: "bg-gold/20 text-gold border-gold/40 shadow-[0_0_12px_rgba(255,200,0,0.5)]", label: "Ouro" };
  if (pos === 2) return { emoji: "🥈", cls: "bg-zinc-300/20 text-zinc-200 border-zinc-300/40 shadow-[0_0_10px_rgba(200,200,210,0.35)]", label: "Prata" };
  if (pos === 3) return { emoji: "🥉", cls: "bg-amber-700/20 text-amber-500 border-amber-700/40 shadow-[0_0_10px_rgba(180,100,30,0.35)]", label: "Bronze" };
  return { emoji: String(pos), cls: "bg-muted text-muted-foreground border-border", label: `Posição ${pos}` };
}

function RankingCaixaPage() {
  const [period, setPeriod] = useState<StreakPeriod>("total");
  const { data, isLoading } = useQuery({
    queryKey: ["mystery-box-ranking", period],
    queryFn: () => getMysteryBoxRanking({ data: { period } }),
    staleTime: 60_000,
  });

  const rows = data ?? [];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-3 w-3" /> Voltar
      </Link>

      <div className="rounded-3xl border border-purple-500/40 bg-gradient-to-br from-purple-900/30 via-fuchsia-900/20 to-background p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-2xl bg-purple-500/20 grid place-items-center animate-pulse">
            <Gift className="h-6 w-6 text-purple-300" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Ranking Caixa Misteriosa</h1>
            <p className="text-xs text-muted-foreground">Top 100 fiéis · Maior sequência diária vence</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`px-4 h-9 rounded-full text-xs font-black uppercase tracking-wider transition ${
              period === p.id
                ? "bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-glow"
                : "border border-border/60 text-muted-foreground hover:border-purple-500/50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border/60 glass-card overflow-hidden">
        <div className="hidden md:grid grid-cols-[60px_1fr_100px_100px_120px] gap-3 px-4 py-3 border-b border-border/60 text-[10px] font-black uppercase tracking-wider text-muted-foreground bg-muted/30">
          <div>Pos</div>
          <div>Jogador</div>
          <div className="text-center">Streak</div>
          <div className="text-center">Aberturas</div>
          <div className="text-right">Tokens</div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando ranking…</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Ninguém abriu a caixa neste período ainda.
            <div className="mt-3">
              <Link to="/caixa-misteriosa" className="inline-flex items-center gap-1 text-purple-400 font-bold hover:underline">
                <Gift className="h-3 w-3" /> Seja o primeiro
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {rows.map((r, i) => {
              const pos = i + 1;
              const m = medal(pos);
              return (
                <li
                  key={r.userId}
                  className="grid grid-cols-[44px_1fr_auto] md:grid-cols-[60px_1fr_100px_100px_120px] gap-3 px-4 py-3 items-center hover:bg-muted/20 transition"
                >
                  <div>
                    <span className={`h-8 w-8 md:h-9 md:w-9 rounded-full grid place-items-center text-xs font-black border ${m.cls}`}>
                      {m.emoji}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    {r.avatarUrl ? (
                      <img src={r.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover border border-border/60 shrink-0" />
                    ) : (
                      <span className="h-8 w-8 rounded-full bg-muted grid place-items-center text-xs font-black shrink-0">
                        {r.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-bold truncate">{r.name}</div>
                      <div className="md:hidden text-[10px] text-muted-foreground flex items-center gap-2">
                        <span className="inline-flex items-center gap-0.5 text-orange-400 font-black">
                          <Flame className="h-3 w-3" /> {r.maxStreak}d
                        </span>
                        <span>·</span>
                        <span>{r.totalOpens} aberturas</span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center justify-center gap-1 text-orange-400 font-black">
                    <Flame className="h-4 w-4" /> {r.maxStreak}d
                  </div>
                  <div className="hidden md:block text-center text-sm font-mono font-bold">{r.totalOpens}</div>
                  <div className="md:text-right text-right inline-flex items-center justify-end gap-1 text-gold font-black text-sm">
                    {r.totalTokens.toLocaleString("pt-BR")} <Coins className="h-3 w-3" />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-6 text-center">
        <Link
          to="/caixa-misteriosa"
          className="inline-flex items-center gap-2 px-6 h-11 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white text-sm font-black uppercase shadow-glow"
        >
          <Gift className="h-4 w-4" /> Abrir minha caixa
        </Link>
      </div>
    </div>
  );
}
