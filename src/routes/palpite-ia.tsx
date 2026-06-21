import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/layout/AppShell";
import { askAiOpinion } from "@/lib/opinion-ai.functions";
import { Brain, Loader2, Sparkles, Target, TrendingUp, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/palpite-ia")({
  head: () => ({
    meta: [
      { title: "Palpite da IA — Segunda opinião | Desafio dos Palpites" },
      { name: "description", content: "Digite seu desafio e tenha uma segunda opinião gerada por IA." },
    ],
  }),
  component: PalpiteIAPage,
});

type Result = { pick: string; confidence: string; opinion: string; reasoning: string };

function PalpiteIAPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const run = useServerFn(askAiOpinion);

  const submit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    const challenge = text.trim();
    if (challenge.length < 5) {
      setError("Descreva o desafio com pelo menos 5 caracteres.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await run({ data: { challenge } });
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao consultar a IA");
    } finally {
      setLoading(false);
    }
  };

  const examples = [
    "Brasil x Argentina amanhã pela Copa América — quem vence?",
    "Flamengo x Palmeiras no Maracanã, quem leva o título?",
    "UFC: Pereira x Ankalaev, quem vence e em qual round?",
  ];

  const confColor = (c: string) => {
    const v = c.toLowerCase();
    if (v.includes("alta")) return "text-primary border-primary/40 bg-primary/10";
    if (v.includes("baixa")) return "text-destructive border-destructive/40 bg-destructive/10";
    return "text-gold border-gold/40 bg-gold/10";
  };

  return (
    <AppShell>
      <header className="mb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 grid place-items-center rounded-2xl bg-gradient-brand shadow-glow">
            <Brain className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-black flex items-center gap-2">
              Palpite da IA <Sparkles className="h-5 w-5 text-gold" />
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Digite aqui o desafio e tenha uma segunda opinião.
            </p>
          </div>
        </div>
      </header>

      <form onSubmit={submit} className="rounded-2xl border border-primary/30 glass-card p-5 mb-6">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Descreva o desafio
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ex.: Brasil x Argentina amanhã na final da Copa América, quem vence e por quanto?"
          rows={4}
          maxLength={1000}
          className="mt-2 w-full bg-background/60 border border-border/60 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 resize-y"
          disabled={loading}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {examples.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setText(ex)}
              className="text-[11px] px-2.5 py-1 rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/60 transition"
            >
              {ex}
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-[11px] text-muted-foreground">{text.length}/1000</span>
          <button
            type="submit"
            disabled={loading || text.trim().length < 5}
            className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-gradient-brand text-primary-foreground font-black text-sm uppercase tracking-wide shadow-glow hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
            {loading ? "Pensando..." : "Pedir opinião da IA"}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive p-4 text-sm flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <section className="rounded-2xl border border-gold/40 glass-card p-6 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Segunda opinião da IA
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${confColor(result.confidence)}`}>
              Confiança: {result.confidence}
            </span>
          </div>

          <div className="rounded-xl bg-background/40 border border-border/60 p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Target className="h-3.5 w-3.5" /> Aposta da IA
            </div>
            <div className="mt-1 font-display text-2xl font-black text-gradient-brand">{result.pick}</div>
          </div>

          {result.opinion && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-1">
                <TrendingUp className="h-3.5 w-3.5" /> Opinião
              </div>
              <p className="text-sm leading-relaxed">{result.opinion}</p>
            </div>
          )}

          {result.reasoning && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Análise</div>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{result.reasoning}</p>
            </div>
          )}

          <div className="text-[11px] text-muted-foreground border-t border-border/60 pt-3">
            ⚠️ Esta é uma análise gerada por IA. Use como segunda opinião, não como garantia.
          </div>
        </section>
      )}
    </AppShell>
  );
}
