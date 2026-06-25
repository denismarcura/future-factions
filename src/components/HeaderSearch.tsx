import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Trophy, Building2, User as UserIcon } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PREDICTIONS } from "@/lib/mock-data";
import { USERS } from "@/lib/mock-users";
import { searchCorpChallenges } from "@/lib/corp-challenges.functions";

type Result =
  | { kind: "challenge"; id: string; title: string; category: string; company?: string | null; logo?: string | null }
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
  const searchFn = useServerFn(searchCorpChallenges);

  // Debounce 220ms
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 220);
    return () => clearTimeout(t);
  }, [q]);

  // Close on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const canQuery = debounced.length >= 2;

  // Server-side search across real corporate challenges
  const { data: corp = [], isFetching } = useQuery({
    queryKey: ["search-corp", debounced],
    queryFn: () => searchFn({ data: { q: debounced, limit: 8 } }),
    enabled: canQuery,
    staleTime: 30_000,
  });

  const results: Result[] = useMemo(() => {
    if (!canQuery) return [];
    const n = norm(debounced);
    const out: Result[] = [];
    const seen = new Set<string>();

    // 1) Real corporate challenges first (priority for paying clients)
    for (const c of corp) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      out.push({
        kind: "challenge",
        id: c.id,
        title: c.title,
        category: c.companyName || c.category || "Empresa",
        company: c.companyName,
        logo: c.logoUrl,
      });
      if (out.length >= 8) break;
    }

    // 2) Mock predictions (Cup matches etc.)
    if (out.length < 8) {
      for (const p of PREDICTIONS) {
        if (seen.has(p.id)) continue;
        if (norm(p.title).includes(n) || norm(p.category).includes(n)) {
          seen.add(p.id);
          out.push({ kind: "challenge", id: p.id, title: p.title, category: p.category });
          if (out.length >= 8) break;
        }
      }
    }

    // 3) Users
    if (out.length < 10) {
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
  }, [debounced, canQuery, corp]);

  const showPanel = open && q.trim().length > 0;
  const tooShort = showPanel && debounced.length > 0 && debounced.length < 2;

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
              Digite pelo menos 2 letras para buscar…
            </div>
          )}
          {!tooShort && isFetching && results.length === 0 && (
            <div className="px-4 py-3 text-xs text-muted-foreground">Buscando…</div>
          )}
          {!tooShort && !isFetching && results.length === 0 && (
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
                      <span className="h-8 w-8 rounded-lg bg-primary/15 text-primary grid place-items-center shrink-0 overflow-hidden">
                        {r.logo ? (
                          <img src={r.logo} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Trophy className="h-4 w-4" />
                        )}
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
            Empresas em destaque · busca instantânea.
          </div>
        </div>
      )}
    </div>
  );
}
