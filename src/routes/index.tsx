import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Flame, Sparkles, TrendingUp, Clock } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PredictionCard } from "@/components/PredictionCard";
import { CATEGORIES, PREDICTIONS } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EU ACHO QUE VAI DAR @#& — Aposte com seus amigos" },
      {
        name: "description",
        content:
          "Rede social de previsões com Tokens virtuais. Crie palpites, aposte com amigos, suba no ranking. Fase de testes.",
      },
      { property: "og:title", content: "EU ACHO QUE VAI DAR @#&" },
      { property: "og:description", content: "Aposte com seus amigos na nossa fase de testes." },
    ],
  }),
  component: Feed,
});

type Sort = "trending" | "new" | "popular" | "closing";

function Feed() {
  const [cat, setCat] = useState<string>("Todas");
  const [sort, setSort] = useState<Sort>("trending");

  const items = useMemo(() => {
    let list = [...PREDICTIONS];
    if (cat !== "Todas") list = list.filter((p) => p.category === cat);
    switch (sort) {
      case "new":
        list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
        break;
      case "popular":
        list.sort((a, b) => b.bettors - a.bettors);
        break;
      case "closing":
        list.sort((a, b) => +new Date(a.closesAt) - +new Date(b.closesAt));
        break;
      default:
        list.sort((a, b) => Number(!!b.hot) - Number(!!a.hot) || b.likes - a.likes);
    }
    return list;
  }, [cat, sort]);

  const sorts: { key: Sort; label: string; icon: typeof Flame }[] = [
    { key: "trending", label: "Em alta", icon: Flame },
    { key: "new", label: "Novas", icon: Sparkles },
    { key: "popular", label: "Mais apostadas", icon: TrendingUp },
    { key: "closing", label: "Encerrando", icon: Clock },
  ];

  return (
    <AppShell>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 glass-card p-6 sm:p-10 mb-8">
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/15 text-destructive text-xs font-bold border border-destructive/30">
            <Flame className="h-3 w-3" /> FASE DE TESTES · TOKENS VIRTUAIS
          </span>
          <h1 className="mt-4 font-display text-4xl sm:text-6xl font-black leading-[0.95]">
            Eu acho que <span className="text-gradient-brand">vai dar</span>{" "}
            <span className="text-destructive">@#&amp;</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl">
            Aposte com seus amigos em previsões malucas da Copa, política, tecnologia,
            aliens e mais. <span className="text-gold font-semibold">Sem dinheiro real</span> —
            só Tokens, ranking e bragging rights.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#feed"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-gradient-brand text-primary-foreground font-bold shadow-glow hover:scale-[1.02] transition"
            >
              Explorar previsões
            </a>
            <a
              href="/missoes"
              className="inline-flex items-center gap-2 h-11 px-5 rounded-full border border-gold/60 text-gold font-bold hover:bg-gold/10 transition"
            >
              Ganhar Tokens grátis
            </a>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
            {[
              { k: "+1.000", v: "Tokens grátis" },
              { k: "47", v: "Previsões ativas" },
              { k: "Top 10", v: "Ranking semanal" },
            ].map((s) => (
              <div key={s.v} className="rounded-xl bg-background/40 border border-border/60 px-3 py-2">
                <div className="font-display text-lg font-black text-gradient-brand">{s.k}</div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section id="feed" className="mb-4 flex items-center gap-2 overflow-x-auto -mx-4 px-4 pb-2">
        {sorts.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSort(key)}
            className={`shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-bold border transition ${
              sort === key
                ? "bg-gradient-brand text-primary-foreground border-transparent shadow-glow"
                : "bg-card text-muted-foreground border-border/60 hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </section>

      <section className="mb-6 flex items-center gap-2 overflow-x-auto -mx-4 px-4 pb-2">
        {["Todas", ...CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`shrink-0 h-8 px-3 rounded-full text-xs font-medium border transition ${
              cat === c
                ? "border-gold text-gold bg-gold/10"
                : "border-border/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {items.map((p) => (
          <PredictionCard key={p.id} prediction={p} />
        ))}
      </section>
    </AppShell>
  );
}
