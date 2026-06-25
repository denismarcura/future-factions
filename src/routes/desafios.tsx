import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/layout/AppShell";
import { PredictionCard } from "@/components/PredictionCard";
import { CATEGORIES, PREDICTIONS, type Prediction } from "@/lib/mock-data";
import { COMPANY_CHALLENGES } from "@/lib/mock-extra";
import { getUserChallenges } from "@/lib/user-challenges";
import { useParticipatedChallengeIds } from "@/hooks/use-participated";
import { aiSearchChallenges } from "@/lib/search-ai.functions";
import { listLatestCorpChallenges, type CorpChallengeRecord } from "@/lib/corp-challenges.functions";
import { ListChecks, Building2, Users, Lock, Globe2, Sparkles, Search, Loader2, X, Wand2, Timer, CalendarDays, Trophy, Star } from "lucide-react";
import { timeLeft } from "@/lib/mock-data";
import { WORLD_CUP_MATCHES, flagUrl } from "@/lib/world-cup-matches";

export const Route = createFileRoute("/desafios")({
  head: () => ({
    meta: [
      { title: "Desafios — Desafio dos Palpites" },
      { name: "description", content: "Mais de 150 desafios entre usuários, empresas e Copa do Mundo." },
    ],
  }),
  component: DesafiosPage,
});

function DesafiosPage() {
  const [tab, setTab] = useState<"todos" | "publicos" | "empresas" | "privados">("todos");
  const [cat, setCat] = useState<string>("Todas");
  const [userChallenges, setUserChallenges] = useState<Prediction[]>([]);
  const [query, setQuery] = useState("");
  const [aiQuery, setAiQuery] = useState<string | null>(null);
  const [aiIds, setAiIds] = useState<string[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [expiringLimit, setExpiringLimit] = useState(6);
  const [nowTs, setNowTs] = useState<number | null>(null);
  const runAiSearch = useServerFn(aiSearchChallenges);
  const fetchCorpChallenges = useServerFn(listLatestCorpChallenges);
  const [corpChallenges, setCorpChallenges] = useState<CorpChallengeRecord[]>([]);
  const participatedIds = useParticipatedChallengeIds();
  const notParticipated = <T extends { id: string }>(p: T) => !participatedIds.has(String(p.id));

  useEffect(() => {
    let alive = true;
    fetchCorpChallenges({ data: { limit: 50 } })
      .then((rows) => { if (alive) setCorpChallenges(rows); })
      .catch(() => {});
    return () => { alive = false; };
  }, [fetchCorpChallenges]);

  useEffect(() => {
    setNowTs(Date.now());
    const t = setInterval(() => setNowTs(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const sync = () => setUserChallenges(getUserChallenges());
    sync();
    window.addEventListener("ddp:user-challenges-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("ddp:user-challenges-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // Deterministic split of mock predictions into "públicos" vs "privados" so
  // each tab shows a distinct list.
  const publicMock = useMemo(() => PREDICTIONS.filter((_, i) => i % 3 !== 0), []);
  const privateMock = useMemo(() => PREDICTIONS.filter((_, i) => i % 3 === 0), []);

  const isClosed = (p: Prediction) => new Date(p.closesAt).getTime() < Date.now();

  const items = useMemo(() => {
    if (tab === "empresas") return [];
    let list: Prediction[];
    if (tab === "publicos") {
      list = [...userChallenges, ...publicMock];
    } else if (tab === "privados") {
      list = [...userChallenges, ...privateMock];
    } else {
      list = [...userChallenges, ...PREDICTIONS];
    }
    if (cat === "Encerrados") {
      list = list.filter(isClosed);
    } else {
      list = list.filter((p) => !isClosed(p));
      if (cat !== "Todas") list = list.filter((p) => p.category === cat);
    }
    list = list.filter(notParticipated);
    if (aiIds && aiIds.length) {
      const order = new Map(aiIds.map((id, i) => [id, i]));
      list = list
        .filter((p) => order.has(p.id))
        .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    } else {
      list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }
    return list;
  }, [tab, cat, userChallenges, publicMock, privateMock, aiIds, participatedIds]);

  const handleAiSearch = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const pool: Prediction[] = tab === "publicos"
        ? [...userChallenges, ...publicMock]
        : tab === "privados"
          ? [...userChallenges, ...privateMock]
          : [...userChallenges, ...PREDICTIONS];
      const payload = pool.slice(0, 250).map((p) => ({
        id: p.id,
        title: p.title,
        category: p.category,
      }));
      const res = await runAiSearch({ data: { query: q, items: payload } });
      setAiQuery(q);
      setAiIds(res.ids);
      if (res.ids.length === 0) setAiError("Nenhum desafio encontrado para esta busca.");
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Erro na busca");
      setAiIds([]);
    } finally {
      setAiLoading(false);
    }
  };

  const clearAiSearch = () => {
    setQuery("");
    setAiQuery(null);
    setAiIds(null);
    setAiError(null);
  };

  // Últimos cadastrados = user-created first, then most recently created mocks (exclui encerrados).
  const latest = useMemo(() => {
    const openMocks = PREDICTIONS.filter((p) => !isClosed(p));
    const sortedMocks = [...openMocks].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const openUser = userChallenges.filter((p) => !isClosed(p));
    return [...openUser, ...sortedMocks].filter(notParticipated).slice(0, 6);
  }, [userChallenges, participatedIds]);

  // Desafios com tempo se esgotando — abertos, mais próximos do encerramento
  const expiringSoon = useMemo(() => {
    const pool = [...userChallenges, ...PREDICTIONS].filter((p) => !isClosed(p));
    return pool
      .filter(notParticipated)
      .sort((a, b) => new Date(a.closesAt).getTime() - new Date(b.closesAt).getTime())
      .slice(0, 24);
  }, [userChallenges, participatedIds]);

  // Próximos jogos da Copa do Mundo 2026
  const upcomingMatches = useMemo(() => {
    const ref = nowTs ?? new Date("2026-06-20T00:00:00-03:00").getTime();
    return WORLD_CUP_MATCHES
      .filter((m) => new Date(m.kickoff).getTime() > ref)
      .filter((m) => !participatedIds.has(String(m.id)))
      .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime())
      .slice(0, 8);
  }, [nowTs, participatedIds]);

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-black flex items-center gap-3">
          <ListChecks className="h-7 w-7 text-primary" /> Desafios
        </h1>
        <p className="text-muted-foreground mt-1">
          Explore desafios públicos, privados (entre amigos) e promoções de empresas.
        </p>
      </header>

      {/* Busca inteligente com IA */}
      <form onSubmit={handleAiSearch} className="mb-6">
        <div className="relative rounded-2xl border border-primary/40 bg-card/60 backdrop-blur-sm shadow-glow/30 focus-within:border-primary transition">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            {aiLoading ? (
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
            ) : (
              <Wand2 className="h-5 w-5 text-primary" />
            )}
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Busca inteligente com IA — ex.: "jogos da Copa do Mundo com prêmios altos"'
            className="w-full h-14 pl-12 pr-40 bg-transparent rounded-2xl text-sm sm:text-base focus:outline-none placeholder:text-muted-foreground/70"
            disabled={aiLoading}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {(aiQuery || query) && (
              <button
                type="button"
                onClick={clearAiSearch}
                className="h-9 w-9 grid place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60"
                aria-label="Limpar"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={aiLoading || !query.trim()}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-gradient-brand text-primary-foreground font-bold text-sm shadow-glow hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Buscar</span>
            </button>
          </div>
        </div>
        {aiQuery && !aiLoading && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            Resultados de IA para <span className="font-bold text-foreground">"{aiQuery}"</span>
            {aiIds && <span>· {aiIds.length} encontrados</span>}
            <button type="button" onClick={clearAiSearch} className="text-primary hover:underline ml-1">
              limpar
            </button>
          </div>
        )}
        {aiError && (
          <div className="mt-2 text-xs text-destructive">{aiError}</div>
        )}
      </form>

      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { k: "todos", label: "Todos", icon: ListChecks },
          { k: "empresas", label: "⭐ Empresas", icon: Building2 },
          { k: "publicos", label: "Públicos", icon: Globe2 },
          { k: "privados", label: "Privados (amigos)", icon: Lock },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as typeof tab)}
            className={`inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-bold border transition ${
              tab === t.k
                ? "bg-gradient-brand text-primary-foreground border-transparent shadow-glow"
                : t.k === "empresas"
                  ? "bg-gold/10 text-gold border-gold/40 hover:bg-gold/20"
                  : "bg-card text-muted-foreground border-border/60 hover:text-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ⭐ Empresas em Destaque — sempre no topo, exceto na aba dedicada */}
      {tab !== "empresas" && corpChallenges.length > 0 && (
        <section className="mb-8 rounded-3xl border-2 border-gold/40 bg-gradient-to-br from-gold/10 via-card to-card p-5 shadow-glow">
          <div className="flex items-center justify-between mb-4 gap-3">
            <h2 className="font-display text-xl font-black flex items-center gap-2 min-w-0">
              <Star className="h-6 w-6 text-gold fill-gold shrink-0" />
              <span className="truncate">Empresas em Destaque</span>
            </h2>
            <button
              onClick={() => setTab("empresas")}
              className="text-xs sm:text-sm font-bold text-gold hover:underline shrink-0"
            >
              Ver todos →
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {corpChallenges.slice(0, 6).map((c) => (
              <Link
                key={c.id}
                to="/desafio-corp/$id"
                params={{ id: c.id }}
                className="block rounded-2xl border border-gold/30 bg-card p-4 hover:border-gold hover:shadow-glow transition group"
              >
                <div className="flex items-center gap-3 mb-2">
                  {c.logoUrl ? (
                    <img src={c.logoUrl} alt="" className="h-11 w-11 rounded-xl object-cover border border-border/60" />
                  ) : (
                    <div className="h-11 w-11 rounded-xl bg-gold/15 grid place-items-center text-gold font-black">
                      {(c.companyName ?? c.title).slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-gold">Patrocinado</div>
                    <div className="font-display font-bold truncate text-sm">{c.companyName ?? "Empresa"}</div>
                  </div>
                </div>
                <h3 className="font-display font-bold text-sm leading-snug line-clamp-2 group-hover:text-gold transition">{c.title}</h3>
                {c.prizeName && (
                  <div className="mt-2 text-xs text-muted-foreground line-clamp-1">🎁 {c.prizeName}</div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}


      {tab !== "empresas" && (
        <>
          {/* Próximos jogos — Copa 2026 */}
          {upcomingMatches.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-3 gap-3">
                <h2 className="font-display text-lg font-bold flex items-center gap-2 min-w-0">
                  <CalendarDays className="h-5 w-5 text-primary shrink-0" />
                  <span className="truncate">Próximos jogos — Copa 2026</span>
                </h2>
                <span className="text-xs text-muted-foreground shrink-0">
                  {upcomingMatches.length} partidas
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingMatches.map((m) => {
                  const d = new Date(m.kickoff);
                  const pad = (n: number) => String(n).padStart(2, "0");
                  const dateLabel = `${pad(d.getDate())}/${pad(d.getMonth() + 1)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
                  return (
                    <Link
                      key={m.id}
                      to="/previsao/$id"
                      params={{ id: String(m.id) }}
                      className="block rounded-2xl border border-border/60 bg-card p-4 hover:border-primary/50 hover:shadow-glow transition"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary min-w-0">
                          <Trophy className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">Grupo {m.group}</span>
                        </span>
                        <span className="text-[11px] text-muted-foreground shrink-0">{dateLabel}</span>
                      </div>
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <img src={flagUrl(m.homeCode)} alt="" className="h-6 w-6 rounded-full object-cover shrink-0" />
                          <span className="font-display font-bold text-sm truncate">{m.home}</span>
                        </div>
                        <span className="text-muted-foreground text-xs">×</span>
                        <div className="flex items-center gap-2 min-w-0 justify-end">
                          <span className="font-display font-bold text-sm truncate text-right">{m.away}</span>
                          <img src={flagUrl(m.awayCode)} alt="" className="h-6 w-6 rounded-full object-cover shrink-0" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Encerrando em breve */}
          <section id="encerrando" className="mb-8 scroll-mt-24">

            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg font-bold flex items-center gap-2">
                <Timer className="h-5 w-5 text-destructive" /> Encerrando em breve
              </h2>
              <span className="text-xs text-muted-foreground">
                {expiringSoon.length} desafios
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {expiringSoon.slice(0, expiringLimit).map((p) => (
                <PredictionCard key={`expiring-${p.id}`} prediction={p} />
              ))}
            </div>
            {expiringSoon.length > 6 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setExpiringLimit((prev) => (prev === 6 ? expiringSoon.length : 6))}
                  className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-gradient-brand text-primary-foreground font-bold text-sm shadow-glow hover:scale-[1.02] transition"
                >
                  {expiringLimit === 6 ? "Ver mais Desafios que estão encerrando em Breve" : "Ver menos"}
                </button>
              </div>
            )}
          </section>

          {/* Últimos desafios cadastrados */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-gold" /> Últimos desafios cadastrados
              </h2>
              <span className="text-xs text-muted-foreground">
                {latest.length} mais recentes
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {latest.map((p) => (
                <PredictionCard key={`latest-${p.id}`} prediction={p} />
              ))}
            </div>
          </section>

          <div className="mb-6 flex items-center gap-2 overflow-x-auto -mx-4 px-4 pb-2">
            {["Todas", ...CATEGORIES, "Encerrados"].map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`shrink-0 h-8 px-3 rounded-full text-xs font-medium border transition ${
                  cat === c
                    ? c === "Encerrados"
                      ? "border-destructive text-destructive bg-destructive/10"
                      : "border-gold text-gold bg-gold/10"
                    : "border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-10 text-center text-muted-foreground">
              Nenhum desafio encontrado nesta combinação de filtros.
            </div>
          ) : (
            <section className="grid gap-4 sm:grid-cols-2">
              {items.map((p) => (
                <PredictionCard key={p.id} prediction={p} />
              ))}
            </section>
          )}
        </>
      )}

      {tab === "empresas" && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...COMPANY_CHALLENGES].reverse().map((c) => (
            <article
              key={c.id}
              className="rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/50 hover:shadow-glow transition"
            >
              <div className="flex items-center gap-3">
                <img src={c.company.logo} alt="" className="h-12 w-12 rounded-xl border border-border/60" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">{c.company.category} · {c.company.city}</div>
                  <div className="font-display font-bold truncate">{c.company.name}</div>
                </div>
              </div>
              <h3 className="mt-3 font-display font-bold text-base leading-snug">{c.title}</h3>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary font-bold border border-primary/30">
                  🟢 {c.status}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-gold/15 text-gold font-bold border border-gold/30">
                  Prêmio: {c.prize}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {c.participants} part.</span>
                <Link to="/desafios" className="text-primary font-bold">Participar →</Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </AppShell>
  );
}
