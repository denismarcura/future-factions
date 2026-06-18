import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { BookOpen, UserPlus, Target, Trophy, ShoppingBag, Sparkles } from "lucide-react";

export const Route = createFileRoute("/como-funciona")({
  head: () => ({
    meta: [
      { title: "Como Funciona — Desafio dos Palpites" },
      { name: "description", content: "Em 4 passos: cadastre-se, participe de desafios, acumule Tokens e troque por prêmios." },
    ],
  }),
  component: HowItWorks,
});

const STEPS = [
  { icon: UserPlus, title: "Cadastre-se grátis", desc: "Ganhe 1.000 Tokens só por entrar. Sem cartão, sem pegadinha." },
  { icon: Target, title: "Participe de desafios", desc: "Futebol, UFC, NBA, criptos, reality, política — ou crie um desafio entre amigos." },
  { icon: Trophy, title: "Acerte e suba no ranking", desc: "Acertou? Mais Tokens, vitórias e visibilidade no Top 100." },
  { icon: ShoppingBag, title: "Troque por prêmios", desc: "iPhone, console, voucher iFood, camisa oficial, brindes de empresas parceiras." },
];

function HowItWorks() {
  return (
    <AppShell>
      <header className="mb-10">
        <h1 className="font-display text-3xl sm:text-5xl font-black flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" /> Como <span className="text-gradient-brand">funciona</span>
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Plataforma 100% gratuita. Você não gasta R$ 1 real para palpitar.
          Tudo gira em torno de Tokens virtuais — acertou, acumulou, trocou por prêmio.
        </p>
      </header>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {STEPS.map((s, i) => (
          <div key={s.title} className="relative rounded-2xl border border-border/60 bg-card p-6 hover:border-primary/50 hover:shadow-glow transition">
            <div className="absolute -top-3 -left-3 h-10 w-10 rounded-full bg-gradient-brand grid place-items-center font-display font-black shadow-glow text-primary-foreground">
              {i + 1}
            </div>
            <s.icon className="h-7 w-7 text-primary mt-2" />
            <h3 className="mt-4 font-display font-bold">{s.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-gold/40 glass-card p-6 sm:p-10 mb-10">
        <Sparkles className="h-7 w-7 text-gold" />
        <h2 className="mt-3 font-display text-2xl font-black">Profeta da Copa</h2>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Acertou um palpite improvável? Ganha o selo dourado <span className="text-gold font-bold">Profeta da Copa</span>,
          que aparece no seu perfil e te dá um boost no ranking. É o tipo de acerto que vira história de mesa de bar.
        </p>
      </section>

      <div className="text-center">
        <Link
          to="/desafios"
          className="inline-flex items-center gap-2 h-12 px-8 rounded-full bg-gradient-brand text-primary-foreground font-black uppercase shadow-glow hover:scale-[1.03] transition"
        >
          Bora começar →
        </Link>
      </div>
    </AppShell>
  );
}
