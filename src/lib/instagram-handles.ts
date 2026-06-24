// Instagram username rules: 1-30 chars, letters, numbers, '.', '_'
const IG_USERNAME_RE = /^[A-Za-z0-9._]{1,30}$/;
const RESERVED = /^(p|reel|reels|explore|stories|tv|accounts|about|developer|legal)$/i;

export type ParsedInstagramHandle = { handle: string; url: string };

export type InstagramRejectReason =
  | "empty"
  | "invalid_chars"
  | "too_long"
  | "reserved"
  | "duplicated";

export type RejectedInstagramHandle = {
  token: string;
  reason: InstagramRejectReason;
  message: string;
};

export type ParseInstagramResult = {
  valid: ParsedInstagramHandle[];
  invalid: RejectedInstagramHandle[];
};

const REASON_LABEL: Record<InstagramRejectReason, string> = {
  empty: "valor vazio",
  invalid_chars: "caracteres inválidos (use apenas letras, números, '.' e '_')",
  too_long: "ultrapassa 30 caracteres",
  reserved: "não é um perfil (link de post, reel ou página do Instagram)",
  duplicated: "perfil duplicado",
};

/**
 * Parse a free-form text of Instagram references into normalized handles.
 *
 * Accepts:
 * - one per line, separated by comma, semicolon or whitespace
 * - bare username, @username
 * - full URLs (https://instagram.com/user, www.instagram.com/user/, with or without trailing slash)
 *
 * Returns deduplicated valid handles (case-insensitive) plus a list of
 * rejected tokens with a specific reason ready to surface in the UI.
 */
export function parseInstagramHandles(raw: string): ParseInstagramResult {
  if (!raw) return { valid: [], invalid: [] };
  const tokens = raw.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
  const seen = new Set<string>();
  const valid: ParsedInstagramHandle[] = [];
  const invalid: RejectedInstagramHandle[] = [];

  const reject = (token: string, reason: InstagramRejectReason) => {
    invalid.push({ token, reason, message: REASON_LABEL[reason] });
  };

  for (const token of tokens) {
    let handle = token;
    const urlMatch = token.match(/instagram\.com\/+([^/?#]+)/i);
    if (urlMatch) handle = urlMatch[1];
    handle = handle.replace(/^@+/, "").replace(/\/+$/, "").trim();

    if (!handle) {
      reject(token, "empty");
      continue;
    }
    if (RESERVED.test(handle)) {
      reject(token, "reserved");
      continue;
    }
    if (handle.length > 30) {
      reject(token, "too_long");
      continue;
    }
    if (!IG_USERNAME_RE.test(handle)) {
      reject(token, "invalid_chars");
      continue;
    }

    const key = handle.toLowerCase();
    if (seen.has(key)) {
      reject(token, "duplicated");
      continue;
    }
    seen.add(key);
    valid.push({ handle, url: `https://www.instagram.com/${handle}/` });
  }
  return { valid, invalid };
}
