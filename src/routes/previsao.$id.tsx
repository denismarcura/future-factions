import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Clock, Users, Flame, Heart, MessageCircle, Share2, Coins, TrendingUp, ArrowLeft, Instagram, Youtube, Facebook, Check, ExternalLink, Loader2, ScrollText, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { formatTokens, getPrediction, PREDICTIONS, USERS, type Prediction, type Category, timeLeft } from "@/lib/mock-data";
import { listMissions, listMyClaims, claimMission, type Mission, ACTION_LABEL } from "@/lib/missions";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { getCorpChallenge, type CorpChallengeRecord } from "@/lib/corp-challenges.functions";
import { detectMatchFromText } from "@/lib/world-cup-matches";

import { useAuth } from "@/hooks/use-auth";
import { hasParticipated, saveParticipation } from "@/lib/my-participations";
import { getTokenBalance } from "@/lib/balance";

function corpToPrediction(c: CorpChallengeRecord): Prediction {
  const first = c.subs[0];
  const labels = first?.options?.filter((o) => o && o.trim()) ?? ["Sim", "Não"];
  const subPredictions = c.subs
    .filter((s) => s.question?.trim())
    .map((s) => ({
      id: s.id,
      question: s.question,
      options: s.options.filter((o) => o && o.trim()),
    }));
  const match = detectMatchFromText(c.title) ?? undefined;
  return {
    id: c.id,
    title: c.title,
    description:
      c.description ??
      c.subs
        .map((s, i) => `${i + 1}. ${s.question} — ${s.options.filter(Boolean).join(" / ")}`)
        .join("  •  "),
    category: (c.category as Category) ?? ("Entretenimento" as Category),
    author: USERS[0],
    createdAt: c.createdAt,
    closesAt: c.endsAt ?? new Date(Date.now() + 7 * 86400000).toISOString(),
    minTokens: 10,
    entryFee: 10,
    options: labels.map((label, i) => ({ id: `o${i}`, label, pool: 0 })),
    subPredictions: subPredictions.length > 1 ? subPredictions : undefined,
    bettors: c.participants ?? 0,
    comments: 0,
    likes: 0,
    shares: 0,
    tags: ["empresa", "ativo"],
    hot: true,
    imageUrl: c.bannerUrl ?? c.logoUrl ?? undefined,
    match,
  };
}



const PLATFORM_ORDER = ["instagram", "youtube", "facebook", "tiktok"] as const;
type SeqPlatform = typeof PLATFORM_ORDER[number];

const PLATFORM_THEME: Record<SeqPlatform, { label: string; gradient: string; color: string; Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }> = {
  instagram: { label: "Instagram", gradient: "linear-gradient(135deg, #E1306C, #833AB4)", color: "#E1306C", Icon: Instagram },
  youtube:   { label: "YouTube",   gradient: "linear-gradient(135deg, #FF0000, #CC0000)", color: "#FF0000", Icon: Youtube },
  facebook:  { label: "Facebook",  gradient: "linear-gradient(135deg, #1877F2, #0D5AA5)", color: "#1877F2", Icon: Facebook },
  tiktok:    { label: "TikTok",    gradient: "linear-gradient(135deg, #010101, #333333)", color: "#ffffff", Icon: TikTokIcon },
};

function TikTokIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="currentColor" aria-hidden="true">
      <path d="M19.6 6.3a5.3 5.3 0 0 1-3.2-1.1V15a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v2.9a2.8 2.8 0 1 0 2 2.7V2h2.7a5.3 5.3 0 0 0 3.3 4.3z" />
    </svg>
  );
}

export const Route = createFileRoute("/previsao/$id")({
  loader: async ({ params }): Promise<{ id: string; initial: Prediction | null }> => {
    const local = getPrediction(params.id);
    if (local) return { id: params.id, initial: local };
    try {
      const corp = await getCorpChallenge({ data: { id: params.id } });
      return { id: params.id, initial: corp ? corpToPrediction(corp) : null };
    } catch {
      return { id: params.id, initial: null };
    }
  },
  head: ({ loaderData }) => ({
    meta: loaderData?.initial
      ? [
          { title: `${loaderData.initial.title} — EU ACHO QUE VAI DAR @#&` },
          { name: "description", content: loaderData.initial.description },
          { property: "og:title", content: loaderData.initial.title },
          { property: "og:description", content: loaderData.initial.description },
          ...(loaderData.initial.imageUrl
            ? [
                { property: "og:image", content: loaderData.initial.imageUrl },
                { name: "twitter:image", content: loaderData.initial.imageUrl },
              ]
            : []),
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
  const { id, initial } = Route.useLoaderData();
  const [p, setP] = useState<Prediction | null>(initial);
  const [resolving, setResolving] = useState<boolean>(!initial);
  const getCorpChallengeFn = useServerFn(getCorpChallenge);

  useEffect(() => {
    if (p) return;
    let cancelled = false;
    (async () => {
      const found = getPrediction(id);
      if (found) {
        if (!cancelled) {
          setP(found);
          setResolving(false);
        }
        return;
      }
      try {
        const corp = await getCorpChallengeFn({ data: { id } });
        if (!cancelled && corp) setP(corpToPrediction(corp));
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setResolving(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, p, getCorpChallengeFn]);

  if (!p) {
    return (
      <AppShell>
        <div className="p-10 text-center">
          {resolving ? (
            <div className="text-muted-foreground">Carregando previsão…</div>
          ) : (
            <>
              <h2 className="font-display text-2xl">Previsão não encontrada</h2>
              <Link to="/" className="text-primary mt-3 inline-block">Voltar ao feed</Link>
            </>
          )}
        </div>
      </AppShell>
    );
  }

  return <PredictionInner p={p} />;
}

function PredictionInner({ p }: { p: Prediction }) {
  const { user } = useAuth();
  const totalPool = p.options.reduce((s: number, o) => s + o.pool, 0);
  const [selected, setSelected] = useState(p.options[0].id);
  const [amount, setAmount] = useState(p.entryFee ?? p.minTokens);
  const [subAnswers, setSubAnswers] = useState<Record<string, string>>({});
  const [missionQueue, setMissionQueue] = useState<Mission[]>([]);
  const [missionStep, setMissionStep] = useState(0);
  const [missionStatus, setMissionStatus] = useState<"idle" | "verifying" | "done">("idle");
  const [extraPalpites, setExtraPalpites] = useState<{ platform: SeqPlatform; sponsor: string; answers: Record<string, string> }[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [pendingExtra, setPendingExtra] = useState<{ platform: SeqPlatform; sponsor: string } | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [regOpen, setRegOpen] = useState(false);
  const [regAccepted, setRegAccepted] = useState<boolean | null>(null);
  const [regChoice, setRegChoice] = useState<"accept" | "reject" | null>(null);
  const pendingConfirmRef = useRef<null | (() => void)>(null);


  useEffect(() => {
    if (hasParticipated(p.id)) setConfirmed(true);
  }, [p.id]);

  useEffect(() => {
    if (!user) {
      setBalance(null);
      return;
    }
    getTokenBalance().then(setBalance).catch(() => setBalance(null));
    const refresh = () => getTokenBalance().then(setBalance).catch(() => {});
    window.addEventListener("ddp:participations-updated", refresh);
    return () => window.removeEventListener("ddp:participations-updated", refresh);
  }, [user]);

  useEffect(() => {
    (async () => {
      try {
        // Load all follow/subscribe missions ordered by platform: instagram → youtube → facebook → tiktok
        const buckets = await Promise.all(
          PLATFORM_ORDER.map((pl) =>
            listMissions({ platform: pl, activeOnly: true })
              .then((arr) => arr.filter((m) => m.action_type === "follow" || m.action_type === "subscribe"))
              .catch(() => [] as Mission[]),
          ),
        );
        const queue: Mission[] = buckets.flat();
        setMissionQueue(queue);

        if (user && queue.length) {
          const claims = await listMyClaims(`challenge:${p.id}`);
          const done: { platform: SeqPlatform; sponsor: string; answers: Record<string, string> }[] = [];
          let step = 0;
          for (const m of queue) {
            if (claims.some((c) => c.mission_id === m.id)) {
              done.push({ platform: m.platform as SeqPlatform, sponsor: m.sponsor_name, answers: {} });
              step++;
            } else break;
          }
          setExtraPalpites(done);
          setMissionStep(step);
        }
      } catch {
        // silently ignore mission load failures on this page
      }
    })();
  }, [p.id, user]);

  async function handleMissionClick() {
    if (!user) {
      toast.error("Faça login para ganhar palpites extras.");
      return;
    }
    const mission = missionQueue[missionStep];
    if (!mission) return;
    window.open(mission.link, "_blank", "noopener,noreferrer");
    setMissionStatus("verifying");
    setTimeout(async () => {
      try {
        await claimMission(mission.id, `challenge:${p.id}`, mission.tokens);
      } catch {
        // ignore (likely already claimed)
      }
      setSubAnswers({});
      if (confirmed) {
        setPendingExtra({ platform: mission.platform as SeqPlatform, sponsor: mission.sponsor_name });
        toast.success("✅ Missão feita! Preencha o novo palpite e clique em CONFIRMAR PALPITE EXTRA.");
      } else {
        // Mission done before confirming participation: just credit tokens
        setExtraPalpites((prev) => [...prev, { platform: mission.platform as SeqPlatform, sponsor: mission.sponsor_name, answers: {} }]);
        toast.success(`✅ Missão feita! +${mission.tokens} TKN no seu saldo. Você pode continuar ou já participar do desafio.`);
      }
      setMissionStatus("done");
      setTimeout(() => {
        setMissionStep((s) => s + 1);
        setMissionStatus("idle");
      }, 1500);
    }, 5000);
  }


  const sel = p.options.find((o) => o.id === selected)!;
  const newPool = totalPool + amount;
  const newOptionPool = sel.pool + amount;
  const odds = newOptionPool ? newPool / newOptionPool : 1;
  const possibleReturn = Math.floor(amount * odds);

  const related = PREDICTIONS.filter((x) => x.id !== p.id && x.category === p.category).slice(0, 4);

  const deadlineMs = new Date(p.closesAt).getTime() - Date.now();
  const isClosed = deadlineMs <= 0;

  return (
    <AppShell>
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      {(() => {

        const doConfirm = () => {
          if (p.subPredictions) {
            const filled = Object.keys(subAnswers).length;
            if (filled < p.subPredictions.length) {
              toast.error(`Preencha todos os ${p.subPredictions.length} palpites.`);
              return;
            }
            // Confirming an EXTRA round (no fee) after a completed mission
            if (confirmed && pendingExtra) {
              setExtraPalpites((prev) => [...prev, { platform: pendingExtra.platform, sponsor: pendingExtra.sponsor, answers: subAnswers }]);
              setPendingExtra(null);
              setSubAnswers({});
              toast.success(`🎁 Palpite extra Nº ${extraPalpites.length + 1} confirmado!`);
              return;
            }
            if (confirmed) return;
            const fee = p.entryFee ?? 0;
            if (!user) { toast.error("Faça login para participar."); return; }
            if (balance !== null && balance < fee) {
              toast.error(`Saldo insuficiente. Você tem ${formatTokens(balance)} TKN e precisa de ${fee}.`);
              return;
            }
            setConfirmed(true);
            saveParticipation({
              id: p.id, title: p.title, category: p.category, entryFee: fee,
              answers: subAnswers, closesAt: p.closesAt,
              participatedAt: new Date().toISOString(),
            });
            toast.success(`🎯 Participação confirmada! ${fee} TKN debitados. Missões bônus liberadas!`);
          } else {
            if (!user) { toast.error("Faça login para apostar."); return; }
            if (balance !== null && balance < amount) {
              toast.error(`Saldo insuficiente. Você tem ${formatTokens(balance)} TKN.`); return;
            }
            saveParticipation({
              id: p.id, title: p.title, category: p.category, entryFee: amount,
              answers: {}, optionLabel: sel.label, closesAt: p.closesAt,
              participatedAt: new Date().toISOString(),
            });
            toast.success(`✅ Aposta de ${amount} TKN em "${sel.label}" confirmada!`);
          }
        };

        const handleParticipate = () => {
          // Extra rounds (after first confirmation) skip regulamento — already accepted
          if (confirmed && pendingExtra) { doConfirm(); return; }
          // Validate basics before opening regulamento
          if (p.subPredictions) {
            const filled = Object.keys(subAnswers).length;
            if (filled < p.subPredictions.length) {
              toast.error(`Preencha todos os ${p.subPredictions.length} palpites.`);
              return;
            }
          }
          if (!user) { toast.error("Faça login para participar."); return; }
          if (regAccepted) { doConfirm(); return; }
          // Open regulamento for first-time acceptance
          pendingConfirmRef.current = doConfirm;
          setRegChoice(null);
          setRegOpen(true);
        };


        return (
      <div className="space-y-6">
        <article className="rounded-2xl bg-card border border-border/60 p-6">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold border border-primary/30">{p.category}</span>
            {p.hot && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/15 text-destructive font-semibold border border-destructive/30">
                <Flame className="h-3 w-3" /> Em alta
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" /> {isClosed ? "Apostas encerradas" : `Encerra em ${timeLeft(p.closesAt)}`}</span>
            <span className="inline-flex items-center gap-1 text-muted-foreground"><Users className="h-3 w-3" /> {p.bettors} apostadores</span>
          </div>

          {p.match && (
            <div className="mt-4 rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-background/40 to-gold/10 p-5">
              <div className="flex items-center justify-around gap-3">
                <div className="flex flex-col items-center gap-2">
                  <img src={p.match.homeFlag} alt={p.match.home} className="h-16 w-24 object-cover rounded shadow-md" />
                  <span className="font-display font-bold">{p.match.home}</span>
                </div>
                <div className="text-center">
                  <div className="font-display text-4xl font-black text-gradient-brand">VS</div>
                  <div className="text-xs text-muted-foreground mt-1">Grupo {p.match.group}</div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <img src={p.match.awayFlag} alt={p.match.away} className="h-16 w-24 object-cover rounded shadow-md" />
                  <span className="font-display font-bold">{p.match.away}</span>
                </div>
              </div>
              <div className="mt-3 text-center text-sm text-muted-foreground">
                Início: <span className="text-foreground font-semibold">{new Date(p.match.kickoff).toLocaleString("pt-BR", { dateStyle: "full", timeStyle: "short", timeZone: "America/Sao_Paulo" })}</span>
              </div>
              <div className="mt-1 text-center text-xs text-destructive font-semibold">
                Apostas encerram 10 minutos antes do jogo
              </div>
            </div>
          )}

          <h1 className="mt-4 font-display text-2xl sm:text-3xl font-black leading-tight">{p.title}</h1>
          <p className="mt-2 text-muted-foreground">{p.description}</p>

          {p.prizeTiers && (
            <div className="mt-5 grid grid-cols-3 gap-3">
              {p.prizeTiers.map((t) => (
                <div key={t.hits} className="rounded-xl border border-gold/40 bg-gold/5 p-3 text-center">
                  <div className="text-[11px] uppercase text-muted-foreground font-bold">{t.hits} acertos</div>
                  <div className="font-display text-xl font-black text-gold">{t.tokens.toLocaleString("pt-BR")}</div>
                  <div className="text-[10px] text-muted-foreground">TOKENS</div>
                </div>
              ))}
            </div>
          )}

          {p.subPredictions ? (
            <div className="mt-6 space-y-5">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display font-bold text-lg">Seus palpites</h2>
                <span className="text-xs text-muted-foreground">
                  Round {extraPalpites.length + 1}
                  {extraPalpites.length > 0 && <span className="text-gold ml-1">· +{extraPalpites.length} extras</span>}
                </span>
              </div>
              {p.subPredictions.map((s, i) => {
                const palpiteNum = extraPalpites.length * p.subPredictions!.length + i + 1;
                return (
                  <div key={s.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
                    <div className="text-sm font-bold mb-3">
                      <span className="text-primary mr-1">Palpite Nº {palpiteNum}.</span> {s.question}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {s.options.map((opt) => {
                        const active = subAnswers[s.id] === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => setSubAnswers((prev) => ({ ...prev, [s.id]: opt }))}
                            disabled={isClosed}
                            className={`h-11 px-3 rounded-lg border text-sm font-semibold transition ${
                              active
                                ? "border-primary bg-primary/10 text-primary shadow-glow"
                                : "border-border/60 hover:border-primary/40"
                            } ${isClosed ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
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
          )}

          {/* PARTICIPAR — botão verde único (também serve para CONFIRMAR PALPITE EXTRA) */}
          <button
            onClick={handleParticipate}
            disabled={
              isClosed ||
              (p.subPredictions
                ? (Object.keys(subAnswers).length < p.subPredictions.length) || (confirmed && !pendingExtra)
                : false) ||
              (!confirmed && balance !== null && balance < (p.entryFee ?? amount))
            }
            className="mt-6 w-full h-14 rounded-xl font-display font-black tracking-wide text-lg transition disabled:opacity-60 disabled:cursor-not-allowed text-white"
            style={{
              background: pendingExtra
                ? "linear-gradient(135deg, #f59e0b, #d97706)"
                : confirmed
                ? "linear-gradient(135deg, #059669, #047857)"
                : "linear-gradient(135deg, #22c55e, #16a34a)",
              boxShadow: pendingExtra
                ? "0 0 28px rgba(245,158,11,0.5), 0 10px 24px -8px rgba(245,158,11,0.6)"
                : "0 0 28px rgba(34,197,94,0.45), 0 10px 24px -8px rgba(34,197,94,0.6)",
            }}
          >
            {isClosed
              ? "APOSTAS ENCERRADAS"
              : pendingExtra
              ? `🎁 CONFIRMAR PALPITE EXTRA Nº ${extraPalpites.length + 1}`
              : confirmed
              ? "✓ PARTICIPAÇÃO CONFIRMADA"
              : "PARTICIPAR"}
          </button>
          {user && balance !== null && (
            <p className="mt-2 text-[11px] text-center text-muted-foreground">
              Seu saldo: <span className="text-gold font-bold">{formatTokens(balance)} TKN</span> · Entrada:{" "}
              <span className="text-gold font-bold">{p.entryFee ?? amount} TKN</span>
            </p>
          )}

          <div className="mt-6 flex items-center gap-5 text-sm text-muted-foreground border-t border-border/60 pt-4">
            <button className="inline-flex items-center gap-1.5 hover:text-destructive"><Heart className="h-4 w-4" />{p.likes}</button>
            <button className="inline-flex items-center gap-1.5 hover:text-primary"><MessageCircle className="h-4 w-4" />{p.comments}</button>
            <button className="inline-flex items-center gap-1.5 hover:text-gold"><Share2 className="h-4 w-4" />{p.shares}</button>
            <span className="ml-auto text-xs inline-flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-primary" /> Volume: <span className="text-gold font-semibold">{formatTokens(totalPool)} TKN</span></span>
          </div>
        </article>


        {/* Banner de missões sequenciais — abaixo do slider */}
        {p.subPredictions && (() => {
          const allDone = missionStep >= missionQueue.length;
          const currentMission = missionQueue[missionStep] ?? null;
          const currentPlatform = (currentMission?.platform as SeqPlatform) ?? null;

          return (
            <section className="rounded-2xl bg-card border border-border/60 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-gold" />
                <h2 className="font-display font-black text-base uppercase tracking-wide">Palpites extras por missões</h2>
              </div>

              {extraPalpites.length > 0 && (
                <div className="rounded-xl border border-gold/40 bg-gold/5 p-4">
                  <div className="font-display font-bold text-sm mb-2 text-gold">🎁 Rounds extras conquistados</div>
                  <ul className="space-y-1.5 text-xs">
                    {extraPalpites.map((e, i) => {
                      const T = PLATFORM_THEME[e.platform];
                      return (
                        <li key={i} className="flex items-center gap-2">
                          <T.Icon className="h-3.5 w-3.5" />
                          <span className="font-bold text-foreground">Round extra Nº {i + 1}</span>
                          <span className="text-muted-foreground">— missão {T.label} ({e.sponsor})</span>
                          <Check className="h-3.5 w-3.5 text-emerald-400 ml-auto" />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {!confirmed && missionQueue.length > 0 && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs text-center text-muted-foreground">
                  💡 Faça as missões agora para ganhar <strong className="text-gold">tokens extras</strong> e depois usar nos palpites — ou confirme sua participação primeiro.
                </div>
              )}

              {!allDone && currentMission && currentPlatform && (() => {
                const T = PLATFORM_THEME[currentPlatform];
                const verifying = missionStatus === "verifying";
                const done = missionStatus === "done";
                return (
                  <div
                    className="rounded-xl border-2 p-4"
                    style={{
                      borderColor: `color-mix(in srgb, ${T.color} 45%, transparent)`,
                      background: `color-mix(in srgb, ${T.color} 10%, transparent)`,
                    }}
                  >
                    <div className="flex items-center gap-2 text-sm font-display font-black mb-1">
                      <T.Icon className="h-4 w-4" style={{ color: T.color }} />
                      <span style={{ color: T.color }}>
                        {confirmed ? "Palpite extra grátis" : "Missão bônus"} — {T.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      <strong>{ACTION_LABEL[currentMission.action_type]}</strong> {currentMission.sponsor_name} no {T.label} e ganhe <strong className="text-gold">+{currentMission.tokens} TKN</strong>
                      {confirmed ? <> (libera +1 round de palpites extras).</> : <> no seu saldo.</>}
                    </p>
                    <button
                      onClick={handleMissionClick}
                      disabled={verifying || done}
                      className="w-full h-11 rounded-lg font-bold text-sm inline-flex items-center justify-center gap-2 transition text-white shadow-glow hover:scale-[1.02] disabled:opacity-80 disabled:cursor-not-allowed"
                      style={{ background: done ? "linear-gradient(135deg, #10b981, #059669)" : T.gradient }}
                    >
                      {verifying ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Validando missão…</>
                      ) : done ? (
                        <><Check className="h-4 w-4" /> Missão concluída!</>
                      ) : (
                        <><ExternalLink className="h-4 w-4" /> {currentMission.title}</>
                      )}
                    </button>
                    <div className="mt-2 text-[11px] text-center text-muted-foreground">
                      Missão {missionStep + 1} de {missionQueue.length}
                      {missionQueue[missionStep + 1] && (
                        <> · próxima: {PLATFORM_THEME[missionQueue[missionStep + 1].platform as SeqPlatform].label}</>
                      )}
                    </div>
                  </div>
                );
              })()}

              {allDone && missionQueue.length > 0 && (
                <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 p-4 text-center">
                  <div className="text-sm font-display font-black text-emerald-400">🏆 Todas as missões concluídas!</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {confirmed ? (
                      <>Você ganhou <strong className="text-gold">+{extraPalpites.length} rounds extras</strong> neste desafio.</>
                    ) : (
                      <>Agora é só confirmar sua participação no desafio.</>
                    )}
                  </p>
                </div>
              )}

              {missionQueue.length === 0 && (
                <div className="rounded-xl border border-border/60 bg-background/40 p-3 text-xs text-center text-muted-foreground">
                  Nenhuma missão de seguir disponível no momento.
                </div>
              )}
            </section>
          );
        })()}

        {related.length > 0 && (
          <section className="mt-4">
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
      </div>
        );
      })()}

      <Dialog open={regOpen} onOpenChange={setRegOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              <ScrollText className="h-5 w-5 text-primary" />
              Regulamento da Promoção
            </DialogTitle>
            <DialogDescription>
              Antes de confirmar seu palpite em <strong>{p.title}</strong>, leia e
              indique se aceita as regras desta promoção.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-72 overflow-y-auto rounded-lg border border-border/60 bg-background/40 p-4 text-sm leading-relaxed space-y-3">
            <p><strong>1. Objeto.</strong> Esta promoção é um desafio de palpites
            organizado em <em>{p.title}</em>, na categoria {p.category}, com
            encerramento em {new Date(p.closesAt).toLocaleString("pt-BR")}.</p>
            <p><strong>2. Participação.</strong> Para participar, o usuário deve
            estar cadastrado, possuir saldo suficiente em tokens e enviar seu
            palpite antes do encerramento.</p>
            <p><strong>3. Prêmios.</strong> Os prêmios anunciados são de
            responsabilidade do organizador do desafio. A plataforma Desafio dos
            Palpites atua exclusivamente como intermediadora tecnológica.</p>
            <p><strong>4. Apuração.</strong> O resultado é apurado conforme o
            evento oficial. Em caso de empate em pontos, aplicam-se os critérios
            de desempate definidos pelo organizador.</p>
            <p><strong>5. Conduta.</strong> Fraudes, múltiplas contas ou
            tentativas de manipulação resultam em desclassificação e perda dos
            tokens utilizados.</p>
            <p><strong>6. LGPD.</strong> Os dados pessoais são tratados conforme
            a Política de Privacidade da plataforma.</p>
            <p><strong>7. Aceite.</strong> Ao marcar “Aceito”, o participante
            declara ter lido e concordado integralmente com este regulamento.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <label className={`flex items-start gap-2 rounded-lg border p-3 cursor-pointer transition ${regChoice === "accept" ? "border-emerald-500 bg-emerald-500/10" : "border-border/60 hover:border-emerald-500/40"}`}>
              <Checkbox
                checked={regChoice === "accept"}
                onCheckedChange={(v) => setRegChoice(v ? "accept" : null)}
                className="mt-0.5"
              />
              <span className="text-sm font-semibold">Aceito o regulamento</span>
            </label>
            <label className={`flex items-start gap-2 rounded-lg border p-3 cursor-pointer transition ${regChoice === "reject" ? "border-destructive bg-destructive/10" : "border-border/60 hover:border-destructive/40"}`}>
              <Checkbox
                checked={regChoice === "reject"}
                onCheckedChange={(v) => setRegChoice(v ? "reject" : null)}
                className="mt-0.5"
              />
              <span className="text-sm font-semibold">Não aceito</span>
            </label>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setRegOpen(false)}>Cancelar</Button>
            <Button
              disabled={regChoice === null}
              onClick={() => {
                if (regChoice === "accept") {
                  setRegAccepted(true);
                  setRegOpen(false);
                  const fn = pendingConfirmRef.current;
                  pendingConfirmRef.current = null;
                  if (fn) fn();
                } else {
                  setRegAccepted(false);
                  setRegOpen(false);
                  toast.error("Você precisa aceitar o regulamento para participar.");
                }
              }}
              className="gap-2"
            >
              <ShieldCheck className="h-4 w-4" /> Confirmar escolha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </AppShell>
  );
}

