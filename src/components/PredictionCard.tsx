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

        <h3 className="mt-3 font-display text-lg font-bold leading-snug group-hover:text-gradient-brand transition">
          {p.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{p.description}</p>

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
