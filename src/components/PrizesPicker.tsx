import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { X, Gift, Trophy, Loader2 } from "lucide-react";
import { listActivePrizes, type AdminPrize } from "@/lib/admin-prizes.functions";

export type PrizeSlot = { position: number; prizeId: string | null };

export function PrizesPicker({
  open,
  initialSlots,
  onClose,
  onConfirm,
}: {
  open: boolean;
  initialSlots: PrizeSlot[];
  onClose: () => void;
  onConfirm: (slots: PrizeSlot[], prizes: AdminPrize[]) => void;
}) {
  const fetchPrizes = useServerFn(listActivePrizes);
  const [prizes, setPrizes] = useState<AdminPrize[]>([]);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(initialSlots.length || 1);
  const [slots, setSlots] = useState<PrizeSlot[]>(
    initialSlots.length ? initialSlots : [{ position: 1, prizeId: null }],
  );

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchPrizes()
      .then(setPrizes)
      .catch(() => setPrizes([]))
      .finally(() => setLoading(false));
  }, [open, fetchPrizes]);

  useEffect(() => {
    setSlots((prev) => {
      const next: PrizeSlot[] = [];
      for (let i = 1; i <= count; i++) {
        const existing = prev.find((s) => s.position === i);
        next.push({ position: i, prizeId: existing?.prizeId ?? null });
      }
      return next;
    });
  }, [count]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-auto glass-card rounded-2xl border border-border/60 p-6">
        <button onClick={onClose} className="absolute right-4 top-4 h-9 w-9 rounded-full hover:bg-muted/40 grid place-items-center">
          <X className="h-4 w-4" />
        </button>
        <h3 className="text-xl font-display font-black flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" /> Selecionar prêmios
        </h3>
        <p className="text-sm text-muted-foreground mt-1 mb-5">
          Defina quantos prêmios serão sorteados (1 a 10) e escolha um prêmio para cada posição.
        </p>

        <div className="mb-5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quantos prêmios sortear?</label>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setCount(n)}
                className={`h-10 w-10 rounded-full font-bold text-sm transition ${
                  count === n
                    ? "bg-gradient-brand text-primary-foreground shadow-glow"
                    : "glass-card border border-border/60 hover:border-primary/60"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-10 grid place-items-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : prizes.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-border/60 text-center text-sm text-muted-foreground">
            <Gift className="h-8 w-8 mx-auto mb-2 opacity-60" />
            Nenhum prêmio cadastrado ainda. Peça ao administrador para cadastrar prêmios em <strong>Conteúdo → Cadastrar Prêmios</strong>.
          </div>
        ) : (
          <div className="space-y-4">
            {slots.map((slot) => (
              <div key={slot.position} className="rounded-xl border border-border/60 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-brand text-primary-foreground font-black text-sm grid place-items-center">{slot.position}º</div>
                  <strong className="text-sm">Prêmio para o {slot.position}º lugar</strong>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {prizes.map((p) => {
                    const sel = slot.prizeId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() =>
                          setSlots((s) => s.map((x) => (x.position === slot.position ? { ...x, prizeId: sel ? null : p.id } : x)))
                        }
                        className={`text-left rounded-xl border p-2 transition ${
                          sel ? "border-primary bg-primary/10 ring-2 ring-primary/40" : "border-border/60 hover:border-primary/60"
                        }`}
                      >
                        <div className="aspect-[4/5] rounded-lg bg-muted/40 mb-2 overflow-hidden">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full grid place-items-center text-muted-foreground"><Gift className="h-6 w-6" /></div>
                          )}
                        </div>
                        <div className="text-xs font-semibold truncate">{p.name}</div>
                        {p.estimated_value != null && (
                          <div className="text-[10px] text-muted-foreground">R$ {Number(p.estimated_value).toFixed(2)}</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button onClick={onClose} className="h-10 px-4 rounded-full text-sm font-semibold hover:bg-muted/40">Cancelar</button>
          <button
            onClick={() => onConfirm(slots, prizes)}
            disabled={prizes.length === 0}
            className="h-10 px-6 rounded-full bg-gradient-brand text-primary-foreground font-bold text-sm shadow-glow disabled:opacity-50"
          >
            Confirmar prêmios
          </button>
        </div>
      </div>
    </div>
  );
}
