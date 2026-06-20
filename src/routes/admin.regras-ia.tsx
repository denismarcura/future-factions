import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CATEGORIES, type Category, USERS, type Prediction } from "@/lib/mock-data";
import { addManyUserChallenges, saveUserChallenge } from "@/lib/user-challenges";
import { generateChallenges, type GeneratedChallenge } from "@/lib/generate-challenges.functions";
import {
  Sparkles, Loader2, Wand2, Plus, Trash2, Check, AlertCircle, PencilLine,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/regras-ia")({
  component: RegrasIA,
});

type Draft = GeneratedChallenge & { _key: string; selected: boolean };

function RegrasIA() {
  const [mode, setMode] = useState<"ia" | "manual">("ia");
  const [category, setCategory] = useState<Category>("Futebol");
  const [count, setCount] = useState(5);
  const [context, setContext] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generate = useServerFn(generateChallenges);

  async function handleGenerate() {
    setError(null);
    setLoading(true);
    try {
      const res = await generate({
        data: { category, count, context: context.trim() || undefined },
      });
      const next: Draft[] = res.challenges.map((c, i) => ({
        ...c,
        _key: `${Date.now()}-${i}`,
        selected: true,
      }));
      setDrafts(next);
      toast.success(`${next.length} desafios gerados pela IA.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao gerar desafios";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function addManualRow() {
    setDrafts((d) => [
      ...d,
      {
        _key: `m-${Date.now()}`,
        selected: true,
        title: "",
        description: "",
        options: ["Sim", "Não"],
        minTokens: 50,
      },
    ]);
  }

  function updateDraft(key: string, patch: Partial<Draft>) {
    setDrafts((d) => d.map((x) => (x._key === key ? { ...x, ...patch } : x)));
  }

  function removeDraft(key: string) {
    setDrafts((d) => d.filter((x) => x._key !== key));
  }

  function publishSelected() {
    const sel = drafts.filter((d) => d.selected && d.title.trim());
    if (!sel.length) {
      toast.error("Selecione pelo menos um desafio com título.");
      return;
    }
    const items: Prediction[] = sel.map((c, i) => ({
      id: `ai-${Date.now()}-${i}`,
      title: c.title.trim(),
      description: c.description.trim() || "Desafio gerado pela IA.",
      category,
      author: USERS[0],
      createdAt: new Date().toISOString(),
      closesAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      minTokens: c.minTokens,
      options: c.options.map((label, j) => ({ id: `o${j}`, label, pool: 0 })),
      bettors: 0,
      comments: 0,
      likes: 0,
      shares: 0,
      tags: ["ia", "admin"],
      hot: true,
    }));
    addManyUserChallenges(items);
    setDrafts([]);
    toast.success(`${items.length} desafios publicados.`);
  }

  function publishManualOne(d: Draft) {
    if (!d.title.trim()) return toast.error("Informe o título.");
    saveUserChallenge({
      id: `manual-${Date.now()}`,
      name: d.title.trim(),
      category,
      endsAt: "",
      isOpen: true,
      subs: [{ id: "s1", question: d.title, options: d.options }],
    });
    removeDraft(d._key);
    toast.success("Desafio publicado.");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-brand grid place-items-center shadow-glow">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-display font-black">Regras IA · Geração de Desafios</h2>
          <p className="text-xs text-muted-foreground">
            Crie desafios em lote escolhendo uma categoria. Use a IA ou monte manualmente.
          </p>
        </div>
      </div>

      <div className="flex gap-2 p-1 rounded-full bg-card border border-border/60 w-fit">
        {(["ia", "manual"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition inline-flex items-center gap-2 ${
              mode === m ? "bg-gradient-brand text-primary-foreground shadow-glow" : "text-muted-foreground"
            }`}
          >
            {m === "ia" ? <Wand2 className="h-4 w-4" /> : <PencilLine className="h-4 w-4" />}
            {m === "ia" ? "Gerar com IA" : "Manual"}
          </button>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-5 border border-border/60 space-y-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Categoria">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full h-10 px-3 rounded-lg bg-card border border-border/60 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="NBA EUA">NBA EUA</option>
              <option value="UFC">UFC</option>
              <option value="Reality Show">Reality Show</option>
            </select>
          </Field>
          {mode === "ia" && (
            <>
              <Field label="Quantidade">
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Math.min(10, Number(e.target.value) || 5)))}
                  className="w-full h-10 px-3 rounded-lg bg-card border border-border/60 text-sm tabular-nums"
                />
              </Field>
              <Field label="Contexto (opcional)">
                <input
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Ex: rodada do final de semana"
                  className="w-full h-10 px-3 rounded-lg bg-card border border-border/60 text-sm"
                />
              </Field>
            </>
          )}
        </div>

        {mode === "ia" ? (
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-gradient-brand text-primary-foreground font-bold text-sm shadow-glow disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            Gerar {count} desafios com IA
          </button>
        ) : (
          <button
            onClick={addManualRow}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-gradient-brand text-primary-foreground font-bold text-sm shadow-glow"
          >
            <Plus className="h-4 w-4" /> Adicionar desafio manual
          </button>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {drafts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-display font-bold">
              Rascunhos ({drafts.filter((d) => d.selected).length}/{drafts.length} selecionados)
            </h3>
            {mode === "ia" && (
              <button
                onClick={publishSelected}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-glow"
              >
                <Check className="h-4 w-4" /> Publicar selecionados
              </button>
            )}
          </div>

          <div className="space-y-3">
            {drafts.map((d) => (
              <div key={d._key} className="glass-card rounded-2xl p-4 border border-border/60 space-y-3">
                <div className="flex items-start gap-3">
                  {mode === "ia" && (
                    <input
                      type="checkbox"
                      checked={d.selected}
                      onChange={(e) => updateDraft(d._key, { selected: e.target.checked })}
                      className="mt-2 h-4 w-4 accent-primary"
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <input
                      value={d.title}
                      onChange={(e) => updateDraft(d._key, { title: e.target.value })}
                      placeholder="Título do desafio"
                      className="w-full h-10 px-3 rounded-lg bg-card border border-border/60 text-sm font-semibold"
                    />
                    <textarea
                      value={d.description}
                      onChange={(e) => updateDraft(d._key, { description: e.target.value })}
                      placeholder="Descrição"
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg bg-card border border-border/60 text-sm"
                    />
                    <div className="grid sm:grid-cols-[1fr_140px] gap-3">
                      <input
                        value={d.options.join(", ")}
                        onChange={(e) =>
                          updateDraft(d._key, {
                            options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                          })
                        }
                        placeholder="Opções (separadas por vírgula)"
                        className="w-full h-10 px-3 rounded-lg bg-card border border-border/60 text-sm"
                      />
                      <input
                        type="number"
                        value={d.minTokens}
                        onChange={(e) => updateDraft(d._key, { minTokens: Number(e.target.value) || 10 })}
                        placeholder="Min tokens"
                        className="w-full h-10 px-3 rounded-lg bg-card border border-border/60 text-sm tabular-nums"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    {mode === "manual" && (
                      <button
                        onClick={() => publishManualOne(d)}
                        className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-bold inline-flex items-center gap-1"
                      >
                        <Check className="h-3 w-3" /> Publicar
                      </button>
                    )}
                    <button
                      onClick={() => removeDraft(d._key)}
                      className="h-8 w-8 grid place-items-center rounded-lg border border-border/60 hover:border-destructive/60 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
