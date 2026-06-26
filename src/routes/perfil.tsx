import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Trophy, Target, Award, Sparkles, CheckCircle2, XCircle, Clock, LogIn, Mail, Flag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/layout/AppShell";
import { ACHIEVEMENTS, formatTokens } from "@/lib/mock-data";
import { InviteLinkCard } from "@/components/InviteLinkCard";
import { MissionsTeaser } from "@/components/MissionsTeaser";
import { PalpiteCreditsBadge } from "@/components/PalpiteCreditsBadge";
import { useAuth } from "@/hooks/use-auth";
import { listMyPalpites } from "@/lib/my-palpites.functions";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { getTokenBalance } from "@/lib/balance";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Seu Perfil — EU ACHO QUE VAI DAR @#&" },
      { name: "description", content: "Seus desafios, acertos e tokens." },
    ],
  }),
  component: Perfil,
});

type ChallengeRow = {
  id: string;
  title: string | null;
  category: string | null;
  home_team: string | null;
  away_team: string | null;
  closes_at: string | null;
};

function Perfil() {
  const { user, loading: authLoading } = useAuth();
  const fetchPalpites = useServerFn(listMyPalpites);

  const palpitesQuery = useQuery({
    queryKey: ["my-palpites", user?.id],
    queryFn: () => fetchPalpites(),
    enabled: !!user,
  });

  const palpites = palpitesQuery.data ?? [];
  const challengeIds = Array.from(new Set(palpites.map((p) => p.challenge_id)));

  const challengesQuery = useQuery({
    queryKey: ["my-palpites-challenges", challengeIds.sort().join(",")],
    queryFn: async (): Promise<Record<string, ChallengeRow>> => {
      if (challengeIds.length === 0) return {};
      const { data, error } = await supabase
        .from("challenges")
        .select("id, title, category, home_team, away_team, closes_at")
        .in("id", challengeIds);
      if (error) throw new Error(error.message);
      const map: Record<string, ChallengeRow> = {};
      (data ?? []).forEach((c: any) => { map[c.id] = c; });
      return map;
    },
    enabled: challengeIds.length > 0,
  });

  const [tokens, setTokens] = useState<number>(0);
  useEffect(() => {
    if (!user) { setTokens(0); return; }
    getTokenBalance().then(setTokens).catch(() => setTokens(0));
  }, [user?.id]);

  // métricas
  const uniqueParticipations = challengeIds.length;
  const acertos = palpites.filter((p) => p.is_correct === true).length;
  const erros = palpites.filter((p) => p.is_correct === false).length;
  const pendentes = palpites.filter((p) => p.is_correct === null).length;
  const avaliados = acertos + erros;
  const rate = avaliados ? Math.round((acertos / avaliados) * 100) : 0;

  const [filter, setFilter] = useState<"all" | "correct" | "pending">("all");
  const filtered = palpites.filter((p) =>
    filter === "all" ? true : filter === "correct" ? p.is_correct === true : p.is_correct === null
  );

  const meta = user?.user_metadata ?? {};
  const fullName = (meta.full_name as string) || (meta.name as string) || user?.email || "Você";
  const avatar = (meta.avatar_url as string) || (meta.picture as string) || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`;

  return (
    <AppShell>
      <section className="relative overflow-hidden rounded-3xl border border-border/60 glass-card p-4 sm:p-8 mb-6">
        <div className="absolute -top-16 -right-10 h-56 w-56 rounded-full bg-primary/30 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
          <div className="relative shrink-0">
            <img src={avatar} alt="" className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-2 border-gold shadow-glow-gold object-cover" />
          </div>
          <div className="flex-1 min-w-0 w-full">
            <h1 className="font-display text-2xl sm:text-3xl font-black truncate">{fullName}</h1>
            {meta.signup_city && (
              <div className="mt-1 text-sm text-muted-foreground inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> {meta.signup_city as string}
              </div>
            )}
            <div className="mt-4 grid grid-cols-3 sm:flex sm:flex-wrap gap-2 sm:gap-4 sm:items-center">
              <KV label="Tokens" value={formatTokens(tokens)} accent />
              <KV label="Particip." value={String(uniqueParticipations)} />
              <KV label="Acertos" value={String(acertos)} success />
              <KV label="Erros" value={String(erros)} />
              <KV label="Pendentes" value={String(pendentes)} />
              <KV label="Taxa" value={`${rate}%`} success />
            </div>
            <div className="mt-3 flex justify-center sm:justify-start">
              <PalpiteCreditsBadge />
            </div>
          </div>
        </div>
      </section>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          to="/historico-tokens"
          className="inline-flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold hover:bg-gold/20 transition"
        >
          <Award className="h-4 w-4" /> Ver histórico de tokens
        </Link>
      </div>

      <MissionsTeaser limit={6} />

      <div className="mb-6">
        <InviteLinkCard title="Seu link simples de convite" />
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            to="/convidar-amigos"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-gradient-brand text-primary-foreground font-display font-black text-sm shadow-glow hover:scale-[1.01] transition"
          >
            <Mail className="h-4 w-4" /> Convidar por e-mail
          </Link>
          <span className="text-xs text-muted-foreground self-center">
            Envie um e-mail bonito para vários amigos de uma vez.
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Desafios que participei
            </h2>
            <div className="flex gap-1 bg-card border border-border/60 rounded-full p-1">
              {([
                ["all", `Todos (${palpites.length})`],
                ["correct", `Acertei (${acertos})`],
                ["pending", `Pendentes (${pendentes})`],
              ] as const).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                    filter === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {!user && !authLoading && (
            <EmptyState
              icon={<LogIn className="h-6 w-6" />}
              title="Entre para ver seus desafios"
              desc="Faça login para visualizar seu histórico, acertos e tokens."
              action={<Link to="/auth" className="px-4 py-2 rounded-full bg-primary text-primary-foreground font-bold text-sm">Entrar</Link>}
            />
          )}

          {user && palpitesQuery.isLoading && (
            <div className="grid sm:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-card border border-border/60 animate-pulse" />
              ))}
            </div>
          )}

          {user && palpitesQuery.isError && (
            <div className="p-4 rounded-2xl border border-destructive/40 bg-destructive/10 text-sm">
              Não foi possível carregar seus palpites. Tente novamente.
            </div>
          )}

          {user && !palpitesQuery.isLoading && filtered.length === 0 && (
            <EmptyState
              icon={<Target className="h-6 w-6" />}
              title={filter === "correct" ? "Nenhum acerto ainda" : filter === "pending" ? "Sem palpites aguardando" : "Você ainda não participou de nenhum desafio"}
              desc="Veja os desafios abertos e faça seus palpites."
              action={<Link to="/desafios" className="px-4 py-2 rounded-full bg-primary text-primary-foreground font-bold text-sm">Ver desafios</Link>}
            />
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            {filtered.map((p) => {
              const ch = challengesQuery.data?.[p.challenge_id];
              const title = ch?.title || (ch?.home_team && ch?.away_team ? `${ch.home_team} × ${ch.away_team}` : "Desafio");
              const status =
                p.is_correct === true ? { icon: <CheckCircle2 className="h-4 w-4" />, label: "Acertou", cls: "text-success border-success/40 bg-success/10" } :
                p.is_correct === false ? { icon: <XCircle className="h-4 w-4" />, label: "Errou", cls: "text-destructive border-destructive/40 bg-destructive/10" } :
                { icon: <Clock className="h-4 w-4" />, label: "Aguardando resultado", cls: "text-muted-foreground border-border/60 bg-muted/30" };
              return (
                <Link
                  key={p.id}
                  to="/previsao/$id"
                  params={{ id: p.challenge_id }}
                  className="rounded-2xl border border-border/60 bg-card p-4 hover:border-primary/60 transition block"
                >
                  {ch?.category && (
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
                      {ch.category}
                    </div>
                  )}
                  <div className="font-bold text-sm leading-tight mb-2 line-clamp-2">{title}</div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full border ${status.cls}`}>
                      {status.icon} {status.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Desafios encerrados que você participou — ordenados por mais acertos */}
          {user && !palpitesQuery.isLoading && (() => {
            const now = Date.now();
            type Agg = { id: string; title: string; category: string | null; closes_at: string | null; total: number; acertos: number; erros: number; pendentes: number };
            const map = new Map<string, Agg>();
            palpites.forEach((p) => {
              const ch = challengesQuery.data?.[p.challenge_id];
              if (!ch) return;
              const closed = ch.closes_at ? new Date(ch.closes_at).getTime() < now : false;
              if (!closed) return;
              const cur = map.get(p.challenge_id) ?? {
                id: p.challenge_id,
                title: ch.title || (ch.home_team && ch.away_team ? `${ch.home_team} × ${ch.away_team}` : "Desafio"),
                category: ch.category,
                closes_at: ch.closes_at,
                total: 0, acertos: 0, erros: 0, pendentes: 0,
              };
              cur.total += 1;
              if (p.is_correct === true) cur.acertos += 1;
              else if (p.is_correct === false) cur.erros += 1;
              else cur.pendentes += 1;
              map.set(p.challenge_id, cur);
            });
            const finished = Array.from(map.values()).sort(
              (a, b) => b.acertos - a.acertos || b.total - a.total
            );
            if (finished.length === 0) return null;
            return (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <h2 className="font-display text-xl font-bold flex items-center gap-2">
                    <Flag className="h-5 w-5 text-gold" /> Desafios encerrados
                    <span className="text-xs font-normal text-muted-foreground">({finished.length})</span>
                  </h2>
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                    Ordenados por mais acertos
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {finished.map((c, idx) => {
                    const rate = c.total ? Math.round((c.acertos / c.total) * 100) : 0;
                    const isTop = idx === 0 && c.acertos > 0;
                    return (
                      <Link
                        key={c.id}
                        to="/previsao/$id"
                        params={{ id: c.id }}
                        className={`relative rounded-2xl border p-4 bg-card transition block ${
                          isTop ? "border-gold/60 shadow-glow-gold/30 bg-gradient-to-br from-gold/10 to-card" : "border-border/60 hover:border-primary/60"
                        }`}
                      >
                        {isTop && (
                          <span className="absolute -top-2 -right-2 inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-gold text-black shadow-glow-gold">
                            <Trophy className="h-3 w-3" /> Melhor desempenho
                          </span>
                        )}
                        {c.category && (
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
                            {c.category}
                          </div>
                        )}
                        <div className="font-bold text-sm leading-tight mb-2 line-clamp-2">{c.title}</div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full border border-success/40 bg-success/10 text-success">
                            <CheckCircle2 className="h-3.5 w-3.5" /> {c.acertos} acerto{c.acertos === 1 ? "" : "s"}
                          </span>
                          {c.erros > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full border border-destructive/40 bg-destructive/10 text-destructive">
                              <XCircle className="h-3.5 w-3.5" /> {c.erros}
                            </span>
                          )}
                          {c.pendentes > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full border border-border/60 bg-muted/30 text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" /> {c.pendentes}
                            </span>
                          )}
                          <span className="ml-auto text-[11px] font-black tabular-nums text-gold">
                            {rate}%
                          </span>
                        </div>
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1 text-[11px]">
                            <span className="font-bold text-muted-foreground uppercase tracking-wider">
                              Aproveitamento
                            </span>
                            <span className="font-black tabular-nums">
                              <span className="text-success">{c.acertos}</span>
                              <span className="text-muted-foreground">/{c.total}</span>
                              <span className="ml-1.5 text-gold">({rate}%)</span>
                            </span>
                          </div>
                          <div
                            role="progressbar"
                            aria-valuenow={rate}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Aproveitamento: ${c.acertos} de ${c.total} palpites (${rate}%)`}
                            className="relative h-2.5 rounded-full bg-muted/40 overflow-hidden border border-border/40"
                          >
                            <div
                              className={`h-full transition-all duration-500 ${
                                rate >= 70 ? "bg-gradient-to-r from-success to-gold"
                                : rate >= 40 ? "bg-gradient-to-r from-amber-500 to-gold"
                                : "bg-gradient-to-r from-destructive to-amber-500"
                              }`}
                              style={{ width: `${rate}%` }}
                            />
                            {/* marca dos 50% para referência visual */}
                            <div className="absolute inset-y-0 left-1/2 w-px bg-border/60" aria-hidden />
                          </div>
                          <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

        <aside>
          <div className="rounded-2xl bg-gradient-to-br from-[#0a3a1a] to-[#06210f] border border-gold/30 p-4 sm:p-5 shadow-glow-gold/20">
            <div className="text-center mb-4">
              <h3 className="font-display text-2xl font-black tracking-wide text-gradient-brand">CONQUISTAS</h3>
              <p className="text-[11px] uppercase tracking-widest text-gold/80 font-bold mt-1">
                Complete desafios e ganhe tokens
              </p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-2 gap-2.5">
              {ACHIEVEMENTS.map((a) => (
                <div
                  key={a.id}
                  className={`relative rounded-xl border p-2 flex flex-col items-center text-center transition ${
                    a.unlocked
                      ? "border-gold/40 bg-black/30 hover:border-gold"
                      : "border-border/40 bg-black/40 opacity-50 grayscale"
                  }`}
                >
                  <img
                    src={a.image}
                    alt={a.title}
                    loading="lazy"
                    className="w-full aspect-square object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
                  />
                  <div className="mt-1 text-[10px] font-black uppercase tracking-wide leading-tight line-clamp-2 min-h-[24px]">
                    {a.title}
                  </div>
                  <div className="text-[9px] text-muted-foreground leading-tight line-clamp-2 mt-0.5 min-h-[20px]">
                    {a.desc}
                  </div>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-success/30 to-success/10 border border-success/40">
                    <span className="text-[10px]">🪙</span>
                    <span className="text-[10px] font-black text-success tabular-nums">
                      {a.reward.toLocaleString("pt-BR")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function KV({ label, value, accent, success }: { label: string; value: string; accent?: boolean; success?: boolean }) {
  return (
    <div className="rounded-lg bg-background/40 border border-border/60 px-2 py-2 sm:px-3 sm:min-w-[78px] text-center sm:text-left">
      <div className={`font-display font-black tabular-nums text-base sm:text-lg leading-tight ${accent ? "text-gradient-brand" : success ? "text-success" : "text-foreground"}`}>
        {value}
      </div>
      <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function EmptyState({ icon, title, desc, action }: { icon: React.ReactNode; title: string; desc: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 text-center">
      <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 text-primary grid place-items-center mb-3">{icon}</div>
      <div className="font-bold">{title}</div>
      <div className="text-sm text-muted-foreground mt-1 mb-4">{desc}</div>
      {action}
    </div>
  );
}
