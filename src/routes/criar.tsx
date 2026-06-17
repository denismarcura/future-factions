import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { CATEGORIES } from "@/lib/mock-data";

export const Route = createFileRoute("/criar")({
  head: () => ({
    meta: [
      { title: "Criar previsão — EU ACHO QUE VAI DAR @#&" },
      { name: "description", content: "Crie sua própria previsão e desafie seus amigos." },
    ],
  }),
  component: Criar,
});

function Criar() {
  const [opts, setOpts] = useState(["Sim", "Não"]);

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-black flex items-center gap-3">
          <Sparkles className="h-7 w-7 text-primary" /> Criar previsão
        </h1>
        <p className="text-muted-foreground mt-1">Defina um palpite e deixe a comunidade apostar.</p>
      </header>

      <form className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <Field label="Título">
            <input placeholder="Vai ter cartão vermelho no jogo de domingo?" className="input" />
          </Field>
          <Field label="Descrição">
            <textarea rows={4} placeholder="Conte os detalhes, regras de validação, fontes…" className="input resize-none" />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Categoria">
              <select className="input">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Encerra em">
              <input type="datetime-local" className="input" />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Mínimo de Tokens">
              <input type="number" defaultValue={10} className="input" />
            </Field>
            <Field label="Tags (vírgula)">
              <input placeholder="copa, brasil, polêmico" className="input" />
            </Field>
          </div>

          <Field label="Opções de resposta">
            <div className="space-y-2">
              {opts.map((o, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="input flex-1"
                    value={o}
                    onChange={(e) => {
                      const next = [...opts]; next[i] = e.target.value; setOpts(next);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setOpts(opts.filter((_, x) => x !== i))}
                    className="h-11 w-11 rounded-lg border border-border/60 grid place-items-center text-muted-foreground hover:text-destructive hover:border-destructive/60"
                    disabled={opts.length <= 2}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setOpts([...opts, ""])}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-primary hover:border-primary/60"
              >
                <Plus className="h-4 w-4" /> Adicionar opção
              </button>
            </div>
          </Field>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
          <div className="rounded-2xl glass-card p-5">
            <div className="text-xs uppercase tracking-wider font-bold text-gold">Dicas</div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground list-disc pl-4">
              <li>Use perguntas Sim/Não — engajam mais.</li>
              <li>Defina regras claras de validação.</li>
              <li>Adicione tags para aparecer nos filtros.</li>
              <li>Encerre antes do evento acontecer.</li>
            </ul>
          </div>
          <button type="button" className="w-full h-12 rounded-xl bg-gradient-brand text-primary-foreground font-display font-black shadow-glow hover:scale-[1.01] transition">
            Publicar previsão
          </button>
          <Link to="/" className="block text-center text-sm text-muted-foreground hover:text-foreground">
            Cancelar
          </Link>
        </aside>
      </form>

      <style>{`
        .input {
          width: 100%;
          height: 44px;
          padding: 0 12px;
          border-radius: 10px;
          background: color-mix(in oklab, var(--card) 70%, transparent);
          border: 1px solid var(--border);
          color: var(--foreground);
          font-size: 14px;
          outline: none;
        }
        textarea.input { height: auto; padding: 10px 12px; }
        .input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px color-mix(in oklab, var(--primary) 25%, transparent); }
      `}</style>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1.5">{label}</div>
      {children}
    </label>
  );
}
