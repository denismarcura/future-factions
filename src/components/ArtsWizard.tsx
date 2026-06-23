import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { X, Loader2, Wand2, Check, Sparkles, ChevronLeft, ChevronRight, Upload } from "lucide-react";
import { generateChallengeArt } from "@/lib/challenge-arts.functions";
import logoAsset from "@/assets/logo-desafio.png.asset.json";

type WizardResult = {
  feed?: string;
  banner?: string;
  story?: string;
};

const SPORTS = ["Futebol", "Basquete", "Vôlei", "UFC", "Fórmula 1", "E-Sports", "Outros"];
const STYLES = [
  "Somente Escudos",
  "Escudos + Bandeiras",
  "Jogadores Principais",
  "Jogadores + Escudos",
  "Arte Estilo Copa do Mundo",
  "Arte Estilo Champions League",
  "Arte Estilo Futurista",
];
const COLORS = [
  { name: "Verde", hex: "#22c55e" },
  { name: "Azul", hex: "#3b82f6" },
  { name: "Vermelho", hex: "#ef4444" },
  { name: "Amarelo", hex: "#facc15" },
  { name: "Preto", hex: "#0f172a" },
  { name: "Branco", hex: "#f8fafc" },
  { name: "Laranja", hex: "#f97316" },
  { name: "Roxo", hex: "#8b5cf6" },
  { name: "Dourado", hex: "#d4af37" },
  { name: "Prata", hex: "#c0c0c0" },
];
const PRIZE_EXAMPLES = [
  "1 mês de academia",
  "Camisa oficial",
  "Vale-compras R$ 200",
  "5.000 Tokens",
  "Jantar para duas pessoas",
  "Smartphone",
  "Bicicleta",
];
const PHRASE_EXAMPLES = [
  "🎯 Faça seu palpite e concorra!",
  "🏆 Acerte e ganhe prêmios!",
  "🔥 Quanto mais palpites, mais chances!",
  "🚀 Convide amigos e ganhe tokens!",
];

export function ArtsWizard({
  initialName,
  initialPrize,
  initialDeadline,
  sponsorName,
  onClose,
  onApply,
}: {
  initialName?: string;
  initialPrize?: string;
  initialDeadline?: string;
  sponsorName?: string;
  onClose: () => void;
  onApply: (result: WizardResult) => void;
}) {
  const [step, setStep] = useState(1);
  const [sponsorLogo, setSponsorLogo] = useState<string | null>(null);
  const [prize, setPrize] = useState(initialPrize ?? "");
  const [deadline, setDeadline] = useState(initialDeadline ?? "");
  const [sport, setSport] = useState("Futebol");
  const [otherSport, setOtherSport] = useState("");
  const [participants, setParticipants] = useState(initialName ?? "");
  const [style, setStyle] = useState(STYLES[4]);
  const [colors, setColors] = useState<string[]>(["Verde", "Dourado"]);
  const [autoPhrase, setAutoPhrase] = useState(true);
  const [phrase, setPhrase] = useState(PHRASE_EXAMPLES[0]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<{ feed?: string; banner?: string; story?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const generateArt = useServerFn(generateChallengeArt);

  const toggleColor = (name: string) => {
    setColors((prev) => {
      if (prev.includes(name)) return prev.filter((c) => c !== name);
      if (prev.length >= 4) return prev;
      return [...prev, name];
    });
  };

  const onLogoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setSponsorLogo(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const sportLabel = sport === "Outros" ? otherSport.trim() || "Outros" : sport;

  const generateAll = async () => {
    setError(null);
    setGenerating(true);
    setProgress({});
    const baseInput = {
      sport: sportLabel,
      participants: participants.trim(),
      style,
      colors,
      prize: prize.trim(),
      deadline: deadline.trim(),
      headline: autoPhrase ? phrase : "",
      sponsorName: sponsorName ?? "",
    };
    try {
      for (const format of ["feed", "banner", "story"] as const) {
        const { dataUrl } = await generateArt({ data: { ...baseInput, format } });
        setProgress((p) => ({ ...p, [format]: dataUrl }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao gerar artes.");
    } finally {
      setGenerating(false);
    }
  };

  const canApply = progress.feed && progress.banner && progress.story;

  const StepHeader = ({ n, title }: { n: number; title: string }) => (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center font-black">
        {n}
      </div>
      <h3 className="font-display font-black text-lg">{title}</h3>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur grid place-items-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl my-8">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="font-display font-black text-xl">Criar Artes Automaticamente</h2>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-lg hover:bg-muted grid place-items-center">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Step indicator */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Etapa {step} de 8</span>
            <span>⚡ Geração em menos de 30s</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${(step / 8) * 100}%` }} />
          </div>

          {step === 1 && (
            <div>
              <StepHeader n={1} title="Identidade visual" />
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center gap-3 mb-4">
                <img src={logoAsset.url} alt="Logo Desafio" className="h-12 w-12 object-contain" />
                <div className="flex-1">
                  <div className="font-semibold text-sm flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-primary" /> Logotipo oficial do Desafio dos Palpites
                  </div>
                  <div className="text-xs text-muted-foreground">Será usado automaticamente nas artes.</div>
                </div>
              </div>
              <label className="block">
                <div className="text-sm font-semibold mb-2">Logotipo do patrocinador (opcional)</div>
                <div className="rounded-xl border-2 border-dashed border-border p-4 flex items-center gap-3 hover:border-primary/50 cursor-pointer">
                  {sponsorLogo ? (
                    <img src={sponsorLogo} alt="Patrocinador" className="h-14 w-14 object-contain" />
                  ) : (
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {sponsorLogo ? "Logo carregado. Clique para trocar." : "Clique para enviar o logo do patrocinador"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && onLogoUpload(e.target.files[0])}
                  />
                </div>
              </label>
            </div>
          )}

          {step === 2 && (
            <div>
              <StepHeader n={2} title="🎁 Premiação" />
              <label className="block text-sm font-semibold mb-2">Qual será o prêmio?</label>
              <input
                value={prize}
                onChange={(e) => setPrize(e.target.value)}
                placeholder="Ex.: Camisa oficial, 5.000 Tokens, Smartphone…"
                className="input"
              />
              <div className="flex flex-wrap gap-2 mt-3">
                {PRIZE_EXAMPLES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPrize(p)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary/50 hover:bg-primary/5"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <StepHeader n={3} title="📅 Data limite" />
              <label className="block text-sm font-semibold mb-2">Data e horário limite para palpites</label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="input"
              />
              <p className="text-xs text-muted-foreground mt-2">Aparecerá em destaque nas artes geradas.</p>
            </div>
          )}

          {step === 4 && (
            <div>
              <StepHeader n={4} title="⚽ Tipo de arte / modalidade" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SPORTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSport(s)}
                    className={`p-3 rounded-xl border text-sm font-semibold transition ${
                      sport === s ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {sport === "Outros" && (
                <input
                  value={otherSport}
                  onChange={(e) => setOtherSport(e.target.value)}
                  placeholder="Descreva a modalidade"
                  className="input mt-3"
                />
              )}
            </div>
          )}

          {step === 5 && (
            <div>
              <StepHeader n={5} title="Times e participantes" />
              <label className="block text-sm font-semibold mb-2">
                Como deseja exibir os participantes? Ex.: <em>Brasil x Escócia</em>
              </label>
              <input
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                placeholder="Brasil x Escócia"
                className="input mb-4"
              />
              <div className="space-y-2">
                {STYLES.map((s) => (
                  <label
                    key={s}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${
                      style === s ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="style"
                      checked={style === s}
                      onChange={() => setStyle(s)}
                      className="accent-primary"
                    />
                    <span className="text-sm font-semibold">{s}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div>
              <StepHeader n={6} title="Cores (até 4)" />
              <p className="text-xs text-muted-foreground mb-3">Selecionadas: {colors.length}/4 — o degradê será gerado automaticamente.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COLORS.map((c) => {
                  const active = colors.includes(c.name);
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => toggleColor(c.name)}
                      className={`p-3 rounded-xl border flex items-center gap-2 text-sm font-semibold ${
                        active ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <span
                        className="h-5 w-5 rounded-full border border-border/50"
                        style={{ background: c.hex }}
                      />
                      {c.name}
                      {active && <Check className="h-4 w-4 ml-auto text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 7 && (
            <div>
              <StepHeader n={7} title="Frases" />
              <label className="block text-sm font-semibold mb-2">Deseja gerar frases automaticamente?</label>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <label className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2 ${autoPhrase ? "border-primary bg-primary/10" : "border-border"}`}>
                  <input type="radio" checked={autoPhrase} onChange={() => setAutoPhrase(true)} className="accent-primary" />
                  <span className="font-semibold">Sim</span>
                </label>
                <label className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2 ${!autoPhrase ? "border-primary bg-primary/10" : "border-border"}`}>
                  <input type="radio" checked={!autoPhrase} onChange={() => setAutoPhrase(false)} className="accent-primary" />
                  <span className="font-semibold">Não</span>
                </label>
              </div>
              {autoPhrase && (
                <div className="space-y-2">
                  {PHRASE_EXAMPLES.map((p) => (
                    <label
                      key={p}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${
                        phrase === p ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                      }`}
                    >
                      <input type="radio" checked={phrase === p} onChange={() => setPhrase(p)} className="accent-primary" />
                      <span className="text-sm font-semibold">{p}</span>
                    </label>
                  ))}
                  <input
                    value={phrase}
                    onChange={(e) => setPhrase(e.target.value)}
                    placeholder="Ou escreva a sua…"
                    className="input mt-2"
                  />
                </div>
              )}
            </div>
          )}

          {step === 8 && (
            <div>
              <StepHeader n={8} title="🚀 Gerar artes" />
              <div className="rounded-xl bg-muted/40 border border-border p-4 text-sm space-y-1 mb-4">
                <div><strong>Modalidade:</strong> {sportLabel}</div>
                {participants && <div><strong>Participantes:</strong> {participants}</div>}
                <div><strong>Estilo:</strong> {style}</div>
                <div><strong>Cores:</strong> {colors.join(", ")}</div>
                {prize && <div><strong>Prêmio:</strong> {prize}</div>}
                {deadline && <div><strong>Data limite:</strong> {deadline}</div>}
                {autoPhrase && <div><strong>Frase:</strong> {phrase}</div>}
              </div>

              {error && (
                <div className="mb-3 text-sm text-destructive rounded-lg border border-destructive/40 bg-destructive/10 p-3">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={generateAll}
                disabled={generating}
                className="w-full h-12 rounded-xl bg-gradient-brand text-primary-foreground font-black shadow-glow inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
                {generating ? "Gerando artes…" : "🚀 GERAR ARTES"}
              </button>

              <div className="grid grid-cols-3 gap-2 mt-4">
                {(["feed", "banner", "story"] as const).map((f) => (
                  <div key={f} className="aspect-square rounded-lg border border-border bg-muted/30 overflow-hidden relative">
                    {progress[f] ? (
                      <img src={progress[f]} alt={f} className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">
                        {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : f}
                      </div>
                    )}
                    <div className="absolute bottom-1 left-1 right-1 text-[10px] text-center bg-background/80 rounded px-1 py-0.5 font-semibold">
                      {f === "feed" ? "Feed 4:5" : f === "banner" ? "Banner 16:9" : "Story 9:16"}
                    </div>
                  </div>
                ))}
              </div>

              {canApply && (
                <button
                  type="button"
                  onClick={() => {
                    onApply(progress);
                    onClose();
                  }}
                  className="w-full mt-4 h-11 rounded-xl bg-primary text-primary-foreground font-bold inline-flex items-center justify-center gap-2"
                >
                  <Check className="h-5 w-5" /> Aplicar artes ao desafio
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 p-4 border-t border-border">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="h-10 px-4 rounded-lg border border-border text-sm font-semibold inline-flex items-center gap-1 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Voltar
          </button>
          {step < 8 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(8, s + 1))}
              className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-bold inline-flex items-center gap-1"
            >
              Avançar <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-lg border border-border text-sm font-semibold"
            >
              Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
