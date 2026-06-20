import { USERS, type Prediction, type Category } from "@/lib/mock-data";

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
    options: optionLabels.map((label, i) => ({
      id: `o${i}`,
      label,
      pool: 0,
    })),
    bettors: 0,
    comments: 0,
    likes: 0,
    shares: 0,
    tags: ["meu-desafio", input.isOpen ? "aberto" : "privado"],
    hot: true,
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

