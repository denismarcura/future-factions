import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ShoppingBag, Coins, Loader2, Gift, Pencil, Check, X } from "lucide-react";
import { listActivePrizes, upsertPrize, type AdminPrize } from "@/lib/admin-prizes.functions";
import { requestRedemption } from "@/lib/prize-redemptions.functions";
import { getTokenBalance } from "@/lib/balance";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { formatTokens } from "@/lib/mock-data";

const ADMIN_EMAILS = ["denismarcura@gmail.com", "antoinio.salvador@gmail.com"];

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop de Prêmios — Desafio dos Palpites" },
      { name: "description", content: "Troque seus Tokens por prêmios reais cadastrados pela equipe." },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const { user } = useAuth();
  const isAdmin = !!(user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));
  const navigate = useNavigate();
  const list = useServerFn(listActivePrizes);
  const requestFn = useServerFn(requestRedemption);
  const saveFn = useServerFn(upsertPrize);
  const [items, setItems] = useState<AdminPrize[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState<string>("");
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    list()
      .then(setItems)
      .catch((e) => toast.error(e?.message ?? "Erro"))
      .finally(() => setLoading(false));
  }, [list]);

  useEffect(() => {
    if (!user) return;
    getTokenBalance().then(setBalance).catch(() => {});
  }, [user]);

  async function handleRedeem(p: AdminPrize) {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    if (balance < (p.cost_tokens ?? 0)) {
      toast.error("Tokens insuficientes");
      return;
    }
    if (!confirm(`Solicitar troca de "${p.name}" por ${p.cost_tokens} tokens?`)) return;
    setBusy(p.id);
    try {
      await requestFn({ data: { prize_id: p.id } });
      toast.success("Solicitação enviada! Aguarde a análise do administrador.");
      const newBal = await getTokenBalance();
      setBalance(newBal);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao solicitar");
    } finally {
      setBusy(null);
    }
  }

  return (
    <AppShell>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-black flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-primary" /> Shop de <span className="text-gradient-gold">Prêmios</span>
          </h1>
          <p className="text-muted-foreground mt-1">Troque seus Tokens por prêmios reais.</p>
        </div>
        {user && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card shadow-glow-gold">
            <Coins className="h-4 w-4 text-gold" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Seu saldo</span>
            <span className="font-display font-black text-gold tabular-nums">{formatTokens(balance)}</span>
          </div>
        )}
      </header>

      {loading ? (
        <div className="py-16 grid place-items-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center text-sm text-muted-foreground">
          Nenhum prêmio disponível no momento.
        </div>
      ) : (
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((p) => {
            const canAfford = user && balance >= (p.cost_tokens ?? 0);
            const noStock = p.stock <= 0;
            const disabled = !canAfford || noStock || busy === p.id;
            const isEditing = editingId === p.id;
            async function saveTokens() {
              const v = Number(editVal);
              if (!Number.isFinite(v) || v < 0) {
                toast.error("Valor inválido");
                return;
              }
              setSavingId(p.id);
              try {
                await saveFn({ data: { ...p, cost_tokens: v } });
                setItems((cur) => cur.map((x) => (x.id === p.id ? { ...x, cost_tokens: v } : x)));
                toast.success("Valor atualizado");
                setEditingId(null);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Erro ao salvar");
              } finally {
                setSavingId(null);
              }
            }
            return (
              <article key={p.id} className="group relative rounded-2xl border border-border/60 bg-card overflow-hidden hover:border-primary/50 hover:shadow-glow transition flex flex-col">
                <div className="aspect-[4/5] bg-black grid place-items-center border-b border-border/60 overflow-hidden">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-contain" loading="lazy" />
                  ) : (
                    <Gift className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-display font-bold leading-snug line-clamp-2 flex-1">{p.name}</h3>
                  {p.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                  )}
                  <div className="mt-3 flex items-baseline justify-between gap-2">
                    {isEditing ? (
                      <div className="flex items-center gap-1 flex-1">
                        <input
                          type="number"
                          value={editVal}
                          onChange={(e) => setEditVal(e.target.value)}
                          className="w-full h-8 px-2 rounded-lg bg-background border border-border/60 text-sm tabular-nums"
                          autoFocus
                        />
                        <button onClick={saveTokens} disabled={savingId === p.id} className="h-8 w-8 grid place-items-center rounded-lg bg-primary text-primary-foreground">
                          {savingId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={() => setEditingId(null)} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-muted/40">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="inline-flex items-center gap-1.5 text-gold">
                          <Coins className="h-4 w-4" />
                          <span className="font-display font-black text-lg tabular-nums">{formatTokens(p.cost_tokens ?? 0)}</span>
                          {isAdmin && (
                            <button
                              onClick={() => { setEditingId(p.id); setEditVal(String(p.cost_tokens ?? 0)); }}
                              className="ml-1 h-6 w-6 grid place-items-center rounded-md hover:bg-muted/40 text-muted-foreground"
                              title="Editar valor em tokens"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">{p.stock} em estoque</span>
                      </>
                    )}
                  </div>
                  {!noStock && (
                    <button
                      onClick={() => handleRedeem(p)}
                      disabled={disabled}
                      className={`mt-3 h-10 rounded-full text-sm font-black uppercase tracking-wide transition inline-flex items-center justify-center gap-1.5 ${
                        !disabled
                          ? "bg-gradient-brand text-primary-foreground shadow-glow hover:scale-[1.02]"
                          : "bg-muted text-muted-foreground cursor-not-allowed border border-border/60"
                      }`}
                    >
                      {busy === p.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : !user ? (
                        "Entrar p/ solicitar"
                      ) : (
                        "Solicitar troca"
                      )}
                    </button>
                  )}
                  {noStock && (
                    <div className="mt-3 h-10 rounded-full grid place-items-center text-xs font-bold uppercase tracking-wide bg-muted text-muted-foreground border border-border/60">
                      Esgotado
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </AppShell>
  );
}
