import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { ArrowDownCircle, ArrowUpCircle, Coins, Gift, Sparkles, Trophy, Wallet, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { buildTokenHistory, type TokenMovement } from "@/lib/token-history";
import { formatTokens } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/historico-tokens")({
  head: () => ({
    meta: [
      { title: "Histórico de tokens — Desafio dos Palpites" },
      { name: "description", content: "Veja todos os créditos e débitos de tokens da sua conta." },
    ],
  }),
  component: HistoricoTokensPage,
});

const SOURCE_ICON: Record<TokenMovement["source"], React.ReactNode> = {
  welcome: <Sparkles className="h-4 w-4" />,
  mission: <Trophy className="h-4 w-4" />,
  participation: <Coins className="h-4 w-4" />,
  redemption: <Gift className="h-4 w-4" />,
};

const STATUS_LABEL: Record<NonNullable<TokenMovement["status"]>, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Recusado (estornado)",
  delivered: "Entregue",
};

function HistoricoTokensPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["token-history"],
    queryFn: buildTokenHistory,
  });
  const [filter, setFilter] = useState<"all" | "credit" | "debit">("all");

  const movements = useMemo(() => {
    if (!data) return [];
    if (filter === "all") return data.movements;
    return data.movements.filter((m) => m.type === filter);
  }, [data, filter]);

  return (
    <main className="container max-w-4xl py-6">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-black flex items-center gap-2">
          <Wallet className="h-7 w-7 text-gold" /> Histórico de tokens
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Todos os créditos e débitos da sua conta, com o motivo de cada movimento.
        </p>
      </header>

      <section className="grid sm:grid-cols-3 gap-3 mb-6">
        <SummaryCard label="Saldo atual" value={data ? formatTokens(data.balance) : "—"} accent />
        <SummaryCard label="Total ganho" value={data ? `+${formatTokens(data.totalCredits)}` : "—"} success />
        <SummaryCard label="Total gasto" value={data ? `−${formatTokens(data.totalDebits)}` : "—"} />
      </section>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="credit">Entradas</TabsTrigger>
          <TabsTrigger value="debit">Saídas</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : movements.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          Nenhum movimento por aqui ainda.
        </Card>
      ) : (
        <ol className="space-y-3">
          {movements.map((m) => (
            <li key={m.id}>
              <MovementRow m={m} />
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}

function SummaryCard({ label, value, accent, success }: { label: string; value: string; accent?: boolean; success?: boolean }) {
  return (
    <Card className="p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div
        className={`mt-1 font-display text-2xl font-black ${
          accent ? "text-gold" : success ? "text-emerald-500" : ""
        }`}
      >
        {value}
      </div>
    </Card>
  );
}

function MovementRow({ m }: { m: TokenMovement }) {
  const isCredit = m.type === "credit";
  return (
    <Card className={`p-4 ${m.refunded ? "opacity-70" : ""}`}>
      <div className="flex items-start gap-3">
        <div
          className={`flex-none h-10 w-10 rounded-xl border flex items-center justify-center ${
            isCredit
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
              : "bg-red-500/10 border-red-500/30 text-red-500"
          }`}
        >
          {isCredit ? <ArrowUpCircle className="h-5 w-5" /> : <ArrowDownCircle className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {SOURCE_ICON[m.source]}
                <span>{new Date(m.date).toLocaleString("pt-BR")}</span>
                {m.status && (
                  <Badge variant={m.status === "rejected" ? "destructive" : "secondary"} className="text-[10px]">
                    {STATUS_LABEL[m.status]}
                  </Badge>
                )}
              </div>
              <div className={`mt-0.5 font-semibold ${m.refunded ? "line-through" : ""}`}>{m.reason}</div>
              {m.detail && <div className="text-xs text-muted-foreground mt-0.5">{m.detail}</div>}
              {m.link && (
                <Link
                  to={m.link.to}
                  className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  {m.link.label} <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>
            <div
              className={`font-display text-xl font-black ${
                isCredit ? "text-emerald-500" : "text-red-500"
              } ${m.refunded ? "line-through" : ""}`}
            >
              {isCredit ? "+" : "−"}
              {formatTokens(m.amount)}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
