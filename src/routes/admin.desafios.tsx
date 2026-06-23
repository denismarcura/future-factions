import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  listAllCorpChallengesAdmin,
  updateCorpChallengeStatus,
  deleteCorpChallenge,
  type AdminCorpChallenge,
} from "@/lib/admin-data.functions";
import { ListChecks, Search, Trash2, Clock, Users as UsersIcon, Building2, Plus, Power } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/desafios")({
  component: AdminDesafios,
});

function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

function formatRemaining(endsAt: string | null, now: number): { text: string; expired: boolean } {
  if (!endsAt) return { text: "Sem prazo", expired: false };
  const diff = new Date(endsAt).getTime() - now;
  if (diff <= 0) return { text: "Encerrado", expired: true };
  const s = Math.floor(diff / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return { text: `${d}d ${h}h`, expired: false };
  if (h > 0) return { text: `${h}h ${m}m`, expired: false };
  return { text: `${m}m`, expired: false };
}

function AdminDesafios() {
  const fetchList = useServerFn(listAllCorpChallengesAdmin);
  const toggleStatus = useServerFn(updateCorpChallengeStatus);
  const removeFn = useServerFn(deleteCorpChallenge);
  const [q, setQ] = useState("");
  const now = useNow();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-corp-challenges"],
    queryFn: () => fetchList(),
    staleTime: 30_000,
  });

  const items = data ?? [];
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        (p.companyName ?? "").toLowerCase().includes(term) ||
        (p.category ?? "").toLowerCase().includes(term),
    );
  }, [items, q]);

  async function handleDelete(id: string) {
    if (!confirm("Excluir este desafio? Esta ação não pode ser desfeita.")) return;
    try {
      await removeFn({ data: { id } });
      toast.success("Desafio excluído.");
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir.");
    }
  }

  async function handleToggle(item: AdminCorpChallenge) {
    const next = item.status === "ativo" ? "encerrado" : "ativo";
    try {
      await toggleStatus({ data: { id: item.id, status: next } });
      toast.success(next === "ativo" ? "Desafio reativado." : "Desafio encerrado.");
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-display font-bold">
            Desafios de empresas{" "}
            <span className="text-muted-foreground font-normal text-sm">
              ({filtered.length})
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/empresa/criar"
            className="h-10 px-4 rounded-full bg-gradient-brand text-primary-foreground text-sm font-bold shadow-glow inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Cadastrar Desafio Empresa
          </Link>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar título, empresa ou categoria…"
              className="h-10 pl-9 pr-4 rounded-full bg-card border border-border/60 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-primary/60"
            />
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-3 font-semibold">Desafio</th>
                <th className="text-left p-3 font-semibold">Empresa</th>
                <th className="text-left p-3 font-semibold">Categoria</th>
                <th className="text-left p-3 font-semibold">Status</th>
                <th className="text-right p-3 font-semibold">Encerra em</th>
                <th className="text-right p-3 font-semibold">Palpiteiros</th>
                <th className="text-right p-3 font-semibold w-28">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground text-sm">
                    Carregando…
                  </td>
                </tr>
              )}
              {error && !isLoading && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-destructive text-sm">
                    Erro ao carregar: {error instanceof Error ? error.message : "desconhecido"}
                  </td>
                </tr>
              )}
              {!isLoading && !error && filtered.map((p) => {
                const rem = formatRemaining(p.endsAt, now);
                const isActive = p.status === "ativo" && !rem.expired;
                return (
                  <tr key={p.id} className="border-t border-border/40 hover:bg-card/40">
                    <td className="p-3">
                      <div className="font-semibold">{p.title}</div>
                      {p.prizeName && (
                        <div className="text-xs text-muted-foreground line-clamp-1">{p.prizeName}</div>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" />
                        {p.companyName ?? "—"}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {p.category ?? "—"}
                      {p.subcategory && (
                        <div className="text-[10px] text-muted-foreground/70">{p.subcategory}</div>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          isActive
                            ? "bg-primary/15 text-primary border-primary/30"
                            : "bg-muted text-muted-foreground border-border/60"
                        }`}
                      >
                        {isActive ? "Ativo" : "Encerrado"}
                      </span>
                    </td>
                    <td className="p-3 text-right tabular-nums">
                      <span
                        className={`inline-flex items-center gap-1.5 font-semibold ${
                          rem.expired ? "text-muted-foreground" : "text-primary"
                        }`}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        {rem.text}
                      </span>
                    </td>
                    <td className="p-3 text-right tabular-nums text-muted-foreground">
                      <UsersIcon className="h-3 w-3 inline mr-1" /> {p.participants}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => handleToggle(p)}
                          className="h-8 w-8 grid place-items-center rounded-lg border border-border/60 hover:border-primary/60 hover:text-primary transition"
                          title={isActive ? "Encerrar" : "Reativar"}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="h-8 w-8 grid place-items-center rounded-lg border border-border/60 hover:border-destructive/60 hover:text-destructive transition"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground text-sm">
                    Nenhum desafio de empresa encontrado.
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
