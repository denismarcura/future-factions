import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Trophy, Building2, User as UserIcon } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { PREDICTIONS } from "@/lib/mock-data";
import { USERS } from "@/lib/mock-users";

type Result =
  | { kind: "challenge"; id: string; title: string; category: string }
  | { kind: "user"; id: string; title: string; subtitle: string };

function norm(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function HeaderSearch({ className = "" }: { className?: string }) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  // Debounce 180ms (AJAX-style instant search, sem chamar IA)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 180);
    return () => clearTimeout(t);
  }, [q]);

  // Fechar ao clicar fora
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const results: Result[] = useMemo(() => {
    if (debounced.length < 3) return [];
    const n = norm(debounced);
    const out: Result[] = [];

    for (const p of PREDICTIONS) {
      if (norm(p.title).includes(n) || norm(p.category).includes(n)) {
        out.push({ kind: "challenge", id: p.id, title: p.title, category: p.category });
        if (out.length >= 8) break;
      }
    }

    if (out.length < 8) {
      for (const u of USERS) {
        if (norm(u.username).includes(n) || norm(u.city).includes(n)) {
          out.push({
            kind: "user",
            id: u.id,
            title: `@${u.username}`,
            subtitle: `${u.city}/${u.state} · ${u.level}`,
          });
          if (out.length >= 10) break;
        }
      }
    }

    return out;
  }, [debounced]);

  const showPanel = open && q.trim().length > 0;
  const tooShort = showPanel && debounced.length > 0 && debounced.length < 3;

  return (
    <div ref={wrapRef} className={`relative w-full ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") { setOpen(false); (e.target as HTMLInputElement).blur(); }
          if (e.key === "Enter" && results[0]) {
            const r = results[0];
            if (r.kind === "challenge") navigate({ to: "/previsao/$id", params: { id: r.id } });
            setOpen(false);
          }
        }}
        placeholder="Buscar desafios, empresas, palpiteiros…"
        className="w-full h-10 pl-9 pr-9 rounded-full bg-card border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
      />
      {q && (
        <button
          type="button"
          onClick={() => { setQ(""); setOpen(false); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 grid place-items-center rounded-full hover:bg-muted"
          aria-label="Limpar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {showPanel && (
        <div className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-border/60 bg-popover shadow-xl overflow-hidden z-50">
          {tooShort && (
            <div className="px-4 py-3 text-xs text-muted-foreground">
              Digite pelo menos 3 letras para buscar…
            </div>
          )}
          {!tooShort && results.length === 0 && (
            <div className="px-4 py-3 text-xs text-muted-foreground">
              Nenhum resultado para "{debounced}".
            </div>
          )}
          {!tooShort && results.length > 0 && (
            <ul className="max-h-[60vh] overflow-y-auto">
              {results.map((r) => (
                <li key={`${r.kind}-${r.id}`}>
                  {r.kind === "challenge" ? (
                    <Link
                      to="/previsao/$id"
                      params={{ id: r.id }}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/60 transition"
                    >
                      <span className="h-8 w-8 rounded-lg bg-primary/15 text-primary grid place-items-center shrink-0">
                        <Trophy className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold truncate">{r.title}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{r.category}</div>
                      </div>
                    </Link>
                  ) : (
                    <Link
                      to="/perfil"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/60 transition"
                    >
                      <span className="h-8 w-8 rounded-lg bg-gold/15 text-gold grid place-items-center shrink-0">
                        <UserIcon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold truncate">{r.title}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{r.subtitle}</div>
                      </div>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="px-3 py-2 border-t border-border/60 text-[10px] text-muted-foreground flex items-center gap-1.5">
            <Building2 className="h-3 w-3" />
            Busca local e instantânea — não consome tokens.
          </div>
        </div>
      )}
    </div>
  );
}
