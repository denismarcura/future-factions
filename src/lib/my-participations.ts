// localStorage tracker for user participations on prediction challenges.

export type MyParticipation = {
  id: string;            // prediction id
  title: string;
  category: string;
  entryFee: number;      // tokens spent
  answers: Record<string, string>; // subPredictionId -> optionId/label
  optionLabel?: string;  // for single-option predictions
  closesAt: string;      // ISO
  participatedAt: string;// ISO
};

const KEY = "ddp:my-participations";

export function listParticipations(): MyParticipation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as MyParticipation[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveParticipation(p: MyParticipation) {
  if (typeof window === "undefined") return;
  const list = listParticipations().filter((x) => x.id !== p.id);
  list.unshift(p);
  window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, 100)));
  window.dispatchEvent(new Event("ddp:participations-updated"));
}

export function hasParticipated(id: string): boolean {
  return listParticipations().some((p) => p.id === id);
}
