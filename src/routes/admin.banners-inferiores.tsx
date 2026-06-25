import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Image as ImageIcon, X, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  type BottomBanner,
  listBottomBanners,
  createBottomBanner,
  updateBottomBanner,
  deleteBottomBanner,
  processBottomBannerImage,
} from "@/lib/bottom-banners";

export const Route = createFileRoute("/admin/banners-inferiores")({
  head: () => ({
    meta: [{ title: "Banners Inferiores · Admin" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: AdminBottomBanners,
});

type Form = {
  imageUrl: string;
  link: string;
  alt: string;
  active: boolean;
  sortOrder: number;
};

const EMPTY: Form = { imageUrl: "", link: "", alt: "", active: true, sortOrder: 1 };

function AdminBottomBanners() {
  const [items, setItems] = useState<BottomBanner[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [processing, setProcessing] = useState(false);

  function reload() {
    setItems(listBottomBanners());
  }
  useEffect(reload, []);

  function startCreate() {
    setEditingId(null);
    setForm({ ...EMPTY, sortOrder: items.length + 1 });
    setShowForm(true);
  }

  function startEdit(b: BottomBanner) {
    setEditingId(b.id);
    setForm({
      imageUrl: b.imageUrl,
      link: b.link ?? "",
      alt: b.alt ?? "",
      active: b.active,
      sortOrder: b.sortOrder,
    });
    setShowForm(true);
  }

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida");
      return;
    }
    try {
      setProcessing(true);
      const url = await processBottomBannerImage(file);
      setForm((f) => ({ ...f, imageUrl: url }));
      toast.success("Imagem otimizada para 800×350");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao processar imagem");
    } finally {
      setProcessing(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.imageUrl) {
      toast.error("Faça upload de uma imagem");
      return;
    }
    const payload = {
      imageUrl: form.imageUrl,
      link: form.link.trim() || undefined,
      alt: form.alt.trim() || undefined,
      active: form.active,
      sortOrder: Number(form.sortOrder) || 1,
    };
    if (editingId) {
      updateBottomBanner(editingId, payload);
      toast.success("Banner atualizado");
    } else {
      createBottomBanner(payload);
      toast.success("Banner criado");
    }
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY);
    reload();
  }

  function handleDelete(id: string) {
    if (!confirm("Excluir banner?")) return;
    deleteBottomBanner(id);
    reload();
  }

  function toggleActive(b: BottomBanner) {
    updateBottomBanner(b.id, { active: !b.active });
    reload();
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <ImageIcon className="h-6 w-6 text-primary" />
          <div>
            <h1 className="font-display text-2xl font-black">Banners Inferiores</h1>
            <p className="text-sm text-muted-foreground">
              Exibidos na home, antes da seção “Como Funciona”. Tamanho fixo: 800×350px.
            </p>
          </div>
        </div>
        <button
          onClick={startCreate}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-gradient-brand text-primary-foreground font-bold text-sm shadow-glow"
        >
          <Plus className="h-4 w-4" /> Novo banner
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg">
              {editingId ? "Editar banner" : "Novo banner inferior"}
            </h2>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditingId(null); }}
              className="h-9 w-9 grid place-items-center rounded-lg border border-border"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Imagem * (será redimensionada e comprimida para 800×350px JPEG)
              </label>
              <div className="mt-1 flex gap-2 items-center">
                <label className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-border cursor-pointer hover:bg-muted text-sm font-semibold">
                  {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                  {processing ? "Otimizando…" : "Selecionar imagem"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={processing}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />
                </label>
                {form.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    Remover
                  </button>
                )}
              </div>
              {form.imageUrl && (
                <div className="mt-3 rounded-lg overflow-hidden border border-border max-w-[800px]">
                  <img
                    src={form.imageUrl}
                    alt="preview"
                    width={800}
                    height={350}
                    className="w-full h-auto block"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Link (opcional)
              </label>
              <input
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                className="input mt-1 w-full"
                placeholder="/desafios ou https://..."
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Texto alternativo (acessibilidade / SEO)
              </label>
              <input
                value={form.alt}
                onChange={(e) => setForm({ ...form, alt: e.target.value })}
                className="input mt-1 w-full"
                placeholder="Descrição curta da imagem"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Ordem
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                  className="input mt-1 w-full"
                />
              </div>
              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm font-semibold">Ativo</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditingId(null); }}
              className="h-10 px-4 rounded-lg border border-border text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={processing}
              className="h-10 px-5 rounded-lg bg-gradient-brand text-primary-foreground font-bold text-sm shadow-glow disabled:opacity-60"
            >
              {editingId ? "Salvar alterações" : "Criar banner"}
            </button>
          </div>
        </form>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {items.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
            Nenhum banner inferior cadastrado.
          </div>
        )}
        {items.map((b) => (
          <div key={b.id} className="glass-card rounded-xl overflow-hidden border border-border/60">
            <img
              src={b.imageUrl}
              alt={b.alt ?? "Banner"}
              width={800}
              height={350}
              loading="lazy"
              decoding="async"
              className="w-full h-auto block"
            />
            <div className="p-3 flex items-center gap-2 flex-wrap text-xs">
              <span className={`px-2 py-0.5 rounded-full font-bold ${b.active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                {b.active ? "Ativo" : "Inativo"}
              </span>
              <span className="text-muted-foreground">Ordem #{b.sortOrder}</span>
              {b.link && <span className="text-muted-foreground truncate max-w-[200px]" title={b.link}>→ {b.link}</span>}
              <div className="ml-auto flex items-center gap-1">
                <button
                  onClick={() => toggleActive(b)}
                  className="h-8 w-8 grid place-items-center rounded-lg border border-border hover:bg-muted"
                  title={b.active ? "Desativar" : "Ativar"}
                >
                  {b.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => startEdit(b)}
                  className="h-8 w-8 grid place-items-center rounded-lg border border-border hover:bg-muted"
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="h-8 w-8 grid place-items-center rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
