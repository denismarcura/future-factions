import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Image as ImageIcon,
  X,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Search,
  Link2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  type Banner,
  listBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} from "@/lib/banners";
import { generateBannerTitle } from "@/lib/title-ai.functions";
import { useServerFn } from "@tanstack/react-start";
import { getUserChallenges } from "@/lib/user-challenges";
import { DESAFIOS_DIAMANTE } from "@/lib/desafios-diamante";
import type { Prediction } from "@/lib/mock-data";

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
  challengeId: string;
  challengeTitle: string;
  active: boolean;
  isMain: boolean;
  hasExpiry: boolean;
  expiresAt: string; // datetime-local value
  sortOrder: number;
};

const EMPTY: Form = {
  title: "",
  subtitle: "",
  imageUrl: "",
  ctaLabel: "",
  ctaLink: "",
  challengeId: "",
  challengeTitle: "",
  active: true,
  isMain: false,
  hasExpiry: false,
  expiresAt: "",
  sortOrder: 1,
};

// Convert ISO -> input[type=datetime-local] value (local TZ, no seconds)
function isoToLocalInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function AdminBanners() {
  const [items, setItems] = useState<Banner[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [aiLoading, setAiLoading] = useState(false);
  const [challengeQuery, setChallengeQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [allChallenges, setAllChallenges] = useState<Prediction[]>([]);

  const generateTitleFn = useServerFn(generateBannerTitle);

  function reload() {
    setItems(listBanners());
  }

  useEffect(() => {
    reload();
    setAllChallenges([...getUserChallenges(), ...DESAFIOS_DIAMANTE]);
  }, []);

  const challengeResults = useMemo(() => {
    const q = challengeQuery.trim().toLowerCase();
    if (!q) return allChallenges.slice(0, 8);
    return allChallenges
      .filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.category && String(c.category).toLowerCase().includes(q)),
      )
      .slice(0, 10);
  }, [challengeQuery, allChallenges]);

  function startCreate() {
    setEditingId(null);
    setForm({ ...EMPTY, sortOrder: items.length + 1 });
    setChallengeQuery("");
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
      challengeId: b.challengeId ?? "",
      challengeTitle: b.challengeTitle ?? "",
      active: b.active,
      isMain: !!b.isMain,
      hasExpiry: !!b.expiresAt,
      expiresAt: isoToLocalInput(b.expiresAt),
      sortOrder: b.sortOrder,
    });
    setChallengeQuery("");
    setShowForm(true);
  }

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, imageUrl: String(reader.result) }));
    reader.readAsDataURL(file);
  }

  async function handleGenerateTitle() {
    try {
      setAiLoading(true);
      const res = await generateTitleFn({
        data: {
          subtitle: form.subtitle || undefined,
          ctaLabel: form.ctaLabel || undefined,
          challengeTitle: form.challengeTitle || undefined,
          current: form.title || undefined,
        },
      });
      setForm((f) => ({ ...f, title: res.title }));
      toast.success("Título gerado pela IA");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao gerar título");
    } finally {
      setAiLoading(false);
    }
  }

  function selectChallenge(c: Prediction) {
    setForm((f) => ({
      ...f,
      challengeId: c.id,
      challengeTitle: c.title,
      ctaLink: `/previsao/${c.id}`,
      ctaLabel: f.ctaLabel || "Participar",
    }));
    setChallengeQuery("");
    setShowResults(false);
  }

  function clearChallenge() {
    setForm((f) => ({ ...f, challengeId: "", challengeTitle: "" }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.imageUrl.trim()) {
      toast.error("Título e imagem são obrigatórios");
      return;
    }
    let expiresAtIso: string | undefined;
    if (form.hasExpiry) {
      if (!form.expiresAt) {
        toast.error("Informe a data e horário de expiração");
        return;
      }
      const d = new Date(form.expiresAt);
      if (Number.isNaN(d.getTime())) {
        toast.error("Data de expiração inválida");
        return;
      }
      expiresAtIso = d.toISOString();
    }
    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || undefined,
      imageUrl: form.imageUrl.trim(),
      ctaLabel: form.ctaLabel.trim() || undefined,
      ctaLink: form.ctaLink.trim() || undefined,
      challengeId: form.challengeId || undefined,
      challengeTitle: form.challengeTitle || undefined,
      active: form.active,
      isMain: form.isMain,
      expiresAt: expiresAtIso,
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
            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Vincular ao desafio
              </label>
              {form.challengeId ? (
                <div className="mt-1 flex items-center gap-2 px-3 h-10 rounded-lg border border-primary/40 bg-primary/5">
                  <Link2 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold truncate flex-1">
                    {form.challengeTitle}
                  </span>
                  <button
                    type="button"
                    onClick={clearChallenge}
                    className="h-7 w-7 grid place-items-center rounded-md hover:bg-muted"
                    title="Remover vínculo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="relative mt-1">
                  <div className="flex items-center gap-2 px-3 h-10 rounded-lg border border-border bg-background">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input
                      value={challengeQuery}
                      onChange={(e) => {
                        setChallengeQuery(e.target.value);
                        setShowResults(true);
                      }}
                      onFocus={() => setShowResults(true)}
                      onBlur={() => setTimeout(() => setShowResults(false), 200)}
                      placeholder="Buscar desafio para vincular..."
                      className="flex-1 bg-transparent outline-none text-sm"
                    />
                  </div>
                  {showResults && challengeResults.length > 0 && (
                    <div className="absolute z-20 left-0 right-0 mt-1 rounded-lg border border-border bg-popover shadow-lg max-h-64 overflow-auto">
                      {challengeResults.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectChallenge(c)}
                          className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex items-center gap-2"
                        >
                          <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="truncate flex-1">{c.title}</span>
                          <span className="text-[10px] text-muted-foreground uppercase">
                            {c.category}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {showResults && challengeQuery && challengeResults.length === 0 && (
                    <div className="absolute z-20 left-0 right-0 mt-1 rounded-lg border border-border bg-popover shadow-lg p-3 text-xs text-muted-foreground">
                      Nenhum desafio encontrado.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Título *
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input flex-1"
                  placeholder="Ex: Não gaste R$ 1 real em palpites"
                  required
                />
                <button
                  type="button"
                  onClick={handleGenerateTitle}
                  disabled={aiLoading}
                  className="inline-flex items-center gap-2 h-10 px-3 rounded-lg bg-gradient-brand text-primary-foreground font-bold text-xs shadow-glow disabled:opacity-60"
                  title="Gerar título com a IA"
                >
                  {aiLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Gerar com IA
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
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
                  {b.challengeTitle && (
                    <p className="text-[11px] text-primary truncate inline-flex items-center gap-1">
                      <Link2 className="h-3 w-3" /> {b.challengeTitle}
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
