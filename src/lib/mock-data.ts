export type Category =
  | "Copa do Mundo 2026"
  | "Futebol"
  | "Política"
  | "Economia"
  | "Tecnologia"
  | "Inteligência Artificial"
  | "Ciência"
  | "Alienígenas"
  | "Conspirações"
  | "Entretenimento"
  | "Brasil"
  | "Mundo"
  | "Palpites Malucos da Copa"
  | "Desafios Diamante";

export const CATEGORIES: Category[] = [
  "Copa do Mundo 2026",
  "Desafios Diamante",
  "Palpites Malucos da Copa",
  "Futebol",
  "Política",
  "Economia",
  "Tecnologia",
  "Inteligência Artificial",
  "Ciência",
  "Alienígenas",
  "Conspirações",
  "Entretenimento",
  "Brasil",
  "Mundo",
];

import { USERS, LEVELS, type User } from "@/lib/mock-users";
export { USERS, LEVELS, type User };

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}



export const CURRENT_USER: User = {
  id: "me",
  username: "Você",
  city: "São Paulo",
  state: "SP",
  level: "Explorador",
  tokens: 1000,
  acertos: 3,
  erros: 1,
  followers: 12,
  following: 8,
  avatar: `https://api.dicebear.com/9.x/thumbs/svg?seed=voce&backgroundColor=ff6a00`,
};

export type PredictionOption = {
  id: string;
  label: string;
  pool: number; // tokens em palpites
};

export type SubPrediction = {
  id: string;
  question: string;
  options: string[];
  answer?: string;
};

export type MatchInfo = {
  home: string;
  away: string;
  homeFlag: string;
  awayFlag: string;
  kickoff: string;
  group: string;
};

export type PrizeTier = { hits: number; tokens: number };

export type Prediction = {
  id: string;
  title: string;
  description: string;
  category: Category;
  author: User;
  createdAt: string;
  closesAt: string;
  minTokens: number;
  options: PredictionOption[];
  bettors: number;
  comments: number;
  likes: number;
  shares: number;
  tags: string[];
  hot?: boolean;
  match?: MatchInfo;
  subPredictions?: SubPrediction[];
  entryFee?: number;
  prizeTiers?: PrizeTier[];
  imageUrl?: string;
  corporateMissions?: Array<{
    id: string;
    sponsorName: string;
    platform: string;
    actionType: string;
    title: string;
    link: string;
    tokens: number;
  }>;
};

const COPA_LOUCA = [
  "Vai acontecer um gol contra?",
  "Vai ter cartão vermelho?",
  "Vai ter invasão de campo?",
  "Vai ter pênalti?",
  "Vai ter gol de falta?",
  "Vai ter gol nos acréscimos?",
  "Vai ter mais de 10 escanteios?",
  "Vai ter goleada?",
  "Vai ter hat-trick?",
  "Vai ter jogador lesionado?",
  "Vai ter briga entre jogadores?",
  "Vai ter discussão com o árbitro?",
  "Vai ter revisão do VAR?",
  "Vai ter gol anulado?",
  "Vai ter comemoração polêmica?",
  "Vai ter torcedor famoso nas arquibancadas?",
  "Vai ter chuva durante a partida?",
  "Vai ter gol de cabeça?",
  "Vai ter gol do meio campo?",
  "Vai ter gol de bicicleta?",
  "Vai ter jogador expulso?",
  "Vai ter defesa de pênalti?",
  "Vai ter mais de 5 cartões?",
  "Vai ter gol antes dos 10 minutos?",
  "Vai ter gol após os 85 minutos?",
  "Vai ter prorrogação?",
  "Vai ter disputa por pênaltis?",
  "Vai ter zebra?",
  "Vai ter empate?",
  "Vai ter virada?",
  "Vai ter gol olímpico?",
  "Vai ter invasão de mascote?",
  "Vai ter problema técnico no VAR?",
  "Vai ter mais de 30 finalizações?",
  "Vai ter gol nos dois tempos?",
  "Vai ter dois gols do mesmo jogador?",
  "Vai ter gol de fora da área?",
  "Vai ter assistência de goleiro?",
  "Vai ter substituição antes dos 15 minutos?",
];

const OUTROS: { title: string; category: Category; desc: string }[] = [
  { title: "IA vai superar humanos em raciocínio matemático até 2027?", category: "Inteligência Artificial", desc: "Algum modelo público vai resolver problemas nível olimpíada com 95%+ até dez/2027?" },
  { title: "Bitcoin vai passar de US$ 200 mil em 2026?", category: "Economia", desc: "Cotação de fechamento em qualquer dia de 2026 acima de 200k USD." },
  { title: "Vão revelar oficialmente contato com vida extraterrestre?", category: "Alienígenas", desc: "Governo de qualquer país do G20 confirma oficialmente até 2027." },
  { title: "Brasil vai ser campeão da Copa do Mundo 2026?", category: "Copa do Mundo 2026", desc: "A Seleção levanta o hexa em julho de 2026." },
  { title: "SpaceX vai pousar humanos em Marte até 2030?", category: "Tecnologia", desc: "Pouso tripulado confirmado por agência espacial." },
  { title: "Vai chover no dia da final da Copa?", category: "Palpites Malucos da Copa", desc: "Precipitação registrada no estádio durante a final." },
  { title: "Algum filme brasileiro vai ganhar o Oscar de Melhor Filme?", category: "Entretenimento", desc: "Até a cerimônia de 2027." },
  { title: "Eleições 2026: vai ter segundo turno presidencial?", category: "Política", desc: "Definição em segundo turno em outubro de 2026." },
];

function daysFromNow(d: number) {
  const date = new Date();
  date.setDate(date.getDate() + d);
  return date.toISOString();
}

function makeOptions(seed: number, labels: string[]): PredictionOption[] {
  const rnd = seededRandom(seed);
  return labels.map((label, i) => ({
    id: `o${i}`,
    label,
    pool: Math.floor(rnd() * 80000) + 5000,
  }));
}

const predictions: Prediction[] = [];

OUTROS.forEach((o, i) => {
  predictions.push({
    id: `p${i + 1}`,
    title: o.title,
    description: o.desc,
    category: o.category,
    author: USERS[i % USERS.length],
    createdAt: daysFromNow(-Math.floor(Math.random() * 5) - 1),
    closesAt: daysFromNow(Math.floor(Math.random() * 30) + 5),
    minTokens: [10, 25, 50, 100][i % 4],
    options: makeOptions(i + 10, ["Sim", "Não"]),
    bettors: Math.floor(Math.random() * 2400) + 80,
    comments: Math.floor(Math.random() * 320),
    likes: Math.floor(Math.random() * 1800),
    shares: Math.floor(Math.random() * 400),
    tags: [o.category.toLowerCase()],
    hot: i < 3,
  });
});

COPA_LOUCA.forEach((title, i) => {
  predictions.push({
    id: `cl${i + 1}`,
    title,
    description: "Palpite maluco para os jogos da Copa do Mundo 2026. Aposte com seus amigos!",
    category: "Palpites Malucos da Copa",
    author: USERS[i % USERS.length],
    createdAt: daysFromNow(-(i % 7) - 1),
    closesAt: daysFromNow((i % 25) + 3),
    minTokens: 10,
    options: makeOptions(i + 100, ["Sim", "Não"]),
    bettors: Math.floor(seededRandom(i + 50)() * 1800) + 40,
    comments: Math.floor(seededRandom(i + 60)() * 220),
    likes: Math.floor(seededRandom(i + 70)() * 1500),
    shares: Math.floor(seededRandom(i + 80)() * 350),
    tags: ["copa", "maluco", "2026"],
    hot: i < 6,
  });
});

import { WORLD_CUP_CHALLENGES } from "@/lib/world-cup-matches";
import { PALPITES_MALUCOS } from "@/lib/palpites-malucos";
import { DESAFIOS_DIAMANTE } from "@/lib/desafios-diamante";

predictions.unshift(...WORLD_CUP_CHALLENGES);
predictions.unshift(...PALPITES_MALUCOS);
predictions.unshift(...DESAFIOS_DIAMANTE);

export const PREDICTIONS = predictions;

export function getPrediction(id: string) {
  const found = PREDICTIONS.find((p) => p.id === id);
  if (found) return found;
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem("ddp:user-challenges");
      if (raw) {
        const arr = JSON.parse(raw) as Prediction[];
        return Array.isArray(arr) ? arr.find((p) => p.id === id) : undefined;
      }
    } catch {
      // ignore
    }
  }
  return undefined;
}

export const MISSIONS: { id: string; title: string; reward: number; icon: string }[] = [
  { id: "m1", title: "Curtir Instagram", reward: 10, icon: "instagram" },
  { id: "m2", title: "Curtir Facebook", reward: 10, icon: "facebook" },
  { id: "m3", title: "Curtir vídeo no YouTube", reward: 50, icon: "youtube" },
  { id: "m4", title: "Comentar vídeo no YouTube", reward: 50, icon: "youtube" },
  { id: "m5", title: "Seguir Instagram", reward: 100, icon: "instagram" },
  { id: "m6", title: "Seguir YouTube", reward: 100, icon: "youtube" },
  { id: "m7", title: "Seguir TikTok", reward: 100, icon: "music" },
  { id: "m8", title: "Seguir Facebook", reward: 100, icon: "facebook" },
  { id: "m9", title: "Compartilhar conteúdo", reward: 50, icon: "share-2" },
  { id: "m10", title: "Convidar um amigo", reward: 100, icon: "user-plus" },
  { id: "m11", title: "Login diário", reward: 20, icon: "calendar" },
];

import aPrimeirosPassos from "@/assets/achievements/a-primeiros-passos.png.asset.json";
import aPrimeiroAcerto from "@/assets/achievements/a-primeiro-acerto.png.asset.json";
import a10Vitorias from "@/assets/achievements/a-10-vitorias.png.asset.json";
import a100Palpites from "@/assets/achievements/a-100-palpites.png.asset.json";
import aCheckins from "@/assets/achievements/a-checkins.png.asset.json";
import aMestre from "@/assets/achievements/a-mestre-palpites.png.asset.json";
import aPrecisao from "@/assets/achievements/a-precisao-total.png.asset.json";
import aCriador from "@/assets/achievements/a-criador.png.asset.json";
import aInfluenciador from "@/assets/achievements/a-influenciador.png.asset.json";
import aDesafioSucesso from "@/assets/achievements/a-desafio-sucesso.png.asset.json";
import aRankingMensal from "@/assets/achievements/a-ranking-mensal.png.asset.json";
import aEliteCopa from "@/assets/achievements/a-elite-copa.png.asset.json";
import aTop10Geral from "@/assets/achievements/a-top10-geral.png.asset.json";
import aRei from "@/assets/achievements/a-rei.png.asset.json";

export type Achievement = {
  id: string;
  title: string;
  desc: string;
  reward: number;
  image: string;
  tier: "bronze" | "silver" | "gold" | "diamond" | "legendary";
  unlocked: boolean;
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: "primeiros-passos", title: "Primeiros Passos", desc: "Criar o primeiro desafio", reward: 50, image: aPrimeirosPassos.url, tier: "bronze", unlocked: true },
  { id: "primeiro-acerto", title: "Primeiro Acerto", desc: "Acertar o primeiro palpite", reward: 50, image: aPrimeiroAcerto.url, tier: "bronze", unlocked: true },
  { id: "10-vitorias", title: "10 Vitórias", desc: "Vencer 10 desafios", reward: 300, image: a10Vitorias.url, tier: "bronze", unlocked: false },
  { id: "100-palpites", title: "100 Palpites", desc: "Fazer 100 palpites", reward: 250, image: a100Palpites.url, tier: "silver", unlocked: false },
  { id: "checkins", title: "30 Check-ins", desc: "Fazer 30 check-ins", reward: 250, image: aCheckins.url, tier: "silver", unlocked: false },
  { id: "mestre-palpites", title: "Mestre dos Palpites", desc: "Acertar 50 palpites", reward: 500, image: aMestre.url, tier: "silver", unlocked: false },
  { id: "precisao-total", title: "Precisão Total", desc: "Acertar 10 palpites consecutivos", reward: 750, image: aPrecisao.url, tier: "gold", unlocked: false },
  { id: "criador", title: "Criador de Desafios", desc: "Criar 100 desafios", reward: 500, image: aCriador.url, tier: "gold", unlocked: false },
  { id: "influenciador", title: "Influenciador", desc: "Convidar 100 amigos cadastrados", reward: 1000, image: aInfluenciador.url, tier: "gold", unlocked: false },
  { id: "desafio-sucesso", title: "Desafio de Sucesso", desc: "Criar 1 desafio com mais de 100 participantes", reward: 1000, image: aDesafioSucesso.url, tier: "silver", unlocked: false },
  { id: "ranking-mensal", title: "Ranking Mensal", desc: "Ficar entre o Top 100 do mês", reward: 500, image: aRankingMensal.url, tier: "silver", unlocked: false },
  { id: "elite-copa", title: "Elite da Copa", desc: "Top 10 dos palpites da Copa do Mundo", reward: 2000, image: aEliteCopa.url, tier: "gold", unlocked: false },
  { id: "top10-geral", title: "Top 10 Geral", desc: "Entrar no Top 10 do ranking geral", reward: 3000, image: aTop10Geral.url, tier: "diamond", unlocked: false },
  { id: "rei", title: "Rei dos Palpites", desc: "Terminar uma temporada em 1º lugar", reward: 5000, image: aRei.url, tier: "legendary", unlocked: false },
];

export function formatTokens(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(".0", "") + "k";
  return n.toString();
}

export function timeLeft(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms < 0) return "Encerrada";
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}
