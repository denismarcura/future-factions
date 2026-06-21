import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Flame, Sparkles, TrendingUp, Clock, ShoppingBag, Trophy, Coins, Gift, Users, Zap, Diamond, Building2 } from "lucide-react";
import imgCampeao from "@/assets/dd-campeao.jpg";
import imgMalucos from "@/assets/pm-soccer.jpg";
import imgAlien from "@/assets/cat-alienigenas.jpg";
import bannerNaoGaste from "@/assets/banner-nao-gaste.png.asset.json";

import { AppShell } from "@/components/layout/AppShell";
import { PredictionCard } from "@/components/PredictionCard";
import { CATEGORIES, PREDICTIONS } from "@/lib/mock-data";
import { listActiveBanners, type Banner } from "@/lib/banners";
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
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    setBanners(listActiveBanners());
  }, []);

  const closingSoon = useMemo(() => {
    const now = Date.now();
    return [...PREDICTIONS]
      .filter((p) => new Date(p.closesAt).getTime() > now)
      .sort((a, b) => +new Date(a.closesAt) - +new Date(b.closesAt))
      .slice(0, 2);
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

      {/* Banners promocionais */}
      <section className="mb-8">
        <Link
          to="/desafios"
          className="group block overflow-hidden rounded-2xl border border-border/60 hover:border-primary/60 hover:shadow-glow transition"
        >
          <img
            src={bannerNaoGaste.url}
            alt="Não gaste R$ 1 real em palpites"
            className="w-full h-auto object-cover group-hover:scale-[1.02] transition duration-500"
            loading="lazy"
          />
        </Link>
      </section>

      {/* Banners cadastrados no admin */}
      {banners.length > 0 && (
        <section className="mb-8 grid gap-4 sm:grid-cols-2">
          {banners.map((b) => {
            const href = b.challengeId ? `/previsao/${b.challengeId}` : (b.ctaLink || "/desafios");
            return (
              <Link
                key={b.id}
                to={href}
                className="group relative block overflow-hidden rounded-2xl border border-border/60 glass-card hover:border-primary/60 hover:shadow-glow transition"
              >
                <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
                  <img
                    src={b.imageUrl}
                    alt={b.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                  {b.isMain && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/20 text-gold text-[10px] font-black uppercase border border-gold/40 mb-2">
                      <Sparkles className="h-3 w-3" /> Destaque
                    </span>
                  )}
                  <div className="font-display text-lg sm:text-xl font-black leading-tight">{b.title}</div>
                  {b.subtitle && (
                    <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{b.subtitle}</div>
                  )}
                  {b.ctaLabel && (
                    <span className="mt-3 inline-flex items-center justify-center h-9 px-4 rounded-full bg-gradient-brand text-primary-foreground text-xs font-black uppercase shadow-glow">
                      {b.ctaLabel} →
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </section>
      )}

      {/* Desafios mais recentes */}
      <section className="mb-8">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-primary font-bold">
              <Sparkles className="h-3.5 w-3.5" /> Novidades
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black">Desafios mais recentes</h2>
          </div>
          <Link to="/desafios" className="text-xs font-bold text-primary hover:underline shrink-0">
            Ver todos →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...PREDICTIONS]
            .filter((p) => new Date(p.closesAt).getTime() > Date.now())
            .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
            .slice(0, 6)
            .map((p) => (
              <PredictionCard key={p.id} prediction={p} />
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

      {/* Categorias em destaque */}
      <section className="mb-8">
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-primary font-bold">
            <Sparkles className="h-3.5 w-3.5" /> Explore
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-black">Categorias em destaque</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              to: "/desafios",
              label: "Desafios Diamantes",
              desc: "Prêmios exclusivos e alta recompensa",
              image: imgCampeao,
              icon: Diamond,
              accent: "text-gold",
            },
            {
              to: "/desafios",
              label: "Palpites Malucos da Copa",
              desc: "Apostas inusitadas para a Copa 2026",
              image: imgMalucos,
              icon: Trophy,
              accent: "text-primary",
            },
            {
              to: "/desafios",
              label: "Alienígenas",
              desc: "Mistérios e teorias extraterrestres",
              image: imgAlien,
              icon: Zap,
              accent: "text-gold",
            },
            {
              to: "/empresas",
              label: "Empresas",
              desc: "Desafios corporativos e promoções",
              image: null,
              icon: Building2,
              accent: "text-primary",
            },
          ].map((c) => (
            <Link
              key={c.label}
              to={c.to}
              className="group relative block overflow-hidden rounded-2xl border border-border/60 hover:border-primary/50 hover:shadow-glow transition"
            >
              {c.image ? (
                <div className="aspect-[16/10] w-full overflow-hidden">
                  <img
                    src={c.image}
                    alt={c.label}
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/50 to-transparent" />
                </div>
              ) : (
                <div className="aspect-[16/10] w-full bg-gradient-to-br from-primary/15 to-gold/10" />
              )}
              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <c.icon className={`h-4 w-4 ${c.accent} shrink-0`} />
                  <div className="font-display font-bold text-sm sm:text-base truncate">{c.label}</div>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{c.desc}</div>
              </div>
            </Link>
          ))}
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
