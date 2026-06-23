// Lightweight client-side "Token Palpite" wallet (separate from regular TKN).
// Conversion rate: 100 TKN -> 1 Token Palpite.

const KEY = "ddp:palpite-tokens";
const SPENT_KEY = "ddp:palpite-tokens-spent-tkn"; // total TKN spent on conversions
export const PALPITE_TOKEN_RATE = 100;

function read(): number {
  if (typeof window === "undefined") return 0;
  try {
    return Number(window.localStorage.getItem(KEY) ?? "0") || 0;
  } catch {
    return 0;
  }
}

function write(value: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, String(Math.max(0, Math.floor(value))));
    window.dispatchEvent(new Event("ddp:palpite-tokens-updated"));
  } catch {
    /* ignore */
  }
}

export function getPalpiteTokens(): number {
  return read();
}

export function getPalpiteTokensSpentTkn(): number {
  if (typeof window === "undefined") return 0;
  try {
    return Number(window.localStorage.getItem(SPENT_KEY) ?? "0") || 0;
  } catch {
    return 0;
  }
}

/** Returns the number of Token Palpite credited. Updates spent counter so the
 *  dashboard balance can subtract TKN locally. */
export function convertTknToPalpiteTokens(tkn: number): number {
  const amount = Math.floor(tkn / PALPITE_TOKEN_RATE);
  if (amount <= 0) return 0;
  const cost = amount * PALPITE_TOKEN_RATE;
  write(read() + amount);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(SPENT_KEY, String(getPalpiteTokensSpentTkn() + cost));
    } catch {
      /* ignore */
    }
  }
  return amount;
}
