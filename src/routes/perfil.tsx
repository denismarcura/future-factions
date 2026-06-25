import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Trophy, Target, Award, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ACHIEVEMENTS, CURRENT_USER, formatTokens, PREDICTIONS } from "@/lib/mock-data";
import { PredictionCard } from "@/components/PredictionCard";
import { InviteLinkCard } from "@/components/InviteLinkCard";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Seu Perfil — EU ACHO QUE VAI DAR @#&" },
      { name: "description", content: "Seu nível, tokens, ranking e conquistas." },
    ],
  }),
  component: Perfil,
});

function Perfil() {
  const u = CURRENT_USER;
  const total = u.acertos + u.erros;
  const rate = total ? Math.round((u.acertos / total) * 100) : 0;
  const minhas = PREDICTIONS.slice(0, 4);

  return (
    <AppShell>
      <section className="relative overflow-hidden rounded-3xl border border-border/60 glass-card p-6 sm:p-8 mb-6">
        <div className="absolute -top-16 -right-10 h-56 w-56 rounded-full bg-primary/30 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row items-start gap-6">
          <div className="relative">
            <img src={u.avatar} alt="" className="h-24 w-24 rounded-2xl border-2 border-gold shadow-glow-gold" />
            <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-gradient-brand text-primary-foreground text-[10px] font-black uppercase tracking-wider">
              {u.level}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-3xl font-black">{u.username}</h1>
            <div className="mt-1 text-sm text-muted-foreground inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> {u.city}, {u.state}
            </div>
            <div className="mt-4 flex flex-wrap gap-4">
              <KV label="Tokens" value={formatTokens(u.tokens)} accent />
              <KV label="Ranking" value="#1.482" />
              <KV label="Acertos" value={u.acertos.toString()} />
              <KV label="Erros" value={u.erros.toString()} />
              <KV label="Taxa" value={`${rate}%`} success />
              <KV label="Seguidores" value={u.followers.toString()} />
              <KV label="Seguindo" value={u.following.toString()} />
            </div>
          </div>
          <button className="h-10 px-5 rounded-full border border-border/60 text-sm font-bold hover:border-primary/60 hover:text-primary">
            Editar perfil
          </button>
        </div>
      </section>
      <div className="mb-6">
        <InviteLinkCard title="Seu link · convide e ganhe +100 Tokens por amigo" />
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div>
          <h2 className="font-display text-xl font-bold mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Suas previsões
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {minhas.map((p) => <PredictionCard key={p.id} prediction={p} />)}
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

          <div className="mt-4 rounded-2xl glass-card p-5">
            <div className="text-xs uppercase tracking-wider font-bold text-gold flex items-center gap-2">
              <Target className="h-4 w-4" /> Profeta da Copa
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Acerte 1 previsão da Copa com odds menor que 1.5x para desbloquear o selo dourado.
            </p>
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
