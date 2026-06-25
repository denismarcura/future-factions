import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Box, Coins, Flame, Gift, Sparkles, Timer, Trophy } from "lucide-react";
import {
  getMysteryBoxStatus,
  openMysteryBox,
  type MysteryBoxResult,
} from "@/lib/mystery-box.functions";

export const Route = createFileRoute("/_authenticated/caixa-misteriosa")({
  head: () => ({
    meta: [
      { title: "Caixa Misteriosa — Desafio dos Palpites" },
      {
        name: "description",
        content:
          "Abra a Caixa Misteriosa a cada 24h e ganhe de 100 a 500 tokens. Acumule 30 dias seguidos e leve 20.000 tokens!",
      },
    ],
  }),
  component: MysteryBoxPage,
  errorComponent: ({ error }) => (
    <div className="container py-12 text-center text-sm text-muted-foreground">
      Erro: {(error as Error).message}
    </div>
  ),
  notFoundComponent: () => <div className="container py-12">Página não encontrada.</div>,
});

function fmtHMS(ms: number) {
  if (ms <= 0) return "00:00:00";
  const t = Math.floor(ms / 1000);
  const h = String(Math.floor(t / 3600)).padStart(2, "0");
  const m = String(Math.floor((t % 3600) / 60)).padStart(2, "0");
  const s = String(t % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function MysteryBoxPage() {
  const fetchStatus = useServerFn(getMysteryBoxStatus);
  const openBox = useServerFn(openMysteryBox);

  const [nextAvailable, setNextAvailable] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [totalOpens, setTotalOpens] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [opening, setOpening] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [result, setResult] = useState<MysteryBoxResult | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const refresh = async () => {
    const s = await fetchStatus();
    setNextAvailable(s.nextAvailableAt);
    setStreak(s.currentStreak);
    setTotalOpens(s.totalOpens);
  };

  useEffect(() => {
    refresh().catch(() => undefined);
  }, []);

  const msLeft = useMemo(() => {
    if (!nextAvailable) return 0;
    return Math.max(0, new Date(nextAvailable).getTime() - now);
  }, [nextAvailable, now]);

  const canOpen = msLeft <= 0;

  const handleOpen = async () => {
    if (!canOpen || opening) return;
    setOpening(true);
    setRevealing(true);
    setResult(null);
    try {
      // dramatic delay for the shake animation
      await new Promise((r) => setTimeout(r, 1400));
      const res = await openBox();
      setResult(res);
      if (res.ok) {
        toast.success(`🎉 Você ganhou ${res.tokens.toLocaleString("pt-BR")} tokens!`);
        setNextAvailable(res.nextAvailableAt);
        await refresh();
      } else {
        toast.error("Aguarde o cooldown para abrir novamente.");
        setNextAvailable(res.nextAvailableAt);
      }
    } catch (e) {
      toast.error("Erro ao abrir a caixa.");
      console.error(e);
    } finally {
      setOpening(false);
      setRevealing(false);
    }
  };

  const milestoneProgress = Math.min(100, ((streak || 0) / 30) * 100);

  return (
    <div className="container max-w-3xl py-8 md:py-12">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-500/40 bg-gradient-to-br from-purple-950/60 via-fuchsia-950/40 to-background p-6 md:p-10 mb-6">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-purple-500/30 blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl pointer-events-none" />
        <div className="relative flex items-center gap-2 mb-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-black uppercase tracking-wider">
            <Box className="h-3.5 w-3.5" /> Caixa Misteriosa
          </span>
          <Link to="/ranking-caixa-misteriosa" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/15 border border-gold/30 text-gold text-xs font-black uppercase tracking-wider hover:bg-gold/25 transition">
            🏆 Top 100 Fidelidade
          </Link>
        </div>
        <h1 className="relative text-3xl md:text-4xl font-black mb-2">
          Abra todos os dias e <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400">multiplique sua sorte</span>
        </h1>
        <p className="relative text-sm text-muted-foreground max-w-xl">
          Sorteie entre <b className="text-purple-300">100 e 500 tokens</b> a cada 24 horas. Quanto mais fiel, maior o bônus.
          Complete <b className="text-gold">30 dias seguidos</b> e ganhe <b className="text-gold">20.000 tokens</b>!
        </p>
      </div>

      {/* THE BOX */}
      <div className="relative rounded-3xl border border-purple-500/40 glass-card p-8 md:p-12 mb-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15),transparent_60%)] pointer-events-none" />

        <div className="relative flex flex-col items-center text-center">
          <button
            onClick={handleOpen}
            disabled={!canOpen || opening}
            className={`group relative h-44 w-44 md:h-52 md:w-52 grid place-items-center rounded-3xl select-none transition-all
              ${canOpen ? "cursor-pointer hover:scale-105" : "cursor-not-allowed opacity-70"}
              ${revealing ? "animate-bounce" : ""}
            `}
            aria-label="Abrir caixa misteriosa"
          >
            {/* glow */}
            {canOpen && (
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/40 to-fuchsia-500/40 blur-2xl animate-pulse" />
            )}
            {/* box */}
            <div
              className={`relative h-full w-full rounded-3xl bg-gradient-to-br from-purple-600 to-fuchsia-700 border-2 border-purple-300/60 shadow-2xl flex items-center justify-center text-7xl md:text-8xl
                ${canOpen ? "group-hover:rotate-3 transition-transform" : ""}
              `}
            >
              {revealing ? "✨" : result?.ok ? "🎉" : "🎁"}
              {canOpen && !revealing && (
                <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-300 animate-pulse" />
              )}
            </div>
          </button>

          {/* status */}
          <div className="mt-6 w-full max-w-md">
            {canOpen ? (
              <button
                onClick={handleOpen}
                disabled={opening}
                className="w-full h-12 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white font-black uppercase tracking-wider shadow-glow hover:scale-[1.02] transition-transform disabled:opacity-60"
              >
                {opening ? "Abrindo..." : "Abrir agora"}
              </button>
            ) : (
              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-4">
                <div className="flex items-center justify-center gap-2 text-purple-300 text-xs font-black uppercase tracking-wider mb-1">
                  <Timer className="h-4 w-4" /> Próxima abertura em
                </div>
                <div className="text-3xl md:text-4xl font-black font-mono text-purple-200 animate-pulse">
                  {fmtHMS(msLeft)}
                </div>
              </div>
            )}
          </div>

          {/* result */}
          {result?.ok && (
            <div className="mt-6 w-full max-w-md rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/10 to-amber-500/5 p-5 animate-fade-in">
              <div className="flex items-center justify-center gap-2 text-gold text-xs font-black uppercase tracking-wider mb-2">
                <Gift className="h-4 w-4" /> Você ganhou
              </div>
              <div className="text-center text-4xl font-black text-gold flex items-center justify-center gap-2">
                <Coins className="h-7 w-7" /> {result.tokens.toLocaleString("pt-BR")}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="rounded-lg bg-card/60 p-2">
                  <div className="text-muted-foreground">Base</div>
                  <div className="font-black">{result.base}</div>
                </div>
                <div className="rounded-lg bg-card/60 p-2">
                  <div className="text-muted-foreground">Fidelidade</div>
                  <div className="font-black text-purple-300">+{result.loyaltyBonus}</div>
                </div>
                <div className="rounded-lg bg-card/60 p-2">
                  <div className="text-muted-foreground">Milestone</div>
                  <div className="font-black text-gold">+{result.milestoneBonus}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* STREAK + MILESTONE */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div className="rounded-2xl border border-orange-500/30 glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="h-5 w-5 text-orange-400 animate-pulse" />
            <div className="text-xs uppercase tracking-wider font-black text-orange-300">Sequência atual</div>
          </div>
          <div className="text-4xl font-black text-orange-300">
            {streak} <span className="text-base text-muted-foreground font-bold">dias</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Abra dentro de 48h da última para manter a sequência viva.
          </p>
        </div>

        <div className="rounded-2xl border border-gold/40 glass-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-5 w-5 text-gold" />
            <div className="text-xs uppercase tracking-wider font-black text-gold">Meta 30 dias</div>
          </div>
          <div className="flex items-center justify-between mb-1">
            <div className="text-2xl font-black text-gold">20.000 tokens</div>
            <div className="text-[11px] font-mono text-muted-foreground">{streak}/30</div>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold to-amber-400 transition-all duration-700"
              style={{ width: `${milestoneProgress}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Faltam {Math.max(0, 30 - streak)} dias para o grande prêmio.
          </p>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="rounded-2xl border border-border/60 glass-card p-5">
        <div className="text-xs uppercase tracking-wider font-black text-muted-foreground mb-3">
          Como funciona
        </div>
        <ul className="space-y-2 text-sm">
          <li className="flex gap-2"><span className="text-purple-400 font-black">•</span> Você pode abrir a Caixa Misteriosa <b>1 vez a cada 24 horas</b>.</li>
          <li className="flex gap-2"><span className="text-purple-400 font-black">•</span> O prêmio base é um sorteio entre <b>100 e 500 tokens</b>.</li>
          <li className="flex gap-2"><span className="text-purple-400 font-black">•</span> A cada dia consecutivo ganha um <b>bônus de fidelidade</b> (+15 por dia, até +500).</li>
          <li className="flex gap-2"><span className="text-gold font-black">•</span> Completou <b>30 dias seguidos</b>? Leva <b>20.000 tokens</b> de bônus extra!</li>
          <li className="flex gap-2"><span className="text-purple-400 font-black">•</span> Total de aberturas: <b>{totalOpens}</b>.</li>
        </ul>
      </div>
    </div>
  );
}
