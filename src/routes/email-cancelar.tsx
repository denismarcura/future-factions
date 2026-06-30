import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, MailX } from "lucide-react";
import { unsubscribeEmailByToken } from "@/lib/email-marketing.functions";
import logoAsset from "@/assets/logo-desafio.png.asset.json";

type Search = { token?: string };

export const Route = createFileRoute("/email-cancelar")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  component: EmailUnsubscribePage,
});

function EmailUnsubscribePage() {
  const { token } = Route.useSearch();
  const unsubscribe = useServerFn(unsubscribeEmailByToken);
  const [status, setStatus] = useState<"loading" | "done" | "invalid">("loading");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    unsubscribe({ data: { token } })
      .then((r) => setStatus(r.ok ? "done" : "invalid"))
      .catch(() => setStatus("invalid"));
  }, [token]);

  return (
    <div className="min-h-screen bg-background bg-radial-brand px-4 py-10 grid place-items-center">
      <section className="w-full max-w-md glass-card rounded-2xl p-8 text-center">
        <Link to="/" className="inline-flex items-center justify-center gap-3 mb-6">
          <img src={logoAsset.url} alt="" className="h-11 w-11" />
          <span className="font-display font-black">DESAFIO DOS PALPITES</span>
        </Link>

        {status === "loading" && (
          <div className="py-8 text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin mx-auto mb-3" />
            Processando cancelamento...
          </div>
        )}

        {status === "done" && (
          <div className="py-4">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="font-display font-black text-2xl">Inscricao cancelada</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Voce nao recebera novas campanhas de marketing. Sua conta continua ativa.
            </p>
            <Link to="/" className="mt-6 inline-flex h-10 px-5 rounded-full bg-gradient-brand text-primary-foreground font-bold items-center">
              Voltar para o inicio
            </Link>
          </div>
        )}

        {status === "invalid" && (
          <div className="py-4">
            <MailX className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="font-display font-black text-2xl">Link invalido</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Nao foi possivel localizar este token de cancelamento.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
