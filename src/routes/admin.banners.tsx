import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Image as ImageIcon, X, Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  type Banner,
  listBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} from "@/lib/banners";

export const Route = createFileRoute("/admin/banners")({
  head: () => ({
    meta: [{ title: "Banners · Admin" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: AdminBanners,
});

type Form = {
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaLabel: string;
  ctaLink: string;
  active: boolean;
  sortOrder: number;
};

const EMPTY: Form = {
  title: "",
  subtitle: "",
  imageUrl: "",
  ctaLabel: "",
  ctaLink: "",
  active: true,
  sortOrder: 1,
};

function AdminBanners() {
  const [items, setItems] = useState<Banner[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);

  function reload() {
    setItems(listBanners());
  }

  useEffect(() => {
    reload();
  }, []);

  function startCreate() {
    setEditingId(null);
    setForm({ ...EMPTY, sortOrder: items.length + 1 });
    setShowForm(true);
  }

  function startEdit(b: Banner) {
    setEditingId(b.id);
    setForm({
      title: b.title,
      subtitle: b.subtitle ?? "",
      imageUrl: b.imageUrl,
      ctaLabel: b.ctaLabel ?? "",
      ctaLink: b.ctaLink ?? "",
      active: b.active,
      sortOrder: b.sortOrder,
    });
    setShowForm(true);
  }

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, imageUrl: String(reader.result) }));
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.imageUrl.trim()) {
      toast.error("Título e imagem são obrigatórios");
      return;
    }
    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || undefined,
      imageUrl: form.imageUrl.trim(),
      ctaLabel: form.ctaLabel.trim() || undefined,
      ctaLink: form.ctaLink.trim() || undefined,
      active: form.active,
      sortOrder: Number(form.sortOrder) || 1,
    };
    if (editingId) {
      updateBanner(editingId, payload);
      toast.success("Banner atualizado");
    } else {
      createBanner(payload);
      toast.success("Banner criado");
    }
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY);
    reload();
  }

  function handleDelete(id: string) {
    if (!confirm("Excluir banner?")) return;
    deleteBanner(id);
    toast.success("Banner removido");
    reload();
  }

  function toggleActive(b: Banner) {
    updateBanner(b.id, { active: !b.active });
    reload();
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <ImageIcon className="h-6 w-6 text-primary" />
          <div>
            <h1 className="font-display text-2xl font-black">Banners</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie banners promocionais exibidos no site.
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
              {editingId ? "Editar banner" : "Novo banner"}
            </h2>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="h-9 w-9 grid place-items-center rounded-lg border border-border"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Título *
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input mt-1 w-full"
                placeholder="Ex: Não gaste R$ 1 real em palpites"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Subtítulo
              </label>
              <input
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                className="input mt-1 w-full"
                placeholder="Texto secundário"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Imagem * (URL ou upload)
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="input flex-1"
                  placeholder="https://..."
                />
                <label className="inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-border cursor-pointer hover:bg-muted text-sm font-semibold">
                  <ImageIcon className="h-4 w-4" />
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />
                </label>
              </div>
              {form.imageUrl && (
                <div className="mt-3 relative rounded-lg overflow-hidden border border-border">
                  <img src={form.imageUrl} alt="preview" className="w-full h-48 object-cover" />
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Texto do botão (CTA)
              </label>
              <input
                value={form.ctaLabel}
                onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })}
                className="input mt-1 w-full"
                placeholder="Ex: Quero participar"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Link do botão
              </label>
              <input
                value={form.ctaLink}
                onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
                className="input mt-1 w-full"
                placeholder="/desafios ou https://..."
              />
            </div>
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

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="h-10 px-4 rounded-lg border border-border font-semibold text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground font-bold text-sm"
            >
              <Check className="h-4 w-4" />
              {editingId ? "Salvar alterações" : "Criar banner"}
            </button>
          </div>
        </form>
      )}

      <section className="glass-card rounded-xl p-5">
        <h2 className="font-display font-bold text-lg mb-4">
          Banners cadastrados ({items.length})
        </h2>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Nenhum banner cadastrado. Clique em "Novo banner" para começar.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((b) => (
              <li
                key={b.id}
                className="flex items-center gap-4 p-3 rounded-lg border border-border"
              >
                <img
                  src={b.imageUrl}
                  alt={b.title}
                  className="h-16 w-28 object-cover rounded-md border border-border flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold truncate">{b.title}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        b.active
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {b.active ? "Ativo" : "Inativo"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Ordem: {b.sortOrder}
                    </span>
                  </div>
                  {b.subtitle && (
                    <p className="text-xs text-muted-foreground truncate">{b.subtitle}</p>
                  )}
                  {b.ctaLink && (
                    <p className="text-[11px] text-muted-foreground truncate">
                      → {b.ctaLabel || "CTA"}: {b.ctaLink}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(b)}
                    className="h-9 w-9 grid place-items-center rounded-lg hover:bg-muted"
                    title={b.active ? "Desativar" : "Ativar"}
                  >
                    {b.active ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={() => startEdit(b)}
                    className="h-9 w-9 grid place-items-center rounded-lg hover:bg-muted"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="h-9 w-9 grid place-items-center rounded-lg hover:bg-destructive/10 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
