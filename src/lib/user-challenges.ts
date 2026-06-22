import { USERS, type Prediction, type Category } from "@/lib/mock-data";
import { detectMatchFromText } from "@/lib/world-cup-matches";

const KEY = "ddp:user-challenges";

export type CreateChallengeInput = {
  id: string;
  name: string;
  category: Category;
  endsAt: string; // datetime-local
  isOpen: boolean;
  subs: { id: string; question: string; options: string[] }[];
  prizeName?: string;
  prizeImg?: string | null;
  bannerImg?: string | null;
  corporateMissions?: Prediction["corporateMissions"];
};

function read(): Prediction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Prediction[]) : [];
  } catch {
    return [];
  }
}

function write(list: Prediction[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("ddp:user-challenges-updated"));
  } catch {
    // ignore quota
  }
}

export function getUserChallenges(): Prediction[] {
  return read();
}

export function saveUserChallenge(input: CreateChallengeInput): Prediction {
  // The first sub-category drives the visible options on the card.
  const first = input.subs[0];
  const optionLabels = first?.options.filter((o) => o.trim()) ?? ["Sim", "Não"];
  const subPreds = input.subs
    .filter((s) => s.question?.trim())
    .map((s) => ({
      id: s.id,
      question: s.question,
      options: s.options.filter((o) => o && o.trim()),
    }));
  const match = detectMatchFromText(input.name) ?? undefined;
  const prediction: Prediction = {
    id: input.id,
    title: input.name,
    description: input.subs
      .map((s, i) => `${i + 1}. ${s.question} — ${s.options.filter(Boolean).join(" / ")}`)
      .join("  •  ") || "Desafio criado por usuário.",
    category: input.category,
    author: USERS[0],
    createdAt: new Date().toISOString(),
    closesAt: input.endsAt ? new Date(input.endsAt).toISOString() : new Date(Date.now() + 7 * 86400000).toISOString(),
    minTokens: 10,
    entryFee: 10,
    options: optionLabels.map((label, i) => ({
      id: `o${i}`,
      label,
      pool: 0,
    })),
    subPredictions: subPreds.length > 1 ? subPreds : undefined,
    bettors: 0,
    comments: 0,
    likes: 0,
    shares: 0,
    tags: ["meu-desafio", input.isOpen ? "aberto" : "privado"],
    hot: true,
    imageUrl: input.bannerImg ?? input.prizeImg ?? undefined,
    corporateMissions: input.corporateMissions,
    match,
  };
  const list = read();
  list.unshift(prediction);
  write(list);
  return prediction;
}

export function addManyUserChallenges(items: Prediction[]) {
  const list = read();
  write([...items, ...list]);
}

export function updateUserChallenge(id: string, patch: Partial<Prediction>) {
  const list = read();
  const idx = list.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...patch };
  write(list);
  return list[idx];
}

export function deleteUserChallenge(id: string) {
  const list = read().filter((c) => c.id !== id);
  write(list);
}

// ===== Platform challenge overrides (admin edits to mock PREDICTIONS) =====
const OVERRIDES_KEY = "ddp:platform-overrides";
const DELETED_KEY = "ddp:platform-deleted";

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("ddp:user-challenges-updated"));
  } catch {
    // ignore
  }
}

export function getPlatformOverrides(): Record<string, Partial<Prediction>> {
  return readJSON<Record<string, Partial<Prediction>>>(OVERRIDES_KEY, {});
}
export function getPlatformDeleted(): string[] {
  return readJSON<string[]>(DELETED_KEY, []);
}
export function setPlatformOverride(id: string, patch: Partial<Prediction>) {
  const all = getPlatformOverrides();
  all[id] = { ...(all[id] ?? {}), ...patch };
  writeJSON(OVERRIDES_KEY, all);
}
export function deletePlatformChallenge(id: string) {
  const set = new Set(getPlatformDeleted());
  set.add(id);
  writeJSON(DELETED_KEY, Array.from(set));
}
export function applyPlatformOverrides(list: Prediction[]): Prediction[] {
  const overrides = getPlatformOverrides();
  const deleted = new Set(getPlatformDeleted());
  return list
    .filter((p) => !deleted.has(p.id))
    .map((p) => (overrides[p.id] ? { ...p, ...overrides[p.id] } : p));
}

