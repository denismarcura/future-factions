import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Flame, Sparkles, TrendingUp, Clock, ShoppingBag, Trophy, Coins, Gift, Users, Zap } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PredictionCard } from "@/components/PredictionCard";
import { CATEGORIES, PREDICTIONS } from "@/lib/mock-data";
import { getUrgencyHours } from "@/components/ClosingTimerBadge";
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

  const closingSoon = useMemo(() => {
    const now = Date.now();
    return [...PREDICTIONS]
      .filter((p) => new Date(p.closesAt).getTime() > now)
      .sort((a, b) => +new Date(a.closesAt) - +new Date(b.closesAt))
      .slice(0, 4);
  }, []);

  const items = useMemo(() => {
    let list = [...PREDICTIONS];
    const isClosed = (p: typeof PREDICTIONS[number]) =>
      new Date(p.closesAt).getTime() < Date.now();
    if (cat === "Encerrados") {
      list = list.filter(isClosed);
    } else {
      list = list.filter((p) => !isClosed(p));
      if (cat !== "Todas") list = list.filter((p) => p.category === cat);
    }
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
      {/* Hero banner — focada em conversão */}
      <section className="relative overflow-hidden rounded-3xl border border-primary/30 glass-card p-6 sm:p-10 mb-8 text-center">
        <div className="absolute -top-24 -right-20 h-80 w-80 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />

        <div className="relative max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold border border-primary/30">
            <Flame className="h-3 w-3" /> 100% GRATUITO · GANHE PRÊMIOS REAIS
          </span>

          <h1 className="mt-5 font-display text-4xl sm:text-6xl lg:text-7xl font-black leading-[0.95]">
            <span className="text-gradient-brand">Ganhe Tokens</span><br />
            <span className="text-gradient-gold">e Troque por Prêmios Reais</span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            Participe gratuitamente de desafios, acumule Tokens e troque por prêmios incríveis.
          </p>

          {/* Benefícios */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {[
              { icon: TrendingUp, text: "Mais de 100 desafios ativos" },
              { icon: Sparkles, text: "Totalmente gratuito" },
              { icon: Trophy, text: "Ranking nacional" },
              { icon: Users, text: "Convide amigos e ganhe mais tokens" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-left rounded-xl bg-background/40 border border-border/60 px-3 py-2.5">
                <item.icon className="h-4 w-4 text-primary shrink-0" />
                <span className="text-xs font-bold text-foreground">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Botão gigante */}
          <div className="mt-8">
            <Link
              to="/desafios"
              className="inline-flex items-center justify-center gap-2 h-14 sm:h-16 px-8 sm:px-10 rounded-full bg-gradient-brand text-primary-foreground text-lg sm:text-xl font-black uppercase tracking-wide shadow-glow hover:scale-[1.03] transition"
            >
              COMEÇAR AGORA
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-md mx-auto">
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
      </section>

      {/* Encerrando em breve */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-black flex items-center gap-2">
            <Zap className="h-5 w-5 text-destructive" /> Encerrando em breve
          </h2>
          <Link
            to="/desafios"
            className="text-xs font-bold text-primary hover:underline"
          >
            Ver todos →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {closingSoon.map((p) => (
            <PredictionCard key={`closing-${p.id}`} prediction={p} />
          ))}
        </div>
      </section>

      {/* Destaque: Desafios para Empresas */}
      <section className="mb-6">
        <Link
          to="/desafios-empresas"
          className="group block rounded-2xl border border-gold/40 glass-card p-5 sm:p-6 hover:border-gold hover:shadow-glow transition relative overflow-hidden"
        >
          <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gold/20 blur-3xl" />
          <div className="relative flex flex-wrap items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gold/15 border border-gold/40 grid place-items-center">
                <Trophy className="h-6 w-6 text-gold" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-gold font-bold">NOVO · EMPRESAS</div>
                <div className="font-display font-black text-lg sm:text-xl">Desafio dos Palpites para Empresas</div>
                <div className="text-sm text-muted-foreground">Crie desafios personalizados, distribua prêmios e amplie sua marca.</div>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-gradient-brand text-primary-foreground text-xs font-black uppercase shadow-glow group-hover:scale-[1.03] transition">
              Saiba mais →
            </span>
          </div>
        </Link>
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
        {["Todas", ...CATEGORIES, "Encerrados"].map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`shrink-0 h-8 px-3 rounded-full text-xs font-medium border transition ${
              cat === c
                ? c === "Encerrados"
                  ? "border-destructive text-destructive bg-destructive/10"
                  : "border-gold text-gold bg-gold/10"
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
