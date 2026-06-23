import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  Trophy, Users, Coins, ListChecks, Building2, CheckCircle2, Clock,
  UserPlus, MessageCircle, Copy, Sparkles, Calendar,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { getFriendProfile } from "@/lib/friend-profile.functions";
import { toast } from "sonner";

type SearchParams = { d?: string };

export const Route = createFileRoute("/amigo/$ref")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    d: typeof s.d === "string" ? s.d : undefined,
  }),
  loader: async ({ params }) => {
    const fn = getFriendProfile as any;
    const data = await fn({ data: { ref: params.ref } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const name = loaderData?.profile?.full_name ?? "Amigo";
    const title = `${name} te convidou para o Desafio dos Palpites`;
    const desc = `Veja os desafios criados, em andamento e oportunidades para participar com ${name}.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:image", content: loaderData?.profile?.avatar_url ?? "" },
      ],
    };
  },
  errorComponent: () => <AppShell><div className="p-8 text-center">Erro ao carregar perfil.</div></AppShell>,
  notFoundComponent: () => (
    <AppShell>
      <div className="max-w-md mx-auto p-8 text-center space-y-3">
        <h1 className="font-display text-2xl font-black">Convite não encontrado</h1>
        <p className="text-sm text-muted-foreground">O link pode estar incorreto ou o amigo ainda não está ativo.</p>
        <Link to="/auth" className="inline-block h-11 px-6 rounded-full bg-gradient-brand text-primary-foreground text-sm font-bold flex items-center justify-center">Criar minha conta</Link>
      </div>
    </AppShell>
  ),
  component: FriendProfile,
});

function FriendProfile() {
  const data = Route.useLoaderData() as any;
  const search = Route.useSearch();
  const highlightId = search.d;
  const { profile, stats, createdOpen, createdClosed, participated, wins, corpOpportunities } = data;
  const name = profile.full_name || "Amigo";

  const signupUrl = typeof window !== "undefined"
    ? `${window.location.origin}/auth?ref=${profile.id.slice(0, 8)}`
    : `/auth?ref=${profile.id.slice(0, 8)}`;

  function copyLink() {
    navigator.clipboard.writeText(signupUrl);
    toast.success("Link copiado!");
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto py-4 space-y-6">
        {/* Header */}
        <header className="glass-card rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-5 border border-border/60">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={name} className="h-20 w-20 rounded-full object-cover ring-2 ring-primary/40" />
          ) : (
            <div className="h-20 w-20 rounded-full bg-gradient-brand grid place-items-center text-2xl font-black text-primary-foreground">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold uppercase text-primary mb-1">Você foi convidado(a)</div>
            <h1 className="text-2xl md:text-3xl font-display font-black">{name}</h1>
            {(profile.cidade || profile.estado) && (
              <div className="text-xs text-muted-foreground">{profile.cidade}{profile.cidade && profile.estado ? " / " : ""}{profile.estado}</div>
            )}
          </div>
          <Link to="/auth" search={{ ref: profile.id.slice(0, 8) } as any} className="h-12 px-6 rounded-full bg-gradient-brand text-primary-foreground text-sm font-bold flex items-center gap-2 shadow-glow">
            <UserPlus className="h-4 w-4" /> Cadastrar e ganhar 1.000 tokens
          </Link>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard icon={Coins} label="Tokens ganhos" value={stats.tokensEarned.toLocaleString("pt-BR")} accent="gold" />
          <StatCard icon={Users} label="Amigos cadastrados" value={stats.friendsCount} />
          <StatCard icon={ListChecks} label="Desafios criados" value={stats.createdCount} />
          <StatCard icon={Sparkles} label="Participações" value={stats.participatedCount} />
          <StatCard icon={Trophy} label="Vitórias" value={stats.winsCount} />
        </div>

        {/* Created challenges */}
        <Section title={`Desafios criados por ${name.split(" ")[0]}`} icon={ListChecks} count={createdOpen.length}>
          {createdOpen.length === 0 ? (
            <Empty>Nenhum desafio aberto no momento.</Empty>
          ) : (
            <Grid items={createdOpen} highlightId={highlightId} />
          )}
        </Section>

        {/* Participating */}
        <Section title={`Desafios em que está participando`} icon={Sparkles} count={participated.length}>
          {participated.length === 0 ? <Empty>Sem participações ainda.</Empty> : <Grid items={participated} />}
        </Section>

        {/* Corporate opportunities */}
        <Section title="Oportunidades — desafios de empresas" icon={Building2} count={corpOpportunities.length}>
          {corpOpportunities.length === 0 ? (
            <Empty>Nenhuma oportunidade aberta agora.</Empty>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {corpOpportunities.map((c: any) => (
                <Link key={c.id} to="/desafios-empresas" className="glass-card rounded-xl overflow-hidden border border-border/60 hover:border-primary/60 transition">
                  {c.banner_url ? (
                    <img src={c.banner_url} alt={c.title} className="w-full aspect-video object-cover" />
                  ) : (
                    <div className="aspect-video bg-gradient-brand grid place-items-center"><Building2 className="h-8 w-8 text-primary-foreground/60" /></div>
                  )}
                  <div className="p-3">
                    <div className="text-[10px] font-bold uppercase text-primary">{c.company_name}</div>
                    <div className="font-bold text-sm line-clamp-2">{c.title}</div>
                    {c.prize_name && <div className="text-xs text-muted-foreground mt-1 truncate">🎁 {c.prize_name}</div>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Section>

        {/* Completed results / wins */}
        <Section title="Resultados de desafios concluídos" icon={Trophy} count={wins.length + createdClosed.length}>
          {wins.length === 0 && createdClosed.length === 0 ? (
            <Empty>Sem resultados publicados ainda.</Empty>
          ) : (
            <div className="space-y-2">
              {wins.map((w: any) => (
                <div key={w.id} className="flex items-center gap-3 p-3 rounded-xl glass-card border border-amber-500/30">
                  <Trophy className="h-5 w-5 text-amber-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{w.challenges?.title}</div>
                    <div className="text-xs text-muted-foreground">Vitória · +{w.tokens} tokens · {w.status}</div>
                  </div>
                </div>
              ))}
              {createdClosed.map((c: any) => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl glass-card border border-border/60">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{c.title}</div>
                    <div className="text-xs text-muted-foreground">Encerrado · {c.apuration_status ?? "aguardando apuração"}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* CTA */}
        <section className="glass-card rounded-2xl p-6 border border-primary/40 text-center space-y-3">
          <h2 className="font-display text-xl font-black">Entre no time e ganhe 1.000 tokens</h2>
          <p className="text-sm text-muted-foreground">Cadastre-se com o link de {name.split(" ")[0]} e comece a palpitar agora.</p>
          <div className="flex flex-col sm:flex-row gap-2 max-w-xl mx-auto">
            <input readOnly value={signupUrl} className="flex-1 h-11 px-3 rounded-lg bg-background border border-border/60 text-xs font-mono" onFocus={(e) => e.currentTarget.select()} />
            <button onClick={copyLink} className="h-11 px-4 rounded-lg border border-border/60 text-xs font-bold inline-flex items-center justify-center gap-1.5"><Copy className="h-3.5 w-3.5" />Copiar</button>
            <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${name} te convidou para o Desafio dos Palpites: ${signupUrl}`)}`} target="_blank" rel="noreferrer" className="h-11 px-4 rounded-lg bg-[#25D366] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</a>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: any; accent?: "gold" }) {
  return (
    <div className="glass-card rounded-xl p-4 border border-border/60">
      <Icon className={`h-5 w-5 mb-1 ${accent === "gold" ? "text-gold" : "text-primary"}`} />
      <div className="font-display font-black text-xl leading-none">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function Section({ title, icon: Icon, count, children }: { title: string; icon: any; count?: number; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="font-bold">{title}</h2>
        {count !== undefined && <span className="text-xs text-muted-foreground">({count})</span>}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-muted-foreground glass-card rounded-xl p-4 border border-border/40">{children}</div>;
}

function Grid({ items, highlightId }: { items: any[]; highlightId?: string }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((c) => (
        <Link
          key={c.id}
          to="/previsao/$id"
          params={{ id: c.id }}
          className={`glass-card rounded-xl overflow-hidden border transition hover:border-primary/60 ${highlightId === c.id ? "border-primary ring-2 ring-primary/40" : "border-border/60"}`}
        >
          {c.image_url ? (
            <img src={c.image_url} alt={c.title} className="w-full aspect-video object-cover" />
          ) : (
            <div className="aspect-video bg-gradient-brand grid place-items-center"><Trophy className="h-8 w-8 text-primary-foreground/60" /></div>
          )}
          <div className="p-3">
            {c.category && <div className="text-[10px] font-bold uppercase text-primary">{c.category}</div>}
            <div className="font-bold text-sm line-clamp-2">{c.title}</div>
            {c.closes_at && (
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                Encerra {new Date(c.closes_at).toLocaleDateString("pt-BR")}
              </div>
            )}
            {highlightId === c.id && (
              <div className="mt-2 text-[10px] font-bold uppercase text-primary flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Convite especial
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
