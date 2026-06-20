import type { Prediction, PredictionOption } from "@/lib/mock-data";

export type WCMatch = {
  id: string;
  home: string;
  away: string;
  homeCode: string; // flagcdn code (lowercase)
  awayCode: string;
  group: string;
  kickoff: string; // ISO with -03:00 (Brasília)
};

// All times Brasília (UTC-03:00).
export const WORLD_CUP_MATCHES: WCMatch[] = [
  // 20/06
  { id: "wc-20a", home: "Holanda", away: "Suécia", homeCode: "nl", awayCode: "se", group: "F", kickoff: "2026-06-20T14:00:00-03:00" },
  { id: "wc-20b", home: "Alemanha", away: "Costa do Marfim", homeCode: "de", awayCode: "ci", group: "E", kickoff: "2026-06-20T17:00:00-03:00" },
  { id: "wc-20c", home: "Equador", away: "Curaçao", homeCode: "ec", awayCode: "cw", group: "E", kickoff: "2026-06-20T21:00:00-03:00" },
  { id: "wc-20d", home: "Tunísia", away: "Japão", homeCode: "tn", awayCode: "jp", group: "F", kickoff: "2026-06-20T23:00:00-03:00" },
  // 21/06
  { id: "wc-21a", home: "Espanha", away: "Arábia Saudita", homeCode: "es", awayCode: "sa", group: "H", kickoff: "2026-06-21T13:00:00-03:00" },
  { id: "wc-21b", home: "Uruguai", away: "Cabo Verde", homeCode: "uy", awayCode: "cv", group: "H", kickoff: "2026-06-21T19:00:00-03:00" },
  // 23/06
  { id: "wc-23a", home: "Portugal", away: "Uzbequistão", homeCode: "pt", awayCode: "uz", group: "K", kickoff: "2026-06-23T14:00:00-03:00" },
  { id: "wc-23b", home: "Inglaterra", away: "Gana", homeCode: "gb-eng", awayCode: "gh", group: "L", kickoff: "2026-06-23T17:00:00-03:00" },
  { id: "wc-23c", home: "Panamá", away: "Croácia", homeCode: "pa", awayCode: "hr", group: "L", kickoff: "2026-06-23T20:00:00-03:00" },
  { id: "wc-23d", home: "Colômbia", away: "Rep. Dem. Congo", homeCode: "co", awayCode: "cd", group: "K", kickoff: "2026-06-23T23:00:00-03:00" },
  // 24/06
  { id: "wc-24a", home: "Brasil", away: "Escócia", homeCode: "br", awayCode: "gb-sct", group: "C", kickoff: "2026-06-24T16:00:00-03:00" },
  { id: "wc-24b", home: "Marrocos", away: "Haiti", homeCode: "ma", awayCode: "ht", group: "C", kickoff: "2026-06-24T16:00:00-03:00" },
  // 25/06
  { id: "wc-25a", home: "Equador", away: "Alemanha", homeCode: "ec", awayCode: "de", group: "E", kickoff: "2026-06-25T17:00:00-03:00" },
  { id: "wc-25b", home: "Curaçao", away: "Costa do Marfim", homeCode: "cw", awayCode: "ci", group: "E", kickoff: "2026-06-25T17:00:00-03:00" },
  { id: "wc-25c", home: "Japão", away: "Suécia", homeCode: "jp", awayCode: "se", group: "F", kickoff: "2026-06-25T20:00:00-03:00" },
  { id: "wc-25d", home: "Tunísia", away: "Holanda", homeCode: "tn", awayCode: "nl", group: "F", kickoff: "2026-06-25T20:00:00-03:00" },
  // 26/06
  { id: "wc-26a", home: "Noruega", away: "França", homeCode: "no", awayCode: "fr", group: "I", kickoff: "2026-06-26T16:00:00-03:00" },
  { id: "wc-26b", home: "Senegal", away: "Iraque", homeCode: "sn", awayCode: "iq", group: "I", kickoff: "2026-06-26T16:00:00-03:00" },
  { id: "wc-26c", home: "Cabo Verde", away: "Arábia Saudita", homeCode: "cv", awayCode: "sa", group: "H", kickoff: "2026-06-26T21:00:00-03:00" },
  { id: "wc-26d", home: "Uruguai", away: "Espanha", homeCode: "uy", awayCode: "es", group: "H", kickoff: "2026-06-26T21:00:00-03:00" },
  { id: "wc-26e", home: "Egito", away: "Irã", homeCode: "eg", awayCode: "ir", group: "G", kickoff: "2026-06-27T00:00:00-03:00" },
  { id: "wc-26f", home: "Nova Zelândia", away: "Bélgica", homeCode: "nz", awayCode: "be", group: "G", kickoff: "2026-06-27T00:00:00-03:00" },
  // 27/06
  { id: "wc-27a", home: "Panamá", away: "Inglaterra", homeCode: "pa", awayCode: "gb-eng", group: "L", kickoff: "2026-06-27T18:00:00-03:00" },
  { id: "wc-27b", home: "Croácia", away: "Gana", homeCode: "hr", awayCode: "gh", group: "L", kickoff: "2026-06-27T18:00:00-03:00" },
];

export function flagUrl(code: string) {
  return `https://flagcdn.com/w80/${code}.png`;
}

const ENTRY_FEE = 100;
const PRIZE_TIERS = [
  { hits: 5, tokens: 10000 },
  { hits: 4, tokens: 5000 },
  { hits: 3, tokens: 2000 },
];

function buildSubs(home: string, away: string) {
  return [
    {
      id: "q1",
      question: `Quem vence a partida ${home} x ${away}?`,
      options: [home, "Empate", away],
    },
    {
      id: "q2",
      question: "Total de gols na partida?",
      options: ["0 a 1 gol", "2 a 3 gols", "4 ou mais"],
    },
    {
      id: "q3",
      question: "As duas equipes marcam?",
      options: ["Sim", "Não"],
    },
    {
      id: "q4",
      question: "Haverá pênalti marcado?",
      options: ["Sim", "Não"],
    },
    {
      id: "q5",
      question: "Algum cartão vermelho?",
      options: ["Sim", "Não"],
    },
  ];
}

// Author used for system-generated WC challenges
const WC_AUTHOR = {
  id: "wc-bot",
  username: "Copa 2026 Oficial",
  city: "Brasília",
  state: "DF",
  level: "Oráculo",
  tokens: 0,
  acertos: 0,
  erros: 0,
  followers: 0,
  following: 0,
  avatar: "https://api.dicebear.com/9.x/thumbs/svg?seed=copa2026&backgroundColor=00c853",
};

export function buildWorldCupChallenges(): Prediction[] {
  return WORLD_CUP_MATCHES.map((m, i) => {
    const subs = buildSubs(m.home, m.away);
    const first = subs[0];
    const options: PredictionOption[] = first.options.map((label, idx) => ({
      id: `o${idx}`,
      label,
      pool: 5000 + ((i * 137 + idx * 911) % 45000),
    }));
    const kickoff = new Date(m.kickoff).getTime();
    const closesAt = new Date(kickoff - 10 * 60 * 1000).toISOString(); // 10 minutos antes do jogo
    return {
      id: m.id,
      title: `${m.home} x ${m.away} — Copa do Mundo 2026`,
      description: `Grupo ${m.group} • Faça 5 palpites sobre ${m.home} x ${m.away}. Acerte mais e leve mais tokens!`,
      category: "Copa do Mundo 2026" as const,
      author: WC_AUTHOR,
      createdAt: new Date().toISOString(),
      closesAt,
      minTokens: ENTRY_FEE,
      options,
      bettors: 120 + ((i * 53) % 1800),
      comments: (i * 17) % 220,
      likes: 200 + ((i * 91) % 1500),
      shares: (i * 31) % 350,
      tags: ["copa", "2026", m.group.toLowerCase(), m.homeCode, m.awayCode],
      hot: i < 8,
      match: {
        home: m.home,
        away: m.away,
        homeFlag: flagUrl(m.homeCode),
        awayFlag: flagUrl(m.awayCode),
        kickoff: m.kickoff,
        group: m.group,
      },
      subPredictions: subs,
      entryFee: ENTRY_FEE,
      prizeTiers: PRIZE_TIERS,
    } satisfies Prediction;
  });
}

export const WORLD_CUP_CHALLENGES = buildWorldCupChallenges();
