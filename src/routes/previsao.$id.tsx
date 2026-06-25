import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Clock, Users, Heart, MessageCircle, Share2, Coins, TrendingUp, ArrowLeft, Instagram, Youtube, Facebook, Check, ExternalLink, Loader2, ScrollText, ShieldCheck, Star, Twitter, Linkedin, Plus,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { formatTokens, getPrediction, PREDICTIONS, USERS, type Prediction, type Category, timeLeft } from "@/lib/mock-data";
import { listMissions, listMyClaims, claimMission, type Mission, ACTION_LABEL } from "@/lib/missions";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { getCorpChallenge, type CorpChallengeRecord, type CorporateMission } from "@/lib/corp-challenges.functions";
import { detectMatchFromText } from "@/lib/world-cup-matches";

import { useAuth } from "@/hooks/use-auth";
import { hasParticipated, saveParticipation } from "@/lib/my-participations";
import { getTokenBalance } from "@/lib/balance";
import { StarRating } from "@/components/StarRating";
import { NextChallengeBanner } from "@/components/NextChallengeBanner";
import { EarnMorePointsCTA } from "@/components/EarnMorePointsCTA";
import { getRatings, rateChallenge, getMyRating } from "@/lib/ratings.functions";

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
    subPredictions: subPredictions.length >= 1 ? subPredictions : undefined,
    bettors: c.participants ?? 0,
    comments: 0,
    likes: 0,
    shares: 0,
    tags: c.companyName || c.missions.length ? ["empresa", "ativo"] : ["meu-desafio", "ativo"],
    hot: true,
    imageUrl: c.bannerUrl ?? c.logoUrl ?? undefined,
    corporateMissions: normalizeCorporateMissions(c),
    match,
  };
}

function normalizeCorporateMissions(c: CorpChallengeRecord): CorporateMission[] {
  return ((c.missions as unknown[]) ?? []).flatMap((mission, index) => {
    if (typeof mission === "string") {
      const link = mission.match(/https?:\/\/\S+/)?.[0] ?? mission.replace(/^Seguir Instagram\s*/i, "").trim();
      return link ? [{
        id: `corp-${c.id}-${index}`,
        sponsorName: c.companyName || c.title,
        platform: "instagram",
        actionType: "follow",
        title: `Seguir ${c.companyName || "Instagram"}`,
        link,
        tokens: 50,
      }] : [];
    }
    if (!mission || typeof mission !== "object") return [];
    const item = mission as Partial<CorporateMission>;
    return item.link && item.platform ? [{
      id: String(item.id ?? `corp-${c.id}-${index}`),
      sponsorName: String(item.sponsorName ?? c.companyName ?? c.title),
      platform: String(item.platform),
      actionType: String(item.actionType ?? "follow"),
      title: String(item.title ?? `Seguir ${c.companyName || "empresa"}`),
      link: String(item.link),
      tokens: Number(item.tokens ?? 50),
    }] : [];
  });
}



const PLATFORM_ORDER = ["instagram", "youtube", "facebook", "tiktok", "google", "twitter", "linkedin"] as const;
const CATALOG_PLATFORM_ORDER = ["instagram", "youtube", "facebook", "tiktok"] as const;
type SeqPlatform = typeof PLATFORM_ORDER[number];
type PageMission = (Mission | CorporateMission) & { platform: SeqPlatform };

function getMissionSponsor(m: PageMission) {
  return "sponsor_name" in m ? m.sponsor_name : m.sponsorName;
}

function getMissionAction(m: PageMission) {
  return "action_type" in m ? m.action_type : m.actionType;
}

function isCatalogMission(m: PageMission): m is Mission & { platform: SeqPlatform } {
  return "sponsor_name" in m;
}

function normalizeMissionIdentityPart(value: string) {
  return value.trim().toLowerCase().replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

function getMissionIdentity(mission: Pick<PageMission, "platform" | "link" | "title">) {
  const link = mission.link ? normalizeMissionIdentityPart(mission.link) : normalizeMissionIdentityPart(mission.title);
  return `${mission.platform}:${link}`;
}

function getLocalMissionClaimKey(userId: string, mission: PageMission) {
  return `ddp:mission-done:${userId}:${getMissionIdentity(mission)}`;
}

function getLocalMissionClaimKeys(userId: string, challengeId: string, mission: PageMission) {
  return [getLocalMissionClaimKey(userId, mission), `ddp:corp-mission:${challengeId}:${mission.id}`];
}

const PLATFORM_THEME: Record<SeqPlatform, { label: string; gradient: string; color: string; Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }> = {
  instagram: { label: "Instagram", gradient: "linear-gradient(135deg, #E1306C, #833AB4)", color: "#E1306C", Icon: Instagram },
  youtube:   { label: "YouTube",   gradient: "linear-gradient(135deg, #FF0000, #CC0000)", color: "#FF0000", Icon: Youtube },
  facebook:  { label: "Facebook",  gradient: "linear-gradient(135deg, #1877F2, #0D5AA5)", color: "#1877F2", Icon: Facebook },
  tiktok:    { label: "TikTok",    gradient: "linear-gradient(135deg, #010101, #333333)", color: "#ffffff", Icon: TikTokIcon },
  google:    { label: "Google",    gradient: "linear-gradient(135deg, #34A853, #FABB05)", color: "#34A853", Icon: Star },
  twitter:   { label: "Twitter / X", gradient: "linear-gradient(135deg, #111111, #3b3b3b)", color: "#ffffff", Icon: Twitter },
  linkedin:  { label: "LinkedIn",  gradient: "linear-gradient(135deg, #0A66C2, #004182)", color: "#0A66C2", Icon: Linkedin },
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
    try {
      const corp = await getCorpChallenge({ data: { id: params.id } });
      if (corp) return { id: params.id, initial: corpToPrediction(corp) };
    } catch {
      // fallback to local challenges below
    }
    const local = getPrediction(params.id);
    return { id: params.id, initial: local ?? null };
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
      try {
        const corp = await getCorpChallengeFn({ data: { id } });
        if (!cancelled && corp) {
          setP(corpToPrediction(corp));
          setResolving(false);
          return;
        }
      } catch {
        /* fallback to local */
      }
      const found = getPrediction(id);
      if (found) {
        if (!cancelled) {
          setP(found);
          setResolving(false);
        }
        return;
      }
      if (!cancelled) setResolving(false);
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

const MISSION_REWARD_TKN = 50;
const CORRECT_PALPITE_REWARD_TKN = 100;

function PredictionInner({ p }: { p: Prediction }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const totalPool = p.options.reduce((s: number, o) => s + o.pool, 0);
  const [selected, setSelected] = useState(p.options[0].id);
  const [amount, setAmount] = useState(p.entryFee ?? p.minTokens);
  const [subAnswers, setSubAnswers] = useState<Record<string, string>>({});
  const [missionQueue, setMissionQueue] = useState<PageMission[]>([]);
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);




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
        const ownMissions = (p.corporateMissions ?? [])
          .filter((m) => PLATFORM_ORDER.includes(m.platform as SeqPlatform) && m.link?.trim())
          .map((m) => ({ ...m, platform: m.platform as SeqPlatform }));
        const rawQueue: PageMission[] = ownMissions.length
          ? PLATFORM_ORDER.flatMap((pl) => ownMissions.filter((m) => m.platform === pl))
          : (await Promise.all(
              CATALOG_PLATFORM_ORDER.map((pl) =>
                listMissions({ platform: pl, activeOnly: true })
                  .then((arr) => arr.filter((m) => m.action_type === "follow" || m.action_type === "subscribe") as PageMission[])
                  .catch(() => [] as PageMission[]),
              ),
            )).flat();
        const seenIdentities = new Set<string>();
        const queue = rawQueue.filter((m) => {
          const identity = getMissionIdentity(m);
          if (seenIdentities.has(identity)) return false;
          seenIdentities.add(identity);
          return true;
        });
        setMissionQueue(queue);

        if (user && queue.length) {
          const claims = await listMyClaims();
          const claimedMissionIds = new Set(claims.map((c) => c.mission_id));
          const claimedCatalogIdentities = new Set(
            rawQueue.filter((m) => isCatalogMission(m) && claimedMissionIds.has(m.id)).map(getMissionIdentity),
          );
          const done: { platform: SeqPlatform; sponsor: string; answers: Record<string, string> }[] = [];
          let step = 0;
          for (const m of queue) {
            const claimed = isCatalogMission(m)
              ? claimedMissionIds.has(m.id) || claimedCatalogIdentities.has(getMissionIdentity(m))
              : getLocalMissionClaimKeys(user.id, p.id, m).some((key) => window.localStorage.getItem(key) === "1");
            if (claimed) {
              done.push({ platform: m.platform, sponsor: getMissionSponsor(m), answers: {} });
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
      goToSignup();
      return;
    }
    const mission = missionQueue[missionStep];
    if (!mission) return;
    window.open(mission.link, "_blank", "noopener,noreferrer");
    setMissionStatus("verifying");
    setTimeout(async () => {
      if (isCatalogMission(mission)) {
        try {
          await claimMission(mission.id, `challenge:${p.id}`, MISSION_REWARD_TKN);
        } catch {
          // ignore (likely already claimed)
        }
      } else {
        getLocalMissionClaimKeys(user.id, p.id, mission).forEach((key) => window.localStorage.setItem(key, "1"));
      }
      setSubAnswers({});
      if (confirmed) {
        setPendingExtra({ platform: mission.platform, sponsor: getMissionSponsor(mission) });
        toast.success(`✅ Missão feita! +${MISSION_REWARD_TKN} TKN. Preencha o novo palpite e clique em CONFIRMAR PALPITE EXTRA.`);
      } else {
        // Mission done before confirming participation: just credit tokens
        setExtraPalpites((prev) => [...prev, { platform: mission.platform, sponsor: getMissionSponsor(mission), answers: {} }]);
        toast.success(`✅ Missão feita! +${MISSION_REWARD_TKN} TKN no seu saldo.`);
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

  const deadlineMs = mounted ? new Date(p.closesAt).getTime() - Date.now() : 1;
  const isClosed = deadlineMs <= 0;
  const inviteRef = mounted ? new URLSearchParams(window.location.search).get("ref") ?? undefined : undefined;
  const goToSignup = () => {
    toast.error("Faça login ou cadastre-se para participar deste desafio.");
    navigate({ to: "/auth", search: { d: p.id, ...(inviteRef ? { ref: inviteRef } : {}) } as any });
  };


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
            if (!user) { goToSignup(); return; }
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
            toast.success(`🎯 Participação confirmada! ${fee} TKN debitados. +${CORRECT_PALPITE_REWARD_TKN} TKN por palpite acertado. Missões bônus liberadas!`);
          } else {
            if (!user) { goToSignup(); return; }
            if (balance !== null && balance < amount) {
              toast.error(`Saldo insuficiente. Você tem ${formatTokens(balance)} TKN.`); return;
            }
            saveParticipation({
              id: p.id, title: p.title, category: p.category, entryFee: amount,
              answers: {}, optionLabel: sel.label, closesAt: p.closesAt,
              participatedAt: new Date().toISOString(),
            });
            setConfirmed(true);
            toast.success(`✅ Aposta de ${amount} TKN em "${sel.label}" confirmada! +${CORRECT_PALPITE_REWARD_TKN} TKN por palpite acertado.`);
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
          if (!user) { goToSignup(); return; }
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
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card border border-border/60 text-muted-foreground">
              <Clock className="h-3 w-3" /> {mounted ? (isClosed ? "Apostas encerradas" : `Encerra em ${timeLeft(p.closesAt)}`) : "Carregando..."}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card border border-border/60 text-muted-foreground">
              <Users className="h-3 w-3" /> {p.bettors} apostadores
            </span>
          </div>

          {p.match && (
            <div className="mt-4 rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-background/40 to-gold/10 p-4 sm:p-5">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="flex flex-col items-center gap-2 min-w-0">
                  <img src={p.match.homeFlag} alt={p.match.home} className="h-12 w-16 sm:h-16 sm:w-24 object-cover rounded-lg shadow-md" />
                  <span className="font-display font-bold text-sm sm:text-base text-center truncate w-full">{p.match.home}</span>
                </div>
                <div className="text-center px-2">
                  <div className="font-display text-3xl sm:text-4xl font-black text-gradient-brand leading-none">VS</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 whitespace-nowrap">Grupo {p.match.group}</div>
                </div>
                <div className="flex flex-col items-center gap-2 min-w-0">
                  <img src={p.match.awayFlag} alt={p.match.away} className="h-12 w-16 sm:h-16 sm:w-24 object-cover rounded-lg shadow-md" />
                  <span className="font-display font-bold text-sm sm:text-base text-center truncate w-full">{p.match.away}</span>
                </div>
              </div>
              <div className="mt-4 text-center text-xs sm:text-sm text-muted-foreground">
                Início: <span className="text-foreground font-semibold">{new Date(p.match.kickoff).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" })}</span>
              </div>
              <div className="mt-1 text-center text-[11px] text-destructive font-semibold">
                Apostas encerram 10 min antes do jogo
              </div>
              {!isClosed && (
                <button
                  onClick={() => {
                    const el = document.getElementById("participar-cta");
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className="mt-4 w-full h-11 rounded-xl bg-gradient-brand text-primary-foreground font-display font-black text-sm tracking-wide shadow-glow hover:scale-[1.01] transition inline-flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" /> PARTICIPAR
                </button>
              )}
            </div>
          )}

          <h1 className="mt-4 font-display text-2xl sm:text-3xl font-black leading-tight">{p.title}</h1>
          {!p.match && <p className="mt-2 text-muted-foreground">{p.description}</p>}
          <ChallengeRatingBlock challengeId={p.id} />



          {p.subPredictions ? (
            <div className="mt-6 space-y-5">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display font-bold text-lg">Seus palpites</h2>
                <span className="text-xs text-muted-foreground">
                  Round {extraPalpites.length + 1}
                  {extraPalpites.length > 0 && <span className="text-gold ml-1">· +{extraPalpites.length} extras</span>}
                </span>
              </div>
              {p.subPredictions.map((s) => {
                return (
                  <div key={s.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
                    <div className="text-sm font-bold mb-3">
                      {s.question}
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
            id="participar-cta"
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

        {/* CTA padrão — ganhe mais pontos para dar palpites */}
        <EarnMorePointsCTA challenge={{ id: p.id, title: p.title, image: p.imageUrl }} />

        {isClosed && <NextChallengeBanner />}





        {/* Banner de missões sequenciais — abaixo do slider */}
        {(() => {
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
                      <strong>{ACTION_LABEL[getMissionAction(currentMission) as keyof typeof ACTION_LABEL] ?? "Abrir"}</strong> {getMissionSponsor(currentMission)} no {T.label} e ganhe <strong className="text-gold">+{MISSION_REWARD_TKN} TKN</strong>
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


function ChallengeRatingBlock({ challengeId }: { challengeId: string }) {
  const { user } = useAuth();
  const fetchRatings = useServerFn(getRatings);
  const fetchMine = useServerFn(getMyRating);
  const rate = useServerFn(rateChallenge);
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);
  const [mine, setMine] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRatings({ data: { ids: [challengeId] } })
      .then((rows) => {
        const r = rows[0];
        if (r) { setAvg(r.avg); setCount(r.count); }
      })
      .catch(() => {});
    if (user) {
      fetchMine({ data: { challengeId } })
        .then((r) => setMine(r.rating))
        .catch(() => {});
    }
  }, [challengeId, user, fetchRatings, fetchMine]);

  async function handleRate(v: number) {
    if (!user) { toast.error("Faça login para avaliar"); return; }
    setSaving(true);
    try {
      await rate({ data: { challengeId, rating: v } });
      setMine(v);
      // optimistic refresh
      const rows = await fetchRatings({ data: { ids: [challengeId] } });
      const r = rows[0];
      if (r) { setAvg(r.avg); setCount(r.count); }
      toast.success("Avaliação salva");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao avaliar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/40 p-3">
      <div className="flex items-center gap-2 text-sm">
        <StarRating value={avg} readOnly size={16} showValue count={count} />
        <span className="text-xs text-muted-foreground">avaliação da comunidade</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">{mine ? "Sua nota:" : "Avalie:"}</span>
        <StarRating value={mine ?? 0} onChange={handleRate} readOnly={saving} size={18} />
      </div>
    </div>
  );
}
