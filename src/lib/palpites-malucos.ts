import { USERS } from "@/lib/mock-users";
import type { Prediction, PredictionOption } from "@/lib/mock-data";
import imgRed from "@/assets/pm-red-card.jpg";
import imgGk from "@/assets/pm-goalkeeper.jpg";
import imgZebra from "@/assets/pm-zebra.jpg";
import imgHat from "@/assets/pm-hattrick.jpg";
import imgPenalty from "@/assets/pm-penalty.jpg";
import imgYellow from "@/assets/pm-yellow-card.jpg";
import imgRain from "@/assets/pm-rain.jpg";
import imgFK from "@/assets/pm-free-kick.jpg";
import imgSoccer from "@/assets/pm-soccer.jpg";

const EMOJI_IMG: Record<string, string> = {
  "🟥": imgRed,
  "🥅": imgGk,
  "🦓": imgZebra,
  "🏆": imgPenalty,
  "🟨": imgYellow,
  "🏟️": imgHat,
  "🌧️": imgRain,
  "🔥": imgFK,
  "⚽": imgSoccer,
};

type Maluco = {
  emoji: string;
  title: string;
  options: string[];
  prize: number;
};

const ENDS_AT = "2026-07-01T20:00:00.000Z";
const ENTRY_FEE = 100;
const REQUIREMENTS = [
  "🎯 Ter feito todas as missões",
  "🎯 Convidar 5 amigos",
];

const MALUCOS: Maluco[] = [
  {
    emoji: "🟥",
    title: "Quantos cartões vermelhos o Brasil vai receber na Copa?",
    options: ["Nenhum", "1 Cartão Vermelho", "2 Cartões Vermelhos", "3 Cartões Vermelhos", "4 ou mais Cartões Vermelhos"],
    prize: 1000,
  },
  {
    emoji: "🥅",
    title: "Haverá um goleiro marcando gol na Copa?",
    options: ["Sim", "Não"],
    prize: 5000,
  },
  {
    emoji: "🦓",
    title: "Qual será a maior zebra da Copa?",
    options: ["Cabo Verde", "Haiti", "Curaçao", "Jordânia", "Iraque", "Nova Zelândia", "Tunísia", "Outra"],
    prize: 10000,
  },
  {
    emoji: "⚽",
    title: "Algum jogador fará 3 gols em uma única partida?",
    options: ["Sim", "Não"],
    prize: 2000,
  },
  {
    emoji: "⚽",
    title: "Qual seleção será eliminada sem perder nenhum jogo?",
    options: ["Brasil", "Argentina", "França", "Alemanha", "Espanha", "Inglaterra", "Portugal", "Outra"],
    prize: 5000,
  },
  {
    emoji: "🏆",
    title: "O Campeão da Copa será decidido nos pênaltis?",
    options: ["Sim", "Não"],
    prize: 10000,
  },
  {
    emoji: "🟨",
    title: "Quantos cartões amarelos o Brasil receberá na Copa?",
    options: ["Até 5", "6 a 10", "11 a 15", "16 a 20", "Mais de 20"],
    prize: 2000,
  },
  {
    emoji: "⚽",
    title: "Quantos gols o Brasil fará na Copa?",
    options: ["Até 5 gols", "6 a 10 gols", "11 a 15 gols", "16 a 20 gols", "Mais de 20 gols"],
    prize: 5000,
  },
  {
    emoji: "🏟️",
    title: "Qual fase terá mais gols?",
    options: ["Fase de Grupos", "16 Avos", "Oitavas", "Quartas", "Semifinais", "Final"],
    prize: 2000,
  },
  {
    emoji: "🌧️",
    title: "Alguma partida será interrompida por clima ou problema técnico?",
    options: ["Sim", "Não"],
    prize: 10000,
  },
  {
    emoji: "⚽",
    title: "Qual jogador marcará mais gols de falta?",
    options: ["Mbappé", "Vinícius Júnior", "Bellingham", "Haaland", "Rodrygo", "Yamal", "Outro"],
    prize: 5000,
  },
  {
    emoji: "🔥",
    title: "Teremos um gol contra na Final da Copa?",
    options: ["Sim", "Não"],
    prize: 10000,
  },
];

function makeOptions(seed: number, labels: string[]): PredictionOption[] {
  return labels.map((label, i) => ({
    id: `o${i}`,
    label,
    pool: ((seed * 37 + i * 113) % 90000) + 1500,
  }));
}

export const PALPITES_MALUCOS: Prediction[] = MALUCOS.map((m, i) => ({
  id: `pm${i + 1}`,
  title: `${m.emoji} ${m.title}`,
  description: `🤪 PALPITES MALUCOS\n\nRequisitos:\n${REQUIREMENTS.join("\n")}\n\n🎁 Premiação: ${m.prize.toLocaleString("pt-BR")} Tokens\n📅 Data limite para apostas: 01/07/2026\n💰 Valor para palpitar: ${ENTRY_FEE} Tokens`,
  category: "Palpites Malucos da Copa",
  author: USERS[i % USERS.length],
  createdAt: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
  closesAt: ENDS_AT,
  minTokens: ENTRY_FEE,
  entryFee: ENTRY_FEE,
  options: makeOptions(i + 1, m.options),
  bettors: ((i * 173) % 1600) + 120,
  comments: ((i * 41) % 180) + 8,
  likes: ((i * 211) % 1400) + 60,
  shares: ((i * 53) % 320) + 12,
  tags: ["palpites-malucos", "copa", "2026"],
  hot: true,
  prizeTiers: [{ hits: 1, tokens: m.prize }],
  imageUrl: EMOJI_IMG[m.emoji] ?? imgSoccer,
}));
