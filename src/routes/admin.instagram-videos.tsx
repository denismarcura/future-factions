import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Instagram, ExternalLink, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  listAllInstagramSubmissions,
  updateInstagramSubmissionStatus,
  type InstagramSubmission,
} from "@/lib/instagram-submissions.functions";

export const Route = createFileRoute("/admin/instagram-videos")({
  component: AdminInstagramVideos,
});

function AdminInstagramVideos() {
  const [items, setItems] = useState<InstagramSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const list = useServerFn(listAllInstagramSubmissions);
  const update = useServerFn(updateInstagramSubmissionStatus);

  async function refresh() {
    setLoading(true);
    try {
      setItems(await list());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function changeStatus(id: string, status: "approved" | "rejected") {
    setBusy(id);
    try {
      await update({ data: { id, status } });
      toast.success(status === "approved" ? "Aprovado" : "Rejeitado");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-black text-2xl flex items-center gap-2">
          <Instagram className="h-6 w-6 text-primary" /> Vídeos do Instagram
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Envios dos usuários — recompensa: 5.000 tokens + 4 Tokens Palpite.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
        </div>
      ) : items.length === 0 ? (
        <div className="text-sm text-muted-foreground italic p-6 rounded-xl border border-dashed border-border/60 text-center">
          Nenhum envio recebido ainda.
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="p-3">Usuário</th>
                <th className="p-3">Link</th>
                <th className="p-3">Recompensa</th>
                <th className="p-3">Status</th>
                <th className="p-3">Enviado</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} className="border-t border-border/60">
                  <td className="p-3">
                    <div className="font-semibold">{s.user_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{s.user_email || s.user_id.slice(0, 8)}</div>
                  </td>
                  <td className="p-3">
                    <a
                      href={s.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1 max-w-[280px] truncate"
                    >
                      {s.instagram_url} <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </td>
                  <td className="p-3 text-xs">
                    <div className="text-gold font-bold">{s.reward_tokens.toLocaleString("pt-BR")} TKN</div>
                    <div className="text-primary font-bold">{s.reward_palpite_tokens} TKN Palpite</div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        s.status === "approved"
                          ? "bg-primary/15 text-primary border-primary/30"
                          : s.status === "rejected"
                            ? "bg-destructive/15 text-destructive border-destructive/30"
                            : "bg-gold/15 text-gold border-gold/30"
                      }`}
                    >
                      {s.status === "approved" ? "Aprovado" : s.status === "rejected" ? "Rejeitado" : "Pendente"}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleString("pt-BR")}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        disabled={busy === s.id || s.status === "approved"}
                        onClick={() => changeStatus(s.id, "approved")}
                        className="h-8 px-3 rounded-full bg-primary text-primary-foreground text-xs font-bold inline-flex items-center gap-1 disabled:opacity-50"
                      >
                        <Check className="h-3 w-3" /> Aprovar
                      </button>
                      <button
                        disabled={busy === s.id || s.status === "rejected"}
                        onClick={() => changeStatus(s.id, "rejected")}
                        className="h-8 px-3 rounded-full bg-destructive/10 text-destructive border border-destructive/30 text-xs font-bold inline-flex items-center gap-1 disabled:opacity-50"
                      >
                        <X className="h-3 w-3" /> Rejeitar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
