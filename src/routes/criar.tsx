import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Plus, Trash2, Sparkles, Upload, Wand2, Calendar as CalIcon,
  Gift, Coins, Instagram, Facebook, Youtube, Music2, Globe, Lock,
  CheckCircle2, Share2, Copy, AlertCircle, UserPlus, Mail, Users, Loader2,
  PencilLine, MessageCircle, Download, ImageIcon,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { CATEGORIES } from "@/lib/mock-data";
import { generateInviteText } from "@/lib/invite.functions";
import { saveUserChallenge } from "@/lib/user-challenges";
import { improveTitle } from "@/lib/title-ai.functions";
import { listCategories, listSubcategories, type ChallengeCategory, type ChallengeSubcategory } from "@/lib/challenge-categories";
import { generateChallenge, improveDescription, generateWhatsAppInvite } from "@/lib/challenge-ai.functions";
import logoAsset from "@/assets/logo-desafio.png.asset.json";

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
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [subcategory, setSubcategory] = useState<string>("");
  const [dbCategories, setDbCategories] = useState<ChallengeCategory[]>([]);
  const [dbSubcategories, setDbSubcategories] = useState<ChallengeSubcategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listCategories(), listSubcategories()])
      .then(([c, s]) => {
        if (cancelled) return;
        setDbCategories(c);
        setDbSubcategories(s);
        if (c.length && !c.some(x => x.name === category)) setCategory(c[0].name);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingCats(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentCategoryId = useMemo(
    () => dbCategories.find(c => c.name === category)?.id ?? null,
    [dbCategories, category],
  );
  const availableSubs = useMemo(
    () => dbSubcategories.filter(s => s.category_id === currentCategoryId),
    [dbSubcategories, currentCategoryId],
  );

  useEffect(() => {
    if (!availableSubs.some(s => s.name === subcategory)) setSubcategory("");
  }, [availableSubs, subcategory]);

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
  const [improvingTitle, setImprovingTitle] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [published, setPublished] = useState<null | { id: string; name: string }>(null);
  const [friends, setFriends] = useState<{ id: string; name: string; email: string }[]>([
    { id: uid(), name: "", email: "" },
  ]);
  const addFriend = () => setFriends([...friends, { id: uid(), name: "", email: "" }]);
  const removeFriend = (id: string) => setFriends(friends.filter(f => f.id !== id));
  const updateFriend = (id: string, patch: Partial<{ name: string; email: string }>) =>
    setFriends(friends.map(f => f.id === id ? { ...f, ...patch } : f));

  const [inviteText, setInviteText] = useState("");
  const [inviterName, setInviterName] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [bulkEmails, setBulkEmails] = useState("");
  const [privateDescription, setPrivateDescription] = useState("");
  const [improvingDesc, setImprovingDesc] = useState(false);
  const [whatsText, setWhatsText] = useState("");
  const [whatsLoading, setWhatsLoading] = useState(false);
  const [whatsCopied, setWhatsCopied] = useState(false);
  const [creativeUrl, setCreativeUrl] = useState<string | null>(null);
  const [creatingCreative, setCreatingCreative] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const generateInvite = useServerFn(generateInviteText);
  const improveTitleFn = useServerFn(improveTitle);
  const generateChallengeFn = useServerFn(generateChallenge);
  const improveDescriptionFn = useServerFn(improveDescription);
  const generateWhatsFn = useServerFn(generateWhatsAppInvite);

  // AI Challenge Generator state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiTheme, setAiTheme] = useState("");
  const [aiCount, setAiCount] = useState(5);
  const [aiUseExistingSubs, setAiUseExistingSubs] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleGenerateChallenge = async () => {
    setAiError(null);
    if (!aiTheme.trim()) {
      setAiError("Descreva o tema do desafio.");
      return;
    }
    setAiLoading(true);
    try {
      const userSubs = aiUseExistingSubs
        ? subs
            .map((s) => ({
              question: s.question.trim(),
              options: s.options.map((o) => o.trim()).filter(Boolean),
            }))
            .filter((s) => s.question.length > 0)
        : [];
      const result = await generateChallengeFn({
        data: {
          theme: aiTheme.trim(),
          category,
          subcategory: subcategory || undefined,
          userSubs: userSubs.length ? userSubs : undefined,
          count: aiCount,
          prizeName: prizeName.trim() || undefined,
          endsAt: endsAt || undefined,
        },
      });
      if (result.name) setName(result.name);
      setSubs(
        result.subs.map((s) => ({
          id: uid(),
          question: s.question,
          options: s.options.slice(0, 3),
        })),
      );
      // mantém a janela aberta para o usuário revisar; ele fecha manualmente.
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Não foi possível gerar agora.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateInvite = async () => {
    setGenError(null);
    if (!inviterName.trim()) {
      setGenError("Informe seu nome (quem está convidando) antes de gerar o texto.");
      return;
    }
    if (!name.trim()) {
      setGenError("Dê um nome ao desafio antes de gerar o texto do convite.");
      return;
    }
    setGenLoading(true);
    try {
      const palpites = subs
        .map(s => {
          const opts = s.options.filter(o => o.trim());
          if (!s.question.trim() || opts.length < 2) return "";
          return `${s.question.trim()} (${opts.join(" / ")})`;
        })
        .filter(Boolean);
      const { text } = await generateInvite({
        data: { inviterName: inviterName.trim(), challengeName: name.trim(), palpites },
      });
      setInviteText(text);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Não foi possível gerar o texto agora.");
    } finally {
      setGenLoading(false);
    }
  };

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
    saveUserChallenge({
      id,
      name: name.trim(),
      category: category as never,
      endsAt,
      isOpen,
      subs,
      prizeName: prizeName.trim() || undefined,
      prizeImg,
    });
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

      {published ? (
        <PublishedSuccess
          name={published.name}
          id={published.id}
          onCreateAnother={() => {
            setPublished(null);
            setName("");
            setPrizeName("");
            setEndsAt("");
            setSubs([{ id: uid(), question: "", options: ["Sim", "Não"] }]);
            setPrizeImg(null);
            setAiPrompt("");
          }}
        />
      ) : (
      <>
      {errors.length > 0 && (
        <div className="mb-5 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
          <div className="flex items-center gap-2 text-destructive font-bold mb-1">
            <AlertCircle className="h-4 w-4" /> Corrija para publicar
          </div>
          <ul className="text-sm text-destructive/90 list-disc pl-5 space-y-0.5">
            {errors.map((er, i) => <li key={i}>{er}</li>)}
          </ul>
        </div>
      )}

      <form className="grid lg:grid-cols-[1fr_360px] gap-6" onSubmit={handleSubmit}>
        <div className="space-y-5">
          {/* Gerador IA */}
          <div className="rounded-xl border border-primary/40 bg-gradient-to-br from-primary/10 via-card to-card overflow-hidden">
            <button
              type="button"
              onClick={() => setAiOpen((v) => !v)}
              className="w-full flex items-center justify-between gap-3 p-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/20 grid place-items-center text-primary">
                  <Wand2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-display font-black text-base">Gere seu desafio com a IA</div>
                  <div className="text-xs text-muted-foreground">
                    Conte o tema, cadastre alguns palpites (opcional) ou peça para a IA criar tudo.
                  </div>
                </div>
              </div>
              <span className={`text-primary text-sm font-bold transition ${aiOpen ? "rotate-180" : ""}`}>▾</span>
            </button>

            {aiOpen && (
              <div className="px-4 pb-4 space-y-3 border-t border-primary/20 pt-4">
                <Field label="Tema do desafio">
                  <textarea
                    value={aiTheme}
                    onChange={(e) => setAiTheme(e.target.value)}
                    rows={3}
                    placeholder="Ex.: Final da Copa do Mundo 2026 — Brasil x Argentina, polêmicas de arbitragem e gols."
                    className="input min-h-[80px] resize-y"
                  />
                </Field>

                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Quantidade total de palpites">
                    <select
                      value={aiCount}
                      onChange={(e) => setAiCount(Number(e.target.value))}
                      className="input"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>{n} palpite{n > 1 ? "s" : ""}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Aproveitar palpites já cadastrados">
                    <label className="flex items-center gap-2 h-11 px-3 rounded-lg border border-border bg-card cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aiUseExistingSubs}
                        onChange={(e) => setAiUseExistingSubs(e.target.checked)}
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="text-sm">Manter meus palpites e completar o restante</span>
                    </label>
                  </Field>
                </div>

                <p className="text-xs text-muted-foreground">
                  A IA usará categoria, sub-categoria, prêmio e data já preenchidos como contexto. Você pode editar tudo depois.
                </p>

                {aiError && (
                  <div className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> {aiError}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateChallenge}
                    disabled={aiLoading || !aiTheme.trim()}
                    className="inline-flex items-center gap-2 h-11 px-4 rounded-lg bg-gradient-brand text-primary-foreground font-bold shadow-glow disabled:opacity-50"
                  >
                    {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {aiLoading ? "Gerando…" : "Gerar desafio com IA"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAiOpen(false);
                      document.getElementById("manual-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className="h-11 px-4 rounded-lg border border-primary/40 bg-primary/10 text-primary text-sm font-bold inline-flex items-center gap-1.5"
                  >
                    <PencilLine className="h-4 w-4" /> Criar manualmente
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiOpen(false)}
                    className="h-11 px-4 rounded-lg border border-border text-sm font-semibold"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Básico */}
          <div id="manual-section" />
          <Section
            title="Informações do desafio"
            description="Criar manualmente — preencha os campos abaixo. Você pode misturar com a IA acima."
          >
            <Field
              label="Nome do desafio"
              action={
                <button
                  type="button"
                  onClick={async () => {
                    if (!name.trim()) return;
                    setImprovingTitle(true);
                    try {
                      const result = await improveTitleFn({ data: { title: name.trim(), category } });
                      setName(result.title);
                    } catch (err) {
                      alert(err instanceof Error ? err.message : "Não foi possível melhorar o título agora.");
                    } finally {
                      setImprovingTitle(false);
                    }
                  }}
                  disabled={improvingTitle || !name.trim()}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {improvingTitle ? (
                    <><Loader2 className="h-3 w-3 animate-spin" /> Melhorando…</>
                  ) : (
                    <><Sparkles className="h-3 w-3" /> Melhorar o título</>
                  )}
                </button>
              }
            >
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Brasil x Haiti — Quem leva?" className="input" />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Categoria">
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="input" disabled={loadingCats}>
                  {dbCategories.length > 0
                    ? dbCategories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)
                    : CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Fim do desafio">
                <div className="relative">
                  <input value={endsAt} onChange={(e) => setEndsAt(e.target.value)} type="datetime-local" className="input pr-9" />
                  <CalIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </Field>
            </div>
            {availableSubs.length > 0 && (
              <Field
                label="Sub-categoria"
                action={
                  <Link to="/admin/categorias" className="text-xs font-bold text-primary hover:text-primary/80">
                    + Cadastrar
                  </Link>
                }
              >
                <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)} className="input">
                  <option value="">Selecione uma sub-categoria…</option>
                  {availableSubs.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </Field>
            )}
            <Field label="Visibilidade">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(true)}
                  className={`flex-1 h-11 rounded-lg border inline-flex items-center justify-center gap-2 text-sm font-semibold transition ${isOpen ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                >
                  <Globe className="h-4 w-4" /> Desafio Aberto
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className={`flex-1 h-11 rounded-lg border inline-flex items-center justify-center gap-2 text-sm font-semibold transition ${!isOpen ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                >
                  <Lock className="h-4 w-4" /> Desafio Fechado (apenas convidados)
                </button>
              </div>
            </Field>
            {!isOpen && (
              <Field
                label="Descrição do desafio fechado"
                action={
                  <button
                    type="button"
                    onClick={async () => {
                      if (!privateDescription.trim()) return;
                      setImprovingDesc(true);
                      try {
                        const { text } = await improveDescriptionFn({
                          data: { text: privateDescription.trim(), context: name.trim() || undefined },
                        });
                        setPrivateDescription(text);
                      } catch (err) {
                        alert(err instanceof Error ? err.message : "Não foi possível melhorar agora.");
                      } finally {
                        setImprovingDesc(false);
                      }
                    }}
                    disabled={improvingDesc || !privateDescription.trim()}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 disabled:opacity-50"
                  >
                    {improvingDesc ? (<><Loader2 className="h-3 w-3 animate-spin" /> Melhorando…</>) : (<><Sparkles className="h-3 w-3" /> Melhorar com IA</>)}
                  </button>
                }
              >
                <textarea
                  value={privateDescription}
                  onChange={(e) => setPrivateDescription(e.target.value)}
                  rows={3}
                  placeholder="Conte para seus convidados do que se trata o desafio, quem está participando e o que está em jogo."
                  className="input min-h-[88px] resize-y"
                />
              </Field>
            )}
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

              <button
                type="button"
                onClick={addSub}
                disabled={subs.length >= 5}
                className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 text-primary text-sm font-bold hover:bg-primary/10 hover:border-primary/60 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <Plus className="h-4 w-4" /> + mais Palpites {subs.length >= 5 ? "(máx. 5)" : `(${subs.length}/5)`}
              </button>
            </div>
          </Section>

          {/* Prêmio */}
          <Section
            title="Prêmio"
            description={`Automaticamente daremos ${AUTO_PRIZE.toLocaleString("pt-BR")} tokens para quem fizer a maior pontuação. Você pode adicionar um prêmio físico extra (opcional).`}
          >
            <Field label="Nome do prêmio extra (opcional)">
              <input value={prizeName} onChange={(e) => setPrizeName(e.target.value)} placeholder="Ex.: 1 Camiseta do Brasil" className="input" />
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
              <input value={socialLink} onChange={(e) => setSocialLink(e.target.value)} placeholder="https://instagram.com/seu-perfil" className="input" />
            </Field>
          </Section>


          {/* Convide Amigos */}
          <Section
            title="Convide amigos"
            description="Cada amigo cadastrado = 100 tokens para você. Se ele criar um Desafio, vocês dois ganham +100 tokens cada. Convide quantos amigos quiser e aumente suas chances de ganhar prêmios."
          >
            <div className="rounded-xl border border-gold/30 bg-gold/5 p-3 mb-3 flex items-start gap-2.5">
              <Users className="h-4 w-4 text-gold mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                <span className="text-gold font-bold">+100 tokens</span> por amigo cadastrado ·{" "}
                <span className="text-gold font-bold">+100 tokens</span> para cada um quando seu amigo criar um desafio.
              </p>
            </div>

            <div className="space-y-2">
              {friends.map((f, idx) => (
                <div key={f.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-stretch">
                  <input
                    value={f.name}
                    onChange={(e) => updateFriend(f.id, { name: e.target.value })}
                    placeholder={`Nome do amigo #${idx + 1}`}
                    className="input"
                  />
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="email"
                      value={f.email}
                      onChange={(e) => updateFriend(f.id, { email: e.target.value })}
                      placeholder="email@exemplo.com"
                      className="input pl-9"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFriend(f.id)}
                    disabled={friends.length <= 1}
                    className="h-11 w-11 rounded-lg border border-border/60 grid place-items-center text-muted-foreground hover:text-destructive hover:border-destructive/60 disabled:opacity-40 justify-self-end"
                    aria-label="Remover amigo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addFriend}
                className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 text-primary text-sm font-bold hover:bg-primary/10 hover:border-primary/60 transition"
              >
                <UserPlus className="h-4 w-4" /> + convide mais amigos
              </button>
            </div>

            <div className="mt-5 pt-5 border-t border-border/40 space-y-3">
              <Field label="Seu nome (quem está convidando)">
                <input
                  value={inviterName}
                  onChange={(e) => setInviterName(e.target.value)}
                  placeholder="Ex.: João Silva"
                  className="input"
                />
              </Field>

              <div className="flex items-center justify-between gap-2">
                <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                  Texto do e-mail de convite
                </label>
                <button
                  type="button"
                  onClick={handleGenerateInvite}
                  disabled={genLoading}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-gradient-to-r from-primary to-gold text-background text-xs font-bold hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {genLoading ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Gerando…</>
                  ) : (
                    <><Wand2 className="h-3.5 w-3.5" /> Gerar com IA</>
                  )}
                </button>
              </div>

              <textarea
                value={inviteText}
                onChange={(e) => setInviteText(e.target.value)}
                rows={8}
                placeholder="Escreva aqui o texto do e-mail de convite, ou clique em &quot;Gerar com IA&quot; para criar automaticamente um convite com o nome do desafio e os palpites."
                className="input min-h-[180px] resize-y leading-relaxed"
              />

              {genError && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{genError}</span>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                A IA usa seu nome, o nome do desafio e os palpites cadastrados para escrever um convite pronto para enviar.
              </p>
            </div>
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
      </>
      )}
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

function Field({ label, action, children }: { label: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground">{label}</div>
        {action}
      </div>
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

function PublishedSuccess({ name, id, onCreateAnother }: { name: string; id: string; onCreateAnother: () => void }) {
  const [copied, setCopied] = useState(false);
  const link = typeof window !== "undefined" ? `${window.location.origin}/previsao/${id}` : `/previsao/${id}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };
  return (
    <div className="max-w-2xl mx-auto text-center py-10">
      <div className="mx-auto h-20 w-20 rounded-full bg-primary/15 grid place-items-center mb-5 shadow-glow">
        <CheckCircle2 className="h-10 w-10 text-primary" />
      </div>
      <h1 className="font-display text-3xl font-black mb-2">Desafio publicado!</h1>
      <p className="text-muted-foreground mb-6">
        <span className="text-foreground font-semibold">"{name}"</span> está no ar. 100 Tokens foram debitados da sua carteira.
      </p>
      <div className="rounded-2xl glass-card p-4 flex items-center gap-2 mb-6">
        <Share2 className="h-4 w-4 text-gold shrink-0" />
        <input readOnly value={link} className="flex-1 bg-transparent text-sm outline-none truncate" />
        <button onClick={copy} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary/15 text-primary border border-primary/30 text-sm font-semibold hover:bg-primary/20">
          <Copy className="h-4 w-4" /> {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link to="/desafios" className="h-11 px-5 rounded-xl bg-gradient-brand text-primary-foreground font-display font-bold inline-flex items-center shadow-glow">
          Ver desafios
        </Link>
        <button onClick={onCreateAnother} className="h-11 px-5 rounded-xl border border-border font-semibold inline-flex items-center hover:border-primary hover:text-primary">
          Criar outro
        </button>
      </div>
    </div>
  );
}
