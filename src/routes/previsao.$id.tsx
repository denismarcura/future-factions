import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Clock, Users, Flame, Heart, MessageCircle, Share2, Coins, TrendingUp, ArrowLeft, Instagram, Check, ExternalLink, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { CURRENT_USER, formatTokens, getPrediction, PREDICTIONS, type Prediction, timeLeft } from "@/lib/mock-data";
import { listMissions, listMyClaims, claimMission, pickRandomFor, type Mission, ACTION_LABEL } from "@/lib/missions";
import { useAuth } from "@/hooks/use-auth";
import { hasParticipated, saveParticipation } from "@/lib/my-participations";
import { getTokenBalance } from "@/lib/balance";

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
  const navigate = useNavigate();
  const p = Route.useLoaderData() as Prediction;
  const { user } = useAuth();
  const totalPool = p.options.reduce((s: number, o) => s + o.pool, 0);
  const [selected, setSelected] = useState(p.options[0].id);
  const [amount, setAmount] = useState(p.entryFee ?? p.minTokens);
  const [subAnswers, setSubAnswers] = useState<Record<string, string>>({});
  const [bonusMission, setBonusMission] = useState<Mission | null>(null);
  const [bonusDone, setBonusDone] = useState(false);
  const [bonusBusy, setBonusBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

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
        const igMissions = await listMissions({ platform: "instagram", activeOnly: true });
        const pick = pickRandomFor(igMissions, p.id);
        setBonusMission(pick);
        if (pick && user) {
          const claims = await listMyClaims(`challenge:${p.id}`);
          if (claims.some((c) => c.mission_id === pick.id)) setBonusDone(true);
        }
      } catch {
        // silently ignore mission load failures on this page
      }
    })();
  }, [p.id, user]);

  async function handleBonusClaim() {
    if (!bonusMission) return;
    if (!user) {
      toast.error("Faça login para ganhar o palpite extra.");
      return;
    }
    setBonusBusy(true);
    window.open(bonusMission.link, "_blank", "noopener,noreferrer");
    try {
      await claimMission(bonusMission.id, `challenge:${p.id}`, bonusMission.tokens);
      setBonusDone(true);
      toast.success("🎯 +1 palpite extra liberado neste desafio!");
    } catch (e: any) {
      toast.error(e.message ?? "Erro");
    } finally {
      setBonusBusy(false);
    }
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

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
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
              <h2 className="font-display font-bold text-lg">Seus 5 palpites</h2>
              {p.subPredictions.map((s, i) => (
                <div key={s.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
                  <div className="text-sm font-bold mb-3">
                    <span className="text-primary mr-1">{i + 1}.</span> {s.question}
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
              ))}

              {bonusMission && (
                <div className="rounded-xl border-2 border-pink-500/40 bg-gradient-to-br from-pink-500/10 to-purple-500/10 p-4">
                  <div className="flex items-center gap-2 text-sm font-display font-black mb-1">
                    <Instagram className="h-4 w-4 text-pink-400" />
                    <span className="text-pink-300">Palpite extra grátis</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    <strong>{ACTION_LABEL[bonusMission.action_type]}</strong> {bonusMission.sponsor_name} no Instagram e ganhe <strong className="text-gold">+1 palpite</strong> neste desafio.
                  </p>
                  <button
                    onClick={handleBonusClaim}
                    disabled={bonusDone || bonusBusy}
                    className={`w-full h-10 rounded-lg font-bold text-sm inline-flex items-center justify-center gap-2 transition ${
                      bonusDone
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-glow hover:scale-[1.02]"
                    }`}
                  >
                    {bonusBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : bonusDone ? <Check className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
                    {bonusDone ? "Palpite extra liberado!" : bonusMission.title}
                  </button>
                </div>
              )}

              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="font-display font-bold text-sm mb-2 text-primary">⚡ Ganhe mais chances</div>
                <p className="text-xs text-muted-foreground mb-3">
                  Complete missões e convide amigos para ganhar tokens extras e palpites bônus neste desafio.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/missoes"
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-gradient-brand text-primary-foreground text-xs font-bold shadow-glow hover:scale-[1.02] transition"
                  >
                    🎯 Fazer missões
                  </Link>
                  <Link
                    to="/criar"
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-gold/60 text-gold text-xs font-bold hover:bg-gold/10"
                  >
                    👥 Convidar amigos
                  </Link>
                </div>
              </div>
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

          <div className="mt-6 flex items-center gap-5 text-sm text-muted-foreground border-t border-border/60 pt-4">
            <button className="inline-flex items-center gap-1.5 hover:text-destructive"><Heart className="h-4 w-4" />{p.likes}</button>
            <button className="inline-flex items-center gap-1.5 hover:text-primary"><MessageCircle className="h-4 w-4" />{p.comments}</button>
            <button className="inline-flex items-center gap-1.5 hover:text-gold"><Share2 className="h-4 w-4" />{p.shares}</button>
            <span className="ml-auto text-xs">Entrada: <span className="text-gold font-semibold">{p.entryFee ?? p.minTokens} tokens</span></span>
          </div>
        </article>

        {/* Bet widget */}
        <aside>
          <div className="sticky top-24 rounded-2xl bg-card border border-border/60 p-5 shadow-glow">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gold font-bold">
              <Coins className="h-4 w-4" /> {p.subPredictions ? "Participar do desafio" : "Fazer aposta"}
            </div>

            {p.subPredictions ? (
              <>
                <div className="mt-3 text-sm text-muted-foreground">Custo de entrada</div>
                <div className="mt-1 font-display text-3xl font-black text-gold">
                  {p.entryFee} <span className="text-sm text-muted-foreground font-normal">TKN</span>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <Row label="Palpites preenchidos" value={`${Object.keys(subAnswers).length} / ${p.subPredictions.length}`} />
                  <Row label="Seu saldo" value={`${formatTokens(CURRENT_USER.tokens)} TKN`} />
                </div>
                {p.prizeTiers && (
                  <div className="mt-4 rounded-xl bg-background/40 border border-border/60 p-3 text-xs">
                    <div className="font-bold text-foreground mb-1">Premiação</div>
                    {p.prizeTiers.map((t) => (
                      <div key={t.hits} className="flex justify-between text-muted-foreground">
                        <span>{t.hits} acertos</span>
                        <span className="text-gold font-bold">{t.tokens.toLocaleString("pt-BR")} TKN</span>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => {
                    const filled = Object.keys(subAnswers).length;
                    if (filled < p.subPredictions!.length) {
                      toast.error(`Preencha todos os ${p.subPredictions!.length} palpites.`);
                      return;
                    }
                    const fee = p.entryFee ?? 0;
                    if (!user) {
                      toast.error("Faça login para participar.");
                      return;
                    }
                    if (balance !== null && balance < fee) {
                      toast.error(`Saldo insuficiente. Você tem ${formatTokens(balance)} TKN e precisa de ${fee}.`);
                      return;
                    }
                    setConfirmed(true);
                    saveParticipation({
                      id: p.id,
                      title: p.title,
                      category: p.category,
                      entryFee: fee,
                      answers: subAnswers,
                      closesAt: p.closesAt,
                      participatedAt: new Date().toISOString(),
                    });
                    toast.success(`🎯 Participação confirmada! ${fee} TKN debitados.`);
                    setTimeout(() => {
                      navigate({ to: "/dashboard" });
                    }, 1200);
                  }}
                  disabled={isClosed || confirmed || Object.keys(subAnswers).length < p.subPredictions.length || (balance !== null && balance < (p.entryFee ?? 0))}
                  className="mt-5 w-full h-12 rounded-xl bg-gradient-brand text-primary-foreground font-display font-black tracking-wide shadow-glow hover:scale-[1.01] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isClosed
                    ? "APOSTAS ENCERRADAS"
                    : confirmed
                      ? "✓ PARTICIPAÇÃO CONFIRMADA"
                      : balance !== null && balance < (p.entryFee ?? 0)
                        ? "SALDO INSUFICIENTE"
                        : `PARTICIPAR POR ${p.entryFee} TOKENS`}
                </button>
                {user && balance !== null && (
                  <p className="mt-2 text-[11px] text-center text-muted-foreground">
                    Seu saldo: <span className="text-gold font-bold">{formatTokens(balance)} TKN</span>
                  </p>
                )}
                <p className="mt-3 text-[11px] text-center text-muted-foreground">
                  Apostas encerram 10 minutos antes do jogo. Tokens virtuais, sem dinheiro real.
                </p>
              </>
            ) : (
              <>
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
                  <Row label="Seu saldo" value={`${formatTokens(balance ?? CURRENT_USER.tokens)} TKN`} />
                </div>

                <button
                  onClick={() => {
                    if (!user) {
                      toast.error("Faça login para apostar.");
                      return;
                    }
                    if (balance !== null && balance < amount) {
                      toast.error(`Saldo insuficiente. Você tem ${formatTokens(balance)} TKN.`);
                      return;
                    }
                    saveParticipation({
                      id: p.id,
                      title: p.title,
                      category: p.category,
                      entryFee: amount,
                      answers: {},
                      optionLabel: sel.label,
                      closesAt: p.closesAt,
                      participatedAt: new Date().toISOString(),
                    });
                    toast.success(`✅ Aposta de ${amount} TKN em "${sel.label}" confirmada!`);
                  }}
                  disabled={balance !== null && balance < amount}
                  className="mt-5 w-full h-12 rounded-xl bg-gradient-brand text-primary-foreground font-display font-black tracking-wide shadow-glow hover:scale-[1.01] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {balance !== null && balance < amount ? "SALDO INSUFICIENTE" : `APOSTAR ${amount} TOKENS`}
                </button>

                <p className="mt-3 text-[11px] text-center text-muted-foreground">
                  Fase de testes. Tokens virtuais, sem dinheiro real.
                </p>
              </>
            )}
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
