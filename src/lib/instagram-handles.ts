// Instagram username rules: 1-30 chars, letters, numbers, '.', '_'
const IG_USERNAME_RE = /^[A-Za-z0-9._]{1,30}$/;
const RESERVED = /^(p|reel|reels|explore|stories|tv|accounts|about|developer|legal)$/i;

export type ParsedInstagramHandle = { handle: string; url: string };

export type ParseInstagramResult = {
  valid: ParsedInstagramHandle[];
  invalid: string[];
};

/**
 * Parse a free-form text of Instagram references into normalized handles.
 *
 * Accepts:
 * - one per line, separated by comma, semicolon or whitespace
 * - bare username, @username
 * - full URLs (https://instagram.com/user, www.instagram.com/user/, with or without trailing slash)
 *
 * Returns deduplicated valid handles (case-insensitive) and a list of invalid tokens.
 */
export function parseInstagramHandles(raw: string): ParseInstagramResult {
  if (!raw) return { valid: [], invalid: [] };
  const tokens = raw.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
  const seen = new Set<string>();
  const valid: ParsedInstagramHandle[] = [];
  const invalid: string[] = [];
  for (const token of tokens) {
    let handle = token;
    const urlMatch = token.match(/instagram\.com\/+([^/?#]+)/i);
    if (urlMatch) handle = urlMatch[1];
    handle = handle.replace(/^@+/, "").replace(/\/+$/, "").trim();
    if (!handle || !IG_USERNAME_RE.test(handle) || RESERVED.test(handle)) {
      invalid.push(token);
      continue;
    }
    const key = handle.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    valid.push({ handle, url: `https://www.instagram.com/${handle}/` });
  }
  return { valid, invalid };
}
