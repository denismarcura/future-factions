import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PredictionCard } from "@/components/PredictionCard";
import { CATEGORIES, PREDICTIONS, type Prediction } from "@/lib/mock-data";
import { COMPANY_CHALLENGES } from "@/lib/mock-extra";
import { getUserChallenges } from "@/lib/user-challenges";
import { ListChecks, Building2, Users, Lock, Globe2 } from "lucide-react";

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

  const items = useMemo(() => {
    if (tab === "empresas") return [];
    let list = [...userChallenges, ...PREDICTIONS];
    if (cat !== "Todas") list = list.filter((p) => p.category === cat);
    if (tab === "privados") list = list.slice(0, 6); // mock
    return list;
  }, [tab, cat, userChallenges]);

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

      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { k: "todos", label: "Todos", icon: ListChecks },
          { k: "publicos", label: "Públicos", icon: Globe2 },
          { k: "empresas", label: "Empresas", icon: Building2 },
          { k: "privados", label: "Privados (amigos)", icon: Lock },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as typeof tab)}
            className={`inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-bold border transition ${
              tab === t.k
                ? "bg-gradient-brand text-primary-foreground border-transparent shadow-glow"
                : "bg-card text-muted-foreground border-border/60 hover:text-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab !== "empresas" && (
        <>
          <div className="mb-6 flex items-center gap-2 overflow-x-auto -mx-4 px-4 pb-2">
            {["Todas", ...CATEGORIES].map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`shrink-0 h-8 px-3 rounded-full text-xs font-medium border transition ${
                  cat === c
                    ? "border-gold text-gold bg-gold/10"
                    : "border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <section className="grid gap-4 sm:grid-cols-2">
            {items.map((p) => (
              <PredictionCard key={p.id} prediction={p} />
            ))}
          </section>
        </>
      )}

      {tab === "empresas" && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COMPANY_CHALLENGES.map((c) => (
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
