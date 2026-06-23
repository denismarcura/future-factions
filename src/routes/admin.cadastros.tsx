import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Search, Download, Users as UsersIcon, Loader2 } from "lucide-react";
import { listAdminProfiles, type AdminProfile } from "@/lib/admin-data.functions";

export const Route = createFileRoute("/admin/cadastros")({
  component: Cadastros,
});

type SortKey = "recent" | "name" | "city";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "Mais recentes" },
  { key: "name", label: "Nome" },
  { key: "city", label: "Cidade" },
];

function Cadastros() {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [rows, setRows] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchProfiles = useServerFn(listAdminProfiles);

  useEffect(() => {
    let cancelled = false;
    fetchProfiles()
      .then((data) => { if (!cancelled) { setRows(data); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(e instanceof Error ? e.message : "Falha"); setLoading(false); } });
    return () => { cancelled = true; };
  }, [fetchProfiles]);

  const sorted = useMemo(() => {
    const arr = [...rows];
    switch (sort) {
      case "name":
        return arr.sort((a, b) => (a.fullName ?? "").localeCompare(b.fullName ?? ""));
      case "city":
        return arr.sort((a, b) => (a.city ?? "").localeCompare(b.city ?? ""));
      default:
        return arr.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  }, [rows, sort]);

  const filtered = sorted.filter((u) => {
    const term = q.toLowerCase();
    return (
      (u.fullName ?? "").toLowerCase().includes(term) ||
      (u.email ?? "").toLowerCase().includes(term) ||
      (u.city ?? "").toLowerCase().includes(term) ||
      (u.whatsapp ?? "").includes(term)
    );
  });

  function exportCsv() {
    const header = ["Nome", "E-mail", "WhatsApp", "Instagram", "Cidade", "Estado", "Provider", "Status", "Cadastro"];
    const lines = [header.join(";")].concat(
      filtered.map((u) => [
        u.fullName ?? "",
        u.email ?? "",
        u.whatsapp ?? "",
        u.instagram ?? "",
        u.city ?? "",
        u.state ?? "",
        u.provider ?? "",
        u.status ?? "",
        new Date(u.createdAt).toLocaleString("pt-BR"),
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"))
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `usuarios-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <UsersIcon className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-display font-bold">
            Cadastros{" "}
            <span className="text-muted-foreground font-normal text-sm">
              ({filtered.length} de {rows.length})
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nome, e-mail, cidade, whatsapp…"
              className="h-10 pl-9 pr-4 rounded-full bg-card border border-border/60 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-primary/60"
            />
          </div>
          <button onClick={exportCsv} className="h-10 px-4 rounded-full bg-card border border-border/60 hover:border-primary/60 text-sm font-semibold flex items-center gap-2">
            <Download className="h-4 w-4" /> Exportar CSV
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {SORTS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSort(s.key)}
            className={`h-9 px-4 rounded-full text-xs font-semibold border transition ${
              sort === s.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border/60 text-muted-foreground hover:border-primary/60 hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando cadastros…
          </div>
        ) : error ? (
          <div className="p-10 text-center text-destructive text-sm">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm">Nenhum usuário encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-card/60 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left p-3 font-semibold">Nome</th>
                  <th className="text-left p-3 font-semibold">E-mail</th>
                  <th className="text-left p-3 font-semibold">WhatsApp</th>
                  <th className="text-left p-3 font-semibold">Instagram</th>
                  <th className="text-left p-3 font-semibold">Cidade/UF</th>
                  <th className="text-left p-3 font-semibold">Provider</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-right p-3 font-semibold">Bônus</th>
                  <th className="text-left p-3 font-semibold">Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-t border-border/40 hover:bg-card/40">
                    <td className="p-3 font-semibold">{u.fullName || "—"}</td>
                    <td className="p-3 text-muted-foreground">{u.email || "—"}</td>
                    <td className="p-3 text-muted-foreground">{u.whatsapp || "—"}</td>
                    <td className="p-3 text-muted-foreground">{u.instagram || "—"}</td>
                    <td className="p-3 text-muted-foreground">{u.city || "—"}{u.state ? `/${u.state}` : ""}</td>
                    <td className="p-3 text-muted-foreground">{u.provider || "—"}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-semibold border border-primary/30">
                        {u.status || "active"}
                      </span>
                    </td>
                    <td className="p-3 text-right tabular-nums font-semibold text-gold">
                      {(u.welcomeBonus ?? 0).toLocaleString("pt-BR")}
                    </td>
                    <td className="p-3 text-muted-foreground">{new Date(u.createdAt).toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
