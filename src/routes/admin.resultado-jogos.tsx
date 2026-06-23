import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useMemo } from "react";
import { Trophy, Radio, Loader2, Upload, Save, Plus, Trash2, Image as ImageIcon, Search, Mail, X, Copy, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  listWorldCupResults,
  upsertWorldCupResult,
  deleteWorldCupResult,
  type WorldCupResultRow,
} from "@/lib/world-cup-results.functions";
import { uploadResultImage } from "@/lib/world-cup-results-client";
import { generateResultEmail } from "@/lib/result-email.functions";

export const Route = createFileRoute("/admin/resultado-jogos")({
  head: () => ({ meta: [{ title: "Resultado dos Jogos — Admin" }] }),
  component: Page,
});

function fmtDateBR(d: string) {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function Page() {
  const listFn = useServerFn(listWorldCupResults);
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin", "wc-results"],
    queryFn: () => listFn(),
  });

  const [query, setQuery] = useState("");
  const [emailFor, setEmailFor] = useState<WorldCupResultRow | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.home_team.toLowerCase().includes(q) ||
        r.away_team.toLowerCase().includes(q) ||
        r.match_date.includes(q),
    );
  }, [rows, query]);

  const grouped = filtered.reduce<Record<string, WorldCupResultRow[]>>((acc, r) => {
    (acc[r.match_date] = acc[r.match_date] || []).push(r);
    return acc;
  }, {});
  const dates = Object.keys(grouped).sort();

  const totals = {
    total: rows.length,
    encerrados: rows.filter((r) => r.status === "encerrado").length,
    aoVivo: rows.filter((r) => r.status === "em_andamento").length,
  };

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "wc-results"] });
    qc.invalidateQueries({ queryKey: ["wc-results"] });
  };

  const [showNew, setShowNew] = useState(false);

  return (
    <AppShell>
      <section className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/admin" className="text-xs text-muted-foreground hover:text-primary">
            ← Admin
          </Link>
          <h1 className="font-display text-3xl font-black mt-1 flex items-center gap-2">
            <Trophy className="h-7 w-7 text-gold" /> Resultado dos Jogos
          </h1>
          <p className="text-sm text-muted-foreground">
            Cadastre o placar de cada jogo. Os cards correspondentes são atualizados automaticamente em todo o app.
          </p>
        </div>
        <button
          onClick={() => setShowNew((v) => !v)}
          className="h-10 px-4 rounded-lg bg-gradient-brand text-primary-foreground text-sm font-bold inline-flex items-center gap-2 shadow-glow"
        >
          <Plus className="h-4 w-4" /> Novo jogo
        </button>
      </section>

      <section className="grid grid-cols-3 gap-3 mb-6">
        {[
          { k: "Jogos", v: totals.total },
          { k: "Encerrados", v: totals.encerrados },
          { k: "Em andamento", v: totals.aoVivo },
        ].map((s) => (
          <div key={s.k} className="rounded-xl glass-card p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.k}</div>
            <div className="font-display text-2xl font-black mt-1">{s.v}</div>
          </div>
        ))}
      </section>

      {showNew && (
        <div className="mb-6">
          <ResultForm onSaved={() => { setShowNew(false); invalidate(); }} onCancel={() => setShowNew(false)} />
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Carregando...
        </div>
      ) : (
        <div className="space-y-6">
          {dates.map((d) => (
            <section key={d}>
              <h2 className="font-display font-black text-lg mb-2">{fmtDateBR(d)}</h2>
              <div className="grid gap-3">
                {grouped[d].map((r) => (
                  <ResultRow key={r.id} row={r} onChanged={invalidate} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function ResultRow({ row, onChanged }: { row: WorldCupResultRow; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const delFn = useServerFn(deleteWorldCupResult);
  const del = useMutation({
    mutationFn: () => delFn({ data: { id: row.id } }),
    onSuccess: onChanged,
  });

  if (editing) {
    return <ResultForm row={row} onSaved={() => { setEditing(false); onChanged(); }} onCancel={() => setEditing(false)} />;
  }

  const winner =
    row.home_score > row.away_score ? "home" : row.away_score > row.home_score ? "away" : "draw";

  return (
    <div className="rounded-xl glass-card p-4 flex items-center gap-4 flex-wrap">
      {row.image_url ? (
        <img src={row.image_url} alt="" className="h-14 w-20 object-cover rounded-lg border border-border/60" loading="lazy" />
      ) : (
        <div className="h-14 w-20 rounded-lg border border-dashed border-border/60 grid place-items-center text-muted-foreground">
          <ImageIcon className="h-4 w-4" />
        </div>
      )}
      <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
        <span className={`text-sm font-bold truncate ${winner === "home" ? "text-primary" : ""}`}>{row.home_team}</span>
        <span className="font-display text-2xl font-black tabular-nums text-gradient-brand">
          {row.home_score} <span className="text-muted-foreground">×</span> {row.away_score}
        </span>
        <span className={`text-sm font-bold truncate ${winner === "away" ? "text-primary" : ""}`}>{row.away_team}</span>
      </div>
      {row.status === "encerrado" ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 font-bold uppercase tracking-wider text-[10px]">
          <Trophy className="h-3 w-3" /> Encerrado
        </span>
      ) : row.status === "em_andamento" ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/15 text-destructive border border-destructive/30 font-bold uppercase tracking-wider text-[10px] animate-pulse">
          <Radio className="h-3 w-3" /> Ao vivo
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60 font-bold uppercase tracking-wider text-[10px]">
          Agendado
        </span>
      )}
      <div className="flex gap-2">
        <button onClick={() => setEditing(true)} className="h-9 px-3 rounded-lg border border-border text-xs font-bold">
          Editar
        </button>
        <button
          onClick={() => { if (confirm("Excluir esse resultado?")) del.mutate(); }}
          disabled={del.isPending}
          className="h-9 px-3 rounded-lg border border-destructive/40 text-destructive text-xs font-bold inline-flex items-center gap-1 disabled:opacity-50"
        >
          <Trash2 className="h-3 w-3" /> Excluir
        </button>
      </div>
    </div>
  );
}

function ResultForm({
  row,
  onSaved,
  onCancel,
}: {
  row?: WorldCupResultRow;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const upsertFn = useServerFn(upsertWorldCupResult);
  const [form, setForm] = useState({
    home_team: row?.home_team ?? "",
    away_team: row?.away_team ?? "",
    match_date: row?.match_date ?? new Date().toISOString().slice(0, 10),
    home_score: row?.home_score ?? 0,
    away_score: row?.away_score ?? 0,
    status: row?.status ?? "agendado",
    image_url: row?.image_url ?? "",
  });
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const save = useMutation({
    mutationFn: () =>
      upsertFn({
        data: {
          id: row?.id,
          home_team: form.home_team.trim(),
          away_team: form.away_team.trim(),
          match_date: form.match_date,
          home_score: Number(form.home_score),
          away_score: Number(form.away_score),
          status: form.status as "agendado" | "em_andamento" | "encerrado",
          image_url: form.image_url || null,
        },
      }),
    onSuccess: () => onSaved(),
    onError: (e: any) => setErr(e?.message ?? "Erro ao salvar"),
  });

  async function handleFile(file: File) {
    setUploading(true);
    setErr(null);
    try {
      const key = `${form.home_team || "match"}-${form.away_team || "x"}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-");
      const url = await uploadResultImage(key, file);
      setForm((f) => ({ ...f, image_url: url }));
    } catch (e: any) {
      setErr(e?.message ?? "Falha no upload");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-xl glass-card p-4 border border-primary/30">
      <div className="font-bold text-sm mb-3">{row ? "Editar resultado" : "Novo resultado"}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-xs">
          <span className="block text-muted-foreground mb-1">Time da casa</span>
          <input value={form.home_team} onChange={(e) => setForm((f) => ({ ...f, home_team: e.target.value }))}
            className="w-full h-10 rounded-lg bg-card border border-border/60 px-3 text-sm" />
        </label>
        <label className="text-xs">
          <span className="block text-muted-foreground mb-1">Time visitante</span>
          <input value={form.away_team} onChange={(e) => setForm((f) => ({ ...f, away_team: e.target.value }))}
            className="w-full h-10 rounded-lg bg-card border border-border/60 px-3 text-sm" />
        </label>
        <label className="text-xs">
          <span className="block text-muted-foreground mb-1">Data</span>
          <input type="date" value={form.match_date} onChange={(e) => setForm((f) => ({ ...f, match_date: e.target.value }))}
            className="w-full h-10 rounded-lg bg-card border border-border/60 px-3 text-sm" />
        </label>
        <label className="text-xs">
          <span className="block text-muted-foreground mb-1">Status</span>
          <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as any }))}
            className="w-full h-10 rounded-lg bg-card border border-border/60 px-3 text-sm">
            <option value="agendado">Agendado</option>
            <option value="em_andamento">Em andamento (Ao vivo)</option>
            <option value="encerrado">Encerrado</option>
          </select>
        </label>
        <label className="text-xs">
          <span className="block text-muted-foreground mb-1">Gols casa</span>
          <input type="number" min={0} value={form.home_score} onChange={(e) => setForm((f) => ({ ...f, home_score: Number(e.target.value) }))}
            className="w-full h-10 rounded-lg bg-card border border-border/60 px-3 text-sm" />
        </label>
        <label className="text-xs">
          <span className="block text-muted-foreground mb-1">Gols visitante</span>
          <input type="number" min={0} value={form.away_score} onChange={(e) => setForm((f) => ({ ...f, away_score: Number(e.target.value) }))}
            className="w-full h-10 rounded-lg bg-card border border-border/60 px-3 text-sm" />
        </label>
      </div>

      <div className="mt-3">
        <div className="text-xs text-muted-foreground mb-1">Imagem do jogo (opcional)</div>
        <div className="flex items-center gap-3 flex-wrap">
          {form.image_url ? (
            <img src={form.image_url} alt="" className="h-20 w-32 object-cover rounded-lg border border-border/60" />
          ) : (
            <div className="h-20 w-32 rounded-lg border border-dashed border-border/60 grid place-items-center text-muted-foreground">
              <ImageIcon className="h-5 w-5" />
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="h-10 px-4 rounded-lg border border-border text-sm font-bold inline-flex items-center gap-2 disabled:opacity-60">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {form.image_url ? "Trocar imagem" : "Enviar imagem"}
          </button>
          {form.image_url && (
            <button onClick={() => setForm((f) => ({ ...f, image_url: "" }))}
              className="h-10 px-3 rounded-lg border border-destructive/40 text-destructive text-xs font-bold">
              Remover
            </button>
          )}
        </div>
      </div>

      {err && <div className="mt-3 text-xs text-destructive">{err}</div>}

      <div className="flex gap-2 mt-4">
        <button onClick={() => save.mutate()} disabled={save.isPending || uploading}
          className="h-10 px-4 rounded-lg bg-gradient-brand text-primary-foreground text-sm font-bold inline-flex items-center gap-2 disabled:opacity-60 shadow-glow">
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar
        </button>
        <button onClick={onCancel} className="h-10 px-4 rounded-lg border border-border text-sm font-semibold">
          Cancelar
        </button>
      </div>
    </div>
  );
}
