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
