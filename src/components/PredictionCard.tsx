import { Link, useNavigate } from "@tanstack/react-router";
import { MessageCircle, Heart, Share2, Users, Plus } from "lucide-react";
import { type Prediction, formatTokens } from "@/lib/mock-data";
import { CATEGORY_IMAGES } from "@/lib/category-images";
import { ClosingTimerBadge } from "@/components/ClosingTimerBadge";
import { findResult } from "@/lib/world-cup-matches";

export function PredictionCard({ prediction: p, hideOptions = false }: { prediction: Prediction; hideOptions?: boolean }) {
  const navigate = useNavigate();
  const totalPool = p.options.reduce((s, o) => s + o.pool, 0);
  const result = p.match ? findResult(p.match.home, p.match.away) : undefined;
  // Normalize result orientation to current card's home/away
  const oriented = result
    ? (() => {
        const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        const swap = norm(result.home) !== norm(p.match!.home);
        return {
          status: result.status,
          homeScore: swap ? result.awayScore : result.homeScore,
          awayScore: swap ? result.homeScore : result.awayScore,
        };
      })()
    : null;
  return (
    <article className="group rounded-2xl bg-card border border-border/60 hover:border-primary/50 hover:shadow-glow transition overflow-hidden h-full flex flex-col">
      <Link
        to="/previsao/$id"
        params={{ id: p.id }}
        className="flex flex-col h-full p-5"
      >
        <div className="flex-1 flex flex-col min-h-0">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold border border-primary/30">
              {p.category}
            </span>
            <span className="shrink-0">
              <ClosingTimerBadge closesAt={p.closesAt} />
            </span>
          </div>

          <h3 className="mt-3 font-display text-lg font-bold leading-snug group-hover:text-gradient-brand transition flex items-start gap-2">
            <span className="mt-2 h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_10px_var(--primary)] flex-none" title="Desafio aberto" />
            <span>Desafio "{p.title}"</span>
          </h3>

          {p.match ? (
            <div className="mt-3 rounded-xl overflow-hidden border border-border/60 bg-gradient-to-br from-primary/10 via-background/40 to-gold/10 p-4">
              <div className="flex items-center justify-around gap-2">
                <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                  <img src={p.match.homeFlag} alt={p.match.home} className="h-12 w-16 object-cover rounded shadow" loading="lazy" />
                  <span className="text-xs font-bold text-center truncate w-full">{p.match.home}</span>
                </div>
                <div className="text-center">
                  <div className="font-display text-2xl font-black text-gradient-brand">VS</div>
                  <div className="text-[10px] text-muted-foreground">Grupo {p.match.group}</div>
                </div>
                <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                  <img src={p.match.awayFlag} alt={p.match.away} className="h-12 w-16 object-cover rounded shadow" loading="lazy" />
                  <span className="text-xs font-bold text-center truncate w-full">{p.match.away}</span>
                </div>
              </div>
              <div className="mt-2 text-center text-[11px] text-muted-foreground">
                {new Date(p.match.kickoff).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })} (Brasília)
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-xl overflow-hidden border border-border/60 bg-background/40 aspect-[16/9]">
              <img
                src={p.imageUrl ?? CATEGORY_IMAGES[p.category] ?? `https://picsum.photos/seed/${encodeURIComponent(p.id)}/800/450`}
                alt="Prêmio do desafio"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}
          {p.entryFee && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-full bg-gold/15 text-gold font-bold border border-gold/30">
                Entrada: {p.entryFee} TKN
              </span>
              {p.prizeTiers && (
                <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary font-bold border border-primary/30">
                  Prêmio: até {p.prizeTiers[0].tokens.toLocaleString("pt-BR")} TKN
                </span>
              )}
            </div>
          )}

          {!hideOptions && (
            <div className="mt-4 space-y-2">
              {p.options.slice(0, 5).map((o) => {
                const pct = totalPool ? Math.round((o.pool / totalPool) * 100) : 50;
                return (
                  <div key={o.id} className="relative">
                    <div className="relative h-9 rounded-lg bg-background/60 border border-border/60 overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-brand/30"
                        style={{
                          width: `${pct}%`,
                          background: "linear-gradient(90deg, color-mix(in oklab, var(--primary) 35%, transparent), color-mix(in oklab, var(--gold) 25%, transparent))",
                        }}
                      />
                      <div className="relative h-full flex items-center justify-between px-3 text-sm">
                        <span className="font-semibold">{o.label}</span>
                        <span className="tabular-nums font-bold text-foreground">{pct}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {p.options.length > 5 && (
                <div className="text-xs text-center text-muted-foreground py-1">
                  +{p.options.length - 5} opções no desafio
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate({ to: "/previsao/$id", params: { id: p.id } });
          }}
          className="mt-4 w-full h-10 rounded-xl bg-gradient-brand text-primary-foreground font-display font-black text-sm tracking-wide shadow-glow hover:scale-[1.01] transition inline-flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="h-4 w-4" /> PARTICIPAR
        </button>

        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground shrink-0">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {p.bettors} apostadores
          </span>
          <span className="text-gold font-semibold tabular-nums">
            {formatTokens(totalPool)} tokens
          </span>
          <span className="ml-auto inline-flex items-center gap-3">
            <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{p.likes}</span>
            <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{p.comments}</span>
            <span className="inline-flex items-center gap-1"><Share2 className="h-3.5 w-3.5" />{p.shares}</span>
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2 pt-3 border-t border-border/60 shrink-0">
          <img src={p.author.avatar} alt="" className="h-6 w-6 rounded-full bg-muted" />
          <span className="text-xs text-muted-foreground">
            por <span className="text-foreground font-medium">{p.author.username}</span> · {p.author.city}/{p.author.state}
          </span>
        </div>
      </Link>
    </article>
  );
}
