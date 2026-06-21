// Lightweight local-only friends list for the dashboard.
// (No friends table on the backend yet — kept simple per user request.)

export type Friend = {
  id: string;
  name: string;
  whatsapp?: string;
  email?: string;
  registered: boolean;
  invitedAt: string;
  lastInviteAt?: string;
};

const KEY = "ddp:friends";

function read(): Friend[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Friend[]) : [];
  } catch {
    return [];
  }
}

function write(list: Friend[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("ddp:friends-updated"));
  } catch {
    /* ignore */
  }
}

export function listFriends(): Friend[] {
  return read();
}

export function addFriend(input: Omit<Friend, "id" | "invitedAt" | "registered"> & { registered?: boolean }): Friend {
  const f: Friend = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    whatsapp: input.whatsapp?.trim() || undefined,
    email: input.email?.trim() || undefined,
    registered: input.registered ?? false,
    invitedAt: new Date().toISOString(),
  };
  const list = read();
  list.unshift(f);
  write(list);
  return f;
}

export function removeFriend(id: string) {
  write(read().filter((f) => f.id !== id));
}

export function markInviteSent(id: string) {
  const list = read();
  const i = list.findIndex((f) => f.id === id);
  if (i === -1) return;
  list[i] = { ...list[i], lastInviteAt: new Date().toISOString() };
  write(list);
}

/** Parses a free-text list (lines, commas, semicolons or tabs) into entries.
 *  Each entry may be a name, an email, a phone number, or "Name <email>" / "Name - phone". */
export function parseFriendsText(text: string): Array<{ name: string; email?: string; whatsapp?: string }> {
  const tokens = text
    .split(/[\n,;\t]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const emailRe = /[^\s<>"]+@[^\s<>"]+\.[^\s<>"]+/;
  const phoneRe = /\+?\d[\d\s().-]{7,}\d/;
  const out: Array<{ name: string; email?: string; whatsapp?: string }> = [];
  for (const raw of tokens) {
    const email = raw.match(emailRe)?.[0];
    const phone = raw.replace(email ?? "", "").match(phoneRe)?.[0];
    let name = raw
      .replace(email ?? "", "")
      .replace(phone ?? "", "")
      .replace(/[<>()\-–—|]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!name) name = email ?? phone ?? raw;
    out.push({
      name,
      email: email || undefined,
      whatsapp: phone ? phone.replace(/\D/g, "") : undefined,
    });
  }
  return out;
}

export function addManyFromText(text: string): number {
  const entries = parseFriendsText(text);
  let added = 0;
  for (const e of entries) {
    if (!e.name && !e.email && !e.whatsapp) continue;
    addFriend(e);
    added++;
  }
  return added;
}

export function toggleRegistered(id: string) {
  const list = read();
  const i = list.findIndex((f) => f.id === id);
  if (i === -1) return;
  list[i] = { ...list[i], registered: !list[i].registered };
  write(list);
}

/** Builds a WhatsApp share URL.
 *  - With a phone: uses wa.me/<digits> (opens the conversation directly).
 *  - Without a phone: uses api.whatsapp.com/send, which opens the contact
 *    picker reliably on web/desktop (wa.me/ with no number errors out on
 *    several browsers). */
export function whatsappLink(phone: string | undefined, message: string) {
  const digits = (phone ?? "").replace(/\D/g, "");
  const text = encodeURIComponent(message);
  if (digits) return `https://wa.me/${digits}?text=${text}`;
  return `https://api.whatsapp.com/send?text=${text}`;
}
