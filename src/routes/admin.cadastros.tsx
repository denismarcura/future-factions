import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { USERS, CURRENT_USER } from "@/lib/mock-data";
import { Search, Download, TrendingUp, TrendingDown, Users as UsersIcon } from "lucide-react";

export const Route = createFileRoute("/admin/cadastros")({
  component: Cadastros,
});

type SortKey = "recent" | "tokens" | "invites" | "challenges" | "missions";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "Mais recentes" },
  { key: "tokens", label: "Mais pontos" },
  { key: "invites", label: "Mais convites" },
  { key: "challenges", label: "Mais desafios criados" },
  { key: "missions", label: "Mais missões" },
];

function Cadastros() {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");

  const all = useMemo(() => {
    return USERS.map((u, i) => {
      const referrer = i === 0 ? CURRENT_USER.username : USERS[(i - 1) % USERS.length].username;
      const acc = u.acertos + u.erros > 0 ? (u.acertos / (u.acertos + u.erros)) * 100 : 0;
      const joinedDate = new Date(2025, (i * 3) % 12, ((i * 7) % 27) + 1, (i * 13) % 24, (i * 7) % 60);
      // deterministic pseudo-stats
      const invites = ((i * 17) % 47) + (i % 5);
      const challenges = ((i * 11) % 23) + (i % 3);
      const missions = ((i * 29) % 60) + (i % 7);
      return {
        ...u,
        referrer,
        email: `${u.username.toLowerCase().replace(/\s+/g, ".")}@desafiodospalpites.com.br`,
        joinedDate,
        joinedAt: joinedDate.toLocaleDateString("pt-BR"),
        accuracy: acc,
        invites,
        challenges,
        missions,
      };
    }).sort((a, b) => b.joinedDate.getTime() - a.joinedDate.getTime());
  }, []);

  const sorted = useMemo(() => {
    const arr = [...all];
    switch (sort) {
      case "tokens":
        return arr.sort((a, b) => b.tokens - a.tokens);
      case "invites":
        return arr.sort((a, b) => b.invites - a.invites);
      case "challenges":
        return arr.sort((a, b) => b.challenges - a.challenges);
      case "missions":
        return arr.sort((a, b) => b.missions - a.missions);
      default:
        return arr;
    }
  }, [all, sort]);

  const filtered = sorted.filter(
    (u) =>
      u.username.toLowerCase().includes(q.toLowerCase()) ||
      u.email.toLowerCase().includes(q.toLowerCase()) ||
      u.city.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <UsersIcon className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-display font-bold">
            Cadastros{" "}
            <span className="text-muted-foreground font-normal text-sm">
              ({filtered.length} de {all.length})
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nome, e-mail, cidade…"
              className="h-10 pl-9 pr-4 rounded-full bg-card border border-border/60 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-primary/60"
            />
          </div>
          <button className="h-10 px-4 rounded-full bg-card border border-border/60 hover:border-primary/60 text-sm font-semibold flex items-center gap-2">
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-3 font-semibold">Usuário</th>
                <th className="text-left p-3 font-semibold">E-mail</th>
                <th className="text-left p-3 font-semibold">Cidade</th>
                <th className="text-left p-3 font-semibold">Indicado por</th>
                <th className="text-left p-3 font-semibold">Cadastro</th>
                <th className="text-right p-3 font-semibold">Tokens</th>
                <th className="text-right p-3 font-semibold">Convites</th>
                <th className="text-right p-3 font-semibold">Desafios</th>
                <th className="text-right p-3 font-semibold">Missões</th>
                <th className="text-right p-3 font-semibold">Acertos</th>
                <th className="text-right p-3 font-semibold">Erros</th>
                <th className="text-right p-3 font-semibold">Acerto %</th>
                <th className="text-left p-3 font-semibold">Nível</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t border-border/40 hover:bg-card/40">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <img src={u.avatar} alt="" className="h-8 w-8 rounded-full" />
                      <span className="font-semibold">{u.username}</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{u.email}</td>
                  <td className="p-3 text-muted-foreground">
                    {u.city}/{u.state}
                  </td>
                  <td className="p-3 text-muted-foreground">{u.referrer}</td>
                  <td className="p-3 text-muted-foreground">{u.joinedAt}</td>
                  <td className="p-3 text-right tabular-nums font-semibold text-gold">
                    {u.tokens.toLocaleString("pt-BR")}
                  </td>
                  <td className="p-3 text-right tabular-nums">{u.invites}</td>
                  <td className="p-3 text-right tabular-nums">{u.challenges}</td>
                  <td className="p-3 text-right tabular-nums">{u.missions}</td>
                  <td className="p-3 text-right tabular-nums">
                    <span className="inline-flex items-center gap-1 text-primary">
                      <TrendingUp className="h-3 w-3" /> {u.acertos}
                    </span>
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    <span className="inline-flex items-center gap-1 text-destructive/80">
                      <TrendingDown className="h-3 w-3" /> {u.erros}
                    </span>
                  </td>
                  <td className="p-3 text-right tabular-nums font-semibold">
                    {u.accuracy.toFixed(1)}%
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-semibold border border-primary/30">
                      {u.level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
