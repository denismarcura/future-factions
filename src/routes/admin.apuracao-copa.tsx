import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  RefreshCcw,
  Wand2,
  Coins,
  Edit3,
  History,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Search,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  listChallengesForAdmin,
  fetchFifaMatchResult,
  recalculateWinners,
  releaseTokens,
  manualConfirmResult,
  getChallengeLogs,
  FIFA_FIXTURES_URL,
} from "@/lib/fifa-results.functions";

export const Route = createFileRoute("/admin/apuracao-copa")({
  head: () => ({
    meta: [{ title: "Apuração da Copa — Admin" }],
  }),
  component: () => <Page />,
});

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  aguardando_jogo: { label: "Aguardando jogo", cls: "bg-muted text-muted-foreground" },
  jogo_em_andamento: { label: "Ao vivo", cls: "bg-destructive/15 text-destructive border-destructive/30 animate-pulse" },
  aguardando_resultado: { label: "Aguardando resultado", cls: "bg-gold/15 text-gold border-gold/30" },
  resultado_encontrado: { label: "Resultado encontrado", cls: "bg-primary/15 text-primary border-primary/30" },
  apurado_automaticamente: { label: "Apurado", cls: "bg-primary/20 text-primary border-primary/40" },
  requer_revisao_manual: { label: "Revisão manual", cls: "bg-destructive/15 text-destructive border-destructive/40" },
  finalizado: { label: "Finalizado", cls: "bg-primary text-primary-foreground" },
  erro_na_consulta: { label: "Erro", cls: "bg-destructive/20 text-destructive border-destructive/40" },
};

function Page() {
  const listFn = useServerFn(listChallengesForAdmin);
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin", "apuracao-copa"],
    queryFn: () => listFn(),
    refetchInterval: 30_000,
  });

  const filtered = rows.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.title?.toLowerCase().includes(s) ||
      r.home_team?.toLowerCase().includes(s) ||
      r.away_team?.toLowerCase().includes(s) ||
      r.apuration_status?.toLowerCase().includes(s)
    );
  });

  const totals = {
    total: rows.length,
    apurados: rows.filter((r) => r.apuration_status === "apurado_automaticamente").length,
    pendentes: rows.filter((r) => r.apuration_status === "requer_revisao_manual").length,
    tokens: rows.reduce((s, r) => s + (r.winners_tokens || 0), 0),
  };

  return (
    <AppShell>
      <section className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/admin" className="text-xs text-muted-foreground hover:text-primary">
            ← Admin
          </Link>
          <h1 className="font-display text-3xl font-black mt-1">Apuração da Copa</h1>
          <p className="text-sm text-muted-foreground">
            Fonte oficial:{" "}
            <a href={FIFA_FIXTURES_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              FIFA.com
            </a>{" "}
            · A rotina automática roda a cada 15 minutos.
          </p>
        </div>
        <button
          onClick={() => qc.invalidateQueries({ queryKey: ["admin", "apuracao-copa"] })}
          className="h-10 px-4 rounded-lg border border-border text-sm font-bold inline-flex items-center gap-2"
        >
          <RefreshCcw className="h-4 w-4" /> Atualizar lista
        </button>
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { k: "Desafios", v: totals.total },
          { k: "Apurados", v: totals.apurados },
          { k: "Revisão manual", v: totals.pendentes },
          { k: "Tokens distribuídos", v: totals.tokens.toLocaleString("pt-BR") },
        ].map((s) => (
          <div key={s.k} className="rounded-xl glass-card p-4">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.k}</div>
            <div className="font-display text-2xl font-black mt-1">{s.v}</div>
          </div>
        ))}
      </section>

      <section className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por desafio, time ou status..."
            className="w-full h-10 pl-9 pr-3 rounded-full bg-card border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
          />
        </div>
      </section>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Carregando...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground glass-card rounded-2xl">
          Nenhum desafio cadastrado ainda. Crie um desafio com partida da Copa para começar.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Row key={r.id} row={r} onChanged={() => qc.invalidateQueries({ queryKey: ["admin", "apuracao-copa"] })} />
          ))}
        </div>
      )}
    </AppShell>
  );
}

function Row({ row, onChanged }: { row: any; onChanged: () => void }) {
  const consultFn = useServerFn(fetchFifaMatchResult);
  const recalcFn = useServerFn(recalculateWinners);
  const releaseFn = useServerFn(releaseTokens);
  const manualFn = useServerFn(manualConfirmResult);
  const logsFn = useServerFn(getChallengeLogs);

  const [openManual, setOpenManual] = useState(false);
  const [openLogs, setOpenLogs] = useState(false);
  const [logs, setLogs] = useState<any[] | null>(null);
  const [manual, setManual] = useState({
    home: row.home_score ?? 0,
    away: row.away_score ?? 0,
    obs: "",
  });

  const consult = useMutation({
    mutationFn: () => consultFn({ data: { challengeId: row.id } }),
    onSuccess: onChanged,
  });
  const recalc = useMutation({
    mutationFn: () => recalcFn({ data: { challengeId: row.id } }),
    onSuccess: onChanged,
  });
  const release = useMutation({
    mutationFn: () => releaseFn({ data: { challengeId: row.id } }),
    onSuccess: onChanged,
  });
  const manualSave = useMutation({
    mutationFn: () =>
      manualFn({
        data: {
          challengeId: row.id,
          home_score: Number(manual.home),
          away_score: Number(manual.away),
          observation: manual.obs || undefined,
        },
      }),
    onSuccess: () => {
      setOpenManual(false);
      onChanged();
    },
  });

  const status = STATUS_STYLE[row.apuration_status] ?? STATUS_STYLE.aguardando_jogo;
  const confidence = row.result_payload_json?.confidence as number | undefined;
  const hasResult = row.home_score != null && row.away_score != null;

  return (
    <div className="rounded-xl glass-card p-4 sm:p-5">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${status.cls}`}>
              {row.apuration_status === "requer_revisao_manual" && <AlertTriangle className="h-3 w-3" />}
              {row.apuration_status === "apurado_automaticamente" && <CheckCircle2 className="h-3 w-3" />}
              {status.label}
            </span>
            {confidence !== undefined && (
              <span className="text-[10px] text-muted-foreground">
                IA: {Math.round(confidence * 100)}%
              </span>
            )}
          </div>
          <div className="font-display font-black text-base sm:text-lg truncate">{row.title}</div>
          <div className="text-sm text-muted-foreground mt-0.5">
            {row.home_team && row.away_team ? (
              <>
                {row.home_team} {hasResult && <span className="text-foreground font-bold tabular-nums">{row.home_score} × {row.away_score}</span>} {!hasResult && "×"} {row.away_team}
              </>
            ) : (
              <em>Sem times definidos</em>
            )}
            {row.match_kickoff && (
              <> · {new Date(row.match_kickoff).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</>
            )}
          </div>
          <div className="flex flex-wrap gap-3 mt-2 text-xs">
            <span className="text-muted-foreground">
              Participantes: <span className="text-foreground font-bold">{row.participants}</span>
            </span>
            <span className="text-muted-foreground">
              Vencedores: <span className="text-primary font-bold">{row.winners_count}</span>
            </span>
            <span className="text-muted-foreground">
              Tokens: <span className="text-gold font-bold">{row.winners_tokens.toLocaleString("pt-BR")}</span>
            </span>
            {row.winners_pending > 0 && (
              <span className="text-destructive font-bold">
                {row.winners_pending} aguardando liberação
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-end content-start">
          <button
            onClick={() => consult.mutate()}
            disabled={consult.isPending}
            className="h-9 px-3 rounded-lg bg-gradient-brand text-primary-foreground text-xs font-bold inline-flex items-center gap-1.5 shadow-glow disabled:opacity-60"
          >
            {consult.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
            Consultar agora
          </button>
          <button
            onClick={() => recalc.mutate()}
            disabled={recalc.isPending || !hasResult}
            className="h-9 px-3 rounded-lg border border-border text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCcw className="h-3 w-3" /> Recalcular
          </button>
          <button
            onClick={() => release.mutate()}
            disabled={release.isPending || row.winners_pending === 0}
            className="h-9 px-3 rounded-lg border border-gold/40 text-gold text-xs font-bold inline-flex items-center gap-1.5 hover:bg-gold/10 disabled:opacity-50"
          >
            <Coins className="h-3 w-3" /> Liberar tokens
          </button>
          <button
            onClick={() => setOpenManual((v) => !v)}
            className="h-9 px-3 rounded-lg border border-border text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Edit3 className="h-3 w-3" /> Editar placar
          </button>
          <button
            onClick={async () => {
              setOpenLogs((v) => !v);
              if (!logs) {
                const l = await logsFn({ data: { challengeId: row.id } });
                setLogs(l as any[]);
              }
            }}
            className="h-9 px-3 rounded-lg border border-border text-xs font-bold inline-flex items-center gap-1.5"
          >
            <History className="h-3 w-3" /> Histórico
          </button>
        </div>
      </div>

      {openManual && (
        <div className="mt-4 rounded-lg border border-border/60 bg-background/40 p-4">
          <div className="font-bold text-sm mb-2">Confirmar manualmente</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
            <label className="text-xs">
              <span className="block text-muted-foreground mb-1">{row.home_team}</span>
              <input
                type="number"
                value={manual.home}
                onChange={(e) => setManual((m) => ({ ...m, home: Number(e.target.value) }))}
                className="w-full h-10 rounded-lg bg-card border border-border/60 px-3 text-sm"
              />
            </label>
            <label className="text-xs">
              <span className="block text-muted-foreground mb-1">{row.away_team}</span>
              <input
                type="number"
                value={manual.away}
                onChange={(e) => setManual((m) => ({ ...m, away: Number(e.target.value) }))}
                className="w-full h-10 rounded-lg bg-card border border-border/60 px-3 text-sm"
              />
            </label>
            <label className="text-xs sm:col-span-2">
              <span className="block text-muted-foreground mb-1">Observação</span>
              <input
                value={manual.obs}
                onChange={(e) => setManual((m) => ({ ...m, obs: e.target.value }))}
                className="w-full h-10 rounded-lg bg-card border border-border/60 px-3 text-sm"
              />
            </label>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => manualSave.mutate()}
              disabled={manualSave.isPending}
              className="h-10 px-4 rounded-lg bg-gradient-brand text-primary-foreground text-sm font-bold disabled:opacity-60"
            >
              {manualSave.isPending ? "Salvando..." : "Confirmar resultado"}
            </button>
            <button
              onClick={() => setOpenManual(false)}
              className="h-10 px-4 rounded-lg border border-border text-sm font-semibold"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {openLogs && (
        <div className="mt-4 rounded-lg border border-border/60 bg-background/40 p-3 max-h-72 overflow-auto">
          {!logs ? (
            <div className="text-xs text-muted-foreground">Carregando histórico...</div>
          ) : logs.length === 0 ? (
            <div className="text-xs text-muted-foreground">Nenhum log ainda.</div>
          ) : (
            <ul className="space-y-2 text-xs">
              {logs.map((l) => (
                <li key={l.id} className="border-l-2 border-primary/40 pl-2">
                  <div className="text-muted-foreground">
                    {new Date(l.created_at).toLocaleString("pt-BR")} · {l.source} · IA {l.confidence ? Math.round(l.confidence * 100) + "%" : "—"} · {l.status_at_check}
                  </div>
                  {l.error && <div className="text-destructive">Erro: {l.error}</div>}
                  {l.payload && (
                    <pre className="mt-1 text-[10px] text-muted-foreground overflow-x-auto">
                      {JSON.stringify(l.payload, null, 2)}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
