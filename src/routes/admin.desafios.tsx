import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PREDICTIONS, type Prediction, CATEGORIES, type Category } from "@/lib/mock-data";
import {
  getUserChallenges,
  updateUserChallenge,
  deleteUserChallenge,
  applyPlatformOverrides,
  setPlatformOverride,
  deletePlatformChallenge,
} from "@/lib/user-challenges";
import { ListChecks, Search, Pencil, Trash2, Save, X, Coins, Users as UsersIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/desafios")({
  component: AdminDesafios,
});

function AdminDesafios() {
  const [userItems, setUserItems] = useState<Prediction[]>([]);
  const [platformItems, setPlatformItems] = useState<Prediction[]>(PREDICTIONS);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"todos" | "usuarios" | "plataforma">("todos");
  const [editing, setEditing] = useState<Prediction | null>(null);

  useEffect(() => {
    const sync = () => {
      setUserItems(getUserChallenges());
      setPlatformItems(applyPlatformOverrides(PREDICTIONS));
    };
    sync();
    window.addEventListener("ddp:user-challenges-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("ddp:user-challenges-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const all = useMemo(() => {
    if (filter === "usuarios") return userItems;
    if (filter === "plataforma") return platformItems;
    return [...userItems, ...platformItems];
  }, [userItems, platformItems, filter]);

  const filtered = all.filter(
    (p) =>
      p.title.toLowerCase().includes(q.toLowerCase()) ||
      p.category.toLowerCase().includes(q.toLowerCase())
  );

  function handleDelete(id: string) {
    if (!confirm("Excluir este desafio? Esta ação não pode ser desfeita.")) return;
    const isUser = userItems.some((u) => u.id === id);
    if (isUser) {
      deleteUserChallenge(id);
    } else {
      deletePlatformChallenge(id);
    }
    toast.success("Desafio excluído.");
  }

  function handleSaveEdit(updated: Prediction) {
    const isUser = userItems.some((u) => u.id === updated.id);
    if (isUser) {
      updateUserChallenge(updated.id, updated);
    } else {
      setPlatformOverride(updated.id, updated);
    }
    setEditing(null);
    toast.success("Desafio atualizado.");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-display font-bold">
            Desafios cadastrados{" "}
            <span className="text-muted-foreground font-normal text-sm">
              ({filtered.length})
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex p-1 rounded-full bg-card border border-border/60 text-xs">
            {(["todos", "usuarios", "plataforma"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`px-3 py-1.5 rounded-full font-semibold transition ${
                  filter === k ? "bg-gradient-brand text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {k === "todos" ? "Todos" : k === "usuarios" ? "Usuários" : "Plataforma"}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar título ou categoria…"
              className="h-10 pl-9 pr-4 rounded-full bg-card border border-border/60 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-primary/60"
            />
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-3 font-semibold">Desafio</th>
                <th className="text-left p-3 font-semibold">Categoria</th>
                <th className="text-left p-3 font-semibold">Origem</th>
                <th className="text-right p-3 font-semibold">Min. Tokens</th>
                <th className="text-right p-3 font-semibold">Palpiteiros</th>
                <th className="text-right p-3 font-semibold w-32">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const isUser = userItems.some((u) => u.id === p.id);
                return (
                  <tr key={p.id} className="border-t border-border/40 hover:bg-card/40">
                    <td className="p-3">
                      <div className="font-semibold">{p.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {p.options.map((o) => o.label).join(" / ")}
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{p.category}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          isUser
                            ? "bg-primary/15 text-primary border-primary/30"
                            : "bg-muted text-muted-foreground border-border/60"
                        }`}
                      >
                        {isUser ? "Usuário" : "Plataforma"}
                      </span>
                    </td>
                    <td className="p-3 text-right tabular-nums text-gold font-semibold">
                      <Coins className="h-3 w-3 inline mr-1" /> {p.minTokens}
                    </td>
                    <td className="p-3 text-right tabular-nums text-muted-foreground">
                      <UsersIcon className="h-3 w-3 inline mr-1" /> {p.bettors}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => setEditing(p)}
                          className="h-8 w-8 grid place-items-center rounded-lg border border-border/60 hover:border-primary/60 hover:text-primary transition"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="h-8 w-8 grid place-items-center rounded-lg border border-border/60 hover:border-destructive/60 hover:text-destructive transition"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground text-sm">
                    Nenhum desafio encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <EditModal
          challenge={editing}
          onClose={() => setEditing(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}

function EditModal({
  challenge,
  onClose,
  onSave,
}: {
  challenge: Prediction;
  onClose: () => void;
  onSave: (p: Prediction) => void;
}) {
  const [title, setTitle] = useState(challenge.title);
  const [description, setDescription] = useState(challenge.description);
  const [category, setCategory] = useState<Category>(challenge.category);
  const [minTokens, setMinTokens] = useState(challenge.minTokens);
  const [options, setOptions] = useState(challenge.options.map((o) => o.label).join("\n"));

  function submit() {
    onSave({
      ...challenge,
      title: title.trim(),
      description: description.trim(),
      category,
      minTokens: Math.max(1, Number(minTokens) || 10),
      options: options
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((label, i) => ({ id: `o${i}`, label, pool: 0 })),
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg glass-card rounded-2xl border border-border/60 p-6 space-y-4">
        <div className="flex items-start justify-between">
          <h3 className="font-display font-black text-lg">Editar desafio</h3>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-card">
            <X className="h-4 w-4" />
          </button>
        </div>

        <Field label="Título">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-card border border-border/60 text-sm"
          />
        </Field>
        <Field label="Descrição">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-card border border-border/60 text-sm"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Categoria">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full h-10 px-3 rounded-lg bg-card border border-border/60 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Min. Tokens">
            <input
              type="number"
              value={minTokens}
              onChange={(e) => setMinTokens(Number(e.target.value))}
              className="w-full h-10 px-3 rounded-lg bg-card border border-border/60 text-sm tabular-nums"
            />
          </Field>
        </div>
        <Field label="Opções (uma por linha)">
          <textarea
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-card border border-border/60 text-sm"
          />
        </Field>

        <div className="flex gap-2 justify-end pt-2">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-full border border-border/60 text-sm font-semibold hover:bg-card"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            className="h-10 px-5 rounded-full bg-gradient-brand text-primary-foreground text-sm font-bold shadow-glow inline-flex items-center gap-2"
          >
            <Save className="h-4 w-4" /> Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</span>
      {children}
    </label>
  );
}
