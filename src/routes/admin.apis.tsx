import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  KeyRound,
  Check,
  AlertTriangle,
  Eye,
  EyeOff,
  Sparkles,
  Mail,
  Bot,
  Send,
  Loader2,
} from "lucide-react";
import {
  getAdminSetting,
  saveAdminSetting,
  sendResendTestEmail,
} from "@/lib/admin-settings.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/apis")({
  component: ApisPage,
});

type FieldDef = { key: string; label: string; secret?: boolean; placeholder: string };

type ApiConfig = {
  id: "chatgpt" | "resend" | "maritaca";
  name: string;
  description: string;
  docsUrl: string;
  icon: typeof KeyRound;
  fields: FieldDef[];
  live?: boolean;
};

const APIS: ApiConfig[] = [
  {
    id: "resend",
    name: "Resend",
    description:
      "Serviço de envio de e-mails transacionais e campanhas. Após salvar, todos os disparos do sistema (convites, notificações de desafio) passam a usar esta chave.",
    docsUrl: "https://resend.com/api-keys",
    icon: Mail,
    fields: [
      { key: "apiKey", label: "API Key", secret: true, placeholder: "re_..." },
      {
        key: "from",
        label: "Remetente padrão",
        placeholder: "Desafio dos Palpites <no-reply@desafiodospalpites.com.br>",
      },
    ],
    live: true,
  },
  {
    id: "chatgpt",
    name: "ChatGPT (OpenAI)",
    description:
      "Usada para gerar e-mails marketing personalizados, sugestões de palpites e moderação de conteúdo.",
    docsUrl: "https://platform.openai.com/api-keys",
    icon: Sparkles,
    fields: [
      { key: "apiKey", label: "API Key", secret: true, placeholder: "sk-..." },
      { key: "model", label: "Modelo padrão", placeholder: "gpt-4o-mini" },
    ],
  },
  {
    id: "maritaca",
    name: "Maritaca AI",
    description: "IA brasileira focada em português — ótima para copy e mensagens em PT-BR.",
    docsUrl: "https://plataforma.maritaca.ai/",
    icon: Bot,
    fields: [
      { key: "apiKey", label: "API Key", secret: true, placeholder: "100..." },
      { key: "model", label: "Modelo padrão", placeholder: "sabiazinho-3" },
    ],
  },
];

function ApiCard({ api }: { api: ApiConfig }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(api.live === true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const Icon = api.icon;

  const get = useServerFn(getAdminSetting);
  const save = useServerFn(saveAdminSetting);
  const test = useServerFn(sendResendTestEmail);

  useEffect(() => {
    if (!api.live) return;
    let alive = true;
    (async () => {
      try {
        const r = await get({ data: { key: api.id } });
        if (!alive) return;
        const v = (r?.value ?? {}) as Record<string, string>;
        if (v && Object.keys(v).length) {
          setValues(v);
          setSaved(Boolean(v.apiKey));
        }
      } catch (e) {
        console.error("load setting failed", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [api.id, api.live, get]);

  const handleSave = async () => {
    if (!api.live) {
      setSaved(true);
      toast.success("Salvo localmente (integração ainda não ativada).");
      return;
    }
    if (!values.apiKey?.trim()) {
      toast.error("Informe a API Key antes de salvar.");
      return;
    }
    setSaving(true);
    try {
      await save({ data: { key: api.id, value: values } });
      setSaved(true);
      toast.success("Chave salva com sucesso!");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Falha ao salvar";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (api.id !== "resend") return;
    setTesting(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const to = u?.user?.email;
      if (!to) {
        toast.error("Não foi possível identificar seu e-mail para o teste.");
        return;
      }
      await test({ data: { to } });
      toast.success(`E-mail de teste enviado para ${to}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Falha no teste";
      toast.error(msg);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 grid place-items-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg">{api.name}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">{api.description}</p>
            <a
              href={api.docsUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary hover:underline mt-2 inline-block"
            >
              Obter chave →
            </a>
          </div>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border ${
            saved
              ? "bg-primary/15 text-primary border-primary/30"
              : "bg-muted/40 text-muted-foreground border-border"
          }`}
        >
          {loading ? "Carregando…" : saved ? "Conectado" : "Não configurado"}
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mt-5">
        {api.fields.map((f) => (
          <label key={f.key} className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              {f.label}
            </span>
            <div className="relative mt-1">
              <input
                type={f.secret && !show[f.key] ? "password" : "text"}
                placeholder={f.placeholder}
                value={values[f.key] || ""}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                disabled={loading}
                className="w-full h-10 px-3 pr-10 rounded-lg bg-card border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 disabled:opacity-60"
              />
              {f.secret && (
                <button
                  type="button"
                  onClick={() => setShow({ ...show, [f.key]: !show[f.key] })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {show[f.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              )}
            </div>
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between mt-5 gap-3 flex-wrap">
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-gold" />
          As chaves ficam armazenadas em ambiente seguro do servidor.
        </div>
        <div className="flex items-center gap-2">
          {api.id === "resend" && saved && (
            <button
              onClick={handleTest}
              disabled={testing}
              className="h-10 px-4 rounded-full border border-border/60 bg-card text-sm font-semibold hover:bg-card/70 transition inline-flex items-center gap-2 disabled:opacity-60"
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar teste
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="h-10 px-5 rounded-full bg-gradient-brand text-primary-foreground font-bold text-sm shadow-glow hover:scale-[1.02] transition inline-flex items-center gap-2 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            {saving ? "Salvando…" : saved ? "Salvo" : "Salvar chave"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ApisPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-display font-bold">Cadastro de APIs</h2>
      </div>

      <div className="glass-card rounded-2xl p-4 border-gold/30">
        <p className="text-sm text-muted-foreground">
          Configure as chaves de integração utilizadas pela plataforma. A chave do <b>Resend</b> é
          usada por todos os envios de e-mail do sistema (convites de amigos, convites de desafios
          e notificações).
        </p>
      </div>

      <div className="grid gap-4">
        {APIS.map((api) => (
          <ApiCard key={api.id} api={api} />
        ))}
      </div>
    </div>
  );
}
