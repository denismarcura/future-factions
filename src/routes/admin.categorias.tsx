import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Pencil, Loader2, FolderTree, ChevronRight, X, Check } from "lucide-react";
import { toast } from "sonner";
import {
  type ChallengeCategory,
  type ChallengeSubcategory,
  listCategories,
  listSubcategories,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
} from "@/lib/challenge-categories";

export const Route = createFileRoute("/admin/categorias")({
  head: () => ({ meta: [{ title: "Categorias de Desafios · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminCategorias,
});

function AdminCategorias() {
  const [cats, setCats] = useState<ChallengeCategory[]>([]);
  const [subs, setSubs] = useState<ChallengeSubcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [newCat, setNewCat] = useState("");
  const [newSub, setNewSub] = useState("");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState("");
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editingSubName, setEditingSubName] = useState("");

  async function reload() {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([listCategories(), listSubcategories()]);
      setCats(c);
      setSubs(s);
      if (!selectedId && c.length) setSelectedId(c[0].id);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, []);

  const visibleSubs = useMemo(
    () => subs.filter(s => s.category_id === selectedId),
    [subs, selectedId],
  );

  async function handleAddCat(e: React.FormEvent) {
    e.preventDefault();
    const name = newCat.trim();
    if (!name) return;
    try {
      const created = await createCategory({ name, sort_order: cats.length + 1 });
      setNewCat("");
      setCats([...cats, created]);
      setSelectedId(created.id);
      toast.success("Categoria criada");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao criar categoria");
    }
  }

  async function handleAddSub(e: React.FormEvent) {
    e.preventDefault();
    const name = newSub.trim();
    if (!name || !selectedId) return;
    try {
      const created = await createSubcategory({ category_id: selectedId, name, sort_order: visibleSubs.length + 1 });
      setNewSub("");
      setSubs([...subs, created]);
      toast.success("Sub-categoria criada");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao criar sub-categoria");
    }
  }

  async function handleRenameCat(id: string) {
    const name = editingCatName.trim();
    if (!name) return;
    try {
      await updateCategory(id, { name });
      setCats(cats.map(c => c.id === id ? { ...c, name } : c));
      setEditingCatId(null);
      toast.success("Categoria atualizada");
    } catch (e: any) { toast.error(e.message ?? "Erro"); }
  }

  async function handleDeleteCat(id: string) {
    if (!confirm("Excluir categoria e todas as sub-categorias?")) return;
    try {
      await deleteCategory(id);
      setCats(cats.filter(c => c.id !== id));
      setSubs(subs.filter(s => s.category_id !== id));
      if (selectedId === id) setSelectedId(null);
      toast.success("Categoria removida");
    } catch (e: any) { toast.error(e.message ?? "Erro"); }
  }

  async function handleRenameSub(id: string) {
    const name = editingSubName.trim();
    if (!name) return;
    try {
      await updateSubcategory(id, { name });
      setSubs(subs.map(s => s.id === id ? { ...s, name } : s));
      setEditingSubId(null);
      toast.success("Sub-categoria atualizada");
    } catch (e: any) { toast.error(e.message ?? "Erro"); }
  }

  async function handleDeleteSub(id: string) {
    if (!confirm("Excluir sub-categoria?")) return;
    try {
      await deleteSubcategory(id);
      setSubs(subs.filter(s => s.id !== id));
      toast.success("Sub-categoria removida");
    } catch (e: any) { toast.error(e.message ?? "Erro"); }
  }

  if (loading) {
    return (
      <div className="min-h-[40vh] grid place-items-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <FolderTree className="h-6 w-6 text-primary" />
        <div>
          <h1 className="font-display text-2xl font-black">Categorias de Desafios</h1>
          <p className="text-sm text-muted-foreground">Gerencie categorias e sub-categorias usadas no cadastro de desafios.</p>
        </div>
      </header>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Categorias */}
        <section className="glass-card rounded-xl p-5">
          <h2 className="font-display font-bold text-lg mb-3">Categorias</h2>
          <form onSubmit={handleAddCat} className="flex gap-2 mb-4">
            <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Nova categoria" className="input flex-1" />
            <button type="submit" className="inline-flex items-center gap-1 h-10 px-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              <Plus className="h-4 w-4" /> Adicionar
            </button>
          </form>
          <ul className="space-y-1">
            {cats.map((c) => {
              const isSel = c.id === selectedId;
              const isEdit = editingCatId === c.id;
              return (
                <li key={c.id} className={`rounded-lg border ${isSel ? "border-primary bg-primary/5" : "border-border"} px-3 py-2 flex items-center gap-2`}>
                  {isEdit ? (
                    <>
                      <input value={editingCatName} onChange={(e) => setEditingCatName(e.target.value)} className="input h-9 flex-1" autoFocus />
                      <button onClick={() => handleRenameCat(c.id)} className="h-9 w-9 grid place-items-center rounded-lg bg-primary text-primary-foreground"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setEditingCatId(null)} className="h-9 w-9 grid place-items-center rounded-lg border border-border"><X className="h-4 w-4" /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setSelectedId(c.id)} className="flex-1 text-left font-semibold flex items-center gap-2">
                        <ChevronRight className={`h-4 w-4 transition ${isSel ? "rotate-90 text-primary" : "text-muted-foreground"}`} />
                        {c.name}
                        <span className="text-xs text-muted-foreground">({subs.filter(s => s.category_id === c.id).length})</span>
                      </button>
                      <button onClick={() => { setEditingCatId(c.id); setEditingCatName(c.name); }} className="h-9 w-9 grid place-items-center rounded-lg hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDeleteCat(c.id)} className="h-9 w-9 grid place-items-center rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </>
                  )}
                </li>
              );
            })}
            {cats.length === 0 && <li className="text-sm text-muted-foreground py-4 text-center">Nenhuma categoria cadastrada.</li>}
          </ul>
        </section>

        {/* Subcategorias */}
        <section className="glass-card rounded-xl p-5">
          <h2 className="font-display font-bold text-lg mb-1">Sub-categorias</h2>
          <p className="text-xs text-muted-foreground mb-3">
            {selectedId ? `Da categoria: ${cats.find(c => c.id === selectedId)?.name ?? ""}` : "Selecione uma categoria à esquerda."}
          </p>
          <form onSubmit={handleAddSub} className="flex gap-2 mb-4">
            <input value={newSub} onChange={(e) => setNewSub(e.target.value)} placeholder="Nova sub-categoria" className="input flex-1" disabled={!selectedId} />
            <button type="submit" disabled={!selectedId} className="inline-flex items-center gap-1 h-10 px-3 rounded-lg bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50">
              <Plus className="h-4 w-4" /> Adicionar
            </button>
          </form>
          <ul className="space-y-1">
            {visibleSubs.map((s) => {
              const isEdit = editingSubId === s.id;
              return (
                <li key={s.id} className="rounded-lg border border-border px-3 py-2 flex items-center gap-2">
                  {isEdit ? (
                    <>
                      <input value={editingSubName} onChange={(e) => setEditingSubName(e.target.value)} className="input h-9 flex-1" autoFocus />
                      <button onClick={() => handleRenameSub(s.id)} className="h-9 w-9 grid place-items-center rounded-lg bg-primary text-primary-foreground"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setEditingSubId(null)} className="h-9 w-9 grid place-items-center rounded-lg border border-border"><X className="h-4 w-4" /></button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 font-medium text-sm">{s.name}</span>
                      <button onClick={() => { setEditingSubId(s.id); setEditingSubName(s.name); }} className="h-9 w-9 grid place-items-center rounded-lg hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDeleteSub(s.id)} className="h-9 w-9 grid place-items-center rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </>
                  )}
                </li>
              );
            })}
            {selectedId && visibleSubs.length === 0 && <li className="text-sm text-muted-foreground py-4 text-center">Nenhuma sub-categoria.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
