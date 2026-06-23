import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlarmClock, X, ArrowRight } from "lucide-react";
import { PREDICTIONS, type Prediction } from "@/lib/mock-data";
import { CATEGORY_IMAGES } from "@/lib/category-images";

const WINDOW_MS = 10 * 60 * 1000;
const DISMISS_KEY = "ddp:closing-alert-dismissed";

function getClosingSoon(): Prediction[] {
  const now = Date.now();
  return PREDICTIONS.filter((p) => {
    const t = new Date(p.closesAt).getTime() - now;
    return t > 0 && t <= WINDOW_MS;
  }).slice(0, 6);
}

function formatLeft(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function ClosingSoonAlert() {
  const [tick, setTick] = useState(0);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DISMISS_KEY);
      if (raw) setDismissedIds(new Set(JSON.parse(raw)));
    } catch {}
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const closing = useMemo(() => getClosingSoon(), [tick]);
  const visible = useMemo(
    () => closing.filter((p) => !dismissedIds.has(p.id)),
    [closing, dismissedIds],
  );

  useEffect(() => {
    if (visible.length > 0) setOpen(true);
  }, [visible.length]);

  if (!open || visible.length === 0) return null;

  const dismiss = () => {
    const next = new Set(dismissedIds);
    visible.forEach((p) => next.add(p.id));
    setDismissedIds(next);
    try {
      sessionStorage.setItem(DISMISS_KEY, JSON.stringify([...next]));
    } catch {}
    setOpen(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-16 md:bottom-4 z-50 px-3 pointer-events-none">
      <div className="max-w-5xl mx-auto pointer-events-auto rounded-2xl border border-destructive/50 bg-background/95 backdrop-blur-xl shadow-glow overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/60 bg-destructive/10">
          <div className="flex items-center gap-2 min-w-0">
            <span className="grid place-items-center h-8 w-8 rounded-full bg-destructive/20 text-destructive shrink-0 animate-pulse">
              <AlarmClock className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="font-display font-black text-sm sm:text-base leading-tight">
                Últimos 10 minutos!
              </div>
              <div className="text-[11px] sm:text-xs text-muted-foreground truncate">
                {visible.length} {visible.length === 1 ? "desafio está" : "desafios estão"} encerrando os palpites
              </div>
            </div>
          </div>
          <button
            onClick={dismiss}
            aria-label="Fechar"
            className="h-8 w-8 grid place-items-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-3 min-w-min">
            {visible.map((p) => {
              const left = new Date(p.closesAt).getTime() - Date.now();
              const img = CATEGORY_IMAGES[p.category];
              return (
                <Link
                  key={p.id}
                  to="/previsao/$id"
                  params={{ id: p.id }}
                  className="group shrink-0 w-[260px] sm:w-[280px] rounded-xl border border-border/60 hover:border-destructive/60 bg-card overflow-hidden transition flex"
                >
                  {img && (
                    <div className="w-20 h-auto shrink-0 overflow-hidden">
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="flex-1 p-3 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-primary font-bold truncate">
                        {p.category}
                      </div>
                      <div className="text-xs font-bold leading-tight line-clamp-2 mt-1">
                        {p.title}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/15 text-destructive border border-destructive/30 text-[10px] font-black tabular-nums">
                        <AlarmClock className="h-3 w-3" /> {formatLeft(left)}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-destructive transition" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
