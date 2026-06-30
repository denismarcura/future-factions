import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  KeyRound,
  Check,
  AlertTriangle,
  Eye,
  EyeOff,
  Sparkles,
  Mail,
  Bot,
  Trash2,
  Loader2,
  RefreshCw,
  ServerCrash,
  Send,
} from "lucide-react";
import {
  listApiSettings,
  upsertApiSetting,
  deleteApiSetting,
  type ApiSettingRow,
} from "@/lib/api-settings.functions";
import { sendResendTestEmail } from "@/lib/admin-settings.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/apis")({
  head: () => ({ meta: [{ title: "APIs · Admin" }, { name: "robots", content: "noindex" }] }),
  component: ApisPage,
});

// ── Definição das chaves gerenciadas ─────────────────────────────────────────
type ApiGroup = {
  id: string;
  name: string;
  description: string;
  icon: typeof KeyRound;
  testable?: boolean;
  fields: {
    key_name: string;
    label: string;
    description: string;
    placeholder: string;
    secret?: boolean;
  }[];
};

const API_GROUPS: ApiGroup[] = [
  {
    id: "anthropic",
    name: "Anthropic (Claude)",
    description:
      "IA principal para geração de desafios, palpites, textos, convites, regulamentos e análise de fraudes.",
    icon: Bot,
    fields: [
      {
        key_name: "anthropic_api_key",
        label: "API Key",
        description: "Chave de API do Anthropic (console.anthropic.com)",
        placeholder: "sk-ant-...",
        secret: true,
      },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "Usada para geração de imagens (artes de desafio, banners e fotos de prêmios).",
    icon: Sparkles,
    fields: [
      {
        key_name: "openai_api_key",
        label: "API Key",
        description: "Chave de API da OpenAI (platform.openai.com/api-keys)",
        placeholder: "sk-...",
        secret: true,
      },
    ],
  },
  {
    id: "resend",
    name: "Resend",
    description:
      "Serviço de envio de e-mails transacionais e campanhas. Usado em convites de amigos, convites de desafio e notificações.",
    icon: Mail,
    testable: true,
    fields: [
      {
        key_name: "resend_api_key",
        label: "API Key",
        description: "Chave de API do Resend (resend.com/api-keys)",
        placeholder: "re_...",
        secret: true,
      },
    ],
  },
  {
    id: "smtp",
    name: "SMTP",
    description: "Servidor de e-mail alternativo via protocolo SMTP.",
    icon: Mail,
    fields: [
      {
        key_name: "smtp_host",
        label: "Host",
        description: "Endereço do servidor SMTP",
        placeholder: "smtp.exemplo.com.br",
      },
      {
        key_name: "smtp_port",
        label: "Porta",
        description: "Porta SMTP (geralmente 587 ou 465)",
        placeholder: "587",
      },
      {
        key_name: "smtp_user",
        label: "Usuário",
        description: "E-mail ou usuário de autenticação",
        placeholder: "no-reply@exemplo.com.br",
      },
      {
        key_name: "smtp_pass",
        label: "Senha",
        description: "Senha ou App Password do servidor SMTP",
        placeholder: "senha secreta",
        secret: true,
      },
    ],
  },
  {
    id: "lovable",
    name: "Lovable Gateway (fallback)",
    description:
      "Gateway de IA legado — usado como fallback quando Anthropic/OpenAI não estão configuradas.",
    icon: KeyRound,
    fields: [
      {
        key_name: "lovable_api_key",
        label: "API Key",
        description: "Chave do Lovable AI Gateway (fallback para texto e imagens)",
        placeholder: "...",
        secret: true,
      },
    ],
  },
];

// ── Card por grupo ────────────────────────────────────────────────────────────
function ApiGroupCard({
  group,
  rows,
  onSaved,
}: {
  group: ApiGroup;
  rows: ApiSettingRow[];
  onSaved: () => void;
}) {
  const upsert = useServerFn(upsertApiSetting);
  const remove = useServerFn(deleteApiSetting);
  const testResend = useServerFn(sendResendTestEmail);

  const Icon = group.icon;
  const [values, setValues] = useState<Record<string, string>>({});
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const configuredCount = group.fields.filter((f) =>
    rows.find((r) => r.key_name === f.key_name && r.is_configured),
  ).length;
  const allConfigured = configuredCount === group.fields.length;

  async function handleSave() {
    const entries = group.fields.filter((f) => values[f.key_name]?.trim());
    if (!entries.length) {
      toast.error("Preencha pelo menos um campo antes de salvar.");
      return;
    }
    setSaving(true);
    try {
      await Promise.all(
        entries.map((f) =>
          upsert({
            data: {
              key_name: f.key_name,
              key_value: values[f.key_name].trim(),
              description: f.description,
            },
          }),
        ),
      );
      setValues({});
      toast.success("Chave(s) salva(s) com sucesso.");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(key_name: string) {
    setDeleting(key_name);
    try {
      await remove({ data: { key_name } });
      toast.success("Chave removida.");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao remover.");
    } finally {
      setDeleting(null);
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const to = u?.user?.email;
      if (!to) {
        toast.error("Não foi possível identificar seu e-mail para o teste.");
        return;
      }
      await testResend({ data: { to } });
      toast.success(`E-mail de teste enviado para ${to}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no envio de teste.");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 grid place-items-center shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg leading-tight">{group.name}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">{group.description}</p>
          </div>
        </div>
        <span
          className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border whitespace-nowrap ${
            allConfigured
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              : configuredCount > 0
                ? "bg-gold/15 text-gold border-gold/30"
                : "bg-muted/40 text-muted-foreground border-border"
          }`}
        >
          {allConfigured
            ? "Configurado"
            : configuredCount > 0
              ? `${configuredCount}/${group.fields.length} campos`
              : "Não configurado"}
        </span>
      </div>

      {/* Fields */}
      <div className="grid sm:grid-cols-2 gap-3">
        {group.fields.map((f) => {
          const existing = rows.find((r) => r.key_name === f.key_name);
          return (
            <div key={f.key_name} className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase tracking-wider text-muted-foreground">
                  {f.label}
                </label>
                {existing?.is_configured && (
                  <button
                    type="button"
                    onClick={() => handleDelete(f.key_name)}
                    disabled={deleting === f.key_name}
                    className="text-muted-foreground hover:text-destructive transition"
                    title="Remover chave"
                  >
                    {deleting === f.key_name ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>

              {/* Valor mascarado existente */}
              {existing?.is_configured && values[f.key_name] === undefined && (
                <>
                  <div className="h-10 px-3 rounded-lg bg-muted/30 border border-border/40 flex items-center text-sm text-muted-foreground font-mono">
                    {existing.masked_value}
                  </div>
                  <button
                    type="button"
                    onClick={() => setValues((prev) => ({ ...prev, [f.key_name]: "" }))}
                    className="text-xs text-primary hover:underline"
                  >
                    Alterar chave
                  </button>
                </>
              )}

              {/* Campo de edição */}
              {(!existing?.is_configured || values[f.key_name] !== undefined) && (
                <div className="relative">
                  <input
                    type={f.secret && !show[f.key_name] ? "password" : "text"}
                    placeholder={
                      existing?.is_configured
                        ? "Nova chave (deixe vazio para manter)"
                        : f.placeholder
                    }
                    value={values[f.key_name] ?? ""}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [f.key_name]: e.target.value }))
                    }
                    className="w-full h-10 px-3 pr-10 rounded-lg bg-card border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
                  />
                  {f.secret && (
                    <button
                      type="button"
                      onClick={() =>
                        setShow((prev) => ({ ...prev, [f.key_name]: !prev[f.key_name] }))
                      }
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {show[f.key_name] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/40 gap-3 flex-wrap">
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-gold shrink-0" />
          Armazenado com segurança no servidor — nunca exposto ao navegador.
        </div>
        <div className="flex items-center gap-2">
          {group.testable && allConfigured && (
            <button
              onClick={handleTest}
              disabled={testing}
              className="h-10 px-4 rounded-full border border-border/60 bg-card text-sm font-semibold hover:bg-card/70 transition inline-flex items-center gap-2 disabled:opacity-60"
            >
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Enviar teste
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !Object.values(values).some((v) => v?.trim())}
            className="h-10 px-5 rounded-full bg-gradient-brand text-primary-foreground font-bold text-sm shadow-glow hover:scale-[1.02] transition inline-flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
function ApisPage() {
  const list = useServerFn(listApiSettings);
  const [rows, setRows] = useState<ApiSettingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const data = await list();
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar configurações.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, [list]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-display font-bold">Chaves de API</h2>
        </div>
        <button
          onClick={reload}
          disabled={loading}
          className="h-8 px-3 rounded-lg border border-border/60 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      <div className="glass-card rounded-2xl p-4 text-sm text-muted-foreground">
        Configure aqui as integrações de IA e e-mail. As chaves ficam armazenadas no banco de dados
        do servidor e nunca são enviadas ao navegador. O sistema usa o{" "}
        <strong>.env</strong> como fallback caso a chave não esteja cadastrada aqui.
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          <ServerCrash className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading && !rows.length && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-6 animate-pulse">
              <div className="h-5 w-40 bg-muted/40 rounded mb-3" />
              <div className="h-4 w-72 bg-muted/30 rounded" />
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <div className="grid gap-4">
          {API_GROUPS.map((group) => (
            <ApiGroupCard key={group.id} group={group} rows={rows} onSaved={reload} />
          ))}
        </div>
      )}
    </div>
  );
}
