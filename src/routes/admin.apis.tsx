import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound, Check, AlertTriangle, Eye, EyeOff, Sparkles, Mail, Bot } from "lucide-react";

export const Route = createFileRoute("/admin/apis")({
  component: ApisPage,
});

type ApiConfig = {
  id: "chatgpt" | "resend" | "maritaca";
  name: string;
  description: string;
  docsUrl: string;
  icon: typeof KeyRound;
  placeholder: string;
  fields: { key: string; label: string; secret?: boolean; placeholder: string }[];
};

const APIS: ApiConfig[] = [
  {
    id: "chatgpt",
    name: "ChatGPT (OpenAI)",
    description:
      "Usada para gerar e-mails marketing personalizados, sugestões de palpites e moderação de conteúdo.",
    docsUrl: "https://platform.openai.com/api-keys",
    icon: Sparkles,
    placeholder: "sk-...",
    fields: [
      { key: "key", label: "API Key", secret: true, placeholder: "sk-..." },
      { key: "model", label: "Modelo padrão", placeholder: "gpt-4o-mini" },
    ],
  },
  {
    id: "resend",
    name: "Resend",
    description: "Serviço de envio de e-mails transacionais e campanhas de marketing.",
    docsUrl: "https://resend.com/api-keys",
    icon: Mail,
    placeholder: "re_...",
    fields: [
      { key: "key", label: "API Key", secret: true, placeholder: "re_..." },
      { key: "from", label: "Remetente padrão", placeholder: "Desafio dos Palpites <no-reply@desafiodospalpites.com.br>" },
    ],
  },
  {
    id: "maritaca",
    name: "Maritaca AI",
    description: "IA brasileira focada em português — ótima para copy e mensagens em PT-BR.",
    docsUrl: "https://plataforma.maritaca.ai/",
    icon: Bot,
    placeholder: "100...",
    fields: [
      { key: "key", label: "API Key", secret: true, placeholder: "100..." },
      { key: "model", label: "Modelo padrão", placeholder: "sabiazinho-3" },
    ],
  },
];

function ApiCard({ api }: { api: ApiConfig }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [show, setShow] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);
  const Icon = api.icon;

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
          {saved ? "Conectado" : "Não configurado"}
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
                className="w-full h-10 px-3 pr-10 rounded-lg bg-card border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
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

      <div className="flex items-center justify-between mt-5">
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-gold" />
          As chaves serão armazenadas em ambiente seguro do servidor.
        </div>
        <button
          onClick={() => setSaved(true)}
          className="h-10 px-5 rounded-full bg-gradient-brand text-primary-foreground font-bold text-sm shadow-glow hover:scale-[1.02] transition inline-flex items-center gap-2"
        >
          {saved ? <Check className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
          {saved ? "Salvo" : "Salvar chave"}
        </button>
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
          Configure as chaves de integração utilizadas pela plataforma. Estas APIs alimentam o
          e-mail marketing inteligente, geração de conteúdo e disparos transacionais.
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
