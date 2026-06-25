import { useEffect, useState, useMemo } from "react";
import { Clock } from "lucide-react";

function timeLeftMs(iso: string) {
  return new Date(iso).getTime() - Date.now();
}

function formatShort(ms: number): string {
  if (ms <= 0) return "Encerrado";
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function ClosingTimerBadge({ closesAt }: { closesAt: string }) {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const ms = useMemo(() => timeLeftMs(closesAt), [closesAt, now]);
  const hours = ms / 3600000;

  let gradient = "";
  let glow = "";
  if (hours < 24) {
    gradient = "linear-gradient(135deg, oklch(0.55 0.26 25), oklch(0.72 0.20 35))";
    glow = "0 0 20px oklch(0.60 0.22 25 / 50%)";
  } else if (hours <= 72) {
    gradient = "linear-gradient(135deg, oklch(0.75 0.14 80), oklch(0.88 0.16 90))";
    glow = "0 0 20px oklch(0.82 0.14 85 / 50%)";
  } else {
    gradient = "linear-gradient(135deg, oklch(0.70 0.22 142), oklch(0.85 0.18 145))";
    glow = "0 0 20px oklch(0.78 0.20 142 / 50%)";
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11px] font-black uppercase tracking-wide text-white shadow-lg"
      style={{
        background: gradient,
        boxShadow: glow,
      }}
    >
      <Clock className="h-3 w-3" />
      {formatShort(ms)}
    </span>
  );
}

export function getUrgencyHours(closesAt: string) {
  const ms = timeLeftMs(closesAt);
  return ms / 3600000;
}
