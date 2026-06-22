import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { prepareSignup } from "@/lib/signup.functions";
import { savePendingAvatar } from "@/lib/avatar-upload";
import {
  Loader2, Mail, Lock, User as UserIcon, Phone, AlertCircle, Instagram, ShieldCheck,
  Camera, FileText, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import logoAsset from "@/assets/logo-desafio.png.asset.json";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function formatCPF(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function isValidCPF(v: string): boolean {
  const c = v.replace(/\D/g, "");
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  let s = 0;
  for (let i = 0; i < 9; i++) s += parseInt(c[i]) * (10 - i);
  let d1 = 11 - (s % 11);
  if (d1 >= 10) d1 = 0;
  if (d1 !== parseInt(c[9])) return false;
  s = 0;
  for (let i = 0; i < 10; i++) s += parseInt(c[i]) * (11 - i);
  let d2 = 11 - (s % 11);
  if (d2 >= 10) d2 = 0;
  return d2 === parseInt(c[10]);
}

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const prepare = useServerFn(prepareSignup);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [cpf, setCpf] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  async function handleGoogle() {
    setError(null);
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/dashboard",
      });
      if (result.redirected) return;
      if (result.error) throw result.error;
      navigate({ to: "/dashboard" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao entrar com Google");
      setBusy(false);
    }
  }

  async function handleForgot() {
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError("Digite seu e-mail acima para receber o link.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/reset-password",
      });
      if (error) throw error;
      setInfo(`Enviamos um link para ${email}. Abra o e-mail para criar uma nova senha.`);
      toast.success("Link de recuperação enviado");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível enviar o link.");
    } finally {
      setBusy(false);
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        if (!name.trim()) throw new Error("Informe seu nome completo");
        if (!whatsapp.trim()) throw new Error("Informe seu WhatsApp");
        if (!instagram.trim()) throw new Error("Informe seu Instagram");
        if (password.length < 6) throw new Error("Senha deve ter pelo menos 6 caracteres");
        if (!acceptTerms) throw new Error("Você precisa aceitar as regras para continuar");

        // 1. Server-side IP check + city lookup + attempt record
        const { ip, city } = await prepare({ data: { email } });
        const acceptedAt = new Date().toISOString();

        // 2. Create the auth user (Supabase sends the confirmation email)
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/dashboard",
            data: {
              full_name: name,
              whatsapp,
              instagram,
              signup_ip: ip,
              signup_city: city,
              terms_accepted_at: acceptedAt,
              marketing_opt_in: marketing,
            },
          },
        });
        if (error) throw error;

        setInfo(
          "Cadastro recebido! Enviamos um e-mail de confirmação para " +
            email +
            ". Confirme para ativar sua conta.",
        );
        toast.success("Confirme seu e-mail para ativar a conta");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Bem-vindo de volta!");
      navigate({ to: "/dashboard" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
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
          <div className="flex gap-2 mb-6 p-1 rounded-full bg-card border border-border/60">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); setInfo(null); }}
                className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${
                  mode === m ? "bg-gradient-brand text-primary-foreground shadow-glow" : "text-muted-foreground"
                }`}
              >
                {m === "login" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          <button
            onClick={handleGoogle}
            disabled={busy}
            className="w-full h-11 rounded-full bg-white text-gray-800 font-semibold text-sm flex items-center justify-center gap-3 hover:bg-gray-100 transition disabled:opacity-60"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar com Google
          </button>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">ou</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            {mode === "signup" && (
              <>
                <Field icon={UserIcon} placeholder="Nome completo" value={name} onChange={setName} required />
                <Field icon={Phone} placeholder="WhatsApp (com DDD)" value={whatsapp} onChange={setWhatsapp} required />
                <Field icon={Instagram} placeholder="Instagram (@usuario)" value={instagram} onChange={setInstagram} required />
              </>
            )}
            <Field icon={Mail} type="email" placeholder="E-mail" value={email} onChange={setEmail} required />
            <Field icon={Lock} type="password" placeholder="Senha" value={password} onChange={setPassword} required />

            {mode === "login" && (
              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  onClick={handleForgot}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
            )}

            {mode === "signup" && (
              <div className="rounded-xl bg-card/60 border border-border/60 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground/80">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  REGRAS DE PARTICIPAÇÃO
                </div>
                <div className="text-xs text-muted-foreground max-h-32 overflow-y-auto leading-relaxed space-y-1.5 pr-1">
                  <p>1. Cada CPF/pessoa pode ter apenas uma conta. Até 5 cadastros são permitidos por IP.</p>
                  <p>2. Os palpites devem ser enviados até 10 minutos antes do início do jogo.</p>
                  <p>3. Prêmios em tokens são creditados após confirmação oficial dos resultados.</p>
                  <p>4. Contas com dados falsos ou múltiplas contas serão suspensas e os tokens cancelados.</p>
                  <p>5. Ao aceitar, você autoriza o registro de data, hora, cidade e endereço IP deste cadastro como prova de aceite.</p>
                  <p>6. Você pode revogar consentimentos a qualquer momento no seu painel.</p>
                </div>

                <label className="flex items-start gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-primary"
                    required
                  />
                  <span className="text-foreground/90">
                    Li e aceito as regras, os Termos de Uso e a Política de Privacidade.
                  </span>
                </label>

                <label className="flex items-start gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-primary"
                  />
                  <span className="text-muted-foreground">
                    Desejo receber informações sobre resultados, promoções, entre outros.
                  </span>
                </label>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {info && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/30 text-sm text-primary">
                <Mail className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{info}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full h-11 rounded-full bg-gradient-brand text-primary-foreground font-bold text-sm shadow-glow flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "login" ? "Entrar" : "Criar conta grátis"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon: Icon, type = "text", placeholder, value, onChange, required,
}: {
  icon: React.ComponentType<{ className?: string }>;
  type?: string; placeholder: string; value: string; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 pl-10 pr-4 rounded-full bg-card border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
      />
    </div>
  );
}
