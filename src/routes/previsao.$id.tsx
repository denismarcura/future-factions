import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  Clock, Users, Flame, Heart, MessageCircle, Share2, Coins, TrendingUp, ArrowLeft,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { CURRENT_USER, formatTokens, getPrediction, PREDICTIONS, type Prediction, timeLeft, USERS } from "@/lib/mock-data";

export const Route = createFileRoute("/previsao/$id")({
  loader: ({ params }): Prediction => {
    const p = getPrediction(params.id);
    if (!p) throw notFound();
    return p;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — EU ACHO QUE VAI DAR @#&` },
          { name: "description", content: loaderData.description },
          { property: "og:title", content: loaderData.title },
          { property: "og:description", content: loaderData.description },
        ]
      : [],
  }),
  component: PredictionPage,
  errorComponent: () => (
    <AppShell>
      <div className="p-10 text-center text-muted-foreground">Não foi possível carregar a previsão.</div>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <div className="p-10 text-center">
        <h2 className="font-display text-2xl">Previsão não encontrada</h2>
        <Link to="/" className="text-primary mt-3 inline-block">Voltar ao feed</Link>
      </div>
    </AppShell>
  ),
});

function PredictionPage() {
  const p = Route.useLoaderData();
  const totalPool = p.options.reduce((s, o) => s + o.pool, 0);
  const [selected, setSelected] = useState(p.options[0].id);
  const [amount, setAmount] = useState(p.minTokens);

  const sel = p.options.find((o) => o.id === selected)!;
  const newPool = totalPool + amount;
  const newOptionPool = sel.pool + amount;
  const odds = newOptionPool ? newPool / newOptionPool : 1;
  const possibleReturn = Math.floor(amount * odds);

  const related = PREDICTIONS.filter((x) => x.id !== p.id && x.category === p.category).slice(0, 4);

  return (
    <AppShell>
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <article className="rounded-2xl bg-card border border-border/60 p-6">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold border border-primary/30">{p.category}</span>
            {p.hot && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/15 text-destructive font-semibold border border-destructive/30">
                <Flame className="h-3 w-3" /> Em alta
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" /> Encerra em {timeLeft(p.closesAt)}</span>
            <span className="inline-flex items-center gap-1 text-muted-foreground"><Users className="h-3 w-3" /> {p.bettors} apostadores</span>
          </div>

          <h1 className="mt-4 font-display text-2xl sm:text-3xl font-black leading-tight">{p.title}</h1>
          <p className="mt-2 text-muted-foreground">{p.description}</p>

          <div className="mt-6 flex items-center gap-3 p-3 rounded-xl bg-background/40 border border-border/60">
            <img src={p.author.avatar} alt="" className="h-10 w-10 rounded-full" />
            <div className="text-sm">
              <div className="font-semibold">{p.author.username}</div>
              <div className="text-xs text-muted-foreground">{p.author.city}/{p.author.state} · {p.author.level}</div>
            </div>
            <button className="ml-auto h-9 px-3 rounded-full border border-primary/60 text-primary text-xs font-bold hover:bg-primary/10">
              Seguir
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {p.options.map((o) => {
              const pct = totalPool ? Math.round((o.pool / totalPool) * 100) : 50;
              const active = o.id === selected;
              return (
                <button
                  key={o.id}
                  onClick={() => setSelected(o.id)}
                  className={`w-full text-left rounded-xl border p-4 transition ${
                    active ? "border-primary shadow-glow bg-primary/5" : "border-border/60 hover:border-primary/40 bg-background/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-display font-bold text-lg">{o.label}</div>
                    <div className="text-right">
                      <div className="font-display font-black text-gradient-brand">{pct}%</div>
                      <div className="text-[10px] text-muted-foreground">{formatTokens(o.pool)} tokens</div>
                    </div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-background overflow-hidden">
                    <div className="h-full bg-gradient-brand" style={{ width: `${pct}%` }} />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex items-center gap-5 text-sm text-muted-foreground border-t border-border/60 pt-4">
            <button className="inline-flex items-center gap-1.5 hover:text-destructive"><Heart className="h-4 w-4" />{p.likes}</button>
            <button className="inline-flex items-center gap-1.5 hover:text-primary"><MessageCircle className="h-4 w-4" />{p.comments}</button>
            <button className="inline-flex items-center gap-1.5 hover:text-gold"><Share2 className="h-4 w-4" />{p.shares}</button>
            <span className="ml-auto text-xs">Mín. aposta: <span className="text-gold font-semibold">{p.minTokens} tokens</span></span>
          </div>

          {/* Comentários mock */}
          <section className="mt-8">
            <h2 className="font-display font-bold text-lg mb-3">Comentários</h2>
            <div className="space-y-3">
              {USERS.slice(0, 4).map((u, i) => (
                <div key={u.id} className="flex gap-3 p-3 rounded-xl bg-background/40 border border-border/60">
                  <img src={u.avatar} className="h-9 w-9 rounded-full" alt="" />
                  <div className="text-sm">
                    <div className="font-semibold">{u.username} <span className="text-xs text-muted-foreground font-normal">· {u.level}</span></div>
                    <p className="text-muted-foreground mt-1">
                      {["Já apostei tudo!", "Vai dar zebra, com certeza.", "Apostei pesado no Sim 🚀", "Tá fácil demais, hein."][i]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </article>

        {/* Bet widget */}
        <aside>
          <div className="sticky top-24 rounded-2xl bg-card border border-border/60 p-5 shadow-glow">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gold font-bold">
              <Coins className="h-4 w-4" /> Fazer aposta
            </div>
            <div className="mt-3 text-sm text-muted-foreground">Sua escolha</div>
            <div className="mt-1 font-display text-xl font-black">{sel.label}</div>

            <label className="mt-5 block text-xs uppercase tracking-wider text-muted-foreground font-bold">
              Quantidade de Tokens
            </label>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                value={amount}
                min={p.minTokens}
                max={CURRENT_USER.tokens}
                onChange={(e) => setAmount(Math.max(p.minTokens, Number(e.target.value) || 0))}
                className="flex-1 h-11 px-3 rounded-lg bg-background border border-border/60 font-display font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
              <span className="text-gold font-bold">TKN</span>
            </div>
            <div className="mt-2 flex gap-1.5">
              {[10, 50, 100, 500].map((n) => (
                <button
                  key={n}
                  onClick={() => setAmount(n)}
                  className="flex-1 h-8 rounded-md text-xs font-semibold border border-border/60 hover:border-primary/60 hover:text-primary"
                >
                  {n}
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-2 text-sm">
              <Row label="Odds estimada" value={odds.toFixed(2) + "x"} />
              <Row label="Possível retorno" value={`${formatTokens(possibleReturn)} TKN`} highlight />
              <Row label="Seu saldo" value={`${formatTokens(CURRENT_USER.tokens)} TKN`} />
            </div>

            <button className="mt-5 w-full h-12 rounded-xl bg-gradient-brand text-primary-foreground font-display font-black tracking-wide shadow-glow hover:scale-[1.01] transition">
              APOSTAR {amount} TOKENS
            </button>

            <p className="mt-3 text-[11px] text-center text-muted-foreground">
              Fase de testes. Tokens virtuais, sem dinheiro real.
            </p>
          </div>

          <div className="mt-4 rounded-2xl glass-card p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-primary">
              <TrendingUp className="h-4 w-4" /> Volume total
            </div>
            <div className="mt-1 font-display text-2xl font-black text-gold">
              {formatTokens(totalPool)} <span className="text-xs text-muted-foreground font-normal uppercase">tokens</span>
            </div>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-bold mb-4">Mais em {p.category}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {related.map((r) => (
              <Link
                key={r.id}
                to="/previsao/$id"
                params={{ id: r.id }}
                className="rounded-xl bg-card border border-border/60 p-4 hover:border-primary/50 transition"
              >
                <div className="text-xs text-primary font-semibold">{r.category}</div>
                <div className="font-display font-bold mt-1 line-clamp-2">{r.title}</div>
                <div className="mt-2 text-xs text-muted-foreground">{r.bettors} apostadores · {timeLeft(r.closesAt)}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? "font-display font-black text-gradient-brand" : "font-semibold"}>{value}</span>
    </div>
  );
}
