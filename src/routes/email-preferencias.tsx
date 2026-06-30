import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Bell, Check, Loader2, Mail, Save, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  EMAIL_PREFERENCE_LABELS,
  getEmailPreferencesByToken,
  saveEmailPreferencesByToken,
  type EmailPreferenceKey,
} from "@/lib/email-marketing.functions";
import logoAsset from "@/assets/logo-desafio.png.asset.json";

type Search = { token?: string };

export const Route = createFileRoute("/email-preferencias")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  component: EmailPreferencesPage,
});

const keys = Object.keys(EMAIL_PREFERENCE_LABELS) as EmailPreferenceKey[];

function EmailPreferencesPage() {
  const { token } = Route.useSearch();
  const loadPrefs = useServerFn(getEmailPreferencesByToken);
  const savePrefs = useServerFn(saveEmailPreferencesByToken);
  const [contact, setContact] = useState<any | null>(null);
  const [prefs, setPrefs] = useState<Record<EmailPreferenceKey, boolean>>(
    Object.fromEntries(keys.map((k) => [k, true])) as Record<EmailPreferenceKey, boolean>,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    loadPrefs({ data: { token } })
      .then((row) => {
        setContact(row);
        if (row?.email_preferences) {
          setPrefs(Object.fromEntries(keys.map((k) => [k, row.email_preferences[k] !== false])) as Record<EmailPreferenceKey, boolean>);
        }
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Nao foi possivel carregar preferencias"))
      .finally(() => setLoading(false));
  }, [token]);

  async function save(optOut = false) {
    if (!token) return;
    setSaving(true);
    try {
      const next = optOut ? Object.fromEntries(keys.map((k) => [k, false])) as Record<EmailPreferenceKey, boolean> : prefs;
      await savePrefs({ data: { token, preferences: next, optOut } });
      setPrefs(next);
      toast.success(optOut ? "Inscricao cancelada" : "Preferencias salvas");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background bg-radial-brand px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <img src={logoAsset.url} alt="" className="h-12 w-12" />
          <div className="font-display font-black text-lg">
            DESAFIO <span className="text-gradient-brand">DOS</span>{" "}
            <span className="text-gradient-silver">PALPITES</span>
          </div>
        </Link>

        <section className="glass-card rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-11 w-11 rounded-xl bg-gradient-brand grid place-items-center shadow-glow">
              <Bell className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-black text-2xl">Preferencias de e-mail</h1>
              <p className="text-sm text-muted-foreground">
                Escolha exatamente quais comunicacoes deseja receber.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="min-h-48 grid place-items-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : !token || !contact ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
              Link invalido ou expirado.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-xl bg-card border border-border/60 p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Contato</div>
                <div className="font-bold">{contact.nome ?? contact.email}</div>
                <div className="text-sm text-muted-foreground">{contact.email}</div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {keys.map((key) => (
                  <label key={key} className="rounded-xl bg-card border border-border/60 p-4 flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefs[key]}
                      onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="text-sm font-semibold">{EMAIL_PREFERENCE_LABELS[key]}</span>
                  </label>
                ))}
              </div>

              <div className="rounded-xl bg-primary/10 border border-primary/30 p-4 flex items-start gap-3 text-sm">
                <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  Suas preferencias sao respeitadas em campanhas e automacoes. Cancelar inscricao
                  nao exclui sua conta, apenas muda seu status para opt-out.
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => save(false)}
                  disabled={saving}
                  className="h-11 px-5 rounded-full bg-gradient-brand text-primary-foreground font-bold inline-flex items-center justify-center gap-2 shadow-glow"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar preferencias
                </button>
                <button
                  onClick={() => save(true)}
                  disabled={saving}
                  className="h-11 px-5 rounded-full border border-destructive/40 text-destructive bg-destructive/10 font-bold inline-flex items-center justify-center gap-2"
                >
                  <XCircle className="h-4 w-4" /> Nao desejo receber comunicacoes
                </button>
              </div>

              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-primary" />
                Preferencias atualizadas em tempo real no sistema de e-mail marketing.
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
