import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Plus, Trash2, Sparkles, Upload, Wand2, Calendar as CalIcon,
  Gift, Coins, Instagram, Facebook, Youtube, Music2, Globe, Lock,
  CheckCircle2, Share2, Copy, AlertCircle, UserPlus, Mail, Users, Loader2,
  PencilLine, MessageCircle, Download, ImageIcon, ShoppingBag, X,
  Linkedin, Twitter, Star, Heart, Check,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { CATEGORIES, CURRENT_USER, formatTokens } from "@/lib/mock-data";
import { PRODUCTS } from "@/lib/mock-extra";

import { generateInviteText } from "@/lib/invite.functions";
import { saveUserChallenge } from "@/lib/user-challenges";
import { improveTitle } from "@/lib/title-ai.functions";
import { listCategories, listSubcategories, type ChallengeCategory, type ChallengeSubcategory } from "@/lib/challenge-categories";
import { generateChallenge, improveDescription, generateWhatsAppInvite, generateTiebreaker, generateRegulation } from "@/lib/challenge-ai.functions";
import { sendChallengePublishedEmail } from "@/lib/challenge-emails.functions";
import { generatePrizeImage } from "@/lib/prize-image.functions";
import { createCorpChallenge, type CorporateMission } from "@/lib/corp-challenges.functions";
import { uploadCorpAsset, uploadCorpAssets } from "@/lib/corp-storage";
import logoAsset from "@/assets/logo-desafio.png.asset.json";
import { WORLD_CUP_MATCHES } from "@/lib/world-cup-matches";
import { ArtsWizard } from "@/components/ArtsWizard";
import { PrizesPicker, type PrizeSlot } from "@/components/PrizesPicker";
import { CitiesAutocomplete, type SelectedCity } from "@/components/CitiesAutocomplete";
import { CitiesScopePicker } from "@/components/CitiesScopePicker";
import type { AdminPrize } from "@/lib/admin-prizes.functions";

function getNextBrazilMatch() {
  const now = Date.now();
  const upcoming = WORLD_CUP_MATCHES
    .filter(m => (m.home === "Brasil" || m.away === "Brasil") && new Date(m.kickoff).getTime() > now)
    .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());
  return upcoming[0] ?? WORLD_CUP_MATCHES.find(m => m.home === "Brasil" || m.away === "Brasil")!;
}

function kickoffToLocalDateTime(kickoff: string): string {
  // kickoff is ISO with -03:00 offset, e.g. 2026-06-24T16:00:00-03:00
  // datetime-local expects YYYY-MM-DDTHH:mm
  const d = new Date(kickoff);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const Route = createFileRoute("/criar")({
  head: () => ({
    meta: [
      { title: "Cadastro de Desafio — Desafio dos Palpites" },
      { name: "description", content: "Crie seu desafio, escolha sub-categorias de palpites e ofereça prêmios." },
    ],
  }),
  component: () => <Criar />,
});

export { Criar };


type SubCat = {
  id: string;
  question: string;
  options: string[]; // up to MAX_OPTIONS
};

const COST = 100;
const REWARD_PER_HIT = 50;
const AUTO_PRIZE = 5000;
const MAX_OPTIONS = 10;
const MAX_SUBS = 10;
const BRAZIL_BONUS = 10000;


function uid() { return Math.random().toString(36).slice(2, 9); }

function buildCorporateMissions(data: MissionData, sponsorName: string): CorporateMission[] {
  const sponsor = sponsorName.trim() || "Empresa";
  const missions: CorporateMission[] = [];
  const instagram = data.instagram.trim();
  if (instagram) {
    missions.push({
      id: uid(),
      sponsorName: sponsor,
      platform: "instagram",
      actionType: "follow",
      title: `Seguir ${sponsor}`,
      link: instagram,
      tokens: 50,
    });
  }
  data.likeLinks.map((l) => l.trim()).filter(Boolean).forEach((link, index) => {
    missions.push({
      id: uid(),
      sponsorName: sponsor,
      platform: "instagram",
      actionType: "like_comment",
      title: `Curtir post ${index + 1}`,
      link,
      tokens: 50,
    });
  });
  Object.entries(data.extras).forEach(([platform, rawLink]) => {
    const link = rawLink.trim();
    if (!link) return;
    missions.push({
      id: uid(),
      sponsorName: sponsor,
      platform,
      actionType: platform === "youtube" ? "subscribe" : platform === "google" ? "review" : "follow",
      title: platform === "youtube" ? `Inscrever-se em ${sponsor}` : `Seguir ${sponsor}`,
      link,
      tokens: 50,
    });
  });
  return missions;
}

function Criar({ forCompany = false, bare = false }: { forCompany?: boolean; bare?: boolean } = {}) {
  const [isOpen, setIsOpen] = useState(true);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [subcategory, setSubcategory] = useState<string>("");
  const [dbCategories, setDbCategories] = useState<ChallengeCategory[]>([]);
  const [dbSubcategories, setDbSubcategories] = useState<ChallengeSubcategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  // Sempre que a tela de criação for aberta, rolar para o topo.
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, []);


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

  const [endsAt, setEndsAt] = useState(() => kickoffToLocalDateTime(getNextBrazilMatch().kickoff));
  const [prizeName, setPrizeName] = useState("");
  const [socialLink, setSocialLink] = useState("");
  const [missionStep, setMissionStep] = useState(0);
  const [missionData, setMissionData] = useState<MissionData>({
    instagram: "",
    likeCount: 4,
    likeLinks: ["", "", "", ""],
    extras: {},
    bonusChance: false,
  });
  const [subs, setSubs] = useState<SubCat[]>(() => {
    const next = getNextBrazilMatch();
    const adv = next.home === "Brasil" ? next.away : next.home;
    return [
      { id: uid(), question: `Quem ganha o jogo Brasil x ${adv}?`, options: ["Brasil", "Empate", adv] },
      { id: uid(), question: "Neymar vai jogar?", options: ["Sim", "Não"] },
    ];
  });
  const [prizeImg, setPrizeImg] = useState<string | null>(null);
  
  const [shopPrizeId, setShopPrizeId] = useState<string | null>(null);
  const [shopPickerOpen, setShopPickerOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  const [generating, setGenerating] = useState(false);
  const [improvingTitle, setImprovingTitle] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [winnerType, setWinnerType] = useState<"points" | "all" | "">("");
  const [published, setPublished] = useState<null | { id: string; name: string }>(null);
  const navigate = useNavigate();
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
  const generatePrizeImageFn = useServerFn(generatePrizeImage);
  const generateTiebreakerFn = useServerFn(generateTiebreaker);
  const generateRegulationFn = useServerFn(generateRegulation);
  const createCorpChallengeFn = useServerFn(createCorpChallenge);
  const sendPublishedEmailFn = useServerFn(sendChallengePublishedEmail);
  const [publishing, setPublishing] = useState(false);

  // Company-only assets & rules
  const [logoImg, setLogoImg] = useState<string | null>(null);
  const [bannerImg, setBannerImg] = useState<string | null>(null);
  const [instagramArts, setInstagramArts] = useState<string[]>([]);
  const [inviteRewardText, setInviteRewardText] = useState<string>(
    "Convide seus amigos para participar do desafio e ganhe mais créditos para fazer palpites! Os créditos serão validados somente quando seu amigo se cadastrar e fizer o palpite dele.",
  );
  const [tiebreaker, setTiebreaker] = useState<string>(
    `1. Maior número de acertos nos palpites registrados.\n\n2. Maior quantidade de missões concluídas na plataforma.\n\n3. Maior número de novos usuários convidados que realizaram o cadastro completo.\n\n4. Ordem cronológica de envio do palpite, premiando quem enviou primeiro.\n\n5. Sorteio eletrônico realizado pela organização do evento.`
  );
  const [tiebreakerLoading, setTiebreakerLoading] = useState(false);
  const [regulation, setRegulation] = useState<string>(() => {
    const next = getNextBrazilMatch();
    const adv = next.home === "Brasil" ? next.away : next.home;
    const matchLabel = `Brasil x ${adv}`;
    const kickoff = new Date(next.kickoff);
    const pad = (n: number) => String(n).padStart(2, "0");
    const dateLabel = `${pad(kickoff.getDate())}/${pad(kickoff.getMonth() + 1)}/${kickoff.getFullYear()}`;
    const timeLabel = `${pad(kickoff.getHours())}:${pad(kickoff.getMinutes())}`;
    return `REGULAMENTO OFICIAL DO DESAFIO DE PALPITES\n\n1. Do Objeto\n\nEste regulamento dispõe sobre as normas e condições de participação no desafio de palpites intitulado "${matchLabel}: Acerte os palpites e ganhe um prêmio imperdível!", doravante denominado simplesmente "Desafio", promovido pela empresa organizadora, no contexto da Copa do Mundo 2026.\n\n2. Da Participação\n\nA participação neste Desafio é voluntária e totalmente gratuita, não exigindo qualquer pagamento, aposta com dinheiro real ou compra de produtos para a inscrição. Podem participar pessoas físicas, residentes e domiciliadas em território nacional, com idade igual ou superior a 18 (dezoito) anos completos no ato da inscrição.\n\n3. Do Período\n\nO Desafio terá vigência até o dia ${dateLabel}. O prazo final e improrrogável para o registro de palpites na plataforma encerra-se às ${timeLabel} (horário de Brasília) do dia ${dateLabel}. Palpites enviados após este horário não serão computados.\n\n4. Da Mecânica\n\nPara participar, o usuário deverá acessar a plataforma oficial, realizar seu cadastro e registrar seus palpites para o evento esportivo especificado. A pontuação será atribuída de acordo com a exatidão das previsões registradas sobre o resultado da partida ${matchLabel}.\n\n5. Da Premiação\n\nO participante que obtiver o melhor desempenho, conforme os critérios de pontuação e desempate, fará jus ao prêmio anunciado pela empresa organizadora. O prêmio é pessoal, intransferível e não poderá ser convertido em dinheiro.\n\n6. Dos Critérios de Desempate\n\n6.1. Maior número de acertos nos palpites registrados.\n6.2. Maior quantidade de missões concluídas na plataforma.\n6.3. Maior número de novos usuários convidados que realizaram o cadastro completo através do link do participante.\n6.4. Ordem cronológica de envio do palpite, premiando aquele que registrou a previsão primeiro.\n6.5. Sorteio eletrônico realizado pela organização do evento.\n\n7. Das Disposições Gerais\n\nA plataforma Desafio dos Palpites atua única e exclusivamente como intermediadora tecnológica. A responsabilidade pela entrega da premiação é exclusiva da empresa organizadora.`;
  });

  const [regulationLoading, setRegulationLoading] = useState(false);
  const [companyName, setCompanyName] = useState<string>("");

  // Location & audience scope
  const [coverAllBrazil, setCoverAllBrazil] = useState(true);
  const [selectedCities, setSelectedCities] = useState<SelectedCity[]>([]);
  const [campaignCity, setCampaignCity] = useState("");
  const [campaignState, setCampaignState] = useState("");
  // Reach mode: "public" (everyone sees in feed) or "open" (only via link)
  const [reachMode, setReachMode] = useState<"public" | "open">("public");
  // Multi-prize picker
  const [prizesPickerOpen, setPrizesPickerOpen] = useState(false);
  const [prizeSlots, setPrizeSlots] = useState<PrizeSlot[]>([]);
  const [pickedPrizes, setPickedPrizes] = useState<AdminPrize[]>([]);
  // Acceptance
  const [acceptDisclaimer, setAcceptDisclaimer] = useState(false);
  const [authorizeMarketing, setAuthorizeMarketing] = useState(false);
  const [closedInfoSeen, setClosedInfoSeen] = useState(false);
  const [showClosedInfo, setShowClosedInfo] = useState(false);



  // AI Challenge Generator state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiTheme, setAiTheme] = useState("");
  const [aiCount, setAiCount] = useState(5);
  const [aiUseExistingSubs, setAiUseExistingSubs] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Auto-generated arts wizard
  const [autoArts, setAutoArts] = useState(false);
  const [artsWizardOpen, setArtsWizardOpen] = useState(false);

  // Inline AI generator (inside Sub-categorias section)
  const [inlineAiCount, setInlineAiCount] = useState(3);
  const [inlineAiFocus, setInlineAiFocus] = useState("");
  const [inlineAiLoading, setInlineAiLoading] = useState(false);
  const [inlineAiError, setInlineAiError] = useState<string | null>(null);

  const hasBrazilMatch = useMemo(
    () => subs.some(s => /\bbrasil\b/i.test(s.question)) || /\bbrasil\b/i.test(name),
    [subs, name],
  );

  const handleInlineGenerate = async () => {
    setInlineAiError(null);
    const want = Math.max(1, Number(inlineAiCount) || 1);
    setInlineAiLoading(true);
    try {
      const themeBase = (name.trim() || subcategory || category || "Desafio de palpites");
      const theme = inlineAiFocus.trim() ? `${themeBase} — foco: ${inlineAiFocus.trim()}` : themeBase;
      const result = await generateChallengeFn({
        data: {
          theme,
          category,
          subcategory: subcategory || undefined,
          userSubs: subs
            .map(s => ({ question: s.question.trim(), options: s.options.map(o => o.trim()).filter(Boolean) }))
            .filter(s => s.question.length > 0),
          count: subs.filter(s => s.question.trim()).length + want,
          prizeName: prizeName.trim() || undefined,
          endsAt: endsAt || undefined,
        },
      });
      const existingQs = new Set(subs.map(s => s.question.trim().toLowerCase()).filter(Boolean));
      const fresh = result.subs
        .filter(s => !existingQs.has(s.question.trim().toLowerCase()))
        .slice(0, want)
        .map(s => ({ id: uid(), question: s.question, options: s.options.slice(0, MAX_OPTIONS) }));
      setSubs(prev => {
        const out = [...prev];
        for (const ns of fresh) {
          const emptyIdx = out.findIndex(s => !s.question.trim());
          if (emptyIdx >= 0) out[emptyIdx] = ns;
          else out.push(ns);
        }
        return out;
      });
    } catch (err) {
      setInlineAiError(err instanceof Error ? err.message : "Não foi possível gerar agora.");
    } finally {
      setInlineAiLoading(false);
    }
  };


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
          options: s.options.slice(0, MAX_OPTIONS),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];
    if (!name.trim()) errs.push("Informe o nome do desafio.");
    if (!endsAt) errs.push("Defina a data e hora de encerramento.");
    if (subs.length === 0) errs.push("Adicione pelo menos 1 sub-categoria.");
    subs.forEach((s, i) => {
      if (!s.question.trim()) errs.push(`Pergunta vazia no palpite #${i + 1}.`);
      if (s.options.filter(o => o.trim()).length < 2) errs.push(`Palpite #${i + 1} precisa de pelo menos 2 opções preenchidas.`);
    });
    if (forCompany && !missionData.instagram.trim()) {
      errs.push("Cadastre o endereço do Instagram nas missões (obrigatório para empresas).");
    }
    if (!winnerType) errs.push("Escolha o critério de ganhador (maior pontuação ou acertar todas).");
    if (reachMode === "public" && !coverAllBrazil && selectedCities.length === 0) {
      errs.push("Selecione ao menos uma cidade, ou marque 'Brasil todo'.");
    }
    if (!acceptDisclaimer) {
      errs.push("Aceite o termo de que o Desafio dos Palpites não se responsabiliza pela entrega dos brindes.");
    }
    if (errs.length) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setErrors([]);
    setPublishing(true);
    const id = uid();
    const corporateMissions = forCompany ? buildCorporateMissions(missionData, companyName || name) : undefined;
    try {
      saveUserChallenge({
        id,
        name: name.trim(),
        category: category as never,
        endsAt,
        isOpen,
        subs,
        prizeName: prizeName.trim() || undefined,
        prizeImg,
        bannerImg,
        corporateMissions,
        reachMode,
        coverAllBrazil,
        city: coverAllBrazil ? undefined : (selectedCities[0]?.nome ?? undefined),
        state: coverAllBrazil ? undefined : (selectedCities[0]?.uf ?? undefined),
      });

      if (forCompany) {
        // Upload assets to Storage, then persist the challenge to the database
        // so it is visible on every device and shareable links work.
        const [logoUrl, bannerUrl, artsUrls] = await Promise.all([
          uploadCorpAsset(id, "logo", logoImg),
          uploadCorpAsset(id, "banner", bannerImg),
          uploadCorpAssets(id, instagramArts),
        ]);

        await createCorpChallengeFn({
          data: {
            id,
            title: name.trim(),
            companyName: companyName.trim() || undefined,
            category,
            subcategory: subcategory || undefined,
            description: subs
              .map((s, i) => `${i + 1}. ${s.question} — ${s.options.filter(Boolean).join(" / ")}`)
              .join("  •  "),
            subs,
            prizeName: prizeName.trim() || undefined,
            logoUrl: logoUrl ?? undefined,
            bannerUrl: bannerUrl ?? undefined,
            instagramArts: artsUrls,
            tiebreaker: tiebreaker || undefined,
            regulation: regulation || undefined,
            inviteRewardText: inviteRewardText || undefined,
            missions: corporateMissions,
            endsAt,
          },
        });

        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("ddp:corp-challenges-updated"));
        }
      }

      setPublished({ id, name: name.trim() });
      window.scrollTo({ top: 0, behavior: "smooth" });
      // Fire-and-forget: notifica o criador por e-mail com os dados do desafio publicado.
      try {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        void sendPublishedEmailFn({
          data: {
            challengeId: id,
            challengeName: name.trim(),
            category: category || undefined,
            endsAt: endsAt || undefined,
            prizeName: prizeName.trim() || undefined,
            visibility: isOpen ? "public" : "private",
            subs: subs.map((s) => ({
              question: s.question,
              options: s.options.filter(Boolean),
            })),
            inviteLink: origin ? `${origin}/previsao/${id}` : undefined,
          },
        });
      } catch {
        // não bloqueia a publicação
      }
      // Mantemos a tela de sucesso aberta para o usuário copiar o link de convite.
    } catch (err) {
      setErrors([
        err instanceof Error
          ? `Não foi possível publicar: ${err.message}`
          : "Não foi possível publicar o desafio.",
      ]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setPublishing(false);
    }
  };

  const addSub = () => {
    setSubs([...subs, { id: uid(), question: "", options: ["Sim", "Não"] }]);
  };
  const removeSub = (id: string) => setSubs(subs.filter(s => s.id !== id));
  const updateSub = (id: string, patch: Partial<SubCat>) =>
    setSubs(subs.map(s => s.id === id ? { ...s, ...patch } : s));
  const setOption = (id: string, i: number, v: string) =>
    setSubs(subs.map(s => s.id === id ? { ...s, options: s.options.map((o, x) => x === i ? v : o) } : s));
  const addOption = (id: string) =>
    setSubs(subs.map(s => s.id === id && s.options.length < MAX_OPTIONS ? { ...s, options: [...s.options, ""] } : s));
  const removeOption = (id: string, i: number) =>
    setSubs(subs.map(s => s.id === id && s.options.length > 2 ? { ...s, options: s.options.filter((_, x) => x !== i) } : s));


  const handleUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      // Auto-resize: center-crop to square, scale to 500x500, compress as JPEG.
      const size = 500;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setPrizeImg(url);
        return;
      }
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      // Fill with white for transparent PNGs converted to JPEG
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      // JPEG @ 0.85 keeps quality but drops file size dramatically vs PNG.
      const resized = canvas.toDataURL("image/jpeg", 0.85);
      setPrizeImg(resized);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      alert("Não foi possível ler a imagem. Tente um arquivo PNG ou JPG.");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const generatePrize = async () => {
    if (!name.trim() && !aiPrompt.trim()) {
      alert("Dê um nome ao desafio ou descreva o prêmio antes de gerar a imagem.");
      return;
    }
    setGenerating(true);
    try {
      const drawDate = endsAt
        ? new Date(endsAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
        : "";
      const { dataUrl } = await generatePrizeImageFn({
        data: {
          title: name.trim() || "Desafio dos Palpites",
          prize: prizeName.trim(),
          drawDate,
          extraPrompt: aiPrompt.trim(),
        },
      });
      setPrizeImg(dataUrl);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Não foi possível gerar a imagem.");
    } finally {
      setGenerating(false);
    }
  };

  const totalQuestions = subs.length;
  const maxReward = totalQuestions * REWARD_PER_HIT;

  const content = (
    <>
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-black flex items-center gap-3">
            <Sparkles className="h-7 w-7 text-primary" /> {forCompany ? "Cadastro de Desafio • Empresa" : "Cadastro de Desafio"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {forCompany
              ? "Monte o desafio da sua marca. As missões de redes sociais são obrigatórias."
              : "Monte seu desafio, escolha até 10 sub-categorias e defina o prêmio."}
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

          {/* Auto-arts toggle */}
          <div className="rounded-xl border border-gold/40 bg-gradient-to-br from-gold/10 via-card to-card p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoArts}
                onChange={(e) => {
                  setAutoArts(e.target.checked);
                  if (e.target.checked) setArtsWizardOpen(true);
                }}
                className="h-5 w-5 accent-gold mt-0.5"
              />
              <div className="flex-1">
                <div className="font-display font-black text-base flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-gold" /> Criar Artes do Desafio Automaticamente
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Gera 3 artes profissionais (feed, banner e story) em menos de 30 segundos com IA. Sem Canva, sem designer.
                </div>
                {autoArts && (
                  <button
                    type="button"
                    onClick={() => setArtsWizardOpen(true)}
                    className="mt-3 inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-gold text-gold-foreground text-sm font-bold"
                  >
                    <Wand2 className="h-4 w-4" /> Abrir assistente de artes
                  </button>
                )}
              </div>
            </label>
          </div>

          {/* Básico */}
          <div id="manual-section" />

          <Section
            step={1}
            title="Informações do desafio"
            description="Criar manualmente — preencha os campos abaixo. Você pode misturar com a IA acima."
          >
            {/* Nome do desafio — destacado */}
            <div className="relative rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-background to-gold/10 p-5 shadow-lg ring-1 ring-primary/20">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-black">01</span>
                  <label className="text-base sm:text-lg font-black uppercase tracking-wide text-foreground">
                    Nome do desafio
                  </label>
                </div>
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
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-gradient-to-r from-primary to-gold text-primary-foreground text-xs font-bold shadow disabled:opacity-50 disabled:cursor-not-allowed transition hover:opacity-90"
                >
                  {improvingTitle ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Melhorando…</>
                  ) : (
                    <><Sparkles className="h-3.5 w-3.5" /> Melhorar título com IA</>
                  )}
                </button>
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`Ex.: Brasil x ${(() => { const n = getNextBrazilMatch(); return n.home === "Brasil" ? n.away : n.home; })()} — Quem leva?`}
                className="w-full h-14 px-4 rounded-xl border-2 border-primary/30 bg-background text-lg sm:text-xl font-bold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Seja claro e direto — o nome aparece em destaque no feed e nos convites.
              </p>
            </div>

            {/* Selecione um Evento */}
            <EventQuickPicker
              category={category}
              onPick={(m) => {
                const adv = m.home === "Brasil" ? m.away : m.home === "Brasil" ? m.home : m.away;
                setName(`${m.home} x ${m.away} — Quem leva?`);
                setEndsAt(kickoffToLocalDateTime(m.kickoff));
                void adv;
              }}
            />
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

          <Section
            step={2}
            title={`Sub-categorias de palpites (${subs.length})`}
            description={`Crie quantas perguntas quiser, cada uma com até ${MAX_OPTIONS} opções. Cada acerto vale ${REWARD_PER_HIT} tokens.`}

            action={
              <button
                type="button"
                onClick={addSub}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary/15 text-primary border border-primary/30 text-sm font-semibold hover:bg-primary/20"
              >
                <Plus className="h-4 w-4" /> Nova sub-categoria
              </button>
            }
          >
            {/* Gerar palpites com IA — inline */}
            <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold">Gerar palpites com a IA</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-[7rem_1fr_auto] items-end">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] text-muted-foreground">Quantos palpites</span>
                  <input
                    type="number"
                    min={1}
                    value={inlineAiCount}
                    onChange={(e) => setInlineAiCount(Math.max(1, Number(e.target.value) || 1))}
                    className="input h-10 w-full"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] text-muted-foreground">Sobre o que devem ser os palpites?</span>
                  <input
                    type="text"
                    value={inlineAiFocus}
                    onChange={(e) => setInlineAiFocus(e.target.value)}
                    placeholder='Ex.: "placar do jogo, primeiro gol, cartões…"'
                    className="input h-10 w-full"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleInlineGenerate}
                  disabled={inlineAiLoading}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 disabled:opacity-50"
                >
                  {inlineAiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  {inlineAiLoading ? "Gerando…" : "Gerar com IA"}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Usa o tema, categoria, prêmio e o foco que você descrever acima.
              </p>
              {inlineAiError && (
                <div className="mt-2 text-xs text-destructive">{inlineAiError}</div>
              )}
            </div>


            {hasBrazilMatch && (
              <div className="mb-4 rounded-xl border border-gold/40 bg-gold/10 p-3 flex items-start gap-2.5">
                <Coins className="h-5 w-5 text-gold mt-0.5 shrink-0" />
                <div className="text-sm">
                  <div className="font-bold text-gold">Bônus Seleção Brasileira</div>
                  <div className="text-xs text-muted-foreground">
                    Quem acertar <span className="font-bold text-foreground">TODOS</span> os palpites de um jogo do Brasil ganha <span className="font-bold text-gold">{BRAZIL_BONUS.toLocaleString("pt-BR")} tokens</span> extras.
                  </div>
                </div>
              </div>
            )}

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
                    {s.options.length < MAX_OPTIONS && (
                      <button
                        type="button"
                        onClick={() => addOption(s.id)}
                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-primary hover:border-primary/60"
                      >
                        <Plus className="h-4 w-4" /> Adicionar opção ({s.options.length}/{MAX_OPTIONS})
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
                className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 text-primary text-sm font-bold hover:bg-primary/10 hover:border-primary/60 transition"
              >
                <Plus className="h-4 w-4" /> + mais Palpites ({subs.length})
              </button>
            </div>
          </Section>



          {/* Ganhador */}
          <Section
            step={3}
            title="Ganhador"
            description="Escolha como será definido o vencedor do desafio. Obrigatório selecionar uma opção."
          >
            <div className="space-y-3">
              <label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition ${winnerType === "points" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                <input
                  type="checkbox"
                  checked={winnerType === "points"}
                  onChange={() => setWinnerType("points")}
                  className="mt-1 h-5 w-5 accent-primary"
                />
                <div>
                  <div className="font-bold text-sm">Que mais fizer pontos</div>
                  <div className="text-xs text-muted-foreground">Ganha quem somar a maior pontuação total nos palpites.</div>
                </div>
              </label>
              <label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition ${winnerType === "all" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                <input
                  type="checkbox"
                  checked={winnerType === "all"}
                  onChange={() => setWinnerType("all")}
                  className="mt-1 h-5 w-5 accent-primary"
                />
                <div>
                  <div className="font-bold text-sm">Ganhador que acertar todas</div>
                  <div className="text-xs text-muted-foreground">Só leva o prêmio quem acertar 100% dos palpites do desafio.</div>
                </div>
              </label>
            </div>
          </Section>

          {/* Prêmio */}
          <Section
            step={4}
            title="Prêmio"
            description={`Automaticamente daremos ${AUTO_PRIZE.toLocaleString("pt-BR")} tokens para quem fizer a maior pontuação. Você pode somar seus próprios tokens, escolher um prêmio da nossa loja ou cadastrar um prêmio físico próprio.`}
          >

            {/* Comprar prêmio na loja */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 mb-4">
              <div className="flex items-start gap-3">
                <ShoppingBag className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm">Comprar prêmio da nossa loja virtual</div>
                  <div className="text-xs text-muted-foreground mb-2">
                    Escolha um produto do nosso catálogo. Cuidamos do envio direto ao vencedor — você só precisa pagar o valor em tokens.
                  </div>
                  {shopPrizeId ? (() => {
                    const p = PRODUCTS.find(x => x.id === shopPrizeId);
                    if (!p) return null;
                    return (
                      <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/60 p-2">
                        {p.image && <img src={p.image} alt={p.name} className="h-14 w-14 rounded-md object-cover" />}
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-sm truncate">{p.name}</div>
                          <div className="text-xs text-gold font-bold inline-flex items-center gap-1">
                            <Coins className="h-3 w-3" /> {formatTokens(p.cost)} tokens
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShopPickerOpen(true)}
                          className="h-9 px-3 rounded-lg border border-border text-xs font-semibold hover:border-primary hover:text-primary"
                        >
                          Trocar
                        </button>
                        <button
                          type="button"
                          onClick={() => setShopPrizeId(null)}
                          className="h-9 w-9 rounded-lg border border-border grid place-items-center text-muted-foreground hover:text-destructive hover:border-destructive/60"
                          aria-label="Remover prêmio da loja"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })() : (
                    <button
                      type="button"
                      onClick={() => setShopPickerOpen(true)}
                      className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary/15 text-primary border border-primary/40 text-sm font-bold hover:bg-primary/25"
                    >
                      <ShoppingBag className="h-4 w-4" /> Escolher prêmio na loja
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">Ou cadastre seu próprio prêmio físico</div>

            {/* Prêmios cadastrados (admin) — múltiplos sorteios */}
            <div className="rounded-xl border border-gold/40 bg-gold/5 p-4 mb-4">
              <div className="flex items-start gap-3">
                <Gift className="h-5 w-5 text-gold mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm">Sortear vários prêmios cadastrados</div>
                  <div className="text-xs text-muted-foreground mb-2">
                    Escolha de 1 a 10 prêmios já cadastrados pelo administrador e defina qual prêmio vai para cada posição (1º, 2º, 3º...).
                  </div>
                  {pickedPrizes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {prizeSlots.map((s) => {
                        const p = pickedPrizes.find((x) => x.id === s.prizeId);
                        return (
                          <span key={s.position} className="inline-flex items-center gap-1.5 pl-2 pr-3 py-1 rounded-full bg-background/80 border border-gold/40 text-xs">
                            <strong>{s.position}º</strong> {p?.name ?? "vazio"}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setPrizesPickerOpen(true)}
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-gold/15 text-gold border border-gold/40 text-sm font-bold hover:bg-gold/25"
                  >
                    <Gift className="h-4 w-4" /> {pickedPrizes.length > 0 ? "Editar prêmios" : "Selecionar prêmios"}
                  </button>
                </div>
              </div>
            </div>

            <Field label="Prêmio do desafio (opcional)">
              <input value={prizeName} onChange={(e) => setPrizeName(e.target.value)} placeholder="Ex.: 1 Camiseta do Brasil, Caixa de Cerveja…" className="input" />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1.5">Imagem do prêmio (proporção 4:5)</div>
                <div className="rounded-xl border border-dashed border-border/70 bg-background/40 p-4 aspect-[4/5] grid place-items-center overflow-hidden">
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
                  onClick={generatePrize}
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
                <p className="text-xs text-muted-foreground">Aceita qualquer tamanho — a imagem será redimensionada automaticamente para 500×500.</p>
              </div>
            </div>
          </Section>

          {/* Banner personalizado (para todos) */}
          <Section
            step={6}
            title="Banner do desafio (opcional)"
            description="Imagem horizontal exibida no topo do desafio. Recomendado 1600×600px (proporção 8:3) em JPG ou PNG."
          >
            <UploadCard
              label="Banner"
              hint="JPG/PNG 1600×600px — aparece no topo da página do desafio."
              image={bannerImg}
              onChange={setBannerImg}
              aspect="aspect-[8/3]"
            />
          </Section>


          {/* Missões */}
          <Section
            step={7}
            title="Cadastre as missões obrigatórias"
            description="Monte o passo a passo de missões. Cada missão concluída pelo usuário vale +50 tokens e +1 chance de palpite."
          >
            <MissionWizard
              step={missionStep}
              setStep={setMissionStep}
              data={missionData}
              setData={setMissionData}
              onComplete={(d) => setSocialLink(d.instagram)}
            />
          </Section>

          {forCompany && (
            <>
              {/* Identidade Visual */}
              <Section
                title="Identidade visual da empresa"
                description="Faça upload do logotipo. O banner do desafio fica na seção acima."
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <UploadCard
                    label="Logotipo"
                    hint="PNG quadrado, recomendado 512×512px (fundo transparente)"
                    image={logoImg}
                    onChange={setLogoImg}
                    aspect="aspect-square"
                  />
                </div>
                <Field label="Nome da empresa (aparece no regulamento)">
                  <input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ex.: Casa di Napoli Pizzaria"
                    className="input"
                  />
                </Field>
              </Section>

              {/* Artes para Instagram */}
              <Section
                title="Artes para divulgação no Instagram"
                description="Adicione imagens prontas (feed 1080×1080px ou story 1080×1920px) que os usuários poderão baixar e compartilhar."
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {instagramArts.map((art, idx) => (
                    <div key={idx} className="relative rounded-xl border border-border/60 bg-background/40 overflow-hidden aspect-square">
                      <img src={art} alt={`Arte ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setInstagramArts((a) => a.filter((_, i) => i !== idx))}
                        className="absolute top-2 right-2 h-8 w-8 rounded-lg bg-background/80 backdrop-blur grid place-items-center text-destructive hover:bg-background"
                        aria-label="Remover arte"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 grid place-items-center cursor-pointer hover:bg-primary/10 transition text-center text-xs text-primary font-semibold p-3">
                    <div>
                      <Upload className="h-6 w-6 mx-auto mb-1.5" />
                      Adicionar arte
                      <div className="text-[10px] text-muted-foreground mt-1">1080×1080 ou 1080×1920</div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []);
                        files.forEach((f) => {
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === "string") {
                              setInstagramArts((prev) => [...prev, reader.result as string]);
                            }
                          };
                          reader.readAsDataURL(f);
                        });
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Os participantes verão essas artes na página do desafio para download e compartilhamento.
                </p>
              </Section>

              {/* Convite com recompensa */}
              <Section
                title="Convite e recompensa de indicação"
                description="Texto que aparece para o usuário convidar amigos. Os créditos são liberados apenas quando o amigo se cadastrar e fizer o palpite."
              >
                <Field label="Mensagem de convite (editável)">
                  <textarea
                    value={inviteRewardText}
                    onChange={(e) => setInviteRewardText(e.target.value)}
                    rows={4}
                    className="input min-h-[100px] resize-y"
                    placeholder="Convide seus amigos e ganhe créditos extras…"
                  />
                </Field>
                <div className="flex items-start gap-2 text-xs text-muted-foreground rounded-lg bg-gold/5 border border-gold/30 p-3">
                  <Coins className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                  <span>Os créditos do organizador serão validados <strong>somente quando o amigo se cadastrar e fizer o palpite dele</strong>.</span>
                </div>
              </Section>

            </>
          )}

          {/* Critérios de desempate */}
          <Section
            title="Critérios de desempate"
            description="Altere e clique em Gerar novamente"
            action={
              <button
                type="button"
                onClick={async () => {
                  setTiebreakerLoading(true);
                  try {
                    const { text } = await generateTiebreakerFn({
                      data: {
                        base: tiebreaker.trim() || undefined,
                        challengeName: name.trim() || undefined,
                        category,
                      },
                    });
                    setTiebreaker(text);
                  } catch (err) {
                    alert(err instanceof Error ? err.message : "Não foi possível gerar agora.");
                  } finally {
                    setTiebreakerLoading(false);
                  }
                }}
                disabled={tiebreakerLoading}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary/15 text-primary border border-primary/30 text-sm font-semibold hover:bg-primary/20 disabled:opacity-50"
              >
                {tiebreakerLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                {tiebreakerLoading ? "Gerando…" : "Gerar pela IA"}
              </button>
            }
          >
            <textarea
              value={tiebreaker}
              onChange={(e) => setTiebreaker(e.target.value)}
              rows={5}
              placeholder="Ex.: 1) Maior número de acertos. 2) Quem palpitou primeiro. 3) Sorteio."
              className="input min-h-[120px] resize-y"
            />
          </Section>

          {/* Regulamento */}
          <Section
            title="Regulamento da promoção"
            description="Verifique o texto e aprove. Será exibido para o usuário antes de cada palpite, com aceite obrigatório."
            action={
              <button
                type="button"
                onClick={async () => {
                  if (!name.trim()) {
                    alert("Informe o nome do desafio antes de gerar o regulamento.");
                    return;
                  }
                  setRegulationLoading(true);
                  try {
                    const { text } = await generateRegulationFn({
                      data: {
                        companyName: companyName.trim() || undefined,
                        challengeName: name.trim(),
                        category,
                        prizeName: prizeName.trim() || undefined,
                        endsAt: endsAt || undefined,
                        tiebreaker: tiebreaker.trim() || undefined,
                      },
                    });
                    setRegulation(text);
                  } catch (err) {
                    alert(err instanceof Error ? err.message : "Não foi possível gerar agora.");
                  } finally {
                    setRegulationLoading(false);
                  }
                }}
                disabled={regulationLoading}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary/15 text-primary border border-primary/30 text-sm font-semibold hover:bg-primary/20 disabled:opacity-50"
              >
                {regulationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                {regulationLoading ? "Gerando…" : "Gerar regulamento com IA"}
              </button>
            }
          >
            <textarea
              value={regulation}
              onChange={(e) => setRegulation(e.target.value)}
              rows={12}
              placeholder="Clique em 'Gerar regulamento com IA' e revise o texto. Você pode editar livremente."
              className="input min-h-[280px] resize-y font-mono text-xs leading-relaxed"
            />
            <div className="flex items-start gap-2 text-xs text-muted-foreground rounded-lg bg-primary/5 border border-primary/20 p-3">
              <AlertCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>Quando o usuário for fazer um palpite, este regulamento aparecerá em tela cheia com as opções <strong>Aceito</strong> ou <strong>Não aceito</strong>. Sem aceite, o palpite não é registrado.</span>
            </div>
          </Section>

          {/* Link de convite (preview) */}
          <Section
            step={8}
            title="Link para convidar seus amigos"
            description="Este é o link que será gerado automaticamente quando você publicar. Compartilhe com seus amigos para chamarem para palpitar."
          >
            <div className="rounded-xl glass-card p-3 flex items-center gap-2">
              <Share2 className="h-4 w-4 text-gold shrink-0" />
              <input
                readOnly
                value="https://www.desafiodospalpites.com.br/previsao/[gerado-ao-publicar]"
                className="flex-1 bg-transparent text-sm outline-none truncate text-muted-foreground"
              />
              <span className="text-[10px] uppercase tracking-wider font-bold text-primary bg-primary/10 border border-primary/30 rounded-full px-2 py-1">
                Pré-visualização
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Assim que o desafio for publicado, o link ficará ativo e você poderá copiar e enviar no WhatsApp, Instagram ou e-mail.
            </p>
          </Section>

          {/* Divulgação: aberto/fechado + cidades + termos */}
          <Section
            title="Divulgação e responsabilidades"
            description="Defina quem encontra seu desafio, em quais cidades ele vale e aceite os termos."
          >
            <div className="space-y-3">
              <label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition ${reachMode === "public" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                <input
                  type="radio"
                  name="reach-mode"
                  checked={reachMode === "public"}
                  onChange={() => setReachMode("public")}
                  className="mt-1 h-5 w-5 accent-primary"
                />
                <div>
                  <div className="font-bold text-sm flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Desafio Aberto (público)</div>
                  <div className="text-xs text-muted-foreground">Aparece na home e no feed para todo mundo encontrar.</div>
                </div>
              </label>
              <label
                className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition ${reachMode === "open" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                onClick={() => { if (reachMode !== "open") setShowClosedInfo(true); }}
              >
                <input
                  type="radio"
                  name="reach-mode"
                  checked={reachMode === "open"}
                  onChange={() => { setReachMode("open"); setShowClosedInfo(true); }}
                  className="mt-1 h-5 w-5 accent-primary"
                />
                <div>
                  <div className="font-bold text-sm flex items-center gap-2"><Lock className="h-4 w-4 text-primary" /> Desafio Fechado (apenas pelo link)</div>
                  <div className="text-xs text-muted-foreground">Só quem receber o link de convite consegue participar.</div>
                </div>
              </label>
            </div>

            {reachMode === "public" && (
              <>
                <div className="mt-4 space-y-3">
                  <label className="flex items-center gap-3 rounded-xl border border-border p-3 cursor-pointer hover:border-primary/50 transition">
                    <input
                      type="checkbox"
                      checked={coverAllBrazil}
                      onChange={(e) => { setCoverAllBrazil(e.target.checked); if (e.target.checked) setSelectedCities([]); }}
                      className="h-5 w-5 accent-primary"
                    />
                    <div>
                      <div className="font-bold text-sm">Brasil todo</div>
                      <div className="text-xs text-muted-foreground">A campanha vale para qualquer cidade do país.</div>
                    </div>
                  </label>
                  {!coverAllBrazil && (
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Aberto apenas para as cidades selecionadas</div>
                      <CitiesScopePicker value={selectedCities} onChange={setSelectedCities} />
                    </div>
                  )}
                </div>
                <label className="mt-4 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={authorizeMarketing}
                    onChange={(e) => setAuthorizeMarketing(e.target.checked)}
                    className="mt-0.5 h-5 w-5 accent-primary"
                  />
                  <span className="text-sm">
                    Autorizo o <strong>Desafio dos Palpites</strong> a divulgar meu desafio por e-mail marketing, Instagram e demais redes sociais.
                  </span>
                </label>
              </>
            )}

            <label className="mt-4 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptDisclaimer}
                onChange={(e) => setAcceptDisclaimer(e.target.checked)}
                className="mt-0.5 h-5 w-5 accent-primary"
              />
              <span className="text-sm">
                Estou ciente de que <strong>O Desafio dos Palpites não se responsabiliza pela entrega dos brindes</strong> aqui cadastrados.
              </span>
            </label>
          </Section>

        </div>




        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
          <div className="rounded-2xl glass-card p-5 space-y-3">
            <div className="text-xs uppercase tracking-wider font-bold text-gold">Resumo</div>
            <Row label="Custo de criação" value={`${COST} Tokens`} />
            <Row label="Sub-categorias" value={`${totalQuestions}/${MAX_SUBS}`} />
            <Row label="Prêmio em tokens (auto)" value={`${AUTO_PRIZE.toLocaleString("pt-BR")} Tokens`} />
            <Row label="Recompensa total possível" value={`${maxReward} Tokens / usuário`} />
            <Row label="Visibilidade" value={isOpen ? "Aberto" : "Privado"} />
          </div>

          <div className="rounded-2xl glass-card p-5">
            <div className="text-xs uppercase tracking-wider font-bold text-gold mb-2">Dicas</div>
            <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1.5">
              <li>Use até 10 sub-categorias bem objetivas.</li>
              
              <li>Prêmio físico aumenta engajamento.</li>
              <li>Encerre antes do evento acontecer.</li>
            </ul>
          </div>

          <button type="submit" disabled={publishing} className="w-full h-12 rounded-xl bg-gradient-brand text-primary-foreground font-display font-black shadow-glow hover:scale-[1.01] transition disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2">
            {publishing ? (<><Loader2 className="h-4 w-4 animate-spin" /> Publicando…</>) : (<>Publicar desafio • {COST} Tokens</>)}
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

      {/* Picker de prêmio da loja */}
      {shopPickerOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4"
          onClick={() => setShopPickerOpen(false)}
        >
          <div
            className="relative w-full max-w-3xl max-h-[85vh] rounded-2xl border border-border bg-card shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <h3 className="font-display font-black text-lg">Escolher prêmio da loja</h3>
              </div>
              <button
                type="button"
                onClick={() => setShopPickerOpen(false)}
                className="h-9 w-9 rounded-lg grid place-items-center hover:bg-muted"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PRODUCTS.map((p) => {
                const selected = shopPrizeId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setShopPrizeId(p.id); setShopPickerOpen(false); }}
                    className={`text-left rounded-xl border bg-background/60 overflow-hidden hover:border-primary transition ${selected ? "border-primary ring-2 ring-primary/40" : "border-border/60"}`}
                  >
                    {p.image && <img src={p.image} alt={p.name} className="w-full aspect-square object-cover" />}
                    <div className="p-2">
                      <div className="text-xs font-bold line-clamp-2 leading-tight">{p.name}</div>
                      <div className="mt-1 text-xs text-gold font-bold inline-flex items-center gap-1">
                        <Coins className="h-3 w-3" /> {formatTokens(p.cost)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {artsWizardOpen && (
        <ArtsWizard
          initialName={name}
          initialPrize={prizeName}
          initialDeadline={endsAt}
          sponsorName={companyName}
          onClose={() => setArtsWizardOpen(false)}
          onApply={(result) => {
            if (result.feed) setPrizeImg(result.feed);
            if (result.banner) setBannerImg(result.banner);
            if (result.story) setInstagramArts((prev) => [...prev, result.story!]);
          }}
        />
      )}
      <PrizesPicker
        open={prizesPickerOpen}
        initialSlots={prizeSlots}
        onClose={() => setPrizesPickerOpen(false)}
        onConfirm={(slots, prizes) => {
          setPrizeSlots(slots);
          setPickedPrizes(slots.map((s) => prizes.find((p) => p.id === s.prizeId)!).filter(Boolean));
          // bind first prize as the main prize image (4:5) if user has none
          const firstPrize = prizes.find((p) => p.id === slots[0]?.prizeId);
          if (firstPrize?.image_url && !prizeImg) setPrizeImg(firstPrize.image_url);
          if (firstPrize?.name && !prizeName) setPrizeName(firstPrize.name);
          setPrizesPickerOpen(false);
        }}
      />
      {showClosedInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => { setShowClosedInfo(false); setClosedInfoSeen(true); }} />
          <div className="relative max-w-md glass-card rounded-2xl p-6 border border-amber-500/40">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display font-black text-lg">Desafio Fechado</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Você escolheu manter o desafio <strong>apenas pelo link</strong>. Isso significa que <strong>você é responsável por divulgar o convite</strong> aos seus amigos, parentes e contatos. O Desafio dos Palpites não exibirá esse desafio publicamente.
                </p>
                <button
                  type="button"
                  onClick={() => { setShowClosedInfo(false); setClosedInfoSeen(true); }}
                  className="mt-4 h-10 px-5 rounded-full bg-gradient-brand text-primary-foreground font-bold text-sm shadow-glow"
                >
                  Entendi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return bare ? <div>{content}</div> : <AppShell>{content}</AppShell>;


}

function Section({ title, description, action, children, step }: { title: string; description?: string; action?: React.ReactNode; children: React.ReactNode; step?: number }) {
  return (
    <section className="rounded-2xl glass-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {typeof step === "number" && (
            <span
              aria-hidden
              className="shrink-0 mt-0.5 h-9 w-9 rounded-full bg-gradient-brand text-primary-foreground font-display font-black text-base grid place-items-center shadow-glow ring-2 ring-primary/30"
            >
              {step}
            </span>
          )}
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold">{title}</h2>
            {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({ label, action, children }: { label: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="block">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground">{label}</div>
        {action}
      </div>
      {children}
    </div>
  );
}

function UploadCard({
  label,
  hint,
  image,
  onChange,
  aspect = "aspect-square",
}: {
  label: string;
  hint: string;
  image: string | null;
  onChange: (v: string | null) => void;
  aspect?: string;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1.5">{label}</div>
      <div className={`relative rounded-xl border border-dashed border-border/70 bg-background/40 ${aspect} overflow-hidden grid place-items-center`}>
        {image ? (
          <>
            <img src={image} alt={label} className="w-full h-full object-contain" />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute top-2 right-2 h-8 w-8 rounded-lg bg-background/80 backdrop-blur grid place-items-center text-destructive hover:bg-background"
              aria-label="Remover"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        ) : (
          <label className="w-full h-full grid place-items-center cursor-pointer text-center text-muted-foreground text-xs hover:text-primary">
            <div>
              <Upload className="h-7 w-7 mx-auto mb-1.5 text-gold" />
              Clique para enviar
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = () => {
                  if (typeof reader.result === "string") onChange(reader.result);
                };
                reader.readAsDataURL(f);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground mt-1.5">{hint}</p>
    </div>
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

type MissionData = {
  instagram: string;
  likeCount: number;
  likeLinks: string[];
  extras: Record<string, string>;
  bonusChance: boolean;
};

const EXTRA_SOCIALS: Array<{ key: string; label: string; icon: React.ReactNode; placeholder: string }> = [
  { key: "facebook", label: "Facebook", icon: <Facebook className="h-4 w-4" />, placeholder: "https://www.facebook.com/sua-pagina" },
  { key: "youtube", label: "YouTube", icon: <Youtube className="h-4 w-4" />, placeholder: "https://www.youtube.com/@seu-canal" },
  { key: "tiktok", label: "TikTok", icon: <Music2 className="h-4 w-4" />, placeholder: "https://www.tiktok.com/@seu-perfil" },
  { key: "google", label: "Avaliação no Google Meu Negócio", icon: <Star className="h-4 w-4" />, placeholder: "https://g.page/r/..." },
  { key: "twitter", label: "Twitter / X", icon: <Twitter className="h-4 w-4" />, placeholder: "https://twitter.com/seu-perfil" },
  { key: "linkedin", label: "LinkedIn", icon: <Linkedin className="h-4 w-4" />, placeholder: "https://www.linkedin.com/company/sua-empresa" },
];

const WIZARD_STEPS = ["Instagram", "Curtidas", "Outras redes", "Bônus"] as const;

function MissionWizard({
  step,
  setStep,
  data,
  setData,
  onComplete,
}: {
  step: number;
  setStep: (n: number) => void;
  data: MissionData;
  setData: React.Dispatch<React.SetStateAction<MissionData>>;
  onComplete: (data: MissionData) => void;
}) {
  const total = WIZARD_STEPS.length;
  const done = step >= total;

  const goNext = () => {
    const nextStep = step + 1;
    if (nextStep >= total) {
      setStep(total);
      onComplete(data);
    } else {
      setStep(nextStep);
    }
  };

  const setLikeCount = (n: number) => {
    const clamped = Math.max(1, Math.min(10, n));
    setData((prev) => {
      const arr = prev.likeLinks.slice(0, clamped);
      while (arr.length < clamped) arr.push("");
      return { ...prev, likeCount: clamped, likeLinks: arr };
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5">
        {WIZARD_STEPS.map((s, i) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${i < step ? "bg-primary" : i === step ? "bg-primary/60" : "bg-border"}`} />
        ))}
      </div>

      <div className="rounded-xl border border-gold/30 bg-gold/5 p-3 flex items-start gap-2 text-xs">
        <Coins className="h-4 w-4 text-gold mt-0.5 shrink-0" />
        <span><span className="text-gold font-bold">Cada missão vale 50 tokens</span> e dá +1 chance de palpite ao usuário.</span>
      </div>

      {!done && (
        <div className="rounded-xl border border-border/60 bg-background/40 p-4 space-y-3">
          <div className="text-xs text-muted-foreground">Passo {step + 1} de {total} • {WIZARD_STEPS[step]}</div>

          {step === 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 grid place-items-center rounded-md bg-primary/15 text-primary"><Instagram className="h-4 w-4" /></span>
                <div className="font-semibold text-sm">Qual é o endereço do seu Instagram?</div>
              </div>
              <input
                value={data.instagram}
                onChange={(e) => setData((p) => ({ ...p, instagram: e.target.value }))}
                placeholder="https://www.instagram.com/casadinapoli/"
                className="input"
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground">Cole o endereço completo do perfil (com https://).</p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 grid place-items-center rounded-md bg-primary/15 text-primary"><Heart className="h-4 w-4" /></span>
                <div className="font-semibold text-sm">Quais links você gostaria que curtissem?</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Número de links:</span>
                <button type="button" onClick={() => setLikeCount(data.likeCount - 1)} className="h-8 w-8 rounded-md border border-border font-bold">−</button>
                <span className="w-10 text-center font-display font-bold">{String(data.likeCount).padStart(2, "0")}</span>
                <button type="button" onClick={() => setLikeCount(data.likeCount + 1)} className="h-8 w-8 rounded-md border border-border font-bold">+</button>
              </div>
              <div className="space-y-2">
                {data.likeLinks.map((link, i) => (
                  <input
                    key={i}
                    value={link}
                    onChange={(e) => setData((p) => {
                      const arr = [...p.likeLinks];
                      arr[i] = e.target.value;
                      return { ...p, likeLinks: arr };
                    })}
                    placeholder={`Link ${i + 1} — https://www.instagram.com/.../p/...`}
                    className="input"
                  />
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 grid place-items-center rounded-md bg-primary/15 text-primary"><Globe className="h-4 w-4" /></span>
                <div className="font-semibold text-sm">Gostaria de cadastrar outras redes sociais?</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {EXTRA_SOCIALS.map((s) => {
                  const checked = s.key in data.extras;
                  return (
                    <label key={s.key} className={`flex items-center gap-2 rounded-lg border p-2 cursor-pointer text-sm ${checked ? "border-primary bg-primary/5" : "border-border"}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setData((p) => {
                          const extras = { ...p.extras };
                          if (e.target.checked) extras[s.key] = extras[s.key] ?? "";
                          else delete extras[s.key];
                          return { ...p, extras };
                        })}
                        className="accent-primary"
                      />
                      <span className="h-7 w-7 grid place-items-center rounded-md bg-primary/15 text-primary">{s.icon}</span>
                      <span className="font-semibold flex-1">{s.label}</span>
                      {checked && <Check className="h-4 w-4 text-primary" />}
                    </label>
                  );
                })}
              </div>
              {Object.keys(data.extras).length > 0 && (
                <div className="space-y-2 pt-1">
                  {EXTRA_SOCIALS.filter((s) => s.key in data.extras).map((s) => (
                    <div key={s.key} className="space-y-1">
                      <label className="text-xs font-semibold flex items-center gap-1.5">{s.icon} {s.label}</label>
                      <input
                        value={data.extras[s.key] || ""}
                        onChange={(e) => setData((p) => ({ ...p, extras: { ...p.extras, [s.key]: e.target.value } }))}
                        placeholder={s.placeholder}
                        className="input"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 grid place-items-center rounded-md bg-gold/15 text-gold"><Sparkles className="h-4 w-4" /></span>
                <div className="font-semibold text-sm">Dar uma chance extra para quem completar todas as missões?</div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setData((p) => ({ ...p, bonusChance: true }))}
                  className={`flex-1 h-11 rounded-lg border text-sm font-bold ${data.bonusChance ? "border-primary bg-primary/15 text-primary" : "border-border"}`}
                >
                  Sim, dar +1 chance extra
                </button>
                <button
                  type="button"
                  onClick={() => setData((p) => ({ ...p, bonusChance: false }))}
                  className={`flex-1 h-11 rounded-lg border text-sm font-bold ${!data.bonusChance ? "border-primary bg-primary/15 text-primary" : "border-border"}`}
                >
                  Não, obrigado
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="h-10 px-4 rounded-lg border border-border text-sm font-semibold disabled:opacity-40"
            >
              Voltar
            </button>
            <button type="button" onClick={goNext} className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              {step + 1 === total ? "Concluir" : "Próximo"}
            </button>
          </div>
        </div>
      )}

      {done && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3 text-xs">
          <div className="font-semibold text-sm text-primary">Missões cadastradas ✓</div>
          <div className="flex items-start gap-2"><Instagram className="h-4 w-4 text-primary mt-0.5" /><div><div className="font-semibold">Instagram</div><div className="text-muted-foreground truncate">{data.instagram || <em>não informado</em>}</div></div></div>
          <div className="flex items-start gap-2"><Heart className="h-4 w-4 text-primary mt-0.5" /><div><div className="font-semibold">{data.likeCount} link(s) para curtir</div><ul className="text-muted-foreground list-disc list-inside">{data.likeLinks.filter(Boolean).map((l, i) => <li key={i} className="truncate">{l}</li>)}</ul></div></div>
          {Object.keys(data.extras).length > 0 && (
            <div className="flex items-start gap-2"><Globe className="h-4 w-4 text-primary mt-0.5" /><div><div className="font-semibold">Outras redes</div><ul className="text-muted-foreground">{EXTRA_SOCIALS.filter((s) => s.key in data.extras).map((s) => <li key={s.key}>{s.label}: {data.extras[s.key] || <em>—</em>}</li>)}</ul></div></div>
          )}
          <div className="flex items-center gap-2 pt-1">
            <Sparkles className="h-4 w-4 text-gold" />
            <span className="font-semibold">Chance extra:</span>
            <span className="text-muted-foreground">{data.bonusChance ? "Sim — +1 chance ao completar todas" : "Não"}</span>
          </div>
          <button type="button" onClick={() => setStep(0)} className="h-9 px-3 rounded-lg border border-border text-xs font-semibold">
            Editar missões
          </button>
        </div>
      )}
    </div>
  );
}


function PublishedSuccess({ name, id, onCreateAnother }: { name: string; id: string; onCreateAnother: () => void }) {
  const [copied, setCopied] = useState(false);
  const PUBLIC_DOMAIN = "https://www.desafiodospalpites.com.br";
  const link = `${PUBLIC_DOMAIN}/previsao/${id}`;
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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Falha ao carregar imagem"));
    img.src = src;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = w;
      if (lines.length === maxLines - 1) break;
    } else {
      current = test;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && words.length > lines.join(" ").split(/\s+/).length) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\s+\S*$/, "") + "…";
  }
  return lines;
}

async function renderCreative(
  canvas: HTMLCanvasElement | null,
  data: {
    name: string;
    category: string;
    prizeName?: string;
    autoPrize: number;
    description?: string;
    inviter?: string;
    logoUrl: string;
  },
): Promise<string> {
  if (!canvas) throw new Error("Canvas indisponível");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Contexto 2D indisponível");
  const W = canvas.width, H = canvas.height;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#0a1f12");
  grad.addColorStop(0.5, "#0f3d22");
  grad.addColorStop(1, "#031309");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Glow accents
  const glow = ctx.createRadialGradient(W * 0.85, H * 0.15, 20, W * 0.85, H * 0.15, 600);
  glow.addColorStop(0, "rgba(34,197,94,0.45)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Border
  ctx.strokeStyle = "rgba(34,197,94,0.6)";
  ctx.lineWidth = 6;
  ctx.strokeRect(24, 24, W - 48, H - 48);

  // Logo
  try {
    const logo = await loadImage(data.logoUrl);
    const logoH = 140;
    const logoW = (logo.width / logo.height) * logoH;
    ctx.drawImage(logo, 70, 70, logoW, logoH);
  } catch {
    ctx.fillStyle = "#22c55e";
    ctx.font = "bold 56px system-ui, sans-serif";
    ctx.fillText("DESAFIO DOS PALPITES", 70, 140);
  }

  // Category chip
  ctx.fillStyle = "rgba(250,204,21,0.18)";
  ctx.strokeStyle = "#facc15";
  ctx.lineWidth = 2;
  const chip = data.category.toUpperCase();
  ctx.font = "bold 28px system-ui, sans-serif";
  const cw = ctx.measureText(chip).width + 40;
  ctx.beginPath();
  const cx = 70, cy = 260, ch = 56, r = 14;
  ctx.moveTo(cx + r, cy);
  ctx.arcTo(cx + cw, cy, cx + cw, cy + ch, r);
  ctx.arcTo(cx + cw, cy + ch, cx, cy + ch, r);
  ctx.arcTo(cx, cy + ch, cx, cy, r);
  ctx.arcTo(cx, cy, cx + cw, cy, r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#facc15";
  ctx.textBaseline = "middle";
  ctx.fillText(chip, cx + 20, cy + ch / 2);

  // Title
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 80px system-ui, sans-serif";
  ctx.textBaseline = "top";
  const titleLines = wrapText(ctx, data.name, W - 140, 3);
  let y = 360;
  for (const line of titleLines) {
    ctx.fillText(line, 70, y);
    y += 92;
  }

  // Description
  if (data.description) {
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "400 36px system-ui, sans-serif";
    const descLines = wrapText(ctx, data.description, W - 140, 4);
    y += 20;
    for (const line of descLines) {
      ctx.fillText(line, 70, y);
      y += 50;
    }
  }

  // Prize box (bottom)
  const boxY = H - 280;
  ctx.fillStyle = "rgba(34,197,94,0.12)";
  ctx.strokeStyle = "#22c55e";
  ctx.lineWidth = 3;
  ctx.beginPath();
  const bx = 70, bw = W - 140, bh = 180, br = 20;
  ctx.moveTo(bx + br, boxY);
  ctx.arcTo(bx + bw, boxY, bx + bw, boxY + bh, br);
  ctx.arcTo(bx + bw, boxY + bh, bx, boxY + bh, br);
  ctx.arcTo(bx, boxY + bh, bx, boxY, br);
  ctx.arcTo(bx, boxY, bx + bw, boxY, br);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#facc15";
  ctx.font = "bold 28px system-ui, sans-serif";
  ctx.fillText("PRÊMIO", bx + 30, boxY + 24);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 56px system-ui, sans-serif";
  const prizeLabel = data.prizeName
    ? `${data.prizeName} + ${data.autoPrize.toLocaleString("pt-BR")} tokens`
    : `${data.autoPrize.toLocaleString("pt-BR")} tokens para o líder`;
  const prizeLines = wrapText(ctx, prizeLabel, bw - 60, 2);
  let py = boxY + 60;
  for (const line of prizeLines) {
    ctx.fillText(line, bx + 30, py);
    py += 60;
  }

  // Footer CTA
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "bold 32px system-ui, sans-serif";
  const cta = data.inviter ? `${data.inviter} te convidou — participe grátis!` : "Participe grátis — só tokens, sem dinheiro real";
  ctx.textAlign = "center";
  ctx.fillText(cta, W / 2, H - 70);
  ctx.textAlign = "start";

  return canvas.toDataURL("image/png");
}

// ----- Event Quick Picker (next 48h) -----
function EventQuickPicker({ category, onPick }: { category: string; onPick: (m: typeof WORLD_CUP_MATCHES[number]) => void }) {
  const isFootball = /futebol|copa|esporte/i.test(category);
  const now = Date.now();
  const horizon = now + 48 * 60 * 60 * 1000;
  const in48h = WORLD_CUP_MATCHES
    .filter(m => {
      const t = new Date(m.kickoff).getTime();
      return t >= now && t <= horizon;
    })
    .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());
  const fallback = WORLD_CUP_MATCHES
    .filter(m => new Date(m.kickoff).getTime() >= now)
    .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime())
    .slice(0, 6);
  const list = in48h.length ? in48h : fallback;
  const labelHeader = in48h.length ? "Eventos terminando em até 48h" : "Próximos eventos";

  if (!isFootball || list.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/40 p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-foreground text-[10px] font-black">02</span>
          <span className="text-sm font-bold">Selecione um Evento</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Nenhum evento próximo para a categoria <b>{category}</b>. Você pode preencher o nome do desafio livremente acima.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-card p-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-black">02</span>
          <span className="text-sm font-bold">Selecione um Evento</span>
          <span className="text-xs text-muted-foreground">({category})</span>
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">{labelHeader}</span>
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {list.map((m) => {
          const d = new Date(m.kickoff);
          const pad = (n: number) => String(n).padStart(2, "0");
          const when = `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onPick(m)}
              className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-background hover:border-primary hover:bg-primary/5 px-3 py-2 text-left transition"
            >
              <div className="flex items-center gap-2 min-w-0">
                <img src={`https://flagcdn.com/24x18/${m.homeCode}.png`} alt="" className="h-3 w-4 object-cover rounded-sm" />
                <span className="text-sm font-bold truncate">{m.home} x {m.away}</span>
                <img src={`https://flagcdn.com/24x18/${m.awayCode}.png`} alt="" className="h-3 w-4 object-cover rounded-sm" />
              </div>
              <span className="text-[11px] font-bold text-muted-foreground group-hover:text-primary whitespace-nowrap">{when}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
