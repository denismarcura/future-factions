import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { COMPANIES } from "@/lib/mock-extra";
import { Building2, Megaphone, Users, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/empresas")({
  head: () => ({
    meta: [
      { title: "Para Empresas — Desafio dos Palpites" },
      { name: "description", content: "Crie desafios promocionais, ofereça prêmios e capte leads engajados." },
    ],
  }),
  component: EmpresasPage,
});

function EmpresasPage() {
  return (
    <AppShell>
      <section className="relative overflow-hidden rounded-3xl border border-primary/30 glass-card p-6 sm:p-10 mb-8">
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 text-gold text-xs font-bold border border-gold/30">
            <Megaphone className="h-3 w-3" /> ÁREA EMPRESAS
          </span>
          <h1 className="mt-4 font-display text-3xl sm:text-5xl font-black leading-tight">
            Sua marca dentro do <span className="text-gradient-brand">jogo</span>
          </h1>
          <p className="mt-4 text-muted-foreground">
            Crie desafios promocionais, ofereça brindes, capte leads e ganhe visibilidade
            com uma comunidade de palpiteiros engajados.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#cadastro" className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-gradient-brand text-primary-foreground font-black uppercase shadow-glow hover:scale-[1.03] transition">
              Cadastrar minha empresa <ArrowRight className="h-4 w-4" />
            </a>
            <Link to="/desafios" className="inline-flex items-center gap-2 h-12 px-6 rounded-full border border-gold/60 text-gold font-bold hover:bg-gold/10 transition">
              Ver desafios de empresas
            </Link>
          </div>
        </div>
      </section>

      <section className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Megaphone, title: "Visibilidade real", desc: "Sua marca aparece para uma comunidade ativa em todo o Brasil." },
          { icon: Users, title: "Captação de leads", desc: "Engajamento gamificado gera contatos qualificados." },
          { icon: Sparkles, title: "Prêmios que viram conversa", desc: "Combo, voucher, brinde — pequenos prêmios, grande burburinho." },
        ].map((b) => (
          <div key={b.title} className="rounded-2xl border border-border/60 bg-card p-5">
            <b.icon className="h-7 w-7 text-primary" />
            <h3 className="mt-3 font-display font-bold">{b.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{b.desc}</p>
          </div>
        ))}
      </section>

      <header className="flex items-end justify-between mb-4">
        <h2 className="font-display text-2xl font-black flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" /> Empresas que já estão dentro
        </h2>
        <span className="text-xs text-muted-foreground">{COMPANIES.length} parceiros</span>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-10">
        {COMPANIES.map((c) => (
          <div key={c.id} className="rounded-xl border border-border/60 bg-card p-4 flex items-center gap-3 hover:border-primary/50 transition">
            <img src={c.logo} alt="" className="h-11 w-11 rounded-lg border border-border/60" />
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground truncate">{c.category}</div>
              <div className="font-display font-bold text-sm truncate">{c.name}</div>
            </div>
          </div>
        ))}
      </section>

      <section id="cadastro" className="rounded-3xl border border-primary/30 glass-card p-6 sm:p-8">
        <h2 className="font-display text-2xl font-black">Cadastre sua empresa</h2>
        <p className="text-sm text-muted-foreground mt-1">Preencha e nosso time entra em contato.</p>
        <form className="mt-6 grid sm:grid-cols-2 gap-4">
          {[
            { label: "Nome da empresa", placeholder: "Pizzaria Bella Massa" },
            { label: "Categoria", placeholder: "Pizzaria, Academia, Salão…" },
            { label: "Cidade / Estado", placeholder: "São Paulo / SP" },
            { label: "WhatsApp", placeholder: "(11) 9 0000-0000" },
            { label: "E-mail", placeholder: "contato@suaempresa.com.br" },
            { label: "Instagram", placeholder: "@suaempresa" },
          ].map((f) => (
            <label key={f.label} className="block">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">{f.label}</span>
              <input
                placeholder={f.placeholder}
                className="mt-1 w-full h-11 px-3 rounded-lg bg-background/60 border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </label>
          ))}
          <label className="sm:col-span-2 block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Que tipo de desafio quer rodar?</span>
            <textarea
              placeholder="Ex: quem adivinhar a pizza mais vendida da semana ganha 1 pizza grátis."
              rows={4}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-background/60 border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="button"
              className="h-12 px-6 rounded-full bg-gradient-brand text-primary-foreground font-black uppercase shadow-glow hover:scale-[1.02] transition"
            >
              Quero participar
            </button>
          </div>
        </form>
      </section>
    </AppShell>
  );
}
