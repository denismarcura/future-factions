import { useEffect, useRef, useState } from "react";
import { MapPin, X, Loader2 } from "lucide-react";
import { loadCities, searchCities, type IbgeCity } from "@/lib/cities-ibge";

export type SelectedCity = { id: number; nome: string; uf: string };

export function CitiesAutocomplete({
  value,
  onChange,
}: {
  value: SelectedCity[];
  onChange: (v: SelectedCity[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IbgeCity[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<IbgeCity[] | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancel = false;
    if (query.trim().length >= 3 && !cities) {
      setLoading(true);
      loadCities().then((list) => {
        if (cancel) return;
        setCities(list);
        setLoading(false);
      });
    }
    return () => {
      cancel = true;
    };
  }, [query, cities]);

  useEffect(() => {
    if (!cities) {
      setResults([]);
      return;
    }
    setResults(searchCities(cities, query));
  }, [query, cities]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function add(c: IbgeCity) {
    if (value.some((v) => v.id === c.id)) return;
    onChange([...value, c]);
    setQuery("");
    setOpen(false);
  }

  function remove(id: number) {
    onChange(value.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-2" ref={boxRef}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Digite ao menos 3 letras da cidade..."
          className="w-full pl-9 pr-3 h-11 rounded-xl glass-card border border-border/60 text-sm focus:border-primary outline-none"
        />
        {open && query.trim().length >= 3 && (
          <div className="absolute z-30 left-0 right-0 mt-1 glass-card border border-border/60 rounded-xl max-h-72 overflow-auto shadow-2xl">
            {loading ? (
              <div className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando cidades...
              </div>
            ) : results.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">Nenhuma cidade encontrada.</div>
            ) : (
              results.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => add(c)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted/40 flex items-center justify-between"
                >
                  <span>{c.nome}</span>
                  <span className="text-xs text-muted-foreground">{c.uf}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold border border-primary/30"
            >
              {c.nome}/{c.uf}
              <button
                type="button"
                onClick={() => remove(c.id)}
                className="h-5 w-5 rounded-full hover:bg-primary/20 grid place-items-center"
                aria-label={`Remover ${c.nome}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
