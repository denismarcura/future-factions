// Canonical share/invite link per user.
//
// New public pattern requested by the client:
//   {origin}/{slug}
// Example:
//   https://www.desafiodospalpites.com.br/denismarcura1975
//
// The slug is deterministic and does not require charging or reserving tokens:
// 1) Instagram handle, 2) e-mail prefix, 3) full name, 4) id prefix fallback.

type Metadata = Record<string, unknown> | null | undefined;

export type InviteUserLike = {
  id?: string | null;
  email?: string | null;
  user_metadata?: Metadata;
} | null | undefined;

export type InviteProfileLike = {
  id?: string | null;
  email?: string | null;
  instagram?: string | null;
  full_name?: string | null;
} | null | undefined;

const RESERVED_SLUGS = new Set([
  "admin",
  "amigo",
  "api",
  "auth",
  "como-funciona",
  "como-funcionam-os-tokens",
  "criar",
  "dashboard",
  "desafios",
  "desafios-empresas",
  "empresa",
  "empresas",
  "faq",
  "lovable",
  "missoes",
  "noticias",
  "palpite-ia",
  "perfil",
  "previsao",
  "ranking",
  "reset-password",
  "shop",
  "termos",
  "top100",
]);

export function normalizeInviteSlug(value: string | null | undefined): string {
  if (!value) return "";
  return String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^instagram\.com\//i, "")
    .replace(/^@+/, "")
    .split(/[/?#]/)[0]
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 40);
}

function safeSlug(value: string | null | undefined): string {
  const slug = normalizeInviteSlug(value);
  if (slug.length < 3) return "";
  if (RESERVED_SLUGS.has(slug)) return "";
  return slug;
}

export function inviteRefFromUserId(userId: string | null | undefined): string {
  if (!userId) return "";
  return normalizeInviteSlug(String(userId).slice(0, 8));
}

export function inviteSlugFromProfile(profile: InviteProfileLike): string {
  if (!profile) return "";
  const emailPrefix = profile.email?.split("@")[0];
  return (
    safeSlug(profile.instagram) ||
    safeSlug(emailPrefix) ||
    safeSlug(profile.full_name) ||
    inviteRefFromUserId(profile.id)
  );
}

export function inviteSlugFromUser(user: InviteUserLike): string {
  if (!user) return "";
  const meta = user.user_metadata ?? {};
  return inviteSlugFromProfile({
    id: user.id,
    email: user.email,
    instagram: typeof meta.instagram === "string" ? meta.instagram : null,
    full_name: typeof meta.full_name === "string" ? meta.full_name : null,
  });
}

export function defaultInviteOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return "https://www.desafiodospalpites.com.br";
}

export function buildInviteUrl(input: InviteUserLike | string | null | undefined, origin = defaultInviteOrigin()): string {
  const slug = typeof input === "string" ? inviteRefFromUserId(input) : inviteSlugFromUser(input);
  if (!slug) return "";
  return `${origin.replace(/\/$/, "")}/${slug}`;
}

export function buildInviteUrlFromProfile(profile: InviteProfileLike, origin = defaultInviteOrigin()): string {
  const slug = inviteSlugFromProfile(profile);
  if (!slug) return "";
  return `${origin.replace(/\/$/, "")}/${slug}`;
}

export function buildInvitePath(input: InviteUserLike | InviteProfileLike | string | null | undefined): string {
  const slug = typeof input === "string"
    ? inviteRefFromUserId(input)
    : "user_metadata" in (input ?? {})
      ? inviteSlugFromUser(input as InviteUserLike)
      : inviteSlugFromProfile(input as InviteProfileLike);
  return slug ? `/${slug}` : "/";
}
