// Canonical share/invite link per user.
// Leads to the friend's showcase page which already lists
// open challenges, created challenges and corp opportunities.
//
// Pattern: {origin}/amigo/{ref}
// `ref` is the first 8 chars of the user's id (prefix match in loader).

export function inviteRefFromUserId(userId: string | null | undefined): string {
  if (!userId) return "";
  return String(userId).slice(0, 8);
}

export function buildInviteUrl(userId: string | null | undefined): string {
  const ref = inviteRefFromUserId(userId);
  if (!ref) return "";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/amigo/${ref}`;
}

export function buildInvitePath(userId: string | null | undefined): string {
  const ref = inviteRefFromUserId(userId);
  return ref ? `/amigo/${ref}` : "/";
}
