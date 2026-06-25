import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Flame, Sparkles, TrendingUp, Clock, ShoppingBag, Trophy, Coins, Gift, Users, Zap, Diamond, Building2, Search, Loader2, X, Timer, ChevronLeft, ChevronRight, Star, Calendar, Box, Heart, PartyPopper } from "lucide-react";


import { AppShell } from "@/components/layout/AppShell";
import { PredictionCard } from "@/components/PredictionCard";
import { CATEGORIES, PREDICTIONS, type Prediction } from "@/lib/mock-data";
import { getUserChallenges } from "@/lib/user-challenges";
import { useParticipatedChallengeIds } from "@/hooks/use-participated";
import { listActiveBanners, type Banner } from "@/lib/banners";
import { listActiveBottomBanners, type BottomBanner } from "@/lib/bottom-banners";
import { aiSearchChallenges } from "@/lib/search-ai.functions";
import { listLatestCorpChallenges, type CorpChallengeRecord } from "@/lib/corp-challenges.functions";
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

function Feed() {

  const [banners, setBanners] = useState<Banner[]>([]);
  const [bottomBanners, setBottomBanners] = useState<BottomBanner[]>([]);
  const [userChallenges, setUserChallenges] = useState<Prediction[]>([]);
  const [mounted, setMounted] = useState(false);
  const [corpChallenges, setCorpChallenges] = useState<CorpChallengeRecord[]>([]);
  const [corpPage, setCorpPage] = useState(0);
  const [nowTs, setNowTs] = useState<number>(0);
  const fetchCorp = useServerFn(listLatestCorpChallenges);
  const participatedIds = useParticipatedChallengeIds();
  const notParticipated = <T extends { id: string }>(p: T) => !participatedIds.has(String(p.id));

  useEffect(() => {
    setMounted(true);
    setNowTs(Date.now());
    setBanners(listActiveBanners());
    setBottomBanners(listActiveBottomBanners());
    setUserChallenges(getUserChallenges());
    const onUpdate = () => setUserChallenges(getUserChallenges());
    window.addEventListener("ddp:user-challenges-updated", onUpdate);
    fetchCorp({ data: { limit: 50 } }).then(setCorpChallenges).catch(() => {});
    const interval = setInterval(() => setNowTs(Date.now()), 60_000);
    return () => {
      window.removeEventListener("ddp:user-challenges-updated", onUpdate);
      clearInterval(interval);
    };
  }, [fetchCorp]);

  // Sort: closest endsAt first, then most recently created
  const sortedCorp = useMemo(() => {
    const arr = [...corpChallenges];
    arr.sort((a, b) => {
      const aEnd = a.endsAt ? new Date(a.endsAt).getTime() : Infinity;
      const bEnd = b.endsAt ? new Date(b.endsAt).getTime() : Infinity;
      if (aEnd !== bEnd) return aEnd - bEnd;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return arr;
  }, [corpChallenges]);

  const corpPerPage = 6;
  const corpTotalPages = Math.max(1, Math.ceil(sortedCorp.length / corpPerPage));
  const corpPageItems = sortedCorp.slice(corpPage * corpPerPage, corpPage * corpPerPage + corpPerPage);

  const formatTimeLeft = (endsAt: string | null) => {
    if (!endsAt) return null;
    const diff = new Date(endsAt).getTime() - nowTs;
    if (diff <= 0) return "Encerrado";
    const d = Math.floor(diff / 86_400_000);
    const h = Math.floor((diff % 86_400_000) / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };


  const closingSoon = useMemo(() => {
    const now = mounted ? Date.now() : 0;
    return [...PREDICTIONS]
      .filter((p) => new Date(p.closesAt).getTime() > now)
      .filter(notParticipated)
      .sort((a, b) => +new Date(a.closesAt) - +new Date(b.closesAt))
      .slice(0, 2);
  }, [participatedIds, mounted]);




  return (
    <AppShell>
      {/* Hero banner — focada em conversão */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-primary/30 glass-card p-4 sm:p-10 mb-5 sm:mb-8 text-center">
        <div className="absolute -top-24 -right-20 h-80 w-80 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />

        <div className="relative max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-[10px] sm:text-xs font-bold border border-primary/30">
            <Flame className="h-3 w-3" /> 100% GRATUITO · GANHE PRÊMIOS REAIS
          </span>

          <h1 className="mt-3 sm:mt-5 font-display text-2xl sm:text-6xl lg:text-7xl font-black leading-[1.05] sm:leading-[0.95]">
            <span className="text-gradient-brand">Crie desafios, dê palpites</span><br />
            <span className="text-gradient-gold">e ganhe prêmios</span>
          </h1>

          <p className="mt-2 sm:mt-4 text-xs sm:text-lg text-muted-foreground max-w-xl mx-auto">
            Totalmente gratuito. Complete missões, convide amigos e acumule tokens.
          </p>

          {/* Benefícios — só em telas maiores */}
          <div className="hidden sm:grid mt-6 grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 max-w-2xl mx-auto">
            {[
              { icon: TrendingUp, text: "100+ desafios ativos" },
              { icon: Sparkles, text: "Totalmente gratuito" },
              { icon: Trophy, text: "Ranking nacional" },
              { icon: Users, text: "Convide e ganhe tokens" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-1.5 sm:gap-2 text-left rounded-lg sm:rounded-xl bg-background/40 border border-border/60 px-2 sm:px-3 py-1.5 sm:py-2.5">
                <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                <span className="text-[10px] sm:text-xs font-bold text-foreground leading-tight">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Botões principais */}
          <div className="mt-5 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <Link
              to="/desafios"
              className="inline-flex items-center justify-center gap-2 h-12 sm:h-16 px-7 sm:px-10 rounded-full bg-gradient-brand text-primary-foreground text-base sm:text-xl font-black uppercase tracking-wide shadow-glow hover:scale-[1.03] transition"
            >
              Participar Agora
            </Link>
            <Link
              to="/como-funciona"
              className="inline-flex items-center justify-center gap-2 h-12 sm:h-16 px-7 sm:px-10 rounded-full border-2 border-gold text-gold bg-gold/5 text-base sm:text-xl font-black uppercase tracking-wide hover:bg-gold/15 hover:scale-[1.03] transition"
            >
              Como Funciona
            </Link>
          </div>

          {/* Stats — só em telas maiores */}
          <div className="hidden sm:grid mt-8 grid-cols-3 gap-2 sm:gap-3 max-w-md mx-auto">
            {[
              { k: "+1.000", v: "Tokens grátis", icon: Coins },
              { k: "150+", v: "Desafios ativos", icon: TrendingUp },
              { k: "50+", v: "Prêmios reais", icon: Gift },
            ].map((s) => (
              <div key={s.v} className="rounded-lg sm:rounded-xl bg-background/40 border border-border/60 px-2 sm:px-3 py-1.5 sm:py-2.5">
                <div className="font-display text-sm sm:text-lg font-black text-gradient-brand">{s.k}</div>
                <div className="text-[9px] sm:text-[11px] uppercase tracking-wider text-muted-foreground leading-tight">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Banners inferiores (cadastrados no admin) */}
      {bottomBanners.length > 0 && (
        <section className="mb-8 grid gap-4 sm:grid-cols-2">
          {bottomBanners.map((b) => {
            const img = (
              <img
                src={b.imageUrl}
                alt={b.alt ?? "Banner"}
                width={800}
                height={350}
                loading="lazy"
                decoding="async"
                className="w-full h-auto block rounded-2xl border border-border/60"
              />
            );
            return b.link ? (
              <a
                key={b.id}
                href={b.link}
                target={b.link.startsWith("http") ? "_blank" : undefined}
                rel={b.link.startsWith("http") ? "noopener noreferrer" : undefined}
                className="block hover:opacity-95 transition"
              >
                {img}
              </a>
            ) : (
              <div key={b.id}>{img}</div>
            );
          })}
        </section>
      )}

      {/* Como Funciona — 4 passos */}
      <section className="mb-8">
        <div className="mb-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-primary font-bold">
            <Sparkles className="h-3.5 w-3.5" /> Em 4 passos
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-black">Como Funciona</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { n: 1, t: "Escolha um desafio", d: "Esportes, reality, cripto e mais.", icon: TrendingUp },
            { n: 2, t: "Dê seu palpite", d: "Use seus tokens grátis.", icon: Sparkles },
            { n: 3, t: "Ganhe tokens em missões", d: "+50 TKN por missão.", icon: Trophy },
            { n: 4, t: "Troque por prêmios", d: "Vitrine com prêmios reais.", icon: Gift },
          ].map((step) => (
            <div key={step.n} className="rounded-2xl border border-border/60 glass-card p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="grid place-items-center h-7 w-7 rounded-full bg-gradient-brand text-primary-foreground text-xs font-black shrink-0">{step.n}</span>
                <step.icon className="h-4 w-4 text-gold" />
              </div>
              <div className="font-display text-sm sm:text-base font-black leading-tight">{step.t}</div>
              <div className="text-[11px] sm:text-xs text-muted-foreground leading-snug">{step.d}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-center text-[11px] text-muted-foreground">
          ⚠️ Tokens expiram em 12 meses.
        </div>
      </section>

      {/* O que são Tokens */}
      <section className="mb-8 rounded-2xl border border-gold/30 glass-card p-5 sm:p-7 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gold/15 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-gold font-bold">
            <Coins className="h-3.5 w-3.5" /> Recompensa gratuita
          </div>
          <h2 className="mt-1 font-display text-xl sm:text-3xl font-black">O que são Tokens?</h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl">
            Tokens são recompensas gratuitas que você usa para participar de desafios, fazer mais palpites e trocar por prêmios reais.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <Link
              to="/missoes"
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-gradient-brand text-primary-foreground text-sm font-black uppercase shadow-glow"
            >
              <Coins className="h-4 w-4" /> Ganhar Tokens
            </Link>
            <Link
              to="/shop"
              className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full border-2 border-gold text-gold bg-gold/5 text-sm font-black uppercase hover:bg-gold/15"
            >
              <Gift className="h-4 w-4" /> Ver Prêmios
            </Link>
          </div>
        </div>
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

      {/* Busca inteligente */}
      <SmartSearch corpChallenges={sortedCorp} />

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
            .filter((p) => new Date(p.closesAt).getTime() > (mounted ? Date.now() : 0))
            .filter(notParticipated)
            .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
            .slice(0, 6)
            .map((p) => (
              <PredictionCard key={p.id} prediction={p} hideOptions />
            ))}
        </div>
      </section>

      {/* Desafios criados por pessoas */}
      {userChallenges.filter((p) => !p.tags?.includes("link-apenas") && new Date(p.closesAt).getTime() > Date.now()).filter(notParticipated).length > 0 && (
        <section className="mb-8">
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-primary font-bold">
                <Users className="h-3.5 w-3.5" /> Comunidade
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-black">Desafios criados por pessoas</h2>
              <p className="text-sm text-muted-foreground">Desafios públicos criados por usuários da plataforma.</p>
            </div>
            <Link to="/criar" className="text-xs font-bold text-primary hover:underline shrink-0">
              Criar o meu →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {userChallenges
              .filter((p) => !p.tags?.includes("link-apenas") && new Date(p.closesAt).getTime() > Date.now())
              .filter(notParticipated)
              .slice(0, 6)
              .map((p) => (
                <PredictionCard key={p.id} prediction={p} hideOptions />
              ))}
          </div>
        </section>
      )}


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

      {/* Empresas em destaque */}
      {sortedCorp.length > 0 && (
        <section className="mb-8">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-gold font-bold">
                <Star className="h-3.5 w-3.5 fill-gold" /> Patrocinados
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-black">Empresas em destaque</h2>
            </div>
            <Link to="/desafios" className="text-xs sm:text-sm font-bold text-gold hover:underline shrink-0">
              Ver todos →
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {corpPageItems.map((c, idx) => {
              const isFirst = corpPage === 0 && idx === 0;
              const timeLabel = formatTimeLeft(c.endsAt);
              return (
                <Link
                  key={c.id}
                  to="/previsao/$id"
                  params={{ id: c.id }}
                  className={`group relative block overflow-hidden rounded-2xl border transition ${
                    isFirst
                      ? "border-gold/60 bg-gradient-to-br from-gold/15 via-card to-card shadow-glow"
                      : "border-border/60 bg-card hover:border-gold/50 hover:shadow-glow"
                  }`}
                >
                  {c.bannerUrl ? (
                    <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
                      <img
                        src={c.bannerUrl}
                        alt={c.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/9] w-full bg-gradient-to-br from-gold/15 to-primary/10 grid place-items-center">
                      <Building2 className="h-10 w-10 text-gold/60" />
                    </div>
                  )}

                  {isFirst && mounted && timeLabel && (
                    <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-black uppercase tracking-wider shadow-lg">
                      <Timer className="h-3 w-3" /> Encerra em {timeLabel}
                    </div>
                  )}
                  {!isFirst && mounted && timeLabel && timeLabel !== "Encerrado" && (
                    <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/85 backdrop-blur text-[10px] font-bold text-foreground">
                      <Clock className="h-3 w-3 text-gold" /> {timeLabel}
                    </div>
                  )}

                  <div className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      {c.logoUrl ? (
                        <img src={c.logoUrl} alt="" className="h-7 w-7 rounded-lg object-cover border border-border/60 shrink-0" />
                      ) : (
                        <div className="h-7 w-7 rounded-lg bg-gold/15 grid place-items-center text-gold font-black text-xs shrink-0">
                          {(c.companyName ?? c.title).slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="text-[11px] font-bold text-gold truncate">{c.companyName ?? "Empresa"}</div>
                    </div>
                    <h3 className="font-display font-bold text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-gold transition">
                      {c.title}
                    </h3>
                    {c.prizeName && (
                      <div className="mt-1.5 text-xs text-muted-foreground line-clamp-1">🎁 {c.prizeName}</div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {corpTotalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setCorpPage((p) => Math.max(0, p - 1))}
                disabled={corpPage === 0}
                className="h-9 w-9 grid place-items-center rounded-full border border-border/60 bg-card text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: corpTotalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCorpPage(i)}
                    className={`h-8 min-w-8 px-2 rounded-full text-xs font-bold transition ${
                      i === corpPage
                        ? "bg-gradient-brand text-primary-foreground shadow-glow"
                        : "bg-card text-muted-foreground border border-border/60 hover:text-foreground"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCorpPage((p) => Math.min(corpTotalPages - 1, p + 1))}
                disabled={corpPage >= corpTotalPages - 1}
                className="h-9 w-9 grid place-items-center rounded-full border border-border/60 bg-card text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Próxima página"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </section>
      )}



    </AppShell>
  );
}

function SmartSearch({ corpChallenges }: { corpChallenges: CorpChallengeRecord[] }) {
  const aiSearch = useServerFn(aiSearchChallenges);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const query = q.trim();
    if (!query) return;
    setLoading(true);
    setError(null);
    try {
      const predItems = PREDICTIONS.slice(0, 80).map((p) => ({
        id: `pred:${p.id}`,
        title: p.title,
        category: p.category,
      }));
      const corpItems = corpChallenges.slice(0, 80).map((c) => ({
        id: `corp:${c.id}`,
        title: `${c.title}${c.companyName ? " — " + c.companyName : ""}`,
        category: "Empresa",
      }));
      const items = [...corpItems, ...predItems];
      const res = await aiSearch({ data: { query, items } });
      setResults(res.ids);
    } catch (err) {
      console.error(err);
      setError("Não foi possível buscar agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setQ("");
    setResults(null);
    setError(null);
  };

  type FoundItem =
    | { kind: "pred"; id: string; title: string; category: string }
    | { kind: "corp"; id: string; title: string; companyName: string | null; logoUrl: string | null; bannerUrl: string | null; prizeName: string | null };

  const found: FoundItem[] = results
    ? (results
        .map((id): FoundItem | null => {
          if (id.startsWith("corp:")) {
            const c = corpChallenges.find((x) => x.id === id.slice(5));
            if (!c) return null;
            return {
              kind: "corp",
              id: c.id,
              title: c.title,
              companyName: c.companyName ?? null,
              logoUrl: c.logoUrl ?? null,
              bannerUrl: c.bannerUrl ?? null,
              prizeName: c.prizeName ?? null,
            };
          }
          const pid = id.startsWith("pred:") ? id.slice(5) : id;
          const p = PREDICTIONS.find((x) => x.id === pid);
          if (!p) return null;
          return { kind: "pred", id: p.id, title: p.title, category: p.category };
        })
        .filter((x): x is FoundItem => !!x)
        .slice(0, 12))
    : [];

  return (
    <section className="mb-8">
      <div className="relative overflow-hidden rounded-2xl border border-primary/30 glass-card p-4 sm:p-5">
        <div className="absolute -top-16 -right-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-[10px] sm:text-xs font-black uppercase tracking-wider border border-primary/30">
              <Sparkles className="h-3 w-3" /> Busca inteligente
            </span>
            <span className="text-[11px] text-muted-foreground hidden sm:block">
              Diga em linguagem natural o que procura
            </span>
          </div>

          <form onSubmit={submit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ex.: Casa di Napoli, Copa, futebol..."
                className="w-full h-11 sm:h-12 pl-9 pr-9 rounded-full bg-background/70 border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
              {q && (
                <button
                  type="button"
                  onClick={clear}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center rounded-full hover:bg-muted"
                  aria-label="Limpar"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || !q.trim()}
              className="h-11 sm:h-12 px-4 sm:px-5 rounded-full bg-gradient-brand text-primary-foreground text-sm font-black uppercase tracking-wide shadow-glow disabled:opacity-50 inline-flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="hidden sm:inline">Buscar</span>
            </button>
          </form>

          {error && (
            <p className="mt-3 text-xs text-destructive">{error}</p>
          )}

          {results && !loading && (
            <div className="mt-4">
              {found.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum desafio encontrado. Tente outras palavras.</p>
              ) : (
                <>
                  <div className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                    {found.length} resultado{found.length > 1 ? "s" : ""}
                  </div>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {found.map((item) =>
                      item.kind === "corp" ? (
                        <li key={`corp-${item.id}`}>
                          <Link
                            to="/previsao/$id"
                            params={{ id: item.id }}
                            className="flex items-center gap-3 p-3 rounded-xl border border-gold/40 bg-gold/5 hover:border-gold hover:shadow-glow transition"
                          >
                            {item.logoUrl ? (
                              <img src={item.logoUrl} alt="" className="h-10 w-10 rounded-lg object-cover border border-border/60 shrink-0" />
                            ) : item.bannerUrl ? (
                              <img src={item.bannerUrl} alt="" className="h-10 w-10 rounded-lg object-cover border border-border/60 shrink-0" />
                            ) : (
                              <span className="h-10 w-10 rounded-lg bg-gold/15 text-gold grid place-items-center shrink-0">
                                <Building2 className="h-5 w-5" />
                              </span>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-black uppercase tracking-wider text-gold bg-gold/15 px-1.5 py-0.5 rounded">Patrocinado</span>
                                {item.companyName && (
                                  <span className="text-[11px] font-bold text-gold truncate">{item.companyName}</span>
                                )}
                              </div>
                              <div className="text-sm font-semibold truncate">{item.title}</div>
                              {item.prizeName && (
                                <div className="text-[11px] text-muted-foreground truncate">🎁 {item.prizeName}</div>
                              )}
                            </div>
                            <span className="text-[11px] font-bold text-gold shrink-0">Abrir →</span>
                          </Link>
                        </li>
                      ) : (
                        <li key={`pred-${item.id}`}>
                          <Link
                            to="/previsao/$id"
                            params={{ id: item.id }}
                            className="flex items-center gap-3 p-3 rounded-xl border border-border/60 hover:border-primary/60 hover:bg-card transition"
                          >
                            <span className="h-10 w-10 rounded-lg bg-primary/15 text-primary grid place-items-center shrink-0">
                              <Trophy className="h-5 w-5" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold truncate">{item.title}</div>
                              <div className="text-[11px] text-muted-foreground truncate">{item.category}</div>
                            </div>
                            <span className="text-[11px] font-bold text-primary shrink-0">Abrir →</span>
                          </Link>
                        </li>
                      ),
                    )}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}


