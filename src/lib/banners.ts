// Simple client-side banner store (localStorage).
// Used by the admin area and the home page to manage promotional banners.

export type Banner = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  ctaLabel?: string;
  ctaLink?: string;
  active: boolean;
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
      sortOrder: 1,
      createdAt: new Date().toISOString(),
    },
  ];
  write(initial);
  return initial;
}

export function listBanners(): Banner[] {
  return read().sort((a, b) => a.sortOrder - b.sortOrder);
}

export function listActiveBanners(): Banner[] {
  return listBanners().filter((b) => b.active);
}

export function createBanner(input: Omit<Banner, "id" | "createdAt">): Banner {
  const banner: Banner = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const list = read();
  list.push(banner);
  write(list);
  return banner;
}

export function updateBanner(id: string, patch: Partial<Omit<Banner, "id" | "createdAt">>) {
  const list = read().map((b) => (b.id === id ? { ...b, ...patch } : b));
  write(list);
}

export function deleteBanner(id: string) {
  write(read().filter((b) => b.id !== id));
}
