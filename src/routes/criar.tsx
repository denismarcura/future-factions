import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Plus, Trash2, Sparkles, Upload, Wand2, Calendar as CalIcon,
  Gift, Coins, Instagram, Facebook, Youtube, Music2, Globe, Lock,
  CheckCircle2, Share2, Copy, AlertCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { CATEGORIES } from "@/lib/mock-data";

export const Route = createFileRoute("/criar")({
  head: () => ({
    meta: [
      { title: "Cadastro de Desafio — Desafio dos Palpites" },
      { name: "description", content: "Crie seu desafio, escolha sub-categorias de palpites e ofereça prêmios." },
    ],
  }),
  component: Criar,
});

type SubCat = {
  id: string;
  question: string;
  options: string[]; // up to 3
};

const COST = 100;
const REWARD_PER_HIT = 50;
const AUTO_PRIZE = 5000;

function uid() { return Math.random().toString(36).slice(2, 9); }

function Criar() {
  const [isOpen, setIsOpen] = useState(true);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [endsAt, setEndsAt] = useState("");
  const [prizeName, setPrizeName] = useState("");
  const [socialLink, setSocialLink] = useState("");
  const [subs, setSubs] = useState<SubCat[]>([
    { id: uid(), question: "Quem ganha o jogo Brasil x Haiti?", options: ["Brasil", "Empate", "Haiti"] },
    { id: uid(), question: "Neymar vai jogar?", options: ["Sim", "Não"] },
  ]);
  const [prizeImg, setPrizeImg] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [published, setPublished] = useState<null | { id: string; name: string }>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];
    if (!name.trim()) errs.push("Informe o nome do desafio.");
    if (!endsAt) errs.push("Defina a data e hora de encerramento.");
    if (subs.length === 0) errs.push("Adicione pelo menos 1 sub-categoria.");
    subs.forEach((s, i) => {
      if (!s.question.trim()) errs.push(`Pergunta vazia no palpite #${i + 1}.`);
      if (s.options.filter(o => o.trim()).length < 2) errs.push(`Palpite #${i + 1} precisa de pelo menos 2 opções preenchidas.`);
    });
    if (errs.length) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setErrors([]);
    const id = uid();
    setPublished({ id, name: name.trim() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addSub = () => {
    if (subs.length >= 5) return;
    setSubs([...subs, { id: uid(), question: "", options: ["Sim", "Não"] }]);
  };
  const removeSub = (id: string) => setSubs(subs.filter(s => s.id !== id));
  const updateSub = (id: string, patch: Partial<SubCat>) =>
    setSubs(subs.map(s => s.id === id ? { ...s, ...patch } : s));
  const setOption = (id: string, i: number, v: string) =>
    setSubs(subs.map(s => s.id === id ? { ...s, options: s.options.map((o, x) => x === i ? v : o) } : s));
  const addOption = (id: string) =>
    setSubs(subs.map(s => s.id === id && s.options.length < 3 ? { ...s, options: [...s.options, ""] } : s));
  const removeOption = (id: string, i: number) =>
    setSubs(subs.map(s => s.id === id && s.options.length > 2 ? { ...s, options: s.options.filter((_, x) => x !== i) } : s));

  const handleUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    // Validate 500x500
    const img = new Image();
    img.onload = () => {
      if (img.width !== 500 || img.height !== 500) {
        alert(`A imagem deve ter 500x500 pixels. Recebido: ${img.width}x${img.height}.`);
        return;
      }
      setPrizeImg(url);
    };
    img.src = url;
  };

  const fakeGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setPrizeImg(`https://picsum.photos/seed/${encodeURIComponent(aiPrompt || "premio")}/500/500`);
      setGenerating(false);
    }, 900);
  };

  const totalQuestions = subs.length;
  const maxReward = totalQuestions * REWARD_PER_HIT;

  return (
    <AppShell>
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-black flex items-center gap-3">
            <Sparkles className="h-7 w-7 text-primary" /> Cadastro de Desafio
          </h1>
          <p className="text-muted-foreground mt-1">
            Monte seu desafio, escolha até 5 sub-categorias e defina o prêmio.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl glass-card px-4 py-2.5">
          <Coins className="h-5 w-5 text-gold" />
          <div className="text-sm">
            <div className="text-xs text-muted-foreground">Custo de criação</div>
            <div className="font-display font-black text-lg leading-none">{COST} <span className="text-xs text-gold">Tokens</span></div>
          </div>
        </div>
      </header>

      <form className="grid lg:grid-cols-[1fr_360px] gap-6" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-5">
          {/* Básico */}
          <Section title="Informações do desafio">
            <Field label="Nome do desafio">
              <input placeholder="Ex.: Brasil x Haiti — Quem leva?" className="input" />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Categoria">
                <select className="input">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Fim do desafio">
                <div className="relative">
                  <input type="datetime-local" className="input pr-9" />
                  <CalIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </Field>
            </div>
            <Field label="Visibilidade">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(true)}
                  className={`flex-1 h-11 rounded-lg border inline-flex items-center justify-center gap-2 text-sm font-semibold transition ${isOpen ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                >
                  <Globe className="h-4 w-4" /> Aberto a todos
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className={`flex-1 h-11 rounded-lg border inline-flex items-center justify-center gap-2 text-sm font-semibold transition ${!isOpen ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                >
                  <Lock className="h-4 w-4" /> Privado (amigos)
                </button>
              </div>
            </Field>
          </Section>

          {/* Sub-categorias */}
          <Section
            title={`Sub-categorias de palpites (${subs.length}/5)`}
            description={`Até 5 perguntas, cada uma com até 3 opções. Cada acerto vale ${REWARD_PER_HIT} tokens.`}
            action={
              <button
                type="button"
                onClick={addSub}
                disabled={subs.length >= 5}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary/15 text-primary border border-primary/30 text-sm font-semibold hover:bg-primary/20 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" /> Nova sub-categoria
              </button>
            }
          >
            <div className="space-y-3">
              {subs.map((s, idx) => (
                <div key={s.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-gold uppercase tracking-wider">Palpite #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeSub(s.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    value={s.question}
                    onChange={(e) => updateSub(s.id, { question: e.target.value })}
                    placeholder="Ex.: Qual jogador faz o primeiro gol?"
                    className="input mb-3"
                  />
                  <div className="space-y-2">
                    {s.options.map((o, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          value={o}
                          onChange={(e) => setOption(s.id, i, e.target.value)}
                          placeholder={`Opção ${i + 1}`}
                          className="input flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(s.id, i)}
                          disabled={s.options.length <= 2}
                          className="h-11 w-11 rounded-lg border border-border/60 grid place-items-center text-muted-foreground hover:text-destructive hover:border-destructive/60 disabled:opacity-40"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {s.options.length < 3 && (
                      <button
                        type="button"
                        onClick={() => addOption(s.id)}
                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-primary hover:border-primary/60"
                      >
                        <Plus className="h-4 w-4" /> Adicionar opção (até 3)
                      </button>
                    )}
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Quem acertar este palpite ganha <span className="text-primary font-bold">{REWARD_PER_HIT} tokens</span>.
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Prêmio */}
          <Section
            title="Prêmio"
            description={`Automaticamente daremos ${AUTO_PRIZE.toLocaleString("pt-BR")} tokens para quem fizer a maior pontuação. Você pode adicionar um prêmio físico extra (opcional).`}
          >
            <Field label="Nome do prêmio extra (opcional)">
              <input placeholder="Ex.: 1 Camiseta do Brasil" className="input" />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1.5">Imagem do prêmio (500x500)</div>
                <div className="rounded-xl border border-dashed border-border/70 bg-background/40 p-4 aspect-square grid place-items-center overflow-hidden">
                  {prizeImg ? (
                    <img src={prizeImg} alt="Prêmio" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <div className="text-center text-muted-foreground text-xs">
                      <Gift className="h-8 w-8 mx-auto mb-2 text-gold" />
                      Nenhuma imagem ainda
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Field label="Gerar com IA">
                  <textarea
                    rows={3}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Descreva o prêmio: ex. camiseta amarela da seleção brasileira sobre fundo verde"
                    className="input resize-none"
                  />
                </Field>
                <button
                  type="button"
                  onClick={fakeGenerate}
                  disabled={generating}
                  className="w-full h-11 rounded-lg bg-gradient-brand text-primary-foreground font-display font-bold inline-flex items-center justify-center gap-2 shadow-glow disabled:opacity-60"
                >
                  <Wand2 className="h-4 w-4" /> {generating ? "Gerando..." : "Gerar imagem 500x500"}
                </button>
                <label className="w-full h-11 rounded-lg border border-border inline-flex items-center justify-center gap-2 text-sm font-semibold cursor-pointer hover:border-primary hover:text-primary">
                  <Upload className="h-4 w-4" /> Upload (500x500)
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                  />
                </label>
                <p className="text-xs text-muted-foreground">A imagem precisa ter exatamente 500x500 pixels.</p>
              </div>
            </div>
          </Section>

          {/* Missões */}
          <Section
            title="Missões do desafio"
            description="Usuários que cumprem as 3 ações de uma rede social ganham +1 chance de palpite."
          >
            <div className="grid sm:grid-cols-2 gap-3">
              <MissionBlock icon={<Instagram className="h-4 w-4" />} name="Instagram" />
              <MissionBlock icon={<Facebook className="h-4 w-4" />} name="Facebook" />
              <MissionBlock icon={<Youtube className="h-4 w-4" />} name="YouTube" />
              <MissionBlock icon={<Music2 className="h-4 w-4" />} name="TikTok" />
            </div>
            <Field label="Link das redes sociais do desafio">
              <input placeholder="https://instagram.com/seu-perfil" className="input" />
            </Field>
          </Section>
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
          <div className="rounded-2xl glass-card p-5 space-y-3">
            <div className="text-xs uppercase tracking-wider font-bold text-gold">Resumo</div>
            <Row label="Custo de criação" value={`${COST} Tokens`} />
            <Row label="Sub-categorias" value={`${totalQuestions}/5`} />
            <Row label="Prêmio em tokens (auto)" value={`${AUTO_PRIZE.toLocaleString("pt-BR")} Tokens`} />
            <Row label="Recompensa total possível" value={`${maxReward} Tokens / usuário`} />
            <Row label="Visibilidade" value={isOpen ? "Aberto" : "Privado"} />
          </div>

          <div className="rounded-2xl glass-card p-5">
            <div className="text-xs uppercase tracking-wider font-bold text-gold mb-2">Dicas</div>
            <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1.5">
              <li>Use até 5 sub-categorias bem objetivas.</li>
              <li>Adicione missões para gerar mais palpites.</li>
              <li>Prêmio físico aumenta engajamento.</li>
              <li>Encerre antes do evento acontecer.</li>
            </ul>
          </div>

          <button type="submit" className="w-full h-12 rounded-xl bg-gradient-brand text-primary-foreground font-display font-black shadow-glow hover:scale-[1.01] transition">
            Publicar desafio • {COST} Tokens
          </button>
          <Link to="/" className="block text-center text-sm text-muted-foreground hover:text-foreground">
            Cancelar
          </Link>
        </aside>
      </form>

      <style>{`
        .input {
          width: 100%; height: 44px; padding: 0 12px;
          border-radius: 10px;
          background: color-mix(in oklab, var(--card) 70%, transparent);
          border: 1px solid var(--border);
          color: var(--foreground); font-size: 14px; outline: none;
        }
        textarea.input { height: auto; padding: 10px 12px; }
        .input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px color-mix(in oklab, var(--primary) 25%, transparent); }
      `}</style>
    </AppShell>
  );
}

function Section({ title, description, action, children }: { title: string; description?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl glass-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold tabular-nums">{value}</span>
    </div>
  );
}

function MissionBlock({ icon, name }: { icon: React.ReactNode; name: string }) {
  const [actions, setActions] = useState({ follow: true, like: true, comment: true });
  const toggle = (k: keyof typeof actions) => setActions({ ...actions, [k]: !actions[k] });
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="h-7 w-7 grid place-items-center rounded-md bg-primary/15 text-primary">{icon}</span>
        <span className="font-semibold text-sm">{name}</span>
        <span className="ml-auto text-[10px] text-gold font-bold">+1 palpite ao completar</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(["follow", "like", "comment"] as const).map((k) => (
          <button
            type="button"
            key={k}
            onClick={() => toggle(k)}
            className={`text-xs px-2.5 py-1 rounded-md border transition ${actions[k] ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
          >
            {k === "follow" ? "Seguir" : k === "like" ? "Curtir" : "Comentar"}
          </button>
        ))}
      </div>
    </div>
  );
}
