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
  { id: "wc-20a", home: "Holanda", away: "Suécia", homeCode: "nl", awayCode: "se", group: "F", kickoff: "2026-06-20T19:00:00-03:00" },
  { id: "wc-20b", home: "Alemanha", away: "Costa do Marfim", homeCode: "de", awayCode: "ci", group: "E", kickoff: "2026-06-20T20:30:00-03:00" },
  { id: "wc-20c", home: "Equador", away: "Curaçao", homeCode: "ec", awayCode: "cw", group: "E", kickoff: "2026-06-20T22:00:00-03:00" },
  { id: "wc-20d", home: "Tunísia", away: "Japão", homeCode: "tn", awayCode: "jp", group: "F", kickoff: "2026-06-20T23:30:00-03:00" },
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

// ============================================================
// Resultados oficiais — Copa do Mundo 2026
// ============================================================
export type WCResult = {
  date: string; // dd/MM/yyyy
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  status: "encerrado" | "em_andamento";
};

export const WORLD_CUP_RESULTS: WCResult[] = [
  { date: "11/06/2026", home: "México", away: "África do Sul", homeScore: 2, awayScore: 0, status: "encerrado" },
  { date: "11/06/2026", home: "Coreia do Sul", away: "República Tcheca", homeScore: 2, awayScore: 1, status: "encerrado" },
  { date: "12/06/2026", home: "Canadá", away: "Bósnia e Herzegovina", homeScore: 1, awayScore: 1, status: "encerrado" },
  { date: "12/06/2026", home: "Estados Unidos", away: "Paraguai", homeScore: 4, awayScore: 1, status: "encerrado" },
  { date: "13/06/2026", home: "Catar", away: "Suíça", homeScore: 1, awayScore: 1, status: "encerrado" },
  { date: "13/06/2026", home: "Brasil", away: "Marrocos", homeScore: 1, awayScore: 1, status: "encerrado" },
  { date: "13/06/2026", home: "Haiti", away: "Escócia", homeScore: 0, awayScore: 1, status: "encerrado" },
  { date: "14/06/2026", home: "Austrália", away: "Turquia", homeScore: 2, awayScore: 0, status: "encerrado" },
  { date: "14/06/2026", home: "Alemanha", away: "Curaçao", homeScore: 7, awayScore: 1, status: "encerrado" },
  { date: "14/06/2026", home: "Holanda", away: "Japão", homeScore: 2, awayScore: 2, status: "encerrado" },
  { date: "14/06/2026", home: "Costa do Marfim", away: "Equador", homeScore: 1, awayScore: 0, status: "encerrado" },
  { date: "14/06/2026", home: "Suécia", away: "Tunísia", homeScore: 5, awayScore: 1, status: "encerrado" },
  { date: "15/06/2026", home: "Espanha", away: "Cabo Verde", homeScore: 0, awayScore: 0, status: "encerrado" },
  { date: "15/06/2026", home: "Bélgica", away: "Egito", homeScore: 1, awayScore: 1, status: "encerrado" },
  { date: "15/06/2026", home: "Arábia Saudita", away: "Uruguai", homeScore: 1, awayScore: 1, status: "encerrado" },
  { date: "15/06/2026", home: "Irã", away: "Nova Zelândia", homeScore: 2, awayScore: 2, status: "encerrado" },
  { date: "16/06/2026", home: "França", away: "Senegal", homeScore: 3, awayScore: 1, status: "encerrado" },
  { date: "16/06/2026", home: "Iraque", away: "Noruega", homeScore: 1, awayScore: 4, status: "encerrado" },
  { date: "16/06/2026", home: "Argentina", away: "Argélia", homeScore: 3, awayScore: 0, status: "encerrado" },
  { date: "17/06/2026", home: "Áustria", away: "Jordânia", homeScore: 3, awayScore: 1, status: "encerrado" },
  { date: "17/06/2026", home: "Portugal", away: "República Democrática do Congo", homeScore: 1, awayScore: 1, status: "encerrado" },
  { date: "17/06/2026", home: "Inglaterra", away: "Croácia", homeScore: 4, awayScore: 2, status: "encerrado" },
  { date: "17/06/2026", home: "Gana", away: "Panamá", homeScore: 1, awayScore: 0, status: "encerrado" },
  { date: "17/06/2026", home: "Uzbequistão", away: "Colômbia", homeScore: 1, awayScore: 3, status: "encerrado" },
  { date: "18/06/2026", home: "República Tcheca", away: "África do Sul", homeScore: 1, awayScore: 1, status: "encerrado" },
  { date: "18/06/2026", home: "Suíça", away: "Bósnia e Herzegovina", homeScore: 4, awayScore: 1, status: "encerrado" },
  { date: "18/06/2026", home: "Canadá", away: "Catar", homeScore: 6, awayScore: 0, status: "encerrado" },
  { date: "18/06/2026", home: "México", away: "Coreia do Sul", homeScore: 1, awayScore: 0, status: "encerrado" },
  { date: "19/06/2026", home: "Estados Unidos", away: "Austrália", homeScore: 2, awayScore: 0, status: "encerrado" },
  { date: "19/06/2026", home: "Escócia", away: "Marrocos", homeScore: 0, awayScore: 1, status: "encerrado" },
  { date: "19/06/2026", home: "Brasil", away: "Haiti", homeScore: 3, awayScore: 0, status: "encerrado" },
  { date: "19/06/2026", home: "Turquia", away: "Paraguai", homeScore: 0, awayScore: 1, status: "encerrado" },
  { date: "20/06/2026", home: "Holanda", away: "Suécia", homeScore: 5, awayScore: 1, status: "encerrado" },
  { date: "20/06/2026", home: "Alemanha", away: "Costa do Marfim", homeScore: 2, awayScore: 1, status: "encerrado" },
  { date: "20/06/2026", home: "Equador", away: "Curaçao", homeScore: 0, awayScore: 0, status: "encerrado" },
  { date: "21/06/2026", home: "Tunísia", away: "Japão", homeScore: 0, awayScore: 4, status: "encerrado" },
  { date: "21/06/2026", home: "Espanha", away: "Arábia Saudita", homeScore: 4, awayScore: 0, status: "encerrado" },
  { date: "21/06/2026", home: "Bélgica", away: "Irã", homeScore: 0, awayScore: 0, status: "encerrado" },
  { date: "21/06/2026", home: "Uruguai", away: "Cabo Verde", homeScore: 2, awayScore: 2, status: "encerrado" },
  { date: "21/06/2026", home: "Nova Zelândia", away: "Egito", homeScore: 1, awayScore: 3, status: "encerrado" },
  { date: "22/06/2026", home: "Argentina", away: "Áustria", homeScore: 0, awayScore: 0, status: "em_andamento" },
];

function normResult(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

export function findResult(home: string, away: string): WCResult | undefined {
  const h = normResult(home);
  const a = normResult(away);
  return WORLD_CUP_RESULTS.find(
    (r) =>
      (normResult(r.home) === h && normResult(r.away) === a) ||
      (normResult(r.home) === a && normResult(r.away) === h),
  );
}

// Build a unique catalog of all known countries from WC matches.
const COUNTRY_CATALOG: { name: string; code: string }[] = (() => {
  const seen = new Map<string, string>();
  for (const m of WORLD_CUP_MATCHES) {
    if (!seen.has(m.home.toLowerCase())) seen.set(m.home.toLowerCase(), m.homeCode);
    if (!seen.has(m.away.toLowerCase())) seen.set(m.away.toLowerCase(), m.awayCode);
  }
  return Array.from(seen.entries()).map(([name, code]) => ({ name, code }));
})();

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Detect two known countries mentioned in any text (e.g. challenge title).
 * Returns a MatchInfo-shaped object with flag URLs, or null.
 */
export function detectMatchFromText(text: string): {
  home: string; away: string; homeFlag: string; awayFlag: string; kickoff: string; group: string;
} | null {
  if (!text) return null;
  const norm = ` ${normalize(text)} `;
  const found: { name: string; code: string; idx: number }[] = [];
  for (const c of COUNTRY_CATALOG) {
    const n = normalize(c.name);
    const idx = norm.indexOf(` ${n} `);
    const idx2 = idx === -1 ? norm.indexOf(` ${n}.`) : idx;
    const idx3 = idx2 === -1 ? norm.indexOf(` ${n},`) : idx2;
    const idx4 = idx3 === -1 ? norm.indexOf(`${n} x `) : idx3;
    const finalIdx = idx4 === -1 ? norm.indexOf(` x ${n}`) : idx4;
    if (finalIdx !== -1) found.push({ name: c.name, code: c.code, idx: finalIdx });
  }
  if (found.length < 2) return null;
  found.sort((a, b) => a.idx - b.idx);
  const home = found[0];
  const away = found.find((f) => f.name !== home.name) ?? found[1];
  // Try to match the official WC fixture to grab kickoff & group.
  const wc = WORLD_CUP_MATCHES.find(
    (m) =>
      (normalize(m.home) === normalize(home.name) && normalize(m.away) === normalize(away.name)) ||
      (normalize(m.away) === normalize(home.name) && normalize(m.home) === normalize(away.name)),
  );
  return {
    home: home.name.replace(/\b\w/g, (c) => c.toUpperCase()),
    away: away.name.replace(/\b\w/g, (c) => c.toUpperCase()),
    homeFlag: flagUrl(home.code),
    awayFlag: flagUrl(away.code),
    kickoff: wc?.kickoff ?? "2026-06-11T16:00:00.000Z",
    group: wc?.group ?? "—",
  };
}

const ENTRY_FEE = 100;
const WC_CREATED_BASE = new Date("2026-06-26T12:00:00-03:00").getTime();
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
      createdAt: new Date(WC_CREATED_BASE - i * 60_000).toISOString(),
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
