// Lightweight client-side logger for the "Participar" flow.
// Logs are printed to the console AND kept in window.__participarLogs
// so you can inspect them from DevTools: `copy(window.__participarLogs)`.

export type ParticipateLogReason =
  | "click"
  | "blocked:closed"
  | "blocked:already-confirmed"
  | "blocked:missing-subanswers"
  | "blocked:insufficient-balance"
  | "blocked:not-authenticated"
  | "regulamento:open"
  | "regulamento:accepted"
  | "regulamento:rejected"
  | "confirm:success"
  | "confirm:extra-success"
  | "error";

export interface ParticipateLogEntry {
  ts: string;
  challengeId: string;
  reason: ParticipateLogReason;
  message: string;
  context?: Record<string, unknown>;
}

const BUFFER_KEY = "__participarLogs";
const MAX_BUFFER = 200;

function getBuffer(): ParticipateLogEntry[] {
  if (typeof window === "undefined") return [];
  const w = window as unknown as Record<string, unknown>;
  if (!Array.isArray(w[BUFFER_KEY])) w[BUFFER_KEY] = [];
  return w[BUFFER_KEY] as ParticipateLogEntry[];
}

const COLORS: Record<string, string> = {
  click: "#3b82f6",
  blocked: "#ef4444",
  regulamento: "#f59e0b",
  confirm: "#22c55e",
  error: "#dc2626",
};

function colorFor(reason: ParticipateLogReason): string {
  const prefix = reason.split(":")[0];
  return COLORS[prefix] ?? "#64748b";
}

export function debugParticipate(entry: Omit<ParticipateLogEntry, "ts">): void {
  const full: ParticipateLogEntry = { ts: new Date().toISOString(), ...entry };
  const buf = getBuffer();
  buf.push(full);
  if (buf.length > MAX_BUFFER) buf.splice(0, buf.length - MAX_BUFFER);

  if (typeof console !== "undefined") {
    const color = colorFor(full.reason);
    // eslint-disable-next-line no-console
    console.groupCollapsed(
      `%c[Participar] ${full.reason}%c ${full.message}`,
      `color:${color};font-weight:bold;`,
      "color:inherit;font-weight:normal;",
    );
    // eslint-disable-next-line no-console
    console.log("challenge:", full.challengeId);
    if (full.context) {
      // eslint-disable-next-line no-console
      console.log("context:", full.context);
    }
    // eslint-disable-next-line no-console
    console.log("ts:", full.ts);
    // eslint-disable-next-line no-console
    console.groupEnd();
  }
}

export function dumpParticipateLogs(): ParticipateLogEntry[] {
  return [...getBuffer()];
}
