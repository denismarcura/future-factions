import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  Newspaper, Plus, Sparkles, Wand2, Image as ImageIcon, Trash2, Loader2,
  Eye, EyeOff, Bot, Instagram, Check, X,
} from "lucide-react";
import { toast } from "sonner";
import {
  adminListNews, saveNews, deleteNews, listCategories, saveCategory,
  generateNewsArticle, generateNewsImage, aiAutoPostNews,
  adminListShares, reviewInstagramShare,
} from "@/lib/news.functions";

export const Route = createFileRoute("/admin/noticias")({
  head: () => ({ meta: [{ title: "Notícias · Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminNews,
});

function AdminNews() {
  const list = useServerFn(adminListNews);
  const save = useServerFn(saveNews);
  const del = useServerFn(deleteNews);
  const cats = useServerFn(listCategories);
  const saveCat = useServerFn(saveCategory);
  const genArticle = useServerFn(generateNewsArticle);
  const genImage = useServerFn(generateNewsImage);
  const autoPost = useServerFn(aiAutoPostNews);
  const shares = useServerFn(adminListShares);
  const reviewShare = useServerFn(reviewInstagramShare);

  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [shareList, setShareList] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [imgBusy, setImgBusy] = useState(false);
  const [autoBusy, setAutoBusy] = useState(false);

  const [form, setForm] = useState({
    title: "",
    referenceUrl: "",
    summary: "",
    body: "",
    cover_url: "",
    category_id: "",
    subcategory_id: "",
    seo_title: "",
    seo_description: "",
    seo_keywords: "",
    tags: "",
    published: true,
  });
  const [autoTheme, setAutoTheme] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [newSubParent, setNewSubParent] = useState("");

  async function reload() {
    const [a, c, s] = await Promise.all([list(), cats(), shares()]);
    setItems(a);
    setCategories(c.categories);
    setSubcategories(c.subcategories);
    setShareList(s);
  }
  useEffect(() => { reload().catch(() => {}); }, []);

  async function handleGenerateText() {
    if (!form.title.trim()) return toast.error("Informe o título");
    setAiBusy(true);
    try {
      const r = await genArticle({
        data: {
          title: form.title,
          referenceUrl: form.referenceUrl || undefined,
          category: categories.find((c) => c.id === form.category_id)?.name,
        },
      });
      setForm((f) => ({
        ...f,
        summary: r.summary,
        body: r.body,
        seo_title: r.seo_title,
        seo_description: r.seo_description,
        seo_keywords: r.seo_keywords,
        tags: (r.tags || []).join(", "),
      }));
      toast.success("Texto gerado com regras de SEO");
    } catch (e: any) { toast.error(e.message); } finally { setAiBusy(false); }
  }

  async function handleGenerateImage() {
    if (!form.title.trim()) return toast.error("Informe o título");
    setImgBusy(true);
    try {
      const r = await genImage({ data: { prompt: form.title } });
      setForm((f) => ({ ...f, cover_url: r.dataUrl }));
      toast.success("Imagem gerada");
    } catch (e: any) { toast.error(e.message); } finally { setImgBusy(false); }
  }

  async function handleSave() {
    if (!form.title.trim() || !form.body.trim()) return toast.error("Título e corpo obrigatórios");
    setBusy(true);
    try {
      await save({
        data: {
          title: form.title,
          summary: form.summary || null,
          body: form.body,
          cover_url: form.cover_url || null,
          category_id: form.category_id || null,
          subcategory_id: form.subcategory_id || null,
          seo_title: form.seo_title || null,
          seo_description: form.seo_description || null,
          seo_keywords: form.seo_keywords || null,
          tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
          published: form.published,
        },
      });
      toast.success("Notícia salva");
      setForm({
        title: "", referenceUrl: "", summary: "", body: "", cover_url: "",
        category_id: "", subcategory_id: "", seo_title: "", seo_description: "",
        seo_keywords: "", tags: "", published: true,
      });
      await reload();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir notícia?")) return;
    await del({ data: { id } });
    await reload();
  }

  async function handleAutoPost() {
    if (!autoTheme.trim()) return toast.error("Informe um tema");
    setAutoBusy(true);
    try {
      await autoPost({ data: { theme: autoTheme, publishNow: true } });
      toast.success("Notícia auto-gerada e publicada");
      setAutoTheme("");
      await reload();
    } catch (e: any) { toast.error(e.message); } finally { setAutoBusy(false); }
  }

  async function handleAddCategory() {
    if (!newCatName.trim()) return;
    await saveCat({ data: { name: newCatName } });
    setNewCatName("");
    await reload();
  }
  async function handleAddSubcategory() {
    if (!newSubName.trim() || !newSubParent) return;
    await saveCat({ data: { name: newSubName, parentCategoryId: newSubParent } });
    setNewSubName("");
    await reload();
  }

  const filteredSubs = subcategories.filter((s) => s.category_id === form.category_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-brand grid place-items-center shadow-glow">
          <Newspaper className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-black">Notícias</h1>
          <p className="text-sm text-muted-foreground">Crie, edite e publique notícias com IA + SEO.</p>
        </div>
      </div>

      {/* Auto-post IA */}
      <section className="glass-card rounded-2xl p-5 border border-primary/30">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="h-5 w-5 text-primary" />
          <h2 className="font-bold">Auto-publicação com IA</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Informe um tema e a IA cria + publica uma notícia completa automaticamente.
        </p>
        <div className="flex gap-2">
          <input
            value={autoTheme}
            onChange={(e) => setAutoTheme(e.target.value)}
            placeholder="Ex: últimas da Copa do Mundo de hoje"
            className="flex-1 h-10 px-3 rounded-lg bg-muted/40 border border-border/60 text-sm"
          />
          <button
            onClick={handleAutoPost}
            disabled={autoBusy}
            className="h-10 px-4 rounded-lg bg-gradient-brand text-primary-foreground text-sm font-bold flex items-center gap-2 disabled:opacity-60"
          >
            {autoBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Gerar e publicar
          </button>
        </div>
      </section>

      {/* Form */}
      <section className="glass-card rounded-2xl p-5 space-y-4">
        <h2 className="font-bold flex items-center gap-2"><Plus className="h-4 w-4" /> Nova notícia</h2>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Título *">
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Link de notícia parecida (referência)">
            <input className="input" value={form.referenceUrl} onChange={(e) => setForm({ ...form, referenceUrl: e.target.value })} placeholder="https://..." />
          </Field>
          <Field label="Categoria">
            <select className="input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value, subcategory_id: "" })}>
              <option value="">—</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Subcategoria">
            <select className="input" value={form.subcategory_id} onChange={(e) => setForm({ ...form, subcategory_id: e.target.value })} disabled={!form.category_id}>
              <option value="">—</option>
              {filteredSubs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={handleGenerateText} disabled={aiBusy} className="h-9 px-3 rounded-lg bg-primary/10 text-primary text-sm font-bold flex items-center gap-2 border border-primary/30">
            {aiBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            Gerar texto com SEO
          </button>
          <button onClick={handleGenerateImage} disabled={imgBusy} className="h-9 px-3 rounded-lg bg-primary/10 text-primary text-sm font-bold flex items-center gap-2 border border-primary/30">
            {imgBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
            Gerar imagem
          </button>
        </div>

        {form.cover_url && (
          <img src={form.cover_url} alt="capa" className="w-full max-h-60 object-cover rounded-lg" />
        )}

        <Field label="Resumo">
          <textarea className="input min-h-[60px]" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
        </Field>
        <Field label="Corpo (Markdown) *">
          <textarea className="input min-h-[200px] font-mono text-xs" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        </Field>

        <details className="rounded-lg border border-border/60 p-3">
          <summary className="cursor-pointer text-sm font-bold">SEO</summary>
          <div className="mt-3 space-y-2">
            <Field label="SEO Title"><input className="input" value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} /></Field>
            <Field label="Meta Description"><input className="input" value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} /></Field>
            <Field label="Keywords"><input className="input" value={form.seo_keywords} onChange={(e) => setForm({ ...form, seo_keywords: e.target.value })} /></Field>
            <Field label="Tags (separadas por vírgula)"><input className="input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></Field>
          </div>
        </details>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
          Publicar agora
        </label>

        <button onClick={handleSave} disabled={busy} className="h-11 px-6 rounded-full bg-gradient-brand text-primary-foreground font-bold text-sm flex items-center gap-2 disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar notícia
        </button>
      </section>

      {/* Categorias */}
      <section className="glass-card rounded-2xl p-5">
        <h2 className="font-bold mb-3">Categorias & Subcategorias</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-bold mb-2">Nova categoria</div>
            <div className="flex gap-2">
              <input className="input flex-1" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Nome" />
              <button onClick={handleAddCategory} className="px-3 rounded-lg bg-primary/10 text-primary text-sm font-bold">Adicionar</button>
            </div>
            <ul className="mt-3 text-sm space-y-1">
              {categories.map((c) => <li key={c.id} className="text-muted-foreground">• {c.name}</li>)}
            </ul>
          </div>
          <div>
            <div className="text-xs font-bold mb-2">Nova subcategoria</div>
            <div className="flex gap-2 mb-2">
              <select className="input" value={newSubParent} onChange={(e) => setNewSubParent(e.target.value)}>
                <option value="">Categoria…</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input className="input flex-1" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} placeholder="Nome" />
              <button onClick={handleAddSubcategory} className="px-3 rounded-lg bg-primary/10 text-primary text-sm font-bold">Adicionar</button>
            </div>
            <ul className="text-sm space-y-1">
              {subcategories.map((s) => (
                <li key={s.id} className="text-muted-foreground">
                  • {categories.find((c) => c.id === s.category_id)?.name} → {s.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Lista */}
      <section className="glass-card rounded-2xl p-5">
        <h2 className="font-bold mb-3">Notícias cadastradas ({items.length})</h2>
        <div className="space-y-2">
          {items.map((n) => (
            <div key={n.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/60">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{n.title}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  {n.published ? <Eye className="h-3 w-3 text-emerald-500" /> : <EyeOff className="h-3 w-3" />}
                  {n.published ? "Publicada" : "Rascunho"}
                  {n.auto_generated && <span className="px-1.5 rounded bg-primary/10 text-primary">IA</span>}
                  <span>· /noticias/{n.slug}</span>
                </div>
              </div>
              <button onClick={() => handleDelete(n.id)} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-destructive/10 text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {items.length === 0 && <div className="text-sm text-muted-foreground">Nenhuma notícia cadastrada.</div>}
        </div>
      </section>

      {/* Instagram shares */}
      <section className="glass-card rounded-2xl p-5">
        <h2 className="font-bold mb-3 flex items-center gap-2"><Instagram className="h-4 w-4" /> Compartilhamentos no Instagram</h2>
        <div className="space-y-2">
          {shareList.map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/60">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{s.news_articles?.title}</div>
                <a href={s.instagram_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline truncate block">{s.instagram_url}</a>
                <div className="text-xs text-muted-foreground">Status: {s.status} · {s.tokens_awarded} tokens</div>
              </div>
              {s.status === "pending" && (
                <>
                  <button onClick={async () => { await reviewShare({ data: { id: s.id, approve: true } }); toast.success("Aprovado +50 tokens"); reload(); }} className="h-8 px-3 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-bold flex items-center gap-1"><Check className="h-3 w-3" />Aprovar</button>
                  <button onClick={async () => { await reviewShare({ data: { id: s.id, approve: false } }); reload(); }} className="h-8 px-3 rounded-lg bg-destructive/10 text-destructive text-xs font-bold flex items-center gap-1"><X className="h-3 w-3" />Rejeitar</button>
                </>
              )}
            </div>
          ))}
          {shareList.length === 0 && <div className="text-sm text-muted-foreground">Nenhum compartilhamento.</div>}
        </div>
      </section>

      <style>{`.input{height:40px;width:100%;padding:0 12px;border-radius:8px;background:hsl(var(--muted)/0.4);border:1px solid hsl(var(--border)/0.6);font-size:14px}textarea.input{padding:10px 12px;height:auto}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-muted-foreground block mb-1">{label}</span>
      {children}
    </label>
  );
}
