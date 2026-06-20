import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Flame, Sparkles, TrendingUp, Clock, ShoppingBag, Trophy, Coins, Gift } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PredictionCard } from "@/components/PredictionCard";
import { CATEGORIES, PREDICTIONS } from "@/lib/mock-data";
import logoAsset from "@/assets/logo-desafio.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Desafio dos Palpites — Não gaste R$ 1 real em palpites" },
      {
        name: "description",
        content:
          "Participe gratuitamente de desafios, acumule Tokens e troque por prêmios incríveis. Crie palpites com amigos sobre futebol, UFC, NBA, criptos, reality shows e mais.",
      },
      { property: "og:title", content: "Desafio dos Palpites" },
      { property: "og:description", content: "100% gratuito. Acumule tokens e troque por prêmios reais." },
    ],
  }),
  component: Feed,
});

type Sort = "trending" | "new" | "popular" | "closing";

function Feed() {
  const [cat, setCat] = useState<string>("Todas");
  const [sort, setSort] = useState<Sort>("new");

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
    return list.slice(0, 24);
  }, [cat, sort]);

  const sorts: { key: Sort; label: string; icon: typeof Flame }[] = [
    { key: "trending", label: "Em alta", icon: Flame },
    { key: "new", label: "Novos", icon: Sparkles },
    { key: "popular", label: "Mais participados", icon: TrendingUp },
    { key: "closing", label: "Encerrando", icon: Clock },
  ];

  return (
    <AppShell>
      {/* Hero banner */}
      <section className="relative overflow-hidden rounded-3xl border border-primary/30 glass-card p-6 sm:p-10 mb-8">
        <div className="absolute -top-24 -right-20 h-80 w-80 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative grid lg:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold border border-primary/30">
              <Flame className="h-3 w-3" /> 100% GRATUITO · SÓ TOKENS VIRTUAIS
            </span>
            <h1 className="mt-4 font-display text-4xl sm:text-6xl font-black leading-[0.95]">
              <span className="text-gradient-brand">NÃO GASTE</span><br />
              <span className="text-gradient-silver">R$ 1 REAL</span> EM PALPITES!
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl">
              Participe gratuitamente de desafios, acumule Tokens e troque por
              <span className="text-gold font-semibold"> prêmios incríveis</span>.
              Futebol, UFC, NBA, criptos, reality, política e palpites entre amigos.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/desafios"
                className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-gradient-brand text-primary-foreground font-black uppercase tracking-wide shadow-glow hover:scale-[1.03] transition"
              >
                Quero participar
              </Link>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 h-12 px-6 rounded-full border border-gold/60 text-gold font-bold hover:bg-gold/10 transition"
              >
                <ShoppingBag className="h-4 w-4" /> Shop de prêmios
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
              {[
                { k: "+1.000", v: "Tokens grátis", icon: Coins },
                { k: "150+", v: "Desafios ativos", icon: TrendingUp },
                { k: "50+", v: "Prêmios reais", icon: Gift },
              ].map((s) => (
                <div key={s.v} className="rounded-xl bg-background/40 border border-border/60 px-3 py-2.5">
                  <div className="font-display text-lg font-black text-gradient-brand">{s.k}</div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:flex items-center justify-center">
            <img
              src={logoAsset.url}
              alt="Desafio dos Palpites"
              className="h-72 w-72 object-contain drop-shadow-[0_0_40px_rgba(0,230,118,0.45)]"
            />
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section className="mb-8 grid sm:grid-cols-3 gap-3">
        {[
          { to: "/ranking", label: "Ranking semanal", desc: "Veja os palpiteiros do topo", icon: Trophy, accent: "text-gold" },
          { to: "/top100", label: "Top 100", desc: "Os lendários da plataforma", icon: Trophy, accent: "text-gradient-silver" },
          { to: "/empresas", label: "Para empresas", desc: "Crie desafios e capte leads", icon: ShoppingBag, accent: "text-primary" },
        ].map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="group rounded-2xl border border-border/60 bg-card p-4 hover:border-primary/50 hover:shadow-glow transition flex items-center gap-3"
          >
            <c.icon className={`h-7 w-7 ${c.accent}`} />
            <div>
              <div className="font-display font-bold text-sm">{c.label}</div>
              <div className="text-xs text-muted-foreground">{c.desc}</div>
            </div>
          </Link>
        ))}
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

      <div className="mt-8 text-center">
        <Link
          to="/desafios"
          className="inline-flex items-center gap-2 h-11 px-6 rounded-full border border-primary/60 text-primary font-bold hover:bg-primary/10 transition"
        >
          Ver todos os desafios →
        </Link>
      </div>
    </AppShell>
  );
}
