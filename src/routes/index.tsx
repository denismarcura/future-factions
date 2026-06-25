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
    const interval = setInterval(() => setNowTs(Date.now()), 1000);
    return () => {
      window.removeEventListener("ddp:user-challenges-updated", onUpdate);
      clearInterval(interval);
    };
  }, [fetchCorp]);

  // Countdown helpers (tick every second)
  const fmtHMS = (ms: number) => {
    if (ms <= 0) return "00:00:00";
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    const s = Math.floor((ms % 60_000) / 1000);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };
  const fmtDHMS = (ms: number) => {
    if (ms <= 0) return "Encerrado";
    const d = Math.floor(ms / 86_400_000);
    const rest = ms % 86_400_000;
    if (d > 0) return `${d}d ${fmtHMS(rest)}`;
    return fmtHMS(rest);
  };
  const msUntilMidnight = () => {
    if (!nowTs) return 0;
    const next = new Date(nowTs);
    next.setHours(24, 0, 0, 0);
    return next.getTime() - nowTs;
  };
  const msUntilSundayEnd = () => {
    if (!nowTs) return 0;
    const d = new Date(nowTs);
    const day = d.getDay();
    const daysToSun = day === 0 ? 0 : 7 - day;
    const target = new Date(d);
    target.setDate(d.getDate() + daysToSun);
    target.setHours(23, 59, 59, 999);
    return target.getTime() - nowTs;
  };
  const msUntilHappyHour = () => {
    if (!nowTs) return 0;
    const d = new Date(nowTs);
    const target = new Date(d);
    target.setHours(20, 0, 0, 0);
    if (target.getTime() <= nowTs) {
      const end = new Date(d); end.setHours(22, 0, 0, 0);
      if (nowTs < end.getTime()) return end.getTime() - nowTs;
      target.setDate(d.getDate() + 1);
    }
    return target.getTime() - nowTs;
  };
  const isHappyHourLive = () => {
    if (!nowTs) return false;
    const h = new Date(nowTs).getHours();
    return h >= 20 && h < 22;
  };

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

      {/* NOVIDADES — Desafios mais recentes (movido para o topo) */}
      <section className="mb-8">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-primary font-bold">
              <Sparkles className="h-3.5 w-3.5" /> Novidades
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black">Desafios mais recentes</h2>
            <p className="text-xs text-muted-foreground">Sempre atualizando.</p>
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

      {/* RECOMPENSA GRATUITA — 4 cards */}
      <section className="mb-8">
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-gold font-bold">
            <Gift className="h-3.5 w-3.5" /> Recompensa gratuita
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-black">Ganhe Tokens e prêmios</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* EVENTOS ESPECIAIS */}
        <div className="rounded-2xl border border-primary/30 glass-card p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-primary/15 grid place-items-center">
              <PartyPopper className="h-4 w-4 text-primary" />
            </div>
            <div className="text-[11px] uppercase tracking-wider font-black text-primary">Eventos Especiais</div>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3 leading-snug">Aproveite eventos limitados e ganhe mais Tokens!</p>
          <ul className="space-y-2 mb-3 flex-1">
            <li className="flex items-start gap-2">
              <Flame className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold leading-tight">Fim de Semana Premiado</div>
                <div className="text-[10px] text-muted-foreground">Tokens em dobro</div>
                {mounted && (
                  <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-destructive/15 text-destructive text-[9px] font-black font-mono">
                    <Timer className="h-2.5 w-2.5" /> {fmtDHMS(msUntilSundayEnd())}
                  </div>
                )}
              </div>
            </li>
            <li className="flex items-start gap-2">
              <Zap className="h-3.5 w-3.5 text-gold mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold leading-tight">Segunda Maluca</div>
                <div className="text-[10px] text-muted-foreground">Missões em dobro</div>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <Heart className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold leading-tight">Hora Feliz · 20h–22h</div>
                {mounted && (
                  isHappyHourLive() ? (
                    <div className="mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[9px] font-black font-mono animate-pulse">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> AO VIVO · termina em {fmtHMS(msUntilHappyHour())}
                    </div>
                  ) : (
                    <div className="mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-black font-mono">
                      <Clock className="h-2.5 w-2.5" /> começa em {fmtHMS(msUntilHappyHour())}
                    </div>
                  )
                )}
              </div>
            </li>
          </ul>
          <Link
            to="/missoes"
            className="inline-flex items-center justify-center h-9 px-3 rounded-full bg-gradient-brand text-primary-foreground text-[11px] font-black uppercase shadow-glow"
          >
            Ver todos os eventos
          </Link>
        </div>

        {/* PRESENTE DIÁRIO */}
        <div className="rounded-2xl border border-gold/40 glass-card p-4 flex flex-col relative overflow-hidden">
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gold/20 blur-3xl pointer-events-none" />
          <div className="relative flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-gold/15 grid place-items-center">
              <Gift className="h-4 w-4 text-gold" />
            </div>
            <div className="text-[11px] uppercase tracking-wider font-black text-gold">Presente Diário</div>
          </div>
          <div className="relative flex-1 flex flex-col items-center justify-center text-center my-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Hoje você ganha</div>
            <div className="font-display text-3xl font-black text-gradient-gold flex items-center gap-1.5">
              50 <Coins className="h-6 w-6 text-gold" />
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">Tokens grátis</div>
            {mounted && (
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/15 border border-gold/30 text-gold text-[10px] font-black font-mono">
                <Timer className="h-3 w-3" /> Reseta em {fmtHMS(msUntilMidnight())}
              </div>
            )}
          </div>
          <Link
            to="/perfil"
            className="relative inline-flex items-center justify-center h-9 px-3 rounded-full bg-gradient-to-r from-gold to-amber-400 text-background text-[11px] font-black uppercase shadow-glow"
          >
            Resgatar agora
          </Link>
          <div className="relative mt-2 text-center text-[10px] text-muted-foreground">
            🔥 Sequência: 12 dias
          </div>
        </div>

        {/* CAIXA MISTERIOSA */}
        <div className="rounded-2xl border border-purple-500/40 glass-card p-4 flex flex-col relative overflow-hidden">
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
          <div className="relative flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-purple-500/15 grid place-items-center">
              <Box className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-[11px] uppercase tracking-wider font-black text-purple-400">Caixa Misteriosa</div>
          </div>
          <p className="relative text-[11px] text-muted-foreground mb-2 leading-snug">Surpresas incríveis te esperam!</p>
          <div className="relative flex-1 flex flex-col items-center justify-center text-center my-2">
            <div className="text-4xl mb-1">🎁</div>
            <div className="text-[10px] text-muted-foreground">Pode conter de</div>
            <div className="text-sm font-black text-purple-300">20 até 5.000 Tokens</div>
            <div className="text-[10px] text-muted-foreground">ou prêmios especiais!</div>
            {mounted && (
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-black font-mono">
                <Timer className="h-3 w-3" /> Próxima grátis em {fmtHMS(msUntilMidnight())}
              </div>
            )}
          </div>
          <Link
            to="/shop"
            className="relative inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white text-[11px] font-black uppercase shadow-glow"
          >
            Abrir caixa <span className="inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded-full bg-black/30 text-[10px]"><Coins className="h-3 w-3" />1</span>
          </Link>
        </div>

        {/* CONVIDE E GANHE */}
        <div className="rounded-2xl border border-emerald-500/40 glass-card p-4 flex flex-col relative overflow-hidden">
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
          <div className="relative flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/15 grid place-items-center">
              <Users className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-[11px] uppercase tracking-wider font-black text-emerald-400">Convide e Ganhe</div>
          </div>
          <p className="relative text-[11px] text-muted-foreground mb-3 leading-snug">Convide amigos e ganhe prêmios!</p>
          {mounted && (
            <div className="relative mb-3 flex items-center justify-between gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-2 py-1.5">
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Campanha</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-black font-mono text-emerald-300">
                <Timer className="h-3 w-3" /> {fmtDHMS(msUntilSundayEnd())}
              </span>
            </div>
          )}
          <ul className="relative space-y-2 mb-3 flex-1">
            <li className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-emerald-500/15 text-emerald-400 grid place-items-center text-[10px] font-black shrink-0">1</span>
              <div className="text-[11px] min-w-0 flex-1">
                <span className="font-bold">Convide 1 amigo</span>
                <div className="text-[10px] text-gold font-bold">500 Tokens</div>
              </div>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-emerald-500/15 text-emerald-400 grid place-items-center text-[10px] font-black shrink-0">5</span>
              <div className="text-[11px] min-w-0 flex-1">
                <span className="font-bold">Convide 5 amigos</span>
                <div className="text-[10px] text-gold font-bold">Camisa Oficial 👕</div>
              </div>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-emerald-500/15 text-emerald-400 grid place-items-center text-[10px] font-black shrink-0">10</span>
              <div className="text-[11px] min-w-0 flex-1">
                <span className="font-bold">Convide 10 amigos</span>
                <div className="text-[10px] text-gold font-bold">PlayStation 5 🎮</div>
              </div>
            </li>
          </ul>
          <Link
            to="/convidar-amigos"
            className="inline-flex items-center justify-center h-9 px-3 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-white text-[11px] font-black uppercase shadow-glow"
          >
            Convidar amigos
          </Link>
        </div>
        </div>
      </section>

      {/* MISSÕES · DESTAQUES · RANKING — 3 colunas */}
      <ThreeColumnWidgets corpChallenges={sortedCorp} mounted={mounted} formatTimeLeft={formatTimeLeft} />

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

function ThreeColumnWidgets({
  corpChallenges,
  mounted,
  formatTimeLeft,
}: {
  corpChallenges: CorpChallengeRecord[];
  mounted: boolean;
  formatTimeLeft: (endsAt: string | null) => string | null;
}) {
  const featured = corpChallenges.slice(0, 4);

  const missions = [
    { t: "Fazer 3 palpites", p: 3, tot: 3, tk: 100 },
    { t: "Acertar 1 resultado", p: 1, tot: 1, tk: 150 },
    { t: "Participar de 2 desafios", p: 1, tot: 2, tk: 200 },
    { t: "Convidar 1 amigo", p: 0, tot: 1, tk: 150 },
    { t: "Fazer 5 palpites", p: 3, tot: 5, tk: 250 },
  ];

  const ranking = [
    { pos: 1, name: "Palpiteiro Pro", pts: "25.980" },
    { pos: 2, name: "Mestre dos Palpites", pts: "22.450" },
    { pos: 3, name: "Craque Visionário", pts: "21.300" },
    { pos: 4, name: "Gênio da Bola", pts: "18.670" },
    { pos: 5, name: "Palpiteiro Nato", pts: "17.890" },
  ];

  return (
    <section className="mb-8 grid gap-4 lg:grid-cols-3">
      {/* MISSÕES */}
      <div className="rounded-2xl border border-primary/30 glass-card p-4 flex flex-col">
        <div className="mb-3">
          <div className="text-[11px] uppercase tracking-wider text-primary font-black">Missões</div>
          <div className="text-xs text-muted-foreground">Complete missões e ganhe Tokens!</div>
        </div>
        <ul className="space-y-2.5 flex-1">
          {missions.map((m) => {
            const done = m.p >= m.tot;
            const pct = Math.min(100, (m.p / m.tot) * 100);
            return (
              <li key={m.t} className="flex items-center gap-2">
                <span className={`h-5 w-5 rounded grid place-items-center text-[10px] font-black shrink-0 ${done ? "bg-primary text-primary-foreground" : "border border-border/60 text-muted-foreground"}`}>
                  {done ? "✓" : ""}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold truncate">{m.t}</span>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">{m.p}/{m.tot}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-gradient-brand transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-gold shrink-0">
                  {m.tk} <Coins className="h-3 w-3" />
                </span>
              </li>
            );
          })}
        </ul>
        <Link to="/missoes" className="mt-3 inline-flex items-center justify-center h-9 px-3 rounded-full bg-gradient-brand text-primary-foreground text-[11px] font-black uppercase shadow-glow">
          Ver todas as missões
        </Link>
      </div>

      {/* DESAFIOS EM DESTAQUE */}
      <div className="rounded-2xl border border-gold/40 glass-card p-4 flex flex-col">
        <div className="mb-3 flex items-end justify-between gap-2">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-gold font-black">Desafios em destaque</div>
            <div className="text-xs text-muted-foreground">Participe dos principais ativos</div>
          </div>
          <Link to="/desafios" className="text-[10px] font-bold text-gold hover:underline shrink-0">Ver todos →</Link>
        </div>
        {featured.length === 0 ? (
          <div className="flex-1 grid place-items-center text-xs text-muted-foreground py-8">Nenhum desafio em destaque ainda.</div>
        ) : (
          <ul className="space-y-2 flex-1">
            {featured.map((c) => {
              const tl = formatTimeLeft(c.endsAt);
              return (
                <li key={c.id}>
                  <Link to="/previsao/$id" params={{ id: c.id }} className="flex items-center gap-2 p-2 rounded-xl border border-border/60 hover:border-gold/60 hover:bg-card transition">
                    {c.logoUrl ? (
                      <img src={c.logoUrl} alt="" className="h-9 w-9 rounded-lg object-cover border border-border/60 shrink-0" />
                    ) : (
                      <span className="h-9 w-9 rounded-lg bg-gold/15 text-gold grid place-items-center shrink-0">
                        <Building2 className="h-4 w-4" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate">{c.title}</div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {c.companyName ?? "Empresa"}
                        {mounted && tl && tl !== "Encerrado" && <> · <span className="text-gold font-bold">⏱ {tl}</span></>}
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-gold shrink-0 uppercase">Abrir</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* RANKING GERAL */}
      <div className="rounded-2xl border border-emerald-500/30 glass-card p-4 flex flex-col">
        <div className="mb-3 flex items-end justify-between gap-2">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-emerald-400 font-black">Ranking geral</div>
            <div className="text-xs text-muted-foreground">Veja os melhores palpiteiros</div>
          </div>
          <Link to="/top100" className="text-[10px] font-bold text-emerald-400 hover:underline shrink-0">Ver TOP 100 →</Link>
        </div>
        <ul className="space-y-2 flex-1">
          {ranking.map((r) => (
            <li key={r.pos} className="flex items-center gap-2 p-2 rounded-xl border border-border/60">
              <span className={`h-7 w-7 rounded-full grid place-items-center text-xs font-black shrink-0 ${
                r.pos === 1 ? "bg-gold/20 text-gold" : r.pos === 2 ? "bg-zinc-300/20 text-zinc-300" : r.pos === 3 ? "bg-amber-700/20 text-amber-500" : "bg-muted text-muted-foreground"
              }`}>
                {r.pos === 1 ? "🥇" : r.pos === 2 ? "🥈" : r.pos === 3 ? "🥉" : r.pos}
              </span>
              <span className="text-xs font-bold flex-1 truncate">{r.name}</span>
              <span className="text-xs font-mono font-black text-foreground shrink-0">{r.pts}</span>
            </li>
          ))}
        </ul>
        <Link to="/ranking" className="mt-3 inline-flex items-center justify-center h-9 px-3 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-white text-[11px] font-black uppercase shadow-glow">
          Ver ranking completo
        </Link>
      </div>
    </section>
  );
}



