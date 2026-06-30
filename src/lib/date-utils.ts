const BRAZIL_TIMEZONE = "America/Sao_Paulo";
const BRAZIL_OFFSET_MS = 3 * 60 * 60 * 1000;

export function parseBrazilDateTimeLocal(value: string): Date | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;

  const [, year, month, day, hour, minute] = match;
  const utcTimestamp = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  );

  return new Date(utcTimestamp + BRAZIL_OFFSET_MS);
}

export function toBrazilISOString(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  const trimmed = value.trim();
  const parsedLocal = parseBrazilDateTimeLocal(trimmed);
  if (parsedLocal) {
    return parsedLocal.toISOString();
  }

  const parsedDate = new Date(trimmed);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString();
}

export function formatBrazilDateTimeLocalForInput(value: string | Date): string {
  const base = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(base.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BRAZIL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(base);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
}

export function getDeadlineTimestamp(value: string | Date | null | undefined): number | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.getTime();
  }

  const trimmed = value.trim();
  const parsedLocal = parseBrazilDateTimeLocal(trimmed);
  if (parsedLocal) {
    return parsedLocal.getTime();
  }

  const parsedDate = new Date(trimmed);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate.getTime();
}

export function isDeadlineExpired(value: string | Date | null | undefined, now = Date.now()): boolean {
  const deadline = getDeadlineTimestamp(value);
  return deadline !== null && deadline <= now;
}

export function getDefaultChallengeDeadline(
  matches: Array<{ kickoff: string }>,
  now: number | Date = Date.now(),
): string {
  const currentTime = now instanceof Date ? now.getTime() : now;
  const upcoming = matches
    .map((match) => ({ kickoff: match.kickoff, time: new Date(match.kickoff).getTime() }))
    .filter((match) => Number.isFinite(match.time) && match.time > currentTime)
    .sort((a, b) => a.time - b.time);

  if (upcoming.length > 0) {
    const fallbackMatch = upcoming[0];
    const kickoff = new Date(fallbackMatch.time);
    kickoff.setMinutes(kickoff.getMinutes() - 10);
    return kickoff.toISOString();
  }

  const fallback = new Date(currentTime + 7 * 24 * 60 * 60 * 1000);
  return fallback.toISOString();
}
