import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Gift, Plus, Pencil, Trash2, Loader2, X, Save } from "lucide-react";
import { listAllPrizes, upsertPrize, deletePrize, type AdminPrize } from "@/lib/admin-prizes.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/premios")({
  head: () => ({ meta: [{ title: "Cadastrar Prêmios · Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminPremios,
});

type Editing = Partial<AdminPrize> | null;

function AdminPremios() {
  const list = useServerFn(listAllPrizes);
  const save = useServerFn(upsertPrize);
  const remove = useServerFn(deletePrize);
  const [items, setItems] = useState<AdminPrize[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Editing>(null);
  const [saving, setSaving] = useState(false);

  function reload() {
    setLoading(true);
    list()
      .then(setItems)
      .catch((e) => toast.error(e?.message ?? "Erro ao carregar"))
      .finally(() => setLoading(false));
  }
  useEffect(reload, [list]);

  async function handleSave() {
    if (!editing?.name?.trim()) {
      toast.error("Informe o nome do prêmio");
      return;
    }
    setSaving(true);
    try {
      await save({ data: editing as { name: string } & Partial<AdminPrize> });
      toast.success("Prêmio salvo");
      setEditing(null);
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este prêmio?")) return;
    try {
      await remove({ data: { id } });
      toast.success("Prêmio removido");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setEditing((cur) => ({ ...(cur ?? {}), image_url: String(reader.result) }));
    reader.readAsDataURL(f);
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-black flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" /> Cadastrar Prêmios
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Cadastre os prêmios disponíveis para os desafios. Imagem na proporção 4:5.</p>
        </div>
        <button
          onClick={() => setEditing({ name: "", stock: 1, active: true })}
          className="h-10 px-4 rounded-full bg-gradient-brand text-primary-foreground font-bold text-sm shadow-glow inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Novo prêmio
        </button>
      </header>

      {loading ? (
        <div className="py-12 grid place-items-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
          Nenhum prêmio cadastrado ainda. Clique em "Novo prêmio".
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((p) => (
            <div key={p.id} className="glass-card rounded-2xl border border-border/60 overflow-hidden">
              <div className="aspect-[4/5] bg-muted/40">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-muted-foreground"><Gift className="h-8 w-8" /></div>
                )}
              </div>
              <div className="p-3 space-y-1">
                <div className="text-sm font-bold truncate">{p.name}</div>
                <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>Estoque: {p.stock}</span>
                  {p.estimated_value != null && <span>R$ {Number(p.estimated_value).toFixed(2)}</span>}
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button onClick={() => setEditing(p)} className="flex-1 h-8 rounded-lg glass-card border border-border/60 text-xs font-semibold hover:border-primary/60 inline-flex items-center justify-center gap-1">
                    <Pencil className="h-3 w-3" /> Editar
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-destructive grid place-items-center">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {!p.active && <div className="text-[10px] text-amber-500 font-semibold uppercase">Inativo</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setEditing(null)} />
          <div className="relative w-full max-w-lg glass-card rounded-2xl border border-border/60 p-6 max-h-[90vh] overflow-auto">
            <button onClick={() => setEditing(null)} className="absolute right-4 top-4 h-9 w-9 rounded-full hover:bg-muted/40 grid place-items-center">
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-display font-black mb-4">{editing.id ? "Editar prêmio" : "Novo prêmio"}</h3>
            <div className="space-y-3">
              <Field label="Nome">
                <input
                  value={editing.name ?? ""}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl glass-card border border-border/60 text-sm"
                />
              </Field>
              <Field label="Descrição">
                <textarea
                  value={editing.description ?? ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl glass-card border border-border/60 text-sm resize-none"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Valor estimado (R$)">
                  <input
                    type="number"
                    step="0.01"
                    value={editing.estimated_value ?? ""}
                    onChange={(e) => setEditing({ ...editing, estimated_value: e.target.value ? Number(e.target.value) : null })}
                    className="w-full h-11 px-3 rounded-xl glass-card border border-border/60 text-sm"
                  />
                </Field>
                <Field label="Valor em tokens">
                  <input
                    type="number"
                    value={editing.cost_tokens ?? 0}
                    onChange={(e) => setEditing({ ...editing, cost_tokens: Number(e.target.value) })}
                    className="w-full h-11 px-3 rounded-xl glass-card border border-border/60 text-sm"
                  />
                </Field>
              </div>
              <Field label="Estoque">
                <input
                  type="number"
                  value={editing.stock ?? 0}
                  onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })}
                  className="w-full h-11 px-3 rounded-xl glass-card border border-border/60 text-sm"
                />
              </Field>
              <Field label="Imagem (proporção 4:5)">
                <div className="flex items-start gap-3">
                  <div className="w-20 aspect-[4/5] rounded-lg bg-muted/40 overflow-hidden shrink-0">
                    {editing.image_url ? <img src={editing.image_url} className="w-full h-full object-cover" /> : null}
                  </div>
                  <input type="file" accept="image/*" onChange={onFile} className="text-sm flex-1" />
                </div>
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.active ?? true} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
                Prêmio ativo (visível para os usuários)
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="h-10 px-4 rounded-full text-sm font-semibold hover:bg-muted/40">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="h-10 px-6 rounded-full bg-gradient-brand text-primary-foreground font-bold text-sm shadow-glow inline-flex items-center gap-2 disabled:opacity-60">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
