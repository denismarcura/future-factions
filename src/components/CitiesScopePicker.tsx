import { useEffect, useRef, useState } from "react";
import { MapPin, X, Loader2, Hash, Type } from "lucide-react";
import { loadCities, searchCities, type IbgeCity } from "@/lib/cities-ibge";
import type { SelectedCity } from "@/components/CitiesAutocomplete";

type Mode = "name" | "cep";

type Slot = {
  mode: Mode;
  city: SelectedCity | null;
  cep: string;
  cepLoading?: boolean;
  cepError?: string;
};

const MAX = 10;

function emptySlot(): Slot {
  return { mode: "name", city: null, cep: "" };
}

function cepIdFromString(cep: string): number {
  // Negative synthetic id (real IBGE ids are positive) to avoid collisions
  const digits = cep.replace(/\D/g, "").slice(0, 8) || "0";
  return -Number(digits);
}

function formatCep(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function CitiesScopePicker({
  value,
  onChange,
}: {
  value: SelectedCity[];
  onChange: (v: SelectedCity[]) => void;
}) {
  const [quantity, setQuantity] = useState<number>(Math.max(1, value.length || 1));
  const [slots, setSlots] = useState<Slot[]>(() => {
    const initial = value.map<Slot>((c) => ({ mode: "name", city: c, cep: "" }));
    while (initial.length < Math.max(1, value.length || 1)) initial.push(emptySlot());
    return initial;
  });

  // Sync slot count with quantity
  useEffect(() => {
    setSlots((prev) => {
      if (prev.length === quantity) return prev;
      if (prev.length < quantity) {
        return [...prev, ...Array.from({ length: quantity - prev.length }, emptySlot)];
      }
      return prev.slice(0, quantity);
    });
  }, [quantity]);

  // Emit selected cities upward
  useEffect(() => {
    const selected = slots
      .map((s) => s.city)
      .filter((c): c is SelectedCity => !!c);
    // Dedup by id
    const seen = new Set<number>();
    const dedup = selected.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
    onChange(dedup);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots]);

  function updateSlot(i: number, patch: Partial<Slot>) {
    setSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
          Quantas cidades podem participar?
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: MAX }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setQuantity(n)}
              className={`h-9 w-10 rounded-lg border text-sm font-bold transition ${
                quantity === n
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {n.toString().padStart(2, "0")}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {slots.map((slot, i) => (
          <SlotCard
            key={i}
            index={i}
            slot={slot}
            onChange={(patch) => updateSlot(i, patch)}
          />
        ))}
      </div>
    </div>
  );
}

function SlotCard({
  index,
  slot,
  onChange,
}: {
  index: number;
  slot: Slot;
  onChange: (patch: Partial<Slot>) => void;
}) {
  return (
    <div className="rounded-xl border border-border/60 p-3 space-y-3 bg-card/40">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Cidade #{(index + 1).toString().padStart(2, "0")}
        </div>
        <div className="flex gap-1 rounded-lg border border-border/60 p-1">
          <button
            type="button"
            onClick={() => onChange({ mode: "name", city: null, cep: "" })}
            className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 ${
              slot.mode === "name" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            <Type className="h-3 w-3" /> Nome
          </button>
          <button
            type="button"
            onClick={() => onChange({ mode: "cep", city: null, cep: "" })}
            className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 ${
              slot.mode === "cep" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            <Hash className="h-3 w-3" /> CEP
          </button>
        </div>
      </div>

      {slot.mode === "name" ? (
        <NamePicker
          value={slot.city}
          onPick={(c) => onChange({ city: c })}
        />
      ) : (
        <CepPicker
          cep={slot.cep}
          city={slot.city}
          loading={!!slot.cepLoading}
          error={slot.cepError}
          onCepChange={(cep) => onChange({ cep, cepError: undefined })}
          onResolved={(c) => onChange({ city: c, cepLoading: false, cepError: undefined })}
          onLoading={(l) => onChange({ cepLoading: l })}
          onError={(e) => onChange({ cepError: e, cepLoading: false, city: null })}
        />
      )}
    </div>
  );
}

function NamePicker({
  value,
  onPick,
}: {
  value: SelectedCity | null;
  onPick: (c: SelectedCity | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [cities, setCities] = useState<IbgeCity[] | null>(null);
  const [results, setResults] = useState<IbgeCity[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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
    return () => { cancel = true; };
  }, [query, cities]);

  useEffect(() => {
    if (!cities) { setResults([]); return; }
    setResults(searchCities(cities, query));
  }, [query, cities]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-lg bg-primary/10 border border-primary/30 px-3 py-2">
        <div className="text-sm font-semibold">
          <MapPin className="h-4 w-4 inline mr-1 text-primary" />
          {value.nome} <span className="text-muted-foreground">- {value.uf}</span>
        </div>
        <button
          type="button"
          onClick={() => onPick(null)}
          className="h-7 w-7 grid place-items-center rounded-full hover:bg-primary/20"
          aria-label="Remover"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={boxRef}>
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Nome da cidade (mín. 3 letras) — ex.: São Paulo"
        className="w-full pl-9 pr-3 h-10 rounded-lg glass-card border border-border/60 text-sm focus:border-primary outline-none"
      />
      {open && query.trim().length >= 3 && (
        <div className="absolute z-30 left-0 right-0 mt-1 glass-card border border-border/60 rounded-xl max-h-64 overflow-auto shadow-2xl">
          {loading ? (
            <div className="p-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando cidades...
            </div>
          ) : results.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground">Nenhuma cidade encontrada.</div>
          ) : (
            results.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => { onPick({ id: c.id, nome: c.nome, uf: c.uf }); setQuery(""); setOpen(false); }}
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
  );
}

function CepPicker({
  cep,
  city,
  loading,
  error,
  onCepChange,
  onResolved,
  onLoading,
  onError,
}: {
  cep: string;
  city: SelectedCity | null;
  loading: boolean;
  error?: string;
  onCepChange: (v: string) => void;
  onResolved: (c: SelectedCity) => void;
  onLoading: (b: boolean) => void;
  onError: (e: string) => void;
}) {
  async function resolve(rawCep: string) {
    const digits = rawCep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    onLoading(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await r.json();
      if (data?.erro) {
        onError("CEP não encontrado.");
        return;
      }
      onResolved({
        id: cepIdFromString(digits),
        nome: data.localidade || "Cidade",
        uf: data.uf || "",
      });
    } catch {
      onError("Falha ao consultar o CEP.");
    }
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          inputMode="numeric"
          value={formatCep(cep)}
          onChange={(e) => {
            const v = e.target.value;
            onCepChange(v);
            const digits = v.replace(/\D/g, "");
            if (digits.length === 8) resolve(digits);
          }}
          placeholder="CEP (00000-000)"
          className="w-full pl-9 pr-3 h-10 rounded-lg glass-card border border-border/60 text-sm focus:border-primary outline-none"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {error && <div className="text-xs text-destructive">{error}</div>}
      {city && (
        <div className="text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 inline mr-1 text-primary" />
          <strong className="text-foreground">{city.nome}</strong> - {city.uf}
        </div>
      )}
    </div>
  );
}
