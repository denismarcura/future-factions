import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import logoAsset from "@/assets/logo-desafio.png.asset.json";
import {
  Coins,
  Sparkles,
  Gift,
  Trophy,
  Target,
  Users,
  Calendar,
  UserPlus,
  Share2,
  ListChecks,
  ShoppingBag,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Clock,
  Wallet,
  Rocket,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";

const SITE_URL = "https://www.desafiodospalpites.com.br";

export const Route = createFileRoute("/como-funcionam-os-tokens")({
  head: () => ({
    meta: [
      { title: "Como Funcionam os Tokens | Desafio dos Palpites" },
      {
        name: "description",
        content:
          "Entenda como ganhar Tokens, usar recompensas e trocar por prêmios no Desafio dos Palpites.",
      },
      { property: "og:title", content: "Como Funcionam os Tokens | Desafio dos Palpites" },
      {
        property: "og:description",
        content:
          "Tokens são o sistema de recompensas do Desafio dos Palpites. Participe gratuitamente, acumule e troque por prêmios reais.",
      },
      { property: "og:url", content: `${SITE_URL}/como-funcionam-os-tokens` },
      { property: "og:type", content: "article" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/como-funcionam-os-tokens` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: TokensPage,
});

const WHAT_IS = [
  { icon: XCircle, title: "Tokens não são dinheiro", tone: "warn" as const },
  { icon: XCircle, title: "Tokens não podem ser vendidos", tone: "warn" as const },
  { icon: CheckCircle2, title: "Servem para participar de desafios", tone: "ok" as const },
  { icon: CheckCircle2, title: "Podem ser trocados por prêmios disponíveis", tone: "ok" as const },
  { icon: CheckCircle2, title: "Ajudam a ter mais oportunidades de palpites", tone: "ok" as const },
];

const USES = [
  {
    icon: Target,
    title: "Fazer mais palpites",
    desc: "Use seus Tokens para participar de mais desafios e aumentar suas chances de pontuar.",
  },
  {
    icon: Gift,
    title: "Trocar por prêmios",
    desc: "Acumule Tokens e troque por produtos, serviços, experiências e recompensas cadastradas.",
  },
  {
    icon: Rocket,
    title: "Liberar oportunidades",
    desc: "Complete missões, suba no ranking e acesse novas formas de participar.",
  },
  {
    icon: Users,
    title: "Participar da comunidade",
    desc: "Convide amigos, entre em desafios e dispute rankings de forma divertida e gratuita.",
  },
];

const EARN_STEPS = [
  { icon: UserPlus, title: "Cadastro gratuito", desc: "Ao criar sua conta, você recebe Tokens de boas-vindas." },
  { icon: Calendar, title: "Check-in diário", desc: "Entre todos os dias e receba bônus de Tokens." },
  { icon: ListChecks, title: "Missões", desc: "Complete missões cadastradas na plataforma e receba Tokens." },
  { icon: Share2, title: "Convide amigos", desc: "Cada amigo convidado pode gerar Tokens extras para você." },
  { icon: Target, title: "Participação em desafios", desc: "Participe, interaja e acumule recompensas." },
  { icon: Trophy, title: "Ranking e campanhas especiais", desc: "Bons colocados e participantes de campanhas recebem Tokens extras." },
];

const REDEEM_STEPS = [
  { title: "Acesse a área de prêmios", desc: "Veja todos os prêmios disponíveis na plataforma." },
  { title: "Confira o valor em Tokens", desc: "Cada prêmio possui uma quantidade necessária de Tokens." },
  { title: "Solicite o resgate", desc: "Ao atingir a quantidade necessária, clique para solicitar a troca." },
  { title: "Aguarde a confirmação", desc: "A equipe ou empresa responsável confirma o resgate." },
  { title: "Receba seu prêmio", desc: "O prazo de entrega pode variar conforme o prêmio cadastrado." },
];

const NOT_MONEY = [
  "Não têm valor monetário",
  "Não podem ser sacados",
  "Não podem ser vendidos",
  "Servem apenas dentro da plataforma",
  "Podem ser usados conforme as regras do Desafio dos Palpites",
];

const FAQ = [
  { q: "O que é Token?", a: "Token é um ponto de recompensa usado dentro do Desafio dos Palpites." },
  { q: "Token é dinheiro?", a: "Não. Token não é dinheiro e não pode ser sacado." },
  { q: "Como ganho Tokens?", a: "Você pode ganhar Tokens com cadastro, check-in diário, missões, convites, desafios e campanhas." },
  { q: "Como troco Tokens por prêmios?", a: "Acesse a área de prêmios, escolha um prêmio disponível e solicite a troca usando seus Tokens." },
  { q: "Os Tokens vencem?", a: "Sim. Os Tokens expiram em 12 meses após serem recebidos." },
  { q: "Posso vender meus Tokens?", a: "Não. Tokens não podem ser vendidos ou convertidos em dinheiro." },
  { q: "Posso transferir Tokens para outra pessoa?", a: "Não. A transferência entre usuários não é permitida, salvo se a administração ativar essa opção futuramente." },
  { q: "Quem entrega os prêmios?", a: "Os prêmios podem ser entregues pelo Desafio dos Palpites ou por empresas parceiras, conforme as regras de cada campanha." },
];

function TokensPage() {
  return (
    <AppShell>
      {/* HERO */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-primary/30 glass-card p-6 sm:p-12 mb-8 text-center">
        <div className="absolute -top-24 -right-20 h-80 w-80 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-gold/25 blur-3xl" />

        <div className="relative max-w-3xl mx-auto">
          <div className="flex flex-col items-center gap-3">
            <div className="relative animate-pulse-slow">
              <div className="absolute inset-0 rounded-full bg-gold/40 blur-2xl" />
              <img
                src={logoAsset.url}
                alt="Desafio dos Palpites"
                className="relative h-20 w-20 sm:h-28 sm:w-28 object-contain drop-shadow-[0_0_18px_rgba(255,200,80,0.55)]"
              />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/15 text-gold text-[11px] sm:text-xs font-bold border border-gold/40">
              <Sparkles className="h-3 w-3" /> 100% GRATUITO · GANHE PRÊMIOS · TOKENS EXPIRAM EM 12 MESES
            </span>
          </div>

          <h1 className="mt-5 font-display text-3xl sm:text-5xl lg:text-6xl font-black leading-[1.05]">
            <span className="text-gradient-gold">Tokens:</span>{" "}
            <span className="text-gradient-brand">o sistema de recompensas</span>
            <br className="hidden sm:block" />
            <span className="text-gradient-silver"> do Desafio dos Palpites</span>
          </h1>

          <p className="mt-4 text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Participe gratuitamente, complete atividades, convide amigos, faça palpites e
            acumule Tokens para trocar por prêmios reais.
          </p>

          {/* 3D coin visual */}
          <div className="mt-6 flex justify-center">
            <CoinVisual />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/auth"
              search={{ mode: "signup" } as never}
              className="inline-flex items-center justify-center gap-2 h-12 sm:h-14 px-6 sm:px-8 rounded-full bg-gradient-brand text-primary-foreground text-sm sm:text-base font-black uppercase tracking-wide shadow-glow hover:scale-[1.03] transition btn-neon shine-on-hover"
            >
              <Sparkles className="h-4 w-4" /> Começar gratuitamente
            </Link>
            <Link
              to="/shop"
              className="inline-flex items-center justify-center gap-2 h-12 sm:h-14 px-6 sm:px-8 rounded-full border-2 border-gold text-gold bg-gold/5 text-sm sm:text-base font-black uppercase tracking-wide hover:bg-gold/15 hover:scale-[1.03] transition"
            >
              <Gift className="h-4 w-4" /> Trocar Tokens por Prêmios
            </Link>
          </div>

          <div className="mt-5 text-[11px] sm:text-xs text-muted-foreground">
            <span className="font-bold text-foreground">{SITE_URL}</span>
          </div>
        </div>
      </section>

      {/* O QUE SÃO TOKENS */}
      <Section
        icon={Coins}
        eyebrow="Conceito"
        title="O que são Tokens?"
        intro="Os Tokens são pontos de recompensa dentro do Desafio dos Palpites. Funcionam como um sistema de cashback, fidelidade e recompensas: quanto mais você participa, mais Tokens pode acumular."
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {WHAT_IS.map((c, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-4 rounded-xl border glass-card hover:scale-[1.02] transition ${
                c.tone === "ok"
                  ? "border-primary/30 hover:border-primary/60"
                  : "border-destructive/30 hover:border-destructive/60"
              }`}
            >
              <c.icon
                className={`h-5 w-5 shrink-0 mt-0.5 ${
                  c.tone === "ok" ? "text-primary" : "text-destructive"
                }`}
              />
              <span className="text-sm font-semibold leading-snug">{c.title}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* PARA QUE SERVEM */}
      <Section icon={Target} eyebrow="Utilidades" title="Para que servem os Tokens?">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {USES.map((u, i) => (
            <div
              key={i}
              className="group p-5 rounded-2xl glass-card border border-border/60 hover:border-primary/60 hover:shadow-glow transition"
            >
              <div className="h-11 w-11 rounded-xl bg-gradient-brand grid place-items-center text-primary-foreground shadow-glow group-hover:scale-110 transition">
                <u.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display font-bold text-base">{u.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{u.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* COMO GANHAR */}
      <Section icon={Trophy} eyebrow="Recompensas" title="Como ganhar Tokens?">
        <ol className="relative grid gap-4 sm:grid-cols-2">
          {EARN_STEPS.map((s, i) => (
            <li
              key={i}
              className="relative flex items-start gap-4 p-5 rounded-2xl glass-card border border-border/60 hover:border-gold/60 transition"
            >
              <div className="h-10 w-10 rounded-full bg-gradient-gold grid place-items-center text-background font-black shadow-glow-gold shrink-0">
                {i + 1}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <s.icon className="h-4 w-4 text-gold shrink-0" />
                  <h3 className="font-display font-bold text-base">{s.title}</h3>
                </div>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* COMO TROCAR */}
      <Section icon={ShoppingBag} eyebrow="Resgate" title="Como trocar Tokens por prêmios?">
        <ol className="grid gap-3">
          {REDEEM_STEPS.map((s, i) => (
            <li
              key={i}
              className="flex items-start gap-4 p-4 sm:p-5 rounded-xl glass-card border border-border/60"
            >
              <div className="h-9 w-9 rounded-full bg-primary/15 border border-primary/40 grid place-items-center font-display font-black text-primary shrink-0">
                {i + 1}
              </div>
              <div>
                <h3 className="font-bold text-base">{s.title}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-5 p-4 rounded-xl border border-gold/30 bg-gold/5 text-sm text-muted-foreground">
          <span className="font-bold text-gold">Aviso:</span> Os prêmios podem ser cadastrados pelo
          Desafio dos Palpites ou por empresas parceiras. Cada prêmio possui suas próprias regras,
          prazo e disponibilidade.
        </div>
      </Section>

      {/* VALIDADE */}
      <Section icon={Clock} eyebrow="Atenção" title="Tokens expiram em 12 meses">
        <div className="rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-5 sm:p-7 flex flex-col sm:flex-row items-start gap-4">
          <AlertTriangle className="h-8 w-8 text-destructive shrink-0" />
          <div>
            <p className="text-sm sm:text-base text-foreground leading-relaxed">
              Os Tokens acumulados têm validade de{" "}
              <span className="font-bold text-destructive">12 meses</span> a partir da data em que
              forem recebidos. Após esse prazo, os Tokens expirados deixam de ficar disponíveis para
              uso.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              <span className="font-bold text-foreground">Use seus Tokens antes do vencimento.</span>{" "}
              Acompanhe seu saldo e validade dentro da sua conta.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: "Disponíveis", icon: Wallet, tone: "text-primary" },
            { label: "Usados", icon: CheckCircle2, tone: "text-foreground" },
            { label: "Expirados", icon: XCircle, tone: "text-destructive" },
            { label: "Próximos a vencer", icon: Clock, tone: "text-gold" },
            { label: "Data de validade", icon: Calendar, tone: "text-muted-foreground" },
          ].map((c) => (
            <div
              key={c.label}
              className="p-4 rounded-xl glass-card border border-border/60 flex flex-col gap-2"
            >
              <c.icon className={`h-5 w-5 ${c.tone}`} />
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                {c.label}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Acompanhe esses indicadores no seu{" "}
          <Link to="/dashboard" className="text-primary font-bold hover:underline">
            painel de Tokens
          </Link>
          .
        </p>
      </Section>

      {/* EXEMPLO */}
      <Section icon={Sparkles} eyebrow="Na prática" title="Exemplo simples de como funciona">
        <div className="rounded-2xl glass-card border border-primary/30 p-5 sm:p-7">
          <p className="text-sm sm:text-base">
            <span className="font-bold">João</span> criou uma conta gratuita.
            <br />
            Recebeu <span className="text-gold font-black">500 Tokens</span> de boas-vindas.
          </p>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {[
              { label: "Check-in diário", value: "+50 Tokens", icon: Calendar },
              { label: "Convidou 3 amigos", value: "+300 Tokens", icon: Share2 },
              { label: "Completou uma missão", value: "+200 Tokens", icon: ListChecks },
              { label: "Participou de desafios", value: "+150 Tokens", icon: Target },
            ].map((r) => (
              <div
                key={r.label}
                className="flex items-center justify-between gap-3 p-3 rounded-lg bg-background/40 border border-border/60"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <r.icon className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-medium truncate">{r.label}</span>
                </div>
                <span className="font-display font-black text-primary text-sm tabular-nums">
                  {r.value}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 p-4 rounded-xl bg-gradient-gold/10 border-2 border-gold/40 flex items-center justify-between">
            <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Total acumulado
            </span>
            <span className="font-display text-2xl sm:text-3xl font-black text-gradient-gold tabular-nums">
              1.200 Tokens
            </span>
          </div>

          <div className="mt-5 text-sm text-muted-foreground">
            Com esses Tokens, João pode:
            <ul className="mt-2 space-y-1.5">
              {["Fazer mais palpites", "Participar de novos desafios", "Trocar por prêmios disponíveis"].map(
                (t) => (
                  <li key={t} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> {t}
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>
      </Section>

      {/* NÃO É DINHEIRO */}
      <Section icon={ShieldCheck} eyebrow="Transparência" title="Tokens são recompensas, não moeda">
        <p className="text-sm sm:text-base text-muted-foreground max-w-3xl">
          Os Tokens são pontos de uso interno do Desafio dos Palpites. Não representam dinheiro, não
          podem ser vendidos, transferidos como moeda ou convertidos em dinheiro.
        </p>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {NOT_MONEY.map((t) => (
            <li
              key={t}
              className="flex items-center gap-3 p-3 rounded-xl glass-card border border-border/60"
            >
              <XCircle className="h-4 w-4 text-destructive shrink-0" />
              <span className="text-sm font-medium">{t}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* FAQ */}
      <Section icon={ListChecks} eyebrow="Dúvidas" title="Perguntas frequentes">
        <div className="grid gap-2">
          {FAQ.map((f, i) => (
            <FaqItem key={i} q={f.q} a={f.a} />
          ))}
        </div>
      </Section>

      {/* CTA FINAL */}
      <section className="mt-10 relative overflow-hidden rounded-2xl sm:rounded-3xl border border-gold/40 glass-card p-6 sm:p-12 text-center">
        <div className="absolute -top-24 -right-20 h-80 w-80 rounded-full bg-gold/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />

        <div className="relative max-w-2xl mx-auto">
          <h2 className="font-display text-2xl sm:text-4xl font-black leading-tight">
            <span className="text-gradient-brand">Comece agora</span>{" "}
            <span className="text-gradient-gold">e acumule seus primeiros Tokens</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground">
            Crie sua conta gratuitamente, participe dos desafios, complete missões, convide amigos e
            troque seus Tokens por prêmios incríveis.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/auth"
              search={{ mode: "signup" } as never}
              className="inline-flex items-center justify-center gap-2 h-12 sm:h-14 px-6 sm:px-8 rounded-full bg-gradient-brand text-primary-foreground text-sm sm:text-base font-black uppercase tracking-wide shadow-glow hover:scale-[1.03] transition"
            >
              <UserPlus className="h-4 w-4" /> Criar conta grátis
            </Link>
            <Link
              to="/shop"
              className="inline-flex items-center justify-center gap-2 h-12 sm:h-14 px-6 sm:px-8 rounded-full border-2 border-gold text-gold bg-gold/5 text-sm sm:text-base font-black uppercase tracking-wide hover:bg-gold/15 hover:scale-[1.03] transition"
            >
              <Gift className="h-4 w-4" /> Ver prêmios disponíveis
            </Link>
          </div>
          <div className="mt-5 text-[11px] sm:text-xs text-muted-foreground">
            {SITE_URL}
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function Section({
  icon: Icon,
  eyebrow,
  title,
  intro,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10 sm:mt-14">
      <div className="flex items-center gap-3 mb-1">
        <div className="h-9 w-9 rounded-xl bg-primary/15 border border-primary/40 grid place-items-center text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-[11px] uppercase tracking-[0.18em] text-primary font-bold">
          {eyebrow}
        </span>
      </div>
      <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black leading-tight">
        {title}
      </h2>
      {intro && (
        <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-3xl">{intro}</p>
      )}
      <div className="mt-5 sm:mt-6">{children}</div>
    </section>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl glass-card border border-border/60 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 text-left hover:bg-card/60 transition"
        aria-expanded={open}
      >
        <span className="font-display font-bold text-sm sm:text-base">{q}</span>
        <ChevronDown
          className={`h-5 w-5 text-primary shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-4 sm:px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{a}</div>
      )}
    </div>
  );
}

function CoinVisual() {
  return (
    <div className="relative h-32 sm:h-44 w-full max-w-md">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gold/25 blur-3xl rounded-full" />

      {/* Floating coins */}
      <Coin className="left-[10%] top-2 h-20 w-20 sm:h-28 sm:w-28 animate-float-slow" />
      <Coin className="left-1/2 -translate-x-1/2 top-6 h-24 w-24 sm:h-32 sm:w-32 animate-float-slower z-10" big />
      <Coin className="right-[8%] top-3 h-20 w-20 sm:h-28 sm:w-28 animate-float" />
    </div>
  );
}

function Coin({ className = "", big = false }: { className?: string; big?: boolean }) {
  return (
    <div
      className={`absolute rounded-full grid place-items-center shadow-[0_18px_45px_-8px_rgba(255,200,80,0.55)] ${className}`}
      style={{
        background:
          "radial-gradient(circle at 30% 30%, #FFE89B 0%, #F7C948 38%, #B8861B 72%, #6E4D0A 100%)",
        border: "2px solid rgba(255,232,155,0.7)",
      }}
    >
      <div
        className="absolute inset-1 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 70% 70%, transparent 55%, rgba(0,0,0,0.25) 100%)",
        }}
      />
      <Coins className={`relative ${big ? "h-10 w-10 sm:h-14 sm:w-14" : "h-8 w-8 sm:h-12 sm:w-12"} text-[#5a3d05]`} strokeWidth={2.5} />
    </div>
  );
}
