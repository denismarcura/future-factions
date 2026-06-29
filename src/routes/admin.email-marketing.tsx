import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Check,
  Copy,
  Eye,
  FileText,
  LayoutTemplate,
  Loader2,
  Mail,
  MousePointerClick,
  Plus,
  RefreshCw,
  Save,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  EMAIL_PREFERENCE_LABELS,
  enqueueEmailCampaign,
  listEmailMarketingData,
  syncEmailContactsFromProfiles,
  upsertEmailCampaign,
  upsertEmailTemplate,
} from "@/lib/email-marketing.functions";

export const Route = createFileRoute("/admin/email-marketing")({
  component: EmailMarketing,
});

const SEGMENTS = [
  ["todos", "Todos"],
  ["ativos", "Usuarios ativos"],
  ["inativos", "Usuarios inativos"],
  ["nunca_participaram", "Nunca participaram"],
  ["ja_participaram", "Ja participaram"],
  ["criaram_desafios", "Criaram desafios"],
  ["nunca_criaram", "Nunca criaram"],
  ["possuem_tokens", "Possuem Tokens"],
  ["poucos_tokens", "Poucos Tokens"],
  ["proximos_premio", "Proximos de premio"],
  ["sem_login_30", "Sem login ha 30 dias"],
  ["sem_login_60", "Sem login ha 60 dias"],
  ["sem_login_90", "Sem login ha 90 dias"],
  ["cidade", "Cidade"],
  ["estado", "Estado"],
  ["pais", "Pais"],
  ["idioma", "Idioma"],
  ["aceita_promocoes", "Aceita promocoes"],
  ["aceita_missoes", "Aceita missoes"],
  ["aceita_tokens", "Aceita tokens"],
  ["aceita_newsletter", "Aceita newsletter"],
] as const;

const CATEGORIES = [
  "Boas-vindas",
  "Promocao",
  "Novo desafio",
  "Tokens",
  "Missoes",
  "Premios",
  "Newsletter",
  "Institucional",
] as const;

const BLOCKS = [
  { type: "logo", label: "Logo" },
  { type: "banner", label: "Banner" },
  { type: "text", label: "Texto" },
  { type: "button", label: "Botao" },
  { type: "cards", label: "Cards" },
  { type: "ranking", label: "Ranking" },
  { type: "missions", label: "Missoes" },
  { type: "tokens", label: "Tokens" },
  { type: "prizes", label: "Premios" },
  { type: "divider", label: "Separador" },
  { type: "social", label: "Redes sociais" },
  { type: "footer", label: "Rodape" },
] as const;

type EmailData = any;
type Tab = "dashboard" | "contatos" | "templates" | "campanhas" | "automacoes" | "estatisticas" | "config";
type LayoutBlock = { type: string; label?: string; content?: string; href?: string };
const TABS: Array<{ id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "contatos", label: "Contatos", icon: Users },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "campanhas", label: "Campanhas", icon: Send },
  { id: "automacoes", label: "Automacoes", icon: Sparkles },
  { id: "estatisticas", label: "Estatisticas", icon: Activity },
  { id: "config", label: "Configuracoes", icon: Settings },
];

function EmailMarketing() {
  const loadData = useServerFn(listEmailMarketingData);
  const syncContacts = useServerFn(syncEmailContactsFromProfiles);
  const [data, setData] = useState<EmailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("dashboard");

  async function load() {
    setLoading(true);
    try {
      setData(await loadData());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar e-mail marketing");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSync() {
    try {
      const result = await syncContacts();
      toast.success(`${result.count} contatos sincronizados`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao sincronizar");
    }
  }

  if (loading && !data) {
    return (
      <div className="min-h-[45vh] grid place-items-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary text-xs uppercase tracking-wider font-black">
            <Mail className="h-4 w-4" /> Resend ativo
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl">E-mail Marketing</h1>
          <p className="text-sm text-muted-foreground">
            Campanhas, contatos, templates, preferencias e webhooks em um unico painel.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSync}
            className="h-10 px-4 rounded-full glass-card border border-border/60 text-sm font-bold inline-flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Sincronizar contatos
          </button>
          <button
            onClick={load}
            className="h-10 px-4 rounded-full bg-gradient-brand text-primary-foreground text-sm font-bold inline-flex items-center gap-2 shadow-glow"
          >
            <Activity className="h-4 w-4" /> Atualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Metric icon={Users} label="Contatos" value={data?.stats.totalContacts ?? 0} />
        <Metric icon={Check} label="Ativos" value={data?.stats.active ?? 0} tone="primary" />
        <Metric icon={XCircle} label="Opt-out" value={data?.stats.optOut ?? 0} tone="gold" />
        <Metric icon={Eye} label="Aberturas" value={`${data?.stats.opened ?? 0}`} />
        <Metric icon={MousePointerClick} label="CTR" value={`${data?.stats.ctr ?? 0}%`} tone="primary" />
      </div>

      <div className="glass-card rounded-2xl p-2 flex gap-1 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={String(id)}
            onClick={() => setTab(id as Tab)}
            className={`h-10 px-3 rounded-xl text-sm font-bold inline-flex items-center gap-2 whitespace-nowrap ${
              tab === id ? "bg-gradient-brand text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-card"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && <DashboardTab data={data} />}
      {tab === "contatos" && <ContactsTab data={data} />}
      {tab === "templates" && <TemplatesTab data={data} onChanged={load} />}
      {tab === "campanhas" && <CampaignsTab data={data} onChanged={load} />}
      {tab === "automacoes" && <AutomationTab />}
      {tab === "estatisticas" && <StatsTab data={data} />}
      {tab === "config" && <ConfigTab />}
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  tone?: "primary" | "gold";
}) {
  const color = tone === "gold" ? "text-gold" : tone === "primary" ? "text-primary" : "text-foreground";
  return (
    <div className="glass-card rounded-2xl p-4 border border-border/60">
      <Icon className={`h-5 w-5 ${color}`} />
      <div className={`mt-2 font-display text-2xl font-black tabular-nums ${color}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function DashboardTab({ data }: { data: EmailData | null }) {
  return (
    <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-4">
      <section className="glass-card rounded-2xl p-5">
        <SectionTitle icon={BarChart3} title="Grafico mensal" />
        <div className="space-y-3">
          {(data?.monthly ?? []).map((m: any) => {
            const max = Math.max(1, m.enviados, m.abertos, m.cliques);
            return (
              <div key={m.month} className="grid grid-cols-[80px_1fr] gap-3 items-center">
                <div className="text-xs text-muted-foreground font-mono">{m.month}</div>
                <div className="space-y-1">
                  <Bar label="Enviados" value={m.enviados} max={max} className="bg-primary" />
                  <Bar label="Abertos" value={m.abertos} max={max} className="bg-gold" />
                  <Bar label="Cliques" value={m.cliques} max={max} className="bg-silver" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="glass-card rounded-2xl p-5">
        <SectionTitle icon={Sparkles} title="Top campanhas" />
        <div className="space-y-2">
          {(data?.topCampaigns ?? []).length === 0 && <Empty>Nenhuma campanha enviada ainda.</Empty>}
          {(data?.topCampaigns ?? []).map((c: any) => (
            <div key={c.id} className="rounded-xl bg-card border border-border/60 p-3">
              <div className="font-bold text-sm">{c.name}</div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <span>{c.sent} envios</span>
                <span>{c.opened} aberturas</span>
                <span>{c.ctr}% CTR</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Bar({ label, value, max, className }: { label: string; value: number; max: number; className: string }) {
  return (
    <div className="grid grid-cols-[70px_1fr_42px] gap-2 items-center">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${className}`} style={{ width: `${Math.max(4, (value / max) * 100)}%` }} />
      </div>
      <span className="text-[10px] text-right font-mono">{value}</span>
    </div>
  );
}

function ContactsTab({ data }: { data: EmailData | null }) {
  const [term, setTerm] = useState("");
  const contacts = useMemo(() => {
    const q = term.toLowerCase();
    return (data?.contacts ?? []).filter((c: any) =>
      [c.nome, c.email, c.cidade, c.estado, c.status].join(" ").toLowerCase().includes(q),
    );
  }, [data, term]);

  return (
    <section className="glass-card rounded-2xl overflow-hidden">
      <div className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between border-b border-border/60">
        <SectionTitle icon={Users} title="Contatos" compact />
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Buscar por nome, e-mail, cidade..."
          className="h-10 px-3 rounded-xl bg-card border border-border/60 text-sm sm:w-80"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-card/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left p-3">Contato</th>
              <th className="text-left p-3">Local</th>
              <th className="text-left p-3">Status</th>
              <th className="text-right p-3">Tokens</th>
              <th className="text-right p-3">Criados</th>
              <th className="text-right p-3">Participou</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c: any) => (
              <tr key={c.id} className="border-t border-border/40">
                <td className="p-3">
                  <div className="font-semibold">{c.nome ?? "Sem nome"}</div>
                  <div className="text-xs text-muted-foreground">{c.email}</div>
                </td>
                <td className="p-3 text-muted-foreground">{[c.cidade, c.estado, c.pais].filter(Boolean).join(" / ") || "-"}</td>
                <td className="p-3"><StatusBadge status={c.status} /></td>
                <td className="p-3 text-right tabular-nums">{c.total_tokens ?? 0}</td>
                <td className="p-3 text-right tabular-nums">{c.desafios_criados ?? 0}</td>
                <td className="p-3 text-right tabular-nums">{c.desafios_participados ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TemplatesTab({ data, onChanged }: { data: EmailData | null; onChanged: () => void }) {
  const saveTemplate = useServerFn(upsertEmailTemplate);
  const [editing, setEditing] = useState<any | null>(null);
  const [blocks, setBlocks] = useState<LayoutBlock[]>([]);
  const [dragging, setDragging] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  function start(template?: any) {
    setEditing(
      template ?? {
        nome: "Nova campanha",
        categoria: "Newsletter",
        assunto: "Novidades do Desafio dos Palpites",
        html: "<p>Oi, {{nome}}!</p><p>Veja as novidades que separamos para voce.</p>",
        status: "rascunho",
      },
    );
    setBlocks((template?.json_layout as LayoutBlock[]) ?? [{ type: "logo" }, { type: "text", content: "Oi, {{nome}}!" }, { type: "button", label: "Participar", href: "{{link}}" }, { type: "footer" }]);
  }

  function htmlFromBlocks(next = blocks) {
    return next
      .map((b) => {
        if (b.type === "logo") return "<p style=\"text-align:center;font-weight:900\">DESAFIO DOS PALPITES</p>";
        if (b.type === "banner") return `<h1>${escapePreview(b.content || "Banner da campanha")}</h1>`;
        if (b.type === "text") return `<p>${escapePreview(b.content || "Texto do e-mail")}</p>`;
        if (b.type === "button") return `<p><a href="${escapePreview(b.href || "{{link}}")}">${escapePreview(b.label || "Abrir")}</a></p>`;
        if (b.type === "cards") return "<div><h3>Cards em destaque</h3><p>{{desafio}}</p></div>";
        if (b.type === "ranking") return "<p>Seu ranking esta esperando por voce.</p>";
        if (b.type === "missions") return "<p>Novas missoes podem render Tokens extras.</p>";
        if (b.type === "tokens") return "<p>Voce tem {{tokens}} Tokens.</p>";
        if (b.type === "prizes") return "<p>Premio em destaque: {{premio}}</p>";
        if (b.type === "divider") return "<hr>";
        if (b.type === "social") return "<p>Siga nossas redes sociais e convide amigos.</p>";
        return "<p>Obrigado por jogar com a gente.</p>";
      })
      .join("\n");
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    try {
      await saveTemplate({
        data: {
          ...editing,
          html: editing.html || htmlFromBlocks(),
          json_layout: blocks,
        },
      });
      toast.success("Template salvo");
      setEditing(null);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar template");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid xl:grid-cols-[0.9fr_1.1fr] gap-4">
      <section className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between gap-2 mb-4">
          <SectionTitle icon={LayoutTemplate} title="Templates" compact />
          <button onClick={() => start()} className="h-9 px-3 rounded-full bg-gradient-brand text-primary-foreground text-xs font-bold inline-flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Novo
          </button>
        </div>
        <div className="space-y-2">
          {(data?.templates ?? []).map((t: any) => (
            <button key={t.id} onClick={() => start(t)} className="w-full text-left rounded-xl bg-card border border-border/60 p-3 hover:border-primary/60">
              <div className="flex items-center justify-between gap-2">
                <div className="font-bold">{t.nome}</div>
                <StatusBadge status={t.status} />
              </div>
              <div className="text-xs text-muted-foreground mt-1">{t.categoria} · {t.assunto}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="glass-card rounded-2xl p-5">
        {!editing ? (
          <Empty>Selecione um template ou crie um novo para editar.</Empty>
        ) : (
          <div className="space-y-4">
            <SectionTitle icon={FileText} title="Editor visual + HTML" />
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Nome" value={editing.nome} onChange={(v) => setEditing({ ...editing, nome: v })} />
              <Select label="Categoria" value={editing.categoria} onChange={(v) => setEditing({ ...editing, categoria: v })} options={CATEGORIES.map((x) => [x, x])} />
              <Field label="Assunto" value={editing.assunto} onChange={(v) => setEditing({ ...editing, assunto: v })} className="sm:col-span-2" />
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Blocos</div>
              <div className="flex flex-wrap gap-2">
                {BLOCKS.map((b) => (
                  <button
                    key={b.type}
                    onClick={() => {
                      const next = [...blocks, { type: b.type, content: b.label, label: b.label }];
                      setBlocks(next);
                      setEditing({ ...editing, html: htmlFromBlocks(next) });
                    }}
                    className="h-8 px-3 rounded-full bg-card border border-border/60 text-xs font-bold"
                  >
                    {b.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 space-y-2">
                {blocks.map((b, i) => (
                  <div
                    key={`${b.type}-${i}`}
                    draggable
                    onDragStart={() => setDragging(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragging === null || dragging === i) return;
                      const next = [...blocks];
                      const [moved] = next.splice(dragging, 1);
                      next.splice(i, 0, moved);
                      setBlocks(next);
                      setEditing({ ...editing, html: htmlFromBlocks(next) });
                      setDragging(null);
                    }}
                    onDragEnd={() => setDragging(null)}
                    className="rounded-xl bg-card border border-border/60 p-3 flex gap-2 items-center cursor-grab active:cursor-grabbing"
                  >
                    <div className="text-xs font-bold uppercase text-primary w-28">{b.type}</div>
                    <input
                      value={b.content ?? b.label ?? ""}
                      onChange={(e) => {
                        const next = blocks.map((x, idx) => idx === i ? { ...x, content: e.target.value } : x);
                        setBlocks(next);
                        setEditing({ ...editing, html: htmlFromBlocks(next) });
                      }}
                      className="flex-1 h-9 px-3 rounded-lg bg-background border border-border/60 text-xs"
                    />
                    <button onClick={() => setBlocks(blocks.filter((_, idx) => idx !== i))} className="h-8 w-8 rounded-lg border border-border/60 grid place-items-center">
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <textarea
              value={editing.html}
              onChange={(e) => setEditing({ ...editing, html: e.target.value })}
              rows={8}
              className="w-full rounded-xl bg-background border border-border/60 p-3 text-xs font-mono"
            />
            <div className="rounded-xl bg-background border border-border/60 p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Preview</div>
              <div className="prose prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: editing.html }} />
            </div>
            <button onClick={save} disabled={saving} className="h-11 px-5 rounded-full bg-gradient-brand text-primary-foreground text-sm font-bold inline-flex items-center gap-2 shadow-glow">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar template
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function CampaignsTab({ data, onChanged }: { data: EmailData | null; onChanged: () => void }) {
  const saveCampaign = useServerFn(upsertEmailCampaign);
  const enqueueCampaign = useServerFn(enqueueEmailCampaign);
  const [form, setForm] = useState({
    nome: "",
    assunto: "",
    template: "",
    segmento: { type: "todos", value: "" },
    agendamento: "",
    remetente: "",
    responder_para: "",
  });
  const [busy, setBusy] = useState<string | null>(null);
  const templates = data?.templates ?? [];

  async function save(status: "Rascunho" | "Agendada" = "Rascunho") {
    setBusy(status);
    try {
      await saveCampaign({
        data: {
          nome: form.nome,
          assunto: form.assunto,
          template: form.template || null,
          segmento: form.segmento,
          status,
          agendamento: form.agendamento ? new Date(form.agendamento).toISOString() : null,
          remetente: form.remetente || null,
          responder_para: form.responder_para || null,
        },
      });
      toast.success(status === "Agendada" ? "Campanha agendada" : "Rascunho salvo");
      setForm({ nome: "", assunto: "", template: "", segmento: { type: "todos", value: "" }, agendamento: "", remetente: "", responder_para: "" });
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar campanha");
    } finally {
      setBusy(null);
    }
  }

  async function duplicate(c: any) {
    setForm({
      nome: `${c.nome} - copia`,
      assunto: c.assunto,
      template: c.template ?? "",
      segmento: c.segmento ?? { type: "todos", value: "" },
      agendamento: "",
      remetente: c.remetente ?? "",
      responder_para: c.responder_para ?? "",
    });
    toast.success("Campanha duplicada no formulario");
  }

  async function sendNow(id: string) {
    setBusy(id);
    try {
      const result = await enqueueCampaign({ data: { campaignId: id, sendNow: true } });
      toast.success(`${result.queued} e-mails enfileirados; ${result.skipped} ignorados`);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao enviar campanha");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid xl:grid-cols-[0.85fr_1.15fr] gap-4">
      <section className="glass-card rounded-2xl p-5 space-y-4">
        <SectionTitle icon={Send} title="Criar campanha" />
        <Field label="Nome" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
        <Field label="Assunto" value={form.assunto} onChange={(v) => setForm({ ...form, assunto: v })} />
        <Select label="Template" value={form.template} onChange={(v) => setForm({ ...form, template: v })} options={[["", "Selecione"], ...templates.map((t: any) => [t.id, t.nome])]} />
        <div className="grid sm:grid-cols-2 gap-3">
          <Select
            label="Segmentacao"
            value={form.segmento.type}
            onChange={(v) => setForm({ ...form, segmento: { ...form.segmento, type: v } })}
            options={SEGMENTS.map(([id, label]) => [id, label])}
          />
          <Field label="Valor do filtro" value={form.segmento.value} onChange={(v) => setForm({ ...form, segmento: { ...form.segmento, value: v } })} />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Agendamento" type="datetime-local" value={form.agendamento} onChange={(v) => setForm({ ...form, agendamento: v })} />
          <Field label="Remetente" value={form.remetente} onChange={(v) => setForm({ ...form, remetente: v })} />
          <Field label="Responder para" value={form.responder_para} onChange={(v) => setForm({ ...form, responder_para: v })} className="sm:col-span-2" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => save("Rascunho")} disabled={!!busy} className="h-10 px-4 rounded-full bg-card border border-border/60 text-sm font-bold inline-flex items-center gap-2">
            {busy === "Rascunho" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar rascunho
          </button>
          <button onClick={() => save("Agendada")} disabled={!!busy} className="h-10 px-4 rounded-full border border-gold/50 text-gold bg-gold/10 text-sm font-bold">
            Agendar
          </button>
        </div>
      </section>

      <section className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border/60">
          <SectionTitle icon={Mail} title="Campanhas" compact />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-3">Campanha</th>
                <th className="text-left p-3">Segmento</th>
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {(data?.campaigns ?? []).map((c: any) => (
                <tr key={c.id} className="border-t border-border/40">
                  <td className="p-3">
                    <div className="font-bold">{c.nome}</div>
                    <div className="text-xs text-muted-foreground">{c.assunto}</div>
                  </td>
                  <td className="p-3 text-muted-foreground">{segmentLabel(c.segmento)}</td>
                  <td className="p-3"><StatusBadge status={c.status} /></td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => duplicate(c)} className="h-8 px-2 rounded-lg border border-border/60 text-xs font-bold inline-flex items-center gap-1">
                        <Copy className="h-3 w-3" /> Duplicar
                      </button>
                      <button onClick={() => sendNow(c.id)} disabled={!!busy || c.status === "Cancelada"} className="h-8 px-2 rounded-lg bg-gradient-brand text-primary-foreground text-xs font-bold inline-flex items-center gap-1">
                        {busy === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} Enviar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AutomationTab() {
  const items = [
    ["Boas-vindas", "Envio imediato apos cadastro e criacao do contato."],
    ["Confirmacao", "Solicita preferencias por e-mail com link seguro."],
    ["Novo desafio", "Respeita opt-in de novos desafios e janela minima de 7 dias."],
    ["Promocoes", "Fila semanal para missoes, brindes, eventos e tokens."],
    ["Tokens", "Segmento de usuarios proximos de resgatar premios."],
    ["Missoes", "Segmento de usuarios sem missao concluida ha 7 dias."],
    ["Check-in", "Base preparada para regra de mais de 5 dias sem check-in."],
    ["Convites", "Segmento para usuarios sem convites realizados."],
    ["Reativacao", "Filtros de 30, 60 e 90 dias sem login."],
    ["Aniversario", "Estrutura pronta para data de aniversario quando o campo existir."],
  ];
  return (
    <section className="glass-card rounded-2xl p-5">
      <SectionTitle icon={Sparkles} title="Automacoes" />
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {items.map(([title, desc]) => (
          <div key={title} className="rounded-xl bg-card border border-border/60 p-4">
            <div className="flex items-center gap-2 font-bold">
              <ShieldCheck className="h-4 w-4 text-primary" /> {title}
            </div>
            <p className="text-xs text-muted-foreground mt-2">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatsTab({ data }: { data: EmailData | null }) {
  return (
    <section className="glass-card rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-border/60">
        <SectionTitle icon={Activity} title="Eventos e estatisticas" compact />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-card/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left p-3">Campanha</th>
              <th className="text-left p-3">Evento</th>
              <th className="text-left p-3">Contato</th>
              <th className="text-right p-3">Data</th>
            </tr>
          </thead>
          <tbody>
            {(data?.logs ?? []).slice(0, 80).map((log: any) => (
              <tr key={log.id} className="border-t border-border/40">
                <td className="p-3 font-semibold">{log.email_campaigns?.nome ?? "-"}</td>
                <td className="p-3 text-muted-foreground">{log.ultimo_evento ?? "queued"}</td>
                <td className="p-3 text-muted-foreground">{log.metadata?.email ?? log.contato ?? "-"}</td>
                <td className="p-3 text-right text-muted-foreground">{new Date(log.data).toLocaleString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ConfigTab() {
  return (
    <section className="glass-card rounded-2xl p-5 space-y-4">
      <SectionTitle icon={Settings} title="Configuracoes" />
      <div className="grid md:grid-cols-2 gap-4">
        <Info title="Provedor" value="Resend via fila existente @lovable.dev/email-js" />
        <Info title="Fila" value="transactional_emails + email_queue para auditoria de marketing" />
        <Info title="Seguranca" value="RLS, service_role no servidor, idempotency_key e janela anti-spam de 7 dias" />
        <Info title="LGPD" value="Opt-out sem exclusao, preferencias por token e supressao de bounce/spam" />
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Preferencias disponiveis</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(EMAIL_PREFERENCE_LABELS).map(([key, label]) => (
            <span key={key} className="px-3 py-1 rounded-full bg-card border border-border/60 text-xs font-bold">
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Info({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl bg-card border border-border/60 p-4">
      <div className="text-xs uppercase tracking-wider text-primary font-bold">{title}</div>
      <div className="text-sm mt-1">{value}</div>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  compact,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  compact?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 ${compact ? "" : "mb-4"}`}>
      <Icon className="h-5 w-5 text-primary" />
      <h2 className="font-display font-black text-lg">{title}</h2>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full h-10 px-3 rounded-xl bg-card border border-border/60 text-sm"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly (readonly [string, string])[];
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full h-10 px-3 rounded-xl bg-card border border-border/60 text-sm"
      >
        {options.map(([id, label]) => (
          <option key={id} value={id}>{label}</option>
        ))}
      </select>
    </label>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone = status === "ativo" || status === "Finalizada"
    ? "bg-primary/15 text-primary border-primary/30"
    : status === "opt-out" || status === "Cancelada" || status === "bounce" || status === "spam"
      ? "bg-destructive/10 text-destructive border-destructive/30"
      : "bg-gold/15 text-gold border-gold/30";
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${tone}`}>{status}</span>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{children}</div>;
}

function segmentLabel(segment: any) {
  const id = segment?.type ?? "todos";
  const found = SEGMENTS.find(([key]) => key === id);
  return `${found?.[1] ?? id}${segment?.value ? `: ${segment.value}` : ""}`;
}

function escapePreview(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
