// Server-only client for football-data.org (Free tier: 10 requests/minute).
// Never import this from client-reachable modules at the top level.

const BASE_URL = "https://api.football-data.org/v4";

// Simple in-process rate limiter (token bucket: 10 tokens / 60s).
const WINDOW_MS = 60_000;
const MAX_REQ = 10;
const recentCalls: number[] = [];

async function waitForSlot() {
  while (true) {
    const now = Date.now();
    while (recentCalls.length && now - recentCalls[0] > WINDOW_MS) recentCalls.shift();
    if (recentCalls.length < MAX_REQ) {
      recentCalls.push(now);
      return;
    }
    const wait = WINDOW_MS - (now - recentCalls[0]) + 50;
    await new Promise((r) => setTimeout(r, wait));
  }
}

export type FdFetchResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
};

export async function fdFetch<T = unknown>(path: string): Promise<FdFetchResult<T>> {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) {
    return { ok: false, status: 0, data: null, error: "FOOTBALL_DATA_API_KEY not configured" };
  }
  await waitForSlot();
  let attempt = 0;
  while (attempt < 3) {
    attempt++;
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        headers: { "X-Auth-Token": key, Accept: "application/json" },
      });
      if (res.status === 429) {
        const retryAfter = Number(res.headers.get("X-RequestCounter-Reset") ?? 30);
        await new Promise((r) => setTimeout(r, Math.min(retryAfter, 60) * 1000));
        continue;
      }
      const text = await res.text();
      const json = text ? JSON.parse(text) : null;
      if (!res.ok) {
        return { ok: false, status: res.status, data: null, error: json?.message ?? text };
      }
      return { ok: true, status: res.status, data: json as T };
    } catch (e) {
      if (attempt >= 3) {
        return { ok: false, status: 0, data: null, error: e instanceof Error ? e.message : String(e) };
      }
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  return { ok: false, status: 0, data: null, error: "Max retries exceeded" };
}

export type FdTeam = { id: number; name: string; crest?: string | null };
export type FdMatch = {
  id: number;
  utcDate: string;
  status: string;
  matchday: number | null;
  stage: string | null;
  group: string | null;
  homeTeam: FdTeam;
  awayTeam: FdTeam;
  score: { winner: string | null; fullTime: { home: number | null; away: number | null } };
  competition?: { code: string; name: string };
  season?: { startDate: string; endDate: string };
  lastUpdated?: string;
};

export type FdMatchesResponse = {
  matches: FdMatch[];
  competition?: { code: string; name: string };
  resultSet?: { count: number };
};

export type FdListOpts = {
  season?: number;
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string;
  status?: string; // CSV
  matchday?: number;
  stage?: string;
};

export function buildMatchesPath(code: string, opts: FdListOpts = {}) {
  const params = new URLSearchParams();
  if (opts.season) params.set("season", String(opts.season));
  if (opts.dateFrom) params.set("dateFrom", opts.dateFrom);
  if (opts.dateTo) params.set("dateTo", opts.dateTo);
  if (opts.status) params.set("status", opts.status);
  if (opts.matchday) params.set("matchday", String(opts.matchday));
  if (opts.stage) params.set("stage", opts.stage);
  const qs = params.toString();
  return `/competitions/${code}/matches${qs ? `?${qs}` : ""}`;
}

export function listMatches(code: string, opts: FdListOpts = {}) {
  return fdFetch<FdMatchesResponse>(buildMatchesPath(code, opts));
}

export function getMatch(externalId: string | number) {
  return fdFetch<{ match: FdMatch }>(`/matches/${externalId}`);
}

export function mapStatus(s: string): string {
  switch (s) {
    case "SCHEDULED":
    case "TIMED":
      return "agendado";
    case "IN_PLAY":
    case "PAUSED":
    case "LIVE":
      return "ao_vivo";
    case "FINISHED":
      return "encerrado";
    case "POSTPONED":
    case "SUSPENDED":
    case "CANCELLED":
    case "AWARDED":
      return "cancelado";
    default:
      return s.toLowerCase();
  }
}

export function utcToBrasil(utcDate: string): string {
  // Returns ISO string adjusted to BRT (UTC-3, no DST since 2019).
  const d = new Date(utcDate);
  return new Date(d.getTime() - 3 * 60 * 60 * 1000).toISOString();
}
