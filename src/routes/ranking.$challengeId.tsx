import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Trophy, Crown, Medal, Users, Calendar, ArrowLeft, ShoppingBag, UserPlus, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { getChallengeRanking } from "@/lib/challenge-ranking.functions";

const rankingQuery = (challengeId: string) =>
  queryOptions({
    queryKey: ["challenge-ranking", challengeId],
    queryFn: () => getChallengeRanking({ data: { challengeId } }),
  });

export const Route = createFileRoute("/ranking/$challengeId")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(rankingQuery(params.challengeId)),
  head: ({ loaderData }) => {
    const c = loaderData?.challenge;
    const title = c ? `Ranking · ${c.title}` : "Ranking do Desafio";
    const desc = c
      ? `Veja o ranking oficial do desafio ${c.title} no Desafio dos Palpites.`
      : "Ranking oficial dos desafios.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        ...(c?.image_url ? [{ property: "og:image", content: c.image_url }] : []),
      ],
    };
  },
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <AppShell>
        <div className="max-w-md mx-auto mt-12 glass-card rounded-2xl p-6 text-center">
          <p className="text-sm text-destructive mb-4">{error.message}</p>
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="h-10 px-4 rounded-full bg-gradient-brand text-primary-foreground text-sm font-bold"
          >
            Tentar novamente
          </button>
        </div>
      </AppShell>
    );
  },
  notFoundComponent: () => (
    <AppShell>
      <div className="text-center mt-12 text-muted-foreground">Desafio não encontrado.</div>
    </AppShell>
  ),
  component: RankingPage,
});

function formatTokens(n: number) {
  return n.toLocaleString("pt-BR");
}

function initials(name: string | null) {
  if (!name) return "??";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

function RankingPage() {
  const { challenge, participants_count, ranking } = Route.useLoaderData();
  const { data } = useSuspenseQuery(rankingQuery(Route.useParams().challengeId));
  const view = data ?? { challenge, participants_count, ranking };

  if (!view.challenge) {
    return (
      <AppShell>
        <div className="text-center mt-12 text-muted-foreground">Desafio não encontrado.</div>
      </AppShell>
    );
  }

  const c = view.challenge;
  const top3 = view.ranking.slice(0, 3);
  const rest = view.ranking.slice(3);
  const finalizado =
    c.apuration_status === "apurado_automaticamente" ||
    c.apuration_status === "finalizado";

  return (
    <AppShell>
      <Link to="/desafios" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary mb-3">
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar para desafios
      </Link>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 glass-card mb-6">
        {c.image_url && (
          <div className="absolute inset-0 opacity-20 bg-cover bg-center" style={{ backgroundImage: `url(${c.image_url})` }} />
        )}
        <div className="relative p-6 sm:p-8">
          <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-black text-gold mb-2">
            <Trophy className="h-3.5 w-3.5" /> Ranking oficial
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-black mb-3">{c.title}</h1>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-4 w-4" /> {view.participants_count} participantes
            </div>
            {c.result_confirmed_at && (
              <div className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Apurado em {new Date(c.result_confirmed_at).toLocaleDateString("pt-BR")}
              </div>
            )}
          </div>

          {finalizado && c.home_team && c.away_team && c.home_score !== null && c.away_score !== null && (
            <div className="mt-5 inline-flex items-center gap-3 px-4 py-3 rounded-2xl border border-gold/40 bg-gold/5">
              <span className="font-display font-black text-base">{c.home_team}</span>
              <span className="font-display text-2xl font-black text-gradient-brand tabular-nums">
                {c.home_score} × {c.away_score}
              </span>
              <span className="font-display font-black text-base">{c.away_team}</span>
            </div>
          )}

          {!finalizado && (
            <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/15 text-gold text-xs font-bold border border-gold/30">
              Em apuração — ranking será publicado em breve
            </div>
          )}
        </div>
      </section>

      {view.ranking.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground">
          Ainda não há participantes neste desafio.
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          {top3.length >= 1 && (
            <section className="grid sm:grid-cols-3 gap-3 mb-6">
              {top3.map((u, i) => {
                const tone =
                  i === 0
                    ? "border-gold/60 bg-gold/10 shadow-glow-gold"
                    : i === 1
                      ? "border-muted bg-muted/30"
                      : "border-amber-600/40 bg-amber-600/10";
                const Icon = i === 0 ? Crown : i === 1 ? Medal : Trophy;
                return (
                  <div key={u.user_id} className={`rounded-2xl border ${tone} p-4 flex items-center gap-3`}>
                    <div className="relative">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="h-14 w-14 rounded-2xl object-cover border border-border/60" />
                      ) : (
                        <div className="h-14 w-14 rounded-2xl bg-card grid place-items-center font-display font-black text-lg border border-border/60">
                          {initials(u.full_name)}
                        </div>
                      )}
                      <div className="absolute -top-2 -left-2 h-7 w-7 rounded-full bg-gradient-brand grid place-items-center text-primary-foreground">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">#{u.position} lugar</div>
                      <div className="font-display font-black text-sm truncate">{u.full_name ?? "Participante"}</div>
                      <div className="text-xs text-gold font-bold tabular-nums">{formatTokens(u.tokens)} tokens</div>
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {/* Full ranking list */}
          <section className="glass-card rounded-2xl border border-border/60 overflow-hidden mb-6">
            <header className="px-5 py-3 border-b border-border/60 flex items-center justify-between">
              <h2 className="font-display font-bold text-sm flex items-center gap-2">
                <Trophy className="h-4 w-4 text-gold" /> Classificação completa
              </h2>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Top 20 ganha selo
              </span>
            </header>
            <ul>
              {rest.map((u) => {
                const isTop20 = u.position <= 20;
                return (
                  <li
                    key={u.user_id}
                    className={`flex items-center gap-3 px-5 py-3 border-b border-border/40 last:border-b-0 ${
                      isTop20 ? "bg-gold/[0.03]" : ""
                    }`}
                  >
                    <div className="w-8 text-center font-display font-black tabular-nums text-sm">
                      {u.position}
                    </div>
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="h-9 w-9 rounded-xl object-cover border border-border/60" />
                    ) : (
                      <div className="h-9 w-9 rounded-xl bg-card grid place-items-center text-xs font-bold border border-border/60">
                        {initials(u.full_name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{u.full_name ?? "Participante"}</div>
                      {u.acertos > 0 && (
                        <div className="text-[11px] text-muted-foreground truncate">{u.acertos} acerto(s)</div>
                      )}
                    </div>
                    {isTop20 && (
                      <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/15 text-gold text-[10px] font-black uppercase border border-gold/30">
                        <Trophy className="h-3 w-3" /> Top 20
                      </span>
                    )}
                    <div className="text-right">
                      <div className="font-display font-black text-gold tabular-nums text-sm">
                        {formatTokens(u.tokens)}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">tokens</div>
                    </div>
                  </li>
                );
              })}
              {rest.length === 0 && top3.length > 0 && (
                <li className="px-5 py-6 text-center text-xs text-muted-foreground">
                  Apenas os {top3.length} primeiros participaram.
                </li>
              )}
            </ul>
          </section>

          {/* CTAs */}
          <section className="grid sm:grid-cols-3 gap-3">
            <Link
              to="/desafios"
              className="glass-card rounded-2xl border border-border/60 p-4 hover:border-primary/60 transition flex items-center gap-3"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/15 grid place-items-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="font-display font-bold text-sm">Novos desafios</div>
                <div className="text-[11px] text-muted-foreground">Continue ganhando tokens</div>
              </div>
            </Link>
            <Link
              to="/shop"
              className="glass-card rounded-2xl border border-border/60 p-4 hover:border-primary/60 transition flex items-center gap-3"
            >
              <div className="h-10 w-10 rounded-xl bg-gold/15 grid place-items-center">
                <ShoppingBag className="h-5 w-5 text-gold" />
              </div>
              <div className="min-w-0">
                <div className="font-display font-bold text-sm">Trocar tokens</div>
                <div className="text-[11px] text-muted-foreground">Brindes na loja</div>
              </div>
            </Link>
            <Link
              to="/dashboard"
              className="glass-card rounded-2xl border border-border/60 p-4 hover:border-primary/60 transition flex items-center gap-3"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/15 grid place-items-center">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="font-display font-bold text-sm">Convidar amigos</div>
                <div className="text-[11px] text-muted-foreground">Bônus por indicação</div>
              </div>
            </Link>
          </section>
        </>
      )}
    </AppShell>
  );
}
