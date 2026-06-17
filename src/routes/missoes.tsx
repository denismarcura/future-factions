import { createFileRoute } from "@tanstack/react-router";
import { Target, Gift, Share2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { MISSIONS, CURRENT_USER, formatTokens } from "@/lib/mock-data";

export const Route = createFileRoute("/missoes")({
  head: () => ({
    meta: [
      { title: "Missões — EU ACHO QUE VAI DAR @#&" },
      { name: "description", content: "Cumpra missões semanais e ganhe Tokens grátis." },
    ],
  }),
  component: Missoes,
});

function Missoes() {
  const [copied, setCopied] = useState(false);
  const referralLink = `vaidar.app/r/${CURRENT_USER.username.toLowerCase()}`;

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-black flex items-center gap-3">
          <Target className="h-7 w-7 text-primary" /> Missões semanais
        </h1>
        <p className="text-muted-foreground mt-1">Ganhe Tokens fazendo coisas que você já faz.</p>
      </header>

      {/* Indicação */}
      <section className="rounded-2xl glass-card p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-brand grid place-items-center shadow-glow shrink-0">
            <Gift className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-xl font-black">Indique amigos · +100 Tokens cada</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Compartilhe seu link e ganhe Tokens toda vez que um amigo entrar.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <div className="flex-1 h-11 px-3 rounded-lg bg-background border border-border/60 flex items-center font-mono text-sm text-foreground/90 overflow-hidden">
                {referralLink}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(referralLink);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="h-11 px-4 rounded-lg bg-gradient-brand text-primary-foreground font-bold inline-flex items-center gap-2 shadow-glow"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copiado!" : "Copiar link"}
              </button>
              <button className="h-11 px-4 rounded-lg border border-gold/60 text-gold font-bold inline-flex items-center gap-2 hover:bg-gold/10">
                <Share2 className="h-4 w-4" /> Compartilhar
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 max-w-sm">
              <Stat label="Indicados" value="0" />
              <Stat label="Tokens ganhos" value="0" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 gap-3">
        {MISSIONS.map((m) => (
          <div key={m.id} className="rounded-xl bg-card border border-border/60 p-4 flex items-center gap-4 hover:border-primary/40 transition">
            <div className="h-10 w-10 rounded-lg bg-primary/15 border border-primary/30 grid place-items-center text-primary font-bold uppercase text-xs">
              {m.icon.slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold">{m.title}</div>
              <div className="text-xs text-gold font-bold mt-0.5">+{m.reward} Tokens</div>
            </div>
            <button className="h-9 px-4 rounded-full bg-gradient-brand text-primary-foreground font-bold text-xs shadow-glow hover:scale-[1.03] transition">
              Fazer
            </button>
          </div>
        ))}
      </section>

      <section className="mt-8 rounded-2xl bg-card border border-border/60 p-5 text-sm text-muted-foreground">
        Saldo atual: <span className="text-gold font-display font-black text-base">{formatTokens(CURRENT_USER.tokens)} Tokens</span>
      </section>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background/40 border border-border/60 px-3 py-2">
      <div className="font-display font-black text-gradient-brand text-lg">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
