// Bottom banners store (localStorage). Displayed on the home page
// just before the "Como Funciona" section. Fixed 800×350 size.

export type BottomBanner = {
  id: string;
  imageUrl: string; // already resized/compressed to 800x350 JPEG (data URL or remote URL)
  link?: string;
  alt?: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
};

const KEY = "ddp:bottom-banners:v1";

function read(): BottomBanner[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as BottomBanner[]) : [];
  } catch {
    return [];
  }
}

function write(list: BottomBanner[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
}

export function listBottomBanners(): BottomBanner[] {
  return read().sort((a, b) => a.sortOrder - b.sortOrder);
}

export function listActiveBottomBanners(): BottomBanner[] {
  return listBottomBanners().filter((b) => b.active);
}

export function createBottomBanner(input: Omit<BottomBanner, "id" | "createdAt">): BottomBanner {
  const banner: BottomBanner = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const list = read();
  list.push(banner);
  write(list);
  return banner;
}

export function updateBottomBanner(id: string, patch: Partial<Omit<BottomBanner, "id" | "createdAt">>) {
  write(read().map((b) => (b.id === id ? { ...b, ...patch } : b)));
}

export function deleteBottomBanner(id: string) {
  write(read().filter((b) => b.id !== id));
}

// Resize/crop any image File to a 800x350 JPEG (object-fit: cover).
// Returns a compressed data URL — keeps payload small for localStorage.
export async function processBottomBannerImage(file: File, quality = 0.82): Promise<string> {
  const TARGET_W = 800;
  const TARGET_H = 350;
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error("Imagem inválida"));
    im.src = dataUrl;
  });
  const canvas = document.createElement("canvas");
  canvas.width = TARGET_W;
  canvas.height = TARGET_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");

  // cover: scale so the smaller ratio fills, then center-crop
  const srcRatio = img.width / img.height;
  const dstRatio = TARGET_W / TARGET_H;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (srcRatio > dstRatio) {
    // source wider — crop sides
    sw = img.height * dstRatio;
    sx = (img.width - sw) / 2;
  } else {
    // source taller — crop top/bottom
    sh = img.width / dstRatio;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, TARGET_W, TARGET_H);
  return canvas.toDataURL("image/jpeg", quality);
}
