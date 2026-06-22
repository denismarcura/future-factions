import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAdminDashboard } from "@/lib/admin-stats.functions";
import {
  Users, Building2, ListChecks, CheckCircle2, Target, Coins, Activity, UserPlus,
  Loader2, TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/admin/")({
  component: AdminHome,
});

function fmt(n: number) {
  return n.toLocaleString("pt-BR");
}

function AdminHome() {
  const fetchDash = useServerFn(getAdminDashboard);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => fetchDash(),
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="min-h-[40vh] grid place-items-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="glass-card rounded-2xl p-6 text-sm text-destructive">
        Erro ao carregar painel: {error instanceof Error ? error.message : "desconhecido"}
      </div>
    );
  }

  const k = data.kpis;
  const kpis = [
    { label: "Usuários cadastrados", value: fmt(k.users), icon: Users, color: "text-primary" },
    { label: "Empresas cadastradas", value: fmt(k.companies), icon: Building2, color: "text-amber-400" },
    { label: "Desafios ativos", value: fmt(k.activeChallenges), icon: ListChecks, color: "text-primary" },
    { label: "Desafios encerrados", value: fmt(k.closedChallenges), icon: CheckCircle2, color: "text-muted-foreground" },
    { label: "Participações totais", value: fmt(k.totalPredictions), icon: Target, color: "text-primary" },
    { label: "Tokens distribuídos", value: fmt(k.tokensDistributed), icon: Coins, color: "text-amber-400" },
    { label: "Ativos hoje", value: fmt(k.dau), icon: Activity, color: "text-primary" },
    { label: "Ativos na semana", value: fmt(k.wau), icon: Activity, color: "text-primary" },
    { label: "Ativos no mês", value: fmt(k.mau), icon: Activity, color: "text-primary" },
    { label: "Novos (7 dias)", value: fmt(k.newUsers7d), icon: UserPlus, color: "text-amber-400" },
    { label: "Novos (30 dias)", value: fmt(k.newUsers30d), icon: UserPlus, color: "text-amber-400" },
    { label: "Engajamento DAU/MAU", value: k.mau ? `${Math.round((k.dau / k.mau) * 100)}%` : "—", icon: TrendingUp, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-black">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Visão geral em tempo real da plataforma.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card rounded-2xl p-4">
            <Icon className={`h-4 w-4 ${color}`} />
            <div className="mt-2 text-xl font-display font-black tabular-nums">{value}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Crescimento de usuários (30 dias)">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.series.users}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={shortDate} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<TT />} />
              <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Participações por dia (30 dias)">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.series.predictions}>
              <defs>
                <linearGradient id="gPred" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={shortDate} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<TT />} />
              <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="url(#gPred)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Tokens distribuídos por dia">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.series.tokens}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={shortDate} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<TT />} />
              <Bar dataKey="value" fill="#fbbf24" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Novos cadastros por dia">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.series.signups}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={shortDate} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<TT />} />
              <Line type="monotone" dataKey="value" stroke="#fbbf24" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-display font-black mb-3 flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary" /> Top desafios
          </h3>
          {data.topChallenges.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
          ) : (
            <ul className="space-y-2">
              {data.topChallenges.map((c, i) => (
                <li key={c.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="h-6 w-6 rounded-md bg-primary/15 text-primary text-xs font-bold grid place-items-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="truncate">{c.title}</span>
                  </span>
                  <span className="font-bold tabular-nums text-primary">{fmt(c.predictions)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass-card rounded-2xl p-5">
          <h3 className="font-display font-black mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-amber-400" /> Top empresas
          </h3>
          {data.topCompanies.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
          ) : (
            <ul className="space-y-2">
              {data.topCompanies.map((c, i) => (
                <li key={c.name} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="h-6 w-6 rounded-md bg-amber-400/15 text-amber-400 text-xs font-bold grid place-items-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="truncate">{c.name}</span>
                  </span>
                  <span className="font-bold tabular-nums text-amber-400">{fmt(c.challenges)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <h3 className="font-display font-black text-sm mb-3">{title}</h3>
      {children}
    </div>
  );
}

function shortDate(s: string) {
  const [, m, d] = s.split("-");
  return `${d}/${m}`;
}

function TT({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-card/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
      <div className="font-bold mb-1">{label}</div>
      <div className="tabular-nums">{fmt(payload[0].value as number)}</div>
    </div>
  );
}
