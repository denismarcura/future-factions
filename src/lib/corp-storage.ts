import { supabase } from "@/integrations/supabase/client";

const BUCKET = "corp-challenges";
// 100 years in seconds — effectively "permanent" signed URL
const SIGN_TTL = 60 * 60 * 24 * 365 * 100;

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

/** Uploads a data: URL to storage and returns a long-lived signed URL.
 *  If the input is already an http(s) URL, returns it unchanged. */
export async function uploadCorpAsset(
  challengeId: string,
  name: string,
  dataUrl: string | null,
): Promise<string | null> {
  if (!dataUrl) return null;
  if (/^https?:/i.test(dataUrl)) return dataUrl;
  const blob = dataUrlToBlob(dataUrl);
  if (!blob) return null;
  const ext = extFromMime(blob.type);
  const path = `${challengeId}/${name}-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: blob.type, upsert: true });
  if (upErr) throw new Error(`Falha no upload (${name}): ${upErr.message}`);
  const { data: signed, error: signErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGN_TTL);
  if (signErr || !signed) throw new Error(`Falha ao gerar URL (${name}): ${signErr?.message ?? "?"}`);
  return signed.signedUrl;
}

export async function uploadCorpAssets(
  challengeId: string,
  arts: string[],
): Promise<string[]> {
  const out: string[] = [];
  for (let i = 0; i < arts.length; i++) {
    const u = await uploadCorpAsset(challengeId, `arte-${i + 1}`, arts[i]);
    if (u) out.push(u);
  }
  return out;
}
