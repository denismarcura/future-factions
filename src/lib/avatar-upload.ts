import { supabase } from "@/integrations/supabase/client";

const BUCKET = "avatars";
const SIGN_TTL = 60 * 60 * 24 * 365 * 100; // ~100 years
const PENDING_KEY = "ddp:pending-avatar";

function dataUrlToBlob(dataUrl: string): Blob | null {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  const [, mime, b64] = m;
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function extFromMime(mime: string): string {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  return "jpg";
}

/** Upload avatar (data URL or Blob/File) for the current user and return a signed URL. */
export async function uploadAvatar(
  userId: string,
  source: string | Blob,
): Promise<string> {
  const blob =
    typeof source === "string" ? dataUrlToBlob(source) : source;
  if (!blob) throw new Error("Imagem inválida");
  const ext = extFromMime(blob.type || "image/jpeg");
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: blob.type || "image/jpeg", upsert: true });
  if (upErr) throw new Error(upErr.message);
  const { data: signed, error: signErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGN_TTL);
  if (signErr || !signed) throw new Error(signErr?.message ?? "Falha ao gerar URL");
  return signed.signedUrl;
}

export function savePendingAvatar(dataUrl: string) {
  try {
    window.localStorage.setItem(PENDING_KEY, dataUrl);
  } catch {
    /* ignore quota */
  }
}

export function takePendingAvatar(): string | null {
  try {
    const v = window.localStorage.getItem(PENDING_KEY);
    if (v) window.localStorage.removeItem(PENDING_KEY);
    return v;
  } catch {
    return null;
  }
}
