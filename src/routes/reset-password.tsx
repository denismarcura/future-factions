import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import logoAsset from "@/assets/logo-desafio.png.asset.json";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // The recovery link from Supabase lands here with a `type=recovery` hash.
  // The client picks it up automatically and gives us a session.
  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (hash.includes("type=recovery") || hash.includes("access_token=")) {
      setReady(true);
      return;
    }
    // Allow it anyway when the user is already signed in via recovery
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("A senha precisa ter ao menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      toast.success("Senha atualizada!");
      setTimeout(() => navigate({ to: "/dashboard" }), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar a senha.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background bg-radial-brand grid place-items-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <img src={logoAsset.url} alt="" className="h-12 w-12 drop-shadow-[0_0_8px_rgba(0,230,118,0.55)]" />
          <div className="font-display font-black text-lg">
            DESAFIO <span className="text-gradient-brand">DOS</span>{" "}
            <span className="text-gradient-silver">PALPITES</span>
          </div>
        </Link>

        <div className="glass-card rounded-2xl p-8 border border-border/60">
          <h1 className="font-display font-black text-2xl mb-2">Definir nova senha</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Escolha uma senha forte. Você usará ela para entrar a partir de agora.
          </p>

          {!ready && !done && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-card border border-border/60 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <span>
                Abra esta página pelo link que enviamos no seu e-mail. Se já abriu e nada acontece, peça um novo link em{" "}
                <Link to="/auth" className="text-primary font-semibold">Entrar</Link>.
              </span>
            </div>
          )}

          {done ? (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-success/10 border border-success/30 text-sm text-success">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Senha atualizada com sucesso. Redirecionando…</span>
            </div>
          ) : ready ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <Field type="password" placeholder="Nova senha" value={password} onChange={setPassword} />
              <Field type="password" placeholder="Confirmar nova senha" value={confirm} onChange={setConfirm} />
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <button
                type="submit"
                disabled={busy}
                className="w-full h-11 rounded-full bg-gradient-brand text-primary-foreground font-bold text-sm shadow-glow flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar nova senha
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Field({
  type, placeholder, value, onChange,
}: { type: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        required
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 pl-10 pr-4 rounded-full bg-card border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
      />
    </div>
  );
}
