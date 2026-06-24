import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeftRight, Loader2, X, ShieldAlert, Sparkles, CheckCircle2, XCircle, Truck, Search } from "lucide-react";
import {
  listAllRedemptions,
  getUserFullHistory,
  runAiFraudCheck,
  updateRedemptionStatus,
  type Redemption,
} from "@/lib/prize-redemptions.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/trocas")({
  head: () => ({ meta: [{ title: "Trocas · Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminTrocas,
});

function AdminTrocas() {
  const list = useServerFn(listAllRedemptions);
  const history = useServerFn(getUserFullHistory);
  const fraud = useServerFn(runAiFraudCheck);
  const updateStatus = useServerFn(updateRedemptionStatus);

  const [items, setItems] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Redemption | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [aiRunning, setAiRunning] = useState(false);

  function reload() {
    setLoading(true);
    list().then(setItems).catch((e) => toast.error(e?.message ?? "Erro")).finally(() => setLoading(false));
  }
  useEffect(reload, [list]);

  async function openDetail(r: Redemption) {
    setSelected(r);
    setDetail(null);
    setLoadingDetail(true);
    try {
      const d = await history({ data: { user_id: r.user_id } });
      setDetail(d);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoadingDetail(false);
    }
  }

  async function runFraud() {
    if (!selected) return;
    setAiRunning(true);
    try {
      const updated = await fraud({ data: { redemption_id: selected.id } });
      setSelected(updated);
      setItems((cur) => cur.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)));
      toast.success("Análise de fraude concluída");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro IA");
    } finally {
      setAiRunning(false);
    }
  }

  async function setStatus(s: Redemption["status"]) {
    if (!selected) return;
    try {
      const updated = await updateStatus({ data: { id: selected.id, status: s } });
      setSelected(updated);
      setItems((cur) => cur.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)));
      toast.success("Status atualizado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-display font-black flex items-center gap-2">
          <ArrowLeftRight className="h-6 w-6 text-primary" /> Solicitações de Troca
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Acompanhe pedidos de troca de prêmios e analise possíveis fraudes com IA.
        </p>
      </header>

      {loading ? (
        <div className="py-12 grid place-items-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
          Nenhuma solicitação de troca ainda.
        </div>
      ) : (
        <div className="rounded-2xl border border-border/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-3">Usuário</th>
                <th className="text-left p-3">Prêmio</th>
                <th className="text-right p-3">Tokens</th>
                <th className="text-left p-3">IP</th>
                <th className="text-left p-3">Data</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">IA</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-t border-border/40 hover:bg-muted/20">
                  <td className="p-3">
                    <div className="font-semibold">{r.user?.full_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{r.user?.email}</div>
                  </td>
                  <td className="p-3">{r.prize_name}</td>
                  <td className="p-3 text-right text-gold font-bold">{r.cost_tokens}</td>
                  <td className="p-3 text-xs font-mono">{r.request_ip ?? "—"}</td>
                  <td className="p-3 text-xs">{new Date(r.created_at).toLocaleString("pt-BR")}</td>
                  <td className="p-3"><StatusBadge status={r.status} /></td>
                  <td className="p-3">
                    {r.ai_fraud_score != null ? <FraudBadge score={r.ai_fraud_score} /> : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="p-3">
                    <button onClick={() => openDetail(r)} className="h-8 px-3 rounded-lg glass-card border border-border/60 text-xs font-semibold hover:border-primary/60 inline-flex items-center gap-1">
                      <Search className="h-3 w-3" /> Abrir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-4xl glass-card rounded-2xl border border-border/60 p-6 max-h-[92vh] overflow-auto">
            <button onClick={() => setSelected(null)} className="absolute right-4 top-4 h-9 w-9 rounded-full hover:bg-muted/40 grid place-items-center">
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-lg font-display font-black mb-1">Histórico do usuário</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Solicitação: {selected.prize_name} · {selected.cost_tokens} tokens · IP: {selected.request_ip ?? "—"} ·{" "}
              {new Date(selected.created_at).toLocaleString("pt-BR")}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={runFraud} disabled={aiRunning} className="h-10 px-4 rounded-full bg-gradient-brand text-primary-foreground font-bold text-xs shadow-glow inline-flex items-center gap-2 disabled:opacity-60">
                {aiRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Verificar possíveis fraudes com IA
              </button>
              <button onClick={() => setStatus("approved")} className="h-10 px-4 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/40 font-bold text-xs inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Aprovar
              </button>
              <button onClick={() => setStatus("delivered")} className="h-10 px-4 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/40 font-bold text-xs inline-flex items-center gap-2">
                <Truck className="h-4 w-4" /> Entregue
              </button>
              <button onClick={() => setStatus("rejected")} className="h-10 px-4 rounded-full bg-destructive/10 text-destructive border border-destructive/40 font-bold text-xs inline-flex items-center gap-2">
                <XCircle className="h-4 w-4" /> Rejeitar
              </button>
            </div>

            {selected.ai_fraud_report && (
              <div className={`rounded-xl border p-4 mb-4 ${
                (selected.ai_fraud_score ?? 0) >= 70
                  ? "border-destructive/60 bg-destructive/10"
                  : (selected.ai_fraud_score ?? 0) >= 40
                  ? "border-amber-500/60 bg-amber-500/10"
                  : "border-emerald-500/60 bg-emerald-500/10"
              }`}>
                <div className="flex items-center gap-2 mb-2 font-bold">
                  <ShieldAlert className="h-4 w-4" /> Parecer IA — Score {selected.ai_fraud_score} / 100 ({selected.ai_fraud_report.verdict})
                </div>
                {selected.ai_fraud_report.signals?.length > 0 && (
                  <ul className="text-xs list-disc pl-5 mb-2">
                    {selected.ai_fraud_report.signals.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                )}
                <p className="text-sm">{selected.ai_fraud_report.analysis}</p>
              </div>
            )}

            {loadingDetail ? (
              <div className="py-10 grid place-items-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : detail ? (
              <HistoryView d={detail} />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Redemption["status"] }) {
  const map: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-500 border-amber-500/40",
    approved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/40",
    delivered: "bg-blue-500/10 text-blue-500 border-blue-500/40",
    rejected: "bg-destructive/10 text-destructive border-destructive/40",
  };
  const label: Record<string, string> = {
    pending: "Pendente",
    approved: "Aprovada",
    delivered: "Entregue",
    rejected: "Rejeitada",
  };
  return <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${map[status]}`}>{label[status]}</span>;
}

function FraudBadge({ score }: { score: number }) {
  const color = score >= 70 ? "text-destructive" : score >= 40 ? "text-amber-500" : "text-emerald-500";
  return <span className={`font-bold tabular-nums ${color}`}>{score}</span>;
}

function HistoryView({ d }: { d: any }) {
  const p = d.profile ?? {};
  return (
    <div className="space-y-4 text-sm">
      <section className="rounded-xl border border-border/60 p-4">
        <h4 className="font-bold mb-2">Perfil</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div><span className="text-muted-foreground">Nome:</span> {p.full_name ?? "—"}</div>
          <div><span className="text-muted-foreground">E-mail:</span> {p.email ?? "—"}</div>
          <div><span className="text-muted-foreground">WhatsApp:</span> {p.whatsapp ?? "—"}</div>
          <div><span className="text-muted-foreground">Instagram:</span> {p.instagram ?? "—"}</div>
          <div><span className="text-muted-foreground">CPF:</span> {p.cpf ?? "—"}</div>
          <div><span className="text-muted-foreground">IP cadastro:</span> {p.signup_ip ?? "—"}</div>
          <div><span className="text-muted-foreground">Cidade:</span> {p.signup_city ?? p.cidade ?? "—"}</div>
          <div><span className="text-muted-foreground">Criado em:</span> {p.created_at ? new Date(p.created_at).toLocaleString("pt-BR") : "—"}</div>
        </div>
      </section>

      <section className="rounded-xl border border-border/60 p-4">
        <h4 className="font-bold mb-2">Amigos / contas no mesmo IP ({d.friendsSameIp.length})</h4>
        {d.friendsSameIp.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma outra conta no mesmo IP.</p>
        ) : (
          <table className="w-full text-xs">
            <thead className="text-muted-foreground"><tr><th className="text-left">Nome</th><th className="text-left">E-mail</th><th className="text-left">WhatsApp</th><th className="text-left">Criado</th></tr></thead>
            <tbody>
              {d.friendsSameIp.map((f: any) => (
                <tr key={f.id} className="border-t border-border/30">
                  <td className="py-1">{f.full_name}</td>
                  <td>{f.email}</td>
                  <td>{f.whatsapp ?? "—"}</td>
                  <td>{new Date(f.created_at).toLocaleString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="rounded-xl border border-border/60 p-4">
        <h4 className="font-bold mb-2">Palpites ({d.palpites.length})</h4>
        <div className="text-xs text-muted-foreground mb-2">
          Acertos: {d.palpites.filter((x: any) => x.is_correct).length} ·
          Taxa: {d.palpites.length > 0 ? ((d.palpites.filter((x: any) => x.is_correct).length / d.palpites.length) * 100).toFixed(1) : 0}%
        </div>
        <div className="max-h-40 overflow-y-auto text-xs">
          {d.palpites.slice(0, 30).map((x: any) => (
            <div key={x.id} className="flex justify-between border-b border-border/30 py-1">
              <span>{x.kind} · {x.option_value ?? `${x.predicted_home_score}x${x.predicted_away_score}`}</span>
              <span>{x.is_correct === true ? "✅" : x.is_correct === false ? "❌" : "—"} {new Date(x.created_at).toLocaleString("pt-BR")}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border/60 p-4">
        <h4 className="font-bold mb-2">Vitórias ({d.wins.length})</h4>
        {d.wins.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sem vitórias registradas.</p>
        ) : (
          <ul className="text-xs space-y-1">
            {d.wins.map((w: any) => (
              <li key={w.id}>Posição {w.position} · {w.prize_label ?? "—"} · {new Date(w.created_at).toLocaleString("pt-BR")}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border/60 p-4">
        <h4 className="font-bold mb-2">Tentativas de cadastro ({d.signupAttempts.length})</h4>
        <div className="max-h-32 overflow-y-auto text-xs">
          {d.signupAttempts.map((s: any) => (
            <div key={s.id} className="flex justify-between border-b border-border/30 py-1">
              <span>{s.email} · IP {s.ip}</span>
              <span>{new Date(s.created_at).toLocaleString("pt-BR")}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border/60 p-4">
        <h4 className="font-bold mb-2">Trocas anteriores ({d.redemptions.length})</h4>
        <ul className="text-xs space-y-1">
          {d.redemptions.map((r: any) => (
            <li key={r.id} className="flex justify-between border-b border-border/30 py-1">
              <span>{r.prize_name} · {r.cost_tokens} tokens · {r.status}</span>
              <span>{new Date(r.created_at).toLocaleString("pt-BR")}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
