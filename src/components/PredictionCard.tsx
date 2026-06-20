import { Link } from "@tanstack/react-router";
import { Flame, MessageCircle, Heart, Share2, Users, Clock } from "lucide-react";
import { type Prediction, formatTokens, timeLeft } from "@/lib/mock-data";

export function PredictionCard({ prediction: p }: { prediction: Prediction }) {
  const totalPool = p.options.reduce((s, o) => s + o.pool, 0);
  return (
    <article className="group rounded-2xl bg-card border border-border/60 hover:border-primary/50 hover:shadow-glow transition overflow-hidden">
      <Link
        to="/previsao/$id"
        params={{ id: p.id }}
        className="block p-5"
      >
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold border border-primary/30">
            {p.category}
          </span>
          {p.hot && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/15 text-destructive font-semibold border border-destructive/30">
              <Flame className="h-3 w-3" /> Em alta
            </span>
          )}
          <span className="ml-auto inline-flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" /> {timeLeft(p.closesAt)}
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
              {new Date(p.match.kickoff).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} (Brasília)
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-xl overflow-hidden border border-border/60 bg-background/40 aspect-[16/9]">
            <img
              src={`https://picsum.photos/seed/${encodeURIComponent(p.id)}/800/450`}
              alt="Prêmio do desafio"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{p.description}</p>

        {p.entryFee && (
          <div className="mt-2 flex items-center gap-2 text-xs">
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

        <div className="mt-4 space-y-2">
          {p.options.map((o) => {
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
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
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

        <div className="mt-4 flex items-center gap-2 pt-3 border-t border-border/60">
          <img src={p.author.avatar} alt="" className="h-6 w-6 rounded-full bg-muted" />
          <span className="text-xs text-muted-foreground">
            por <span className="text-foreground font-medium">{p.author.username}</span> · {p.author.city}/{p.author.state}
          </span>
        </div>
      </Link>
    </article>
  );
}
