// Daily check-in (client-side, per-user) backed by localStorage.
// Reward curve: day N → min(300, 10 * N). Missing a day resets streak to 0.

const KEY = "ddp:checkin:v1";

export type CheckinEntry = { date: string; day: number; tokens: number };
export type CheckinState = {
  streak: number;
  lastDate: string | null; // YYYY-MM-DD
  totalEarned: number;
  history: CheckinEntry[];
};

export const MAX_REWARD = 300;
export const STEP = 10;
export const MAX_DAY = 30;

export function rewardForDay(day: number): number {
  if (day < 1) return 0;
  return Math.min(MAX_REWARD, STEP * day);
}

function today(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function yesterday(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function read(): CheckinState {
  if (typeof window === "undefined") {
    return { streak: 0, lastDate: null, totalEarned: 0, history: [] };
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { streak: 0, lastDate: null, totalEarned: 0, history: [] };
    const parsed = JSON.parse(raw);
    return {
      streak: Number(parsed.streak) || 0,
      lastDate: parsed.lastDate ?? null,
      totalEarned: Number(parsed.totalEarned) || 0,
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
  } catch {
    return { streak: 0, lastDate: null, totalEarned: 0, history: [] };
  }
}

function write(state: CheckinState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("ddp:checkin-updated"));
}

export function getCheckinState(): CheckinState {
  // Compute "effective" streak: if last check-in was before yesterday, streak resets.
  const s = read();
  if (!s.lastDate) return s;
  const t = today();
  const y = yesterday(t);
  if (s.lastDate !== t && s.lastDate !== y) {
    // Missed at least one day → reset (but keep history for the log).
    return { ...s, streak: 0 };
  }
  return s;
}

export function canCheckinToday(): boolean {
  const s = read();
  return s.lastDate !== today();
}

export function performCheckin(): { ok: boolean; entry?: CheckinEntry; reason?: string } {
  const s = read();
  const t = today();
  if (s.lastDate === t) return { ok: false, reason: "Você já fez check-in hoje." };
  const y = yesterday(t);
  const newStreak = s.lastDate === y ? s.streak + 1 : 1;
  const tokens = rewardForDay(newStreak);
  const entry: CheckinEntry = { date: t, day: newStreak, tokens };
  const next: CheckinState = {
    streak: newStreak,
    lastDate: t,
    totalEarned: s.totalEarned + tokens,
    history: [entry, ...s.history].slice(0, 365),
  };
  write(next);
  return { ok: true, entry };
}

export function resetCheckin() {
  write({ streak: 0, lastDate: null, totalEarned: 0, history: [] });
}
