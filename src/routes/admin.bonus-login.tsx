import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Gift, Flame, Coins, Calendar, CheckCircle2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  MAX_DAY,
  rewardForDay,
  getCheckinState,
  performCheckin,
  canCheckinToday,
  resetCheckin,
  type CheckinState,
} from "@/lib/checkin";

export const Route = createFileRoute("/admin/bonus-login")({
  component: AdminBonusLogin,
});

function formatDate(s: string) {
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

function AdminBonusLogin() {
  const [state, setState] = useState<CheckinState>(() => ({
    streak: 0, lastDate: null, totalEarned: 0, history: [],
  }));
  const [canCheckin, setCanCheckin] = useState(false);

  useEffect(() => {
    const sync = () => {
      setState(getCheckinState());
      setCanCheckin(canCheckinToday());
    };
    sync();
    window.addEventListener("ddp:checkin-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("ddp:checkin-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  function handleCheckin() {
    const r = performCheckin();
    if (!r.ok) {
      toast.error(r.reason ?? "Não foi possível fazer check-in.");
      return;
    }
    toast.success(`+${r.entry!.tokens} tokens — Dia ${r.entry!.day} da sequência!`);
  }

  function handleReset() {
    if (!confirm("Zerar histórico de check-ins?")) return;
    resetCheckin();
    toast.success("Histórico zerado.");
  }

  const nextDay = state.streak + 1;
  const nextReward = rewardForDay(nextDay);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Gift className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-display font-bold">Bônus de Login — Check-in diário</h2>
      </div>

      {/* Status do usuário atual */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Kpi icon={Flame} color="text-amber-400" label="Sequência atual" value={`${state.streak} dia${state.streak === 1 ? "" : "s"}`} />
        <Kpi icon={Coins} color="text-gold" label="Tokens acumulados" value={state.totalEarned.toLocaleString("pt-BR")} />
        <Kpi icon={Calendar} color="text-primary" label="Último check-in" value={state.lastDate ? formatDate(state.lastDate) : "—"} />
        <Kpi icon={CheckCircle2} color="text-primary" label="Próximo prêmio" value={`+${nextReward} (Dia ${nextDay})`} />
      </div>

      {/* Ação de check-in */}
      <div className="glass-card rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-black">
            {canCheckin ? "Você ainda não fez check-in hoje" : "Check-in de hoje concluído"}
          </h3>
          <p className="text-sm text-muted-foreground">
            Sequência diária: <span className="text-foreground font-semibold">{state.streak} dia{state.streak === 1 ? "" : "s"}</span> · perder um dia zera a sequência e o próximo prêmio volta para <span className="text-foreground font-semibold">10 tokens</span>.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCheckin}
            disabled={!canCheckin}
            className="h-11 px-5 rounded-full bg-gradient-brand text-primary-foreground font-bold text-sm shadow-glow inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="h-4 w-4" />
            {canCheckin ? `Fazer check-in (+${nextReward})` : "Já feito"}
          </button>
          <button
            onClick={handleReset}
            className="h-11 w-11 grid place-items-center rounded-full border border-border/60 text-muted-foreground hover:border-destructive/60 hover:text-destructive"
            title="Zerar histórico"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabela de recompensas Dia 1 → 30 */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-black">Tabela de recompensas (Dia 1 → 30)</h3>
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
            Fórmula: 10 × dia, máx. 300 tokens
          </span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-2">
          {Array.from({ length: MAX_DAY }, (_, i) => i + 1).map((day) => {
            const tokens = rewardForDay(day);
            const active = day === state.streak;
            const next = day === nextDay && canCheckin;
            return (
              <div
                key={day}
                className={`rounded-xl border p-2 text-center transition ${
                  active
                    ? "border-amber-400/60 bg-amber-400/10"
                    : next
                    ? "border-primary/60 bg-primary/10"
                    : "border-border/40 bg-card/40"
                }`}
              >
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Dia</div>
                <div className="font-display font-black text-lg tabular-nums">{day}</div>
                <div className="text-xs font-semibold text-gold tabular-nums">+{tokens}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Histórico de check-ins */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border/40">
          <h3 className="font-display font-black flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" /> Histórico de check-ins
          </h3>
          <span className="text-xs text-muted-foreground">{state.history.length} registro{state.history.length === 1 ? "" : "s"}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-3 font-semibold">Data</th>
                <th className="text-left p-3 font-semibold">Dia da sequência</th>
                <th className="text-right p-3 font-semibold">Tokens ganhos</th>
              </tr>
            </thead>
            <tbody>
              {state.history.map((h) => (
                <tr key={h.date} className="border-t border-border/40">
                  <td className="p-3">{formatDate(h.date)}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1.5">
                      <Flame className="h-3.5 w-3.5 text-amber-400" />
                      Dia {h.day}
                    </span>
                  </td>
                  <td className="p-3 text-right tabular-nums text-gold font-semibold">
                    <Coins className="h-3 w-3 inline mr-1" /> +{h.tokens}
                  </td>
                </tr>
              ))}
              {state.history.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-muted-foreground text-sm">
                    Nenhum check-in registrado ainda. Faça o primeiro check-in para iniciar sua sequência.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon, color, label, value,
}: { icon: any; color: string; label: string; value: string }) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <Icon className={`h-4 w-4 ${color}`} />
      <div className="mt-2 text-xl font-display font-black tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}
