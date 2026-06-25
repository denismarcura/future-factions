import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Trophy, Target, Award, Sparkles, CheckCircle2, XCircle, Clock, LogIn, Mail } from "lucide-react";
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
        </div>

        <aside>
          <div className="rounded-2xl bg-card border border-border/60 p-5">
            <h3 className="font-display font-bold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-gold" /> Conquistas
            </h3>
            <ul className="mt-4 space-y-2">
              {ACHIEVEMENTS.map((a) => (
                <li
                  key={a.id}
                  className={`flex items-start gap-3 p-2.5 rounded-lg border ${
                    a.unlocked ? "border-gold/40 bg-gold/5" : "border-border/60 opacity-60"
                  }`}
                >
                  <div className={`h-8 w-8 rounded-lg grid place-items-center ${a.unlocked ? "bg-gold/20 text-gold" : "bg-muted text-muted-foreground"}`}>
                    <Award className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{a.title}</div>
                    <div className="text-xs text-muted-foreground">{a.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function KV({ label, value, accent, success }: { label: string; value: string; accent?: boolean; success?: boolean }) {
  return (
    <div className="rounded-lg bg-background/40 border border-border/60 px-3 py-2 min-w-[78px]">
      <div className={`font-display font-black tabular-nums ${accent ? "text-gradient-brand text-lg" : success ? "text-success" : "text-foreground"}`}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
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
