import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, RefreshCcw, Plus, ExternalLink, AlertTriangle, CheckCircle2, Activity } from "lucide-react";
import {
  listFootballCompetitions,
  upsertFootballCompetition,
  syncFootballCompetition,
  listFootballMatches,
  listFootballSyncLogs,
  refreshFootballMatch,
  createChallengeForFootballMatch,
  getFootballSyncDashboard,
} from "@/lib/football-integrations.functions";

export const Route = createFileRoute("/admin/integracoes-futebol")({
  head: () => ({ meta: [{ title: "Integrações de Futebol · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: Page,
});

type Tab = "dashboard" | "competitions" | "matches" | "logs";

function Page() {
  const [tab, setTab] = useState<Tab>("dashboard");
  return (
    <div className="space-y-5">
      <header className="glass-card rounded-2xl p-5 border border-border/60">
        <h1 className="text-2xl font-display font-black">Integrações de Futebol</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sincronização automática de jogos e resultados via football-data.org. Os desafios criados aqui
          ficam separados dos cadastros manuais.
        </p>
      </header>

      <div className="flex gap-2 border-b border-border/60 overflow-x-auto">
        {(["dashboard", "competitions", "matches", "logs"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-bold border-b-2 -mb-px transition whitespace-nowrap ${
              tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
            }`}
          >
            {t === "dashboard" ? "Painel" : t === "competitions" ? "Competições" : t === "matches" ? "Jogos" : "Logs"}
          </button>
        ))}
      </div>

      {tab === "dashboard" && <DashboardTab />}
      {tab === "competitions" && <CompetitionsTab />}
      {tab === "matches" && <MatchesTab />}
      {tab === "logs" && <LogsTab />}
    </div>
  );
}

function DashboardTab() {
  const dashFn = useServerFn(getFootballSyncDashboard);
  const syncFn = useServerFn(syncFootballCompetition);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try { setData(await dashFn()); } catch (e) { toast.error(String(e)); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function sync(code: string) {
    setSyncing(code);
    try {
      const r = await syncFn({ data: { code } });
      if (r.ok) toast.success(`OK — ${r.imported} novos, ${r.updated} atualizados`);
      else toast.error(r.error ?? "Falha");
      load();
    } catch (e) { toast.error(String(e)); } finally { setSyncing(null); }
  }

  if (loading || !data) return <div className="py-12 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  const t = data.totals;
  const fmt = (d: string | null) => d ? new Date(d).toLocaleString("pt-BR") : "—";
  const ago = (d: string | null) => {
    if (!d) return "nunca";
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (mins < 1) return "agora";
    if (mins < 60) return `${mins} min atrás`;
    const h = Math.floor(mins / 60);
    if (h < 24) return `${h}h atrás`;
    return `${Math.floor(h / 24)}d atrás`;
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Chamadas (7d)" value={t.calls7d} icon={<Activity className="h-4 w-4" />} />
        <StatCard label="Importados (24h / 7d)" value={`${t.imported24h} / ${t.imported7d}`} icon={<Plus className="h-4 w-4" />} />
        <StatCard label="Atualizados (24h / 7d)" value={`${t.updated24h} / ${t.updated7d}`} icon={<RefreshCcw className="h-4 w-4" />} />
        <StatCard label="Erros (7d)" value={t.errors7d} icon={<AlertTriangle className="h-4 w-4" />} tone={t.errors7d > 0 ? "danger" : "ok"} />
      </div>

      <div className="glass-card rounded-2xl border border-border/60 overflow-x-auto">
        <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
          <h2 className="text-sm font-bold">Por competição</h2>
          <button onClick={load} className="h-8 px-3 rounded bg-muted/40 text-xs font-bold inline-flex items-center gap-1">
            <RefreshCcw className="h-3 w-3" /> Recarregar
          </button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-xs uppercase">
            <tr>
              <th className="text-left p-3">Comp.</th>
              <th className="text-left p-3">Nome</th>
              <th className="text-left p-3">Ativo</th>
              <th className="text-left p-3">Última sync</th>
              <th className="text-left p-3">Imp. 24h / 7d</th>
              <th className="text-left p-3">Upd. 24h / 7d</th>
              <th className="text-left p-3">Erros 7d</th>
              <th className="text-right p-3">Ação</th>
            </tr>
          </thead>
          <tbody>
            {data.competitions.map((c: any) => {
              const lastSync = c.last_synced_at ?? c.stats.lastLogAt;
              return (
                <tr key={c.code} className="border-t border-border/40">
                  <td className="p-3 font-mono font-bold">{c.code}</td>
                  <td className="p-3">{c.name}</td>
                  <td className="p-3">{c.active ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <span className="text-xs text-muted-foreground">off</span>}</td>
                  <td className="p-3 text-xs">
                    <div>{fmt(lastSync)}</div>
                    <div className="text-muted-foreground">{ago(lastSync)}</div>
                  </td>
                  <td className="p-3">{c.stats.imported24h} / {c.stats.imported7d}</td>
                  <td className="p-3">{c.stats.updated24h} / {c.stats.updated7d}</td>
                  <td className={`p-3 font-bold ${c.stats.errors7d > 0 ? "text-destructive" : "text-emerald-500"}`}>{c.stats.errors7d}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => sync(c.code)} disabled={syncing === c.code}
                      className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50">
                      {syncing === c.code ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCcw className="h-3 w-3" />}
                      Sincronizar
                    </button>
                  </td>
                </tr>
              );
            })}
            {data.competitions.length === 0 && (
              <tr><td colSpan={8} className="p-8 text-center text-muted-foreground text-sm">Nenhuma competição cadastrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="glass-card rounded-2xl border border-border/60">
        <div className="px-4 py-3 border-b border-border/60">
          <h2 className="text-sm font-bold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Últimos erros</h2>
        </div>
        {data.recentErrors.length === 0 ? (
          <div className="p-8 text-center text-sm text-emerald-500">Sem erros recentes 🎉</div>
        ) : (
          <ul className="divide-y divide-border/40">
            {data.recentErrors.map((e: any, i: number) => (
              <li key={i} className="px-4 py-3 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold">{e.competition_code ?? "—"}</span>
                    <span className="text-muted-foreground">{e.endpoint}</span>
                    {e.http_status != null && <span className="text-destructive font-bold">HTTP {e.http_status}</span>}
                  </div>
                  <span className="text-muted-foreground">{fmt(e.created_at)}</span>
                </div>
                <div className="mt-1 text-destructive break-words">{e.error_message}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, tone }: { label: string; value: any; icon: React.ReactNode; tone?: "ok" | "danger" }) {
  return (
    <div className="glass-card rounded-2xl p-4 border border-border/60">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground uppercase font-bold">{label}</span>
        <span className={tone === "danger" ? "text-destructive" : tone === "ok" ? "text-emerald-500" : "text-muted-foreground"}>{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-display font-black">{value}</div>
    </div>
  );
}


function CompetitionsTab() {
  const listFn = useServerFn(listFootballCompetitions);
  const upsertFn = useServerFn(upsertFootballCompetition);
  const syncFn = useServerFn(syncFootballCompetition);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try { setRows(await listFn()); } catch (e) { toast.error(String(e)); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function save(row: any, patch: Partial<any>) {
    try {
      await upsertFn({ data: { ...row, ...patch } });
      toast.success("Salvo");
      load();
    } catch (e) { toast.error(String(e)); }
  }

  async function sync(code: string) {
    setSyncing(code);
    try {
      const r = await syncFn({ data: { code } });
      if (r.ok) toast.success(`OK — ${r.imported} novos, ${r.updated} atualizados`);
      else toast.error(r.error ?? "Falha");
      load();
    } catch (e) { toast.error(String(e)); } finally { setSyncing(null); }
  }

  if (loading) return <div className="py-12 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <div className="glass-card rounded-2xl border border-border/60 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/30 text-xs uppercase">
          <tr>
            <th className="text-left p-3">Código</th>
            <th className="text-left p-3">Nome</th>
            <th className="text-left p-3">Temporada</th>
            <th className="text-left p-3">Ativo</th>
            <th className="text-left p-3">Auto-criar</th>
            <th className="text-left p-3">Auto-resultado</th>
            <th className="text-left p-3">Última sync</th>
            <th className="text-right p-3">Ação</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border/40">
              <td className="p-3 font-mono font-bold">{r.code}</td>
              <td className="p-3">{r.name}</td>
              <td className="p-3">
                <input
                  type="number"
                  defaultValue={r.season ?? ""}
                  onBlur={(e) => {
                    const v = e.target.value ? Number(e.target.value) : null;
                    if (v !== r.season) save(r, { season: v });
                  }}
                  className="w-20 h-8 px-2 rounded bg-background border border-border/60 text-sm"
                />
              </td>
              <td className="p-3"><input type="checkbox" defaultChecked={r.active} onChange={(e) => save(r, { active: e.target.checked })} /></td>
              <td className="p-3"><input type="checkbox" defaultChecked={r.auto_create_challenges} onChange={(e) => save(r, { auto_create_challenges: e.target.checked })} /></td>
              <td className="p-3"><input type="checkbox" defaultChecked={r.auto_update_results} onChange={(e) => save(r, { auto_update_results: e.target.checked })} /></td>
              <td className="p-3 text-xs text-muted-foreground">{r.last_synced_at ? new Date(r.last_synced_at).toLocaleString("pt-BR") : "—"}</td>
              <td className="p-3 text-right">
                <button
                  onClick={() => sync(r.code)}
                  disabled={syncing === r.code}
                  className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50"
                >
                  {syncing === r.code ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCcw className="h-3 w-3" />}
                  Sincronizar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MatchesTab() {
  const listFn = useServerFn(listFootballMatches);
  const refreshFn = useServerFn(refreshFootballMatch);
  const createFn = useServerFn(createChallengeForFootballMatch);
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<{ competition?: string; status?: string }>({});
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const limit = 30;

  async function load() {
    setLoading(true);
    try {
      const r = await listFn({ data: { ...filters, limit, offset } });
      setRows(r.rows); setTotal(r.total);
    } catch (e) { toast.error(String(e)); } finally { setLoading(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [offset, filters.competition, filters.status]);

  async function refresh(id: string) {
    setBusy(id);
    try { await refreshFn({ data: { externalId: id } }); toast.success("Atualizado"); load(); }
    catch (e) { toast.error(String(e)); } finally { setBusy(null); }
  }
  async function createCh(id: string) {
    setBusy(id);
    try {
      const r = await createFn({ data: { externalId: id } });
      if (r.ok) toast.success("Desafio criado"); else toast.error("Falha");
      load();
    } catch (e) { toast.error(String(e)); } finally { setBusy(null); }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <input
          placeholder="Código (PL, BSA, ...)"
          value={filters.competition ?? ""}
          onChange={(e) => { setOffset(0); setFilters((f) => ({ ...f, competition: e.target.value || undefined })); }}
          className="h-9 px-3 rounded-lg bg-background border border-border/60 text-sm"
        />
        <select
          value={filters.status ?? ""}
          onChange={(e) => { setOffset(0); setFilters((f) => ({ ...f, status: e.target.value || undefined })); }}
          className="h-9 px-3 rounded-lg bg-background border border-border/60 text-sm"
        >
          <option value="">Todos status</option>
          <option value="SCHEDULED">Agendado</option>
          <option value="TIMED">Com horário</option>
          <option value="IN_PLAY">Ao vivo</option>
          <option value="FINISHED">Encerrado</option>
          <option value="POSTPONED">Adiado</option>
        </select>
      </div>

      {loading ? (
        <div className="py-12 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : (
        <div className="glass-card rounded-2xl border border-border/60 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase">
              <tr>
                <th className="text-left p-3">Competição</th>
                <th className="text-left p-3">Data BR</th>
                <th className="text-left p-3">Casa</th>
                <th className="text-left p-3">Fora</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Placar</th>
                <th className="text-left p-3">Desafio</th>
                <th className="text-right p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border/40">
                  <td className="p-3 font-mono text-xs">{r.competition_code}</td>
                  <td className="p-3 text-xs">{r.data_hora_brasil ? new Date(r.data_hora_brasil).toLocaleString("pt-BR") : "—"}</td>
                  <td className="p-3">{r.home_team_name}</td>
                  <td className="p-3">{r.away_team_name}</td>
                  <td className="p-3 text-xs">{r.status}</td>
                  <td className="p-3 font-bold">{r.score_home ?? "-"} × {r.score_away ?? "-"}</td>
                  <td className="p-3">
                    {r.linked_challenge_id ? (
                      <Link to="/previsao/$id" params={{ id: r.linked_challenge_id }} className="text-primary inline-flex items-center gap-1 text-xs">
                        Ver <ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="p-3 text-right space-x-1 whitespace-nowrap">
                    <button onClick={() => refresh(r.external_match_id)} disabled={busy === r.external_match_id}
                      className="h-8 px-2 rounded bg-muted/40 text-xs font-bold disabled:opacity-50">
                      Atualizar
                    </button>
                    {!r.linked_challenge_id && (
                      <button onClick={() => createCh(r.external_match_id)} disabled={busy === r.external_match_id}
                        className="h-8 px-2 rounded bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50 inline-flex items-center gap-1">
                        <Plus className="h-3 w-3" /> Desafio
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground text-sm">Nenhum jogo. Sincronize uma competição na aba anterior.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{total} jogos</span>
        <div className="flex gap-2">
          <button disabled={offset === 0} onClick={() => setOffset((o) => Math.max(0, o - limit))}
            className="h-8 px-3 rounded bg-muted/40 disabled:opacity-50">Anterior</button>
          <button disabled={offset + limit >= total} onClick={() => setOffset((o) => o + limit)}
            className="h-8 px-3 rounded bg-muted/40 disabled:opacity-50">Próximo</button>
        </div>
      </div>
    </div>
  );
}

function LogsTab() {
  const listFn = useServerFn(listFootballSyncLogs);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { listFn().then(setRows).catch((e) => toast.error(String(e))).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="py-12 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  return (
    <div className="glass-card rounded-2xl border border-border/60 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/30 text-xs uppercase">
          <tr>
            <th className="text-left p-3">Data/Hora</th>
            <th className="text-left p-3">Comp.</th>
            <th className="text-left p-3">Endpoint</th>
            <th className="text-left p-3">HTTP</th>
            <th className="text-left p-3">Import</th>
            <th className="text-left p-3">Update</th>
            <th className="text-left p-3">Erro</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border/40">
              <td className="p-3 text-xs">{new Date(r.created_at).toLocaleString("pt-BR")}</td>
              <td className="p-3 font-mono text-xs">{r.competition_code ?? "-"}</td>
              <td className="p-3 text-xs">{r.endpoint}</td>
              <td className={`p-3 text-xs font-bold ${r.http_status >= 400 ? "text-destructive" : "text-emerald-500"}`}>{r.http_status}</td>
              <td className="p-3">{r.imported}</td>
              <td className="p-3">{r.updated}</td>
              <td className="p-3 text-xs text-destructive max-w-[300px] truncate">{r.error_message ?? "-"}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground text-sm">Sem logs ainda.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
