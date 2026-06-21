// Simple client-side banner store (localStorage).
// Used by the admin area and the home page to manage promotional banners.

export type Banner = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  ctaLabel?: string;
  ctaLink?: string;
  challengeId?: string;
  challengeTitle?: string;
  active: boolean;
  isMain?: boolean;
  expiresAt?: string; // ISO datetime; if past, banner is treated as expired
  sortOrder: number;
  createdAt: string;
};

const KEY = "ddp:banners:v1";

function read(): Banner[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seed();
    return JSON.parse(raw) as Banner[];
  } catch {
    return [];
  }
}

function write(list: Banner[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
}

function seed(): Banner[] {
  const initial: Banner[] = [
    {
      id: crypto.randomUUID(),
      title: "Bem-vindo ao Desafio dos Palpites",
      subtitle: "Ganhe tokens e troque por prêmios reais",
      imageUrl:
        "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=1600&q=80",
      ctaLabel: "Quero participar",
      ctaLink: "/desafios",
      active: true,
      isMain: true,
      sortOrder: 1,
      createdAt: new Date().toISOString(),
    },
  ];
  write(initial);
  return initial;
}

function isExpired(b: Banner): boolean {
  if (!b.expiresAt) return false;
  return new Date(b.expiresAt).getTime() < Date.now();
}

export function listBanners(): Banner[] {
  return read().sort((a, b) => {
    if (a.isMain && !b.isMain) return -1;
    if (!a.isMain && b.isMain) return 1;
    return a.sortOrder - b.sortOrder;
  });
}

export function listActiveBanners(): Banner[] {
  return listBanners().filter((b) => b.active && !isExpired(b));
}

export function getMainBanner(): Banner | undefined {
  return listActiveBanners().find((b) => b.isMain);
}

export function isBannerExpired(b: Banner): boolean {
  return isExpired(b);
}

export function createBanner(input: Omit<Banner, "id" | "createdAt">): Banner {
  const banner: Banner = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const list = read();
  if (banner.isMain) {
    list.forEach((b) => (b.isMain = false));
  }
  list.push(banner);
  write(list);
  return banner;
}

export function updateBanner(id: string, patch: Partial<Omit<Banner, "id" | "createdAt">>) {
  let list = read();
  if (patch.isMain) {
    list = list.map((b) => ({ ...b, isMain: false }));
  }
  list = list.map((b) => (b.id === id ? { ...b, ...patch } : b));
  write(list);
}

export function deleteBanner(id: string) {
  write(read().filter((b) => b.id !== id));
}
