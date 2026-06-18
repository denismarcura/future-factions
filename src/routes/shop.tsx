import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PRODUCTS, type Product } from "@/lib/mock-extra";
import { CURRENT_USER, formatTokens } from "@/lib/mock-data";
import { ShoppingBag, Coins, Sparkles, Lock } from "lucide-react";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop de Prêmios — Desafio dos Palpites" },
      { name: "description", content: "Troque seus Tokens por prêmios reais: smartphones, vouchers, eletrônicos e mais." },
    ],
  }),
  component: ShopPage,
});

const CATS = ["Todos", "Premium", "Eletrônicos", "Esportes", "Moda", "Casa", "Vouchers"] as const;

function ProductCard({ p }: { p: Product }) {
  const canAfford = CURRENT_USER.tokens >= p.cost;
  return (
    <article className="group relative rounded-2xl border border-border/60 bg-card overflow-hidden hover:border-primary/50 hover:shadow-glow transition flex flex-col">
      {p.highlight && (
        <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold text-accent-foreground text-[10px] font-black uppercase tracking-wide">
          <Sparkles className="h-3 w-3" /> Destaque
        </div>
      )}
      <div className="aspect-square bg-gradient-to-br from-background to-card grid place-items-center text-7xl border-b border-border/60 overflow-hidden">
        {p.image ? (
          <img src={p.image} alt={p.name} className="w-full h-full object-contain p-4" loading="lazy" />
        ) : (
          <span className="drop-shadow-[0_0_12px_rgba(0,230,118,0.4)]">{p.emoji}</span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.category}</div>
        <h3 className="mt-1 font-display font-bold leading-snug line-clamp-2 flex-1">{p.name}</h3>
        <div className="mt-3 flex items-baseline justify-between">
          <div className="inline-flex items-center gap-1.5 text-gold">
            <Coins className="h-4 w-4" />
            <span className="font-display font-black text-lg tabular-nums">{formatTokens(p.cost)}</span>
          </div>
          <span className="text-[10px] text-muted-foreground">{p.stock} em estoque</span>
        </div>
        <button
          disabled={!canAfford}
          className={`mt-3 h-10 rounded-full text-sm font-black uppercase tracking-wide transition ${
            canAfford
              ? "bg-gradient-brand text-primary-foreground shadow-glow hover:scale-[1.02]"
              : "bg-muted text-muted-foreground cursor-not-allowed border border-border/60"
          }`}
        >
          {canAfford ? "Resgatar" : (
            <span className="inline-flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Faltam tokens</span>
          )}
        </button>
      </div>
    </article>
  );
}

function ShopPage() {
  const [cat, setCat] = useState<(typeof CATS)[number]>("Todos");
  const items = useMemo(
    () => (cat === "Todos" ? PRODUCTS : PRODUCTS.filter((p) => p.category === cat)),
    [cat],
  );

  return (
    <AppShell>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-black flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-primary" /> Shop de <span className="text-gradient-gold">Prêmios</span>
          </h1>
          <p className="text-muted-foreground mt-1">Troque seus Tokens por prêmios reais. Sem dinheiro envolvido.</p>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card shadow-glow-gold">
          <Coins className="h-4 w-4 text-gold" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Seu saldo</span>
          <span className="font-display font-black text-gold tabular-nums">{formatTokens(CURRENT_USER.tokens)}</span>
        </div>
      </header>

      <div className="mb-6 flex items-center gap-2 overflow-x-auto -mx-4 px-4 pb-2">
        {CATS.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`shrink-0 h-9 px-4 rounded-full text-xs font-bold border transition ${
              cat === c
                ? "bg-gradient-brand text-primary-foreground border-transparent shadow-glow"
                : "bg-card text-muted-foreground border-border/60 hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </section>
    </AppShell>
  );
}
