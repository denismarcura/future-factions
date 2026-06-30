import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Loader2, Check, KeyRound } from "lucide-react";
import {
  listApiSettings,
  upsertApiSetting,
  type ApiSettingRow,
} from "@/lib/api-settings.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/apis")({
  head: () => ({ meta: [{ title: "APIs · Admin" }, { name: "robots", content: "noindex" }] }),
  component: ApisPage,
});

const PROVIDERS = [
  {
    key_name: "anthropic_api_key",
    label: "Anthropic (Claude)",
    placeholder: "sk-ant-...",
    description: "Usada para geração de textos, desafios e análises.",
  },
  {
    key_name: "openai_api_key",
    label: "OpenAI",
    placeholder: "sk-...",
    description: "Usada para geração de imagens (artes e banners).",
  },
  {
    key_name: "resend_api_key",
    label: "Resend",
    placeholder: "re_...",
    description: "Usada para envio de e-mails transacionais.",
  },
] as const;

function ApiCard({
  provider,
  existing,
  onSaved,
}: {
  provider: (typeof PROVIDERS)[number];
  existing: ApiSettingRow | undefined;
  onSaved: () => void;
}) {
  const upsert = useServerFn(upsertApiSetting);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  const isConfigured = existing?.is_configured ?? false;

  async function handleSave() {
    const trimmed = value.trim();
    if (!trimmed) {
      toast.error("Cole a chave antes de salvar.");
      return;
    }
    setSaving(true);
    try {
      await upsert({ data: { key_name: provider.key_name, key_value: trimmed } });
      setValue("");
      toast.success("Chave salva com sucesso.");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display font-bold text-lg">{provider.label}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{provider.description}</p>
        </div>
        <span
          className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold border ${
            isConfigured
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              : "bg-muted/40 text-muted-foreground border-border"
          }`}
        >
          {isConfigured ? "Configurada" : "Não configurada"}
        </span>
      </div>

      {isConfigured && (
        <div className="px-3 py-2 rounded-lg bg-muted/30 border border-border/40 text-sm font-mono text-muted-foreground">
          {existing?.masked_value}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="password"
          placeholder={isConfigured ? "Nova chave para substituir" : provider.placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 h-10 px-3 rounded-lg bg-card border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
        />
        <button
          onClick={handleSave}
          disabled={saving || !value.trim()}
          className="h-10 px-5 rounded-full bg-gradient-brand text-primary-foreground font-bold text-sm shadow-glow hover:scale-[1.02] transition inline-flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {saving ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </div>
  );
}

function ApisPage() {
  const list = useServerFn(listApiSettings);
  const [rows, setRows] = useState<ApiSettingRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function reload() {
    setLoading(true);
    try {
      setRows(await list());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, [list]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-display font-bold">Chaves de API</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4">
          {PROVIDERS.map((p) => (
            <ApiCard
              key={p.key_name}
              provider={p}
              existing={rows.find((r) => r.key_name === p.key_name)}
              onSaved={reload}
            />
          ))}
        </div>
      )}
    </div>
  );
}
