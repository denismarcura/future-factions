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
  | "Palpites Malucos da Copa";

export const CATEGORIES: Category[] = [
  "Copa do Mundo 2026",
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

export type User = {
  id: string;
  username: string;
  city: string;
  state: string;
  level: string;
  tokens: number;
  acertos: number;
  erros: number;
  followers: number;
  following: number;
  avatar: string;
};

export const LEVELS = [
  "Iniciante",
  "Explorador",
  "Analista",
  "Especialista",
  "Visionário",
  "Oráculo",
  "Lenda",
] as const;

const USERNAMES = [
  "Carlos Visionário","AlienHunter77","RainhaDasApostas","MestreDaCopa","RadarGlobal",
  "FuturoTech","GuruDigital","ApostaCerta","Profeta2027","TokenKing",
  "OraculoBR","PalpiteiroMaster","ZebraDaCopa","MestreVAR","AnalistaFutebol",
  "CapitãoPalpite","RainhaDoRanking","RadarMundial","FuturoAgora","LendaDosTokens",
];

const CITIES: [string, string][] = [
  ["São Paulo", "SP"], ["Rio de Janeiro", "RJ"], ["Belo Horizonte", "MG"],
  ["Curitiba", "PR"], ["Porto Alegre", "RS"], ["Salvador", "BA"],
  ["Recife", "PE"], ["Fortaleza", "CE"], ["Brasília", "DF"], ["Manaus", "AM"],
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export const USERS: User[] = USERNAMES.map((username, i) => {
  const rnd = seededRandom(i + 1);
  const acertos = Math.floor(rnd() * 800) + 50;
  const erros = Math.floor(rnd() * 400) + 20;
  const [city, state] = CITIES[i % CITIES.length];
  return {
    id: `u${i + 1}`,
    username,
    city,
    state,
    level: LEVELS[Math.min(LEVELS.length - 1, Math.floor(rnd() * LEVELS.length))],
    tokens: Math.floor(rnd() * 950000) + 1000,
    acertos,
    erros,
    followers: Math.floor(rnd() * 12000),
    following: Math.floor(rnd() * 800),
    avatar: `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(username)}&backgroundColor=ff6a00,ffd700,ff3b30`,
  };
});

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
  pool: number; // tokens apostados
};

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

export const PREDICTIONS = predictions;

export function getPrediction(id: string) {
  return PREDICTIONS.find((p) => p.id === id);
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

export const ACHIEVEMENTS = [
  { id: "a1", title: "Primeira aposta", desc: "Faça sua primeira aposta", unlocked: true },
  { id: "a2", title: "Primeira previsão criada", desc: "Crie sua primeira previsão", unlocked: true },
  { id: "a3", title: "10 acertos", desc: "Acerte 10 previsões", unlocked: false },
  { id: "a4", title: "50 acertos", desc: "Acerte 50 previsões", unlocked: false },
  { id: "a5", title: "100 acertos", desc: "Acerte 100 previsões", unlocked: false },
  { id: "a6", title: "1.000 seguidores", desc: "Alcance 1.000 seguidores", unlocked: false },
  { id: "a7", title: "100.000 Tokens", desc: "Acumule 100k Tokens", unlocked: false },
  { id: "a8", title: "1.000.000 Tokens", desc: "Acumule 1M Tokens (Lenda)", unlocked: false },
  { id: "a9", title: "Profeta da Copa", desc: "Acerte uma previsão improvável da Copa", unlocked: false },
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
