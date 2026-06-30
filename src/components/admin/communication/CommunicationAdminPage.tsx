import { Link } from "@tanstack/react-router";
import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BellRing,
  CheckCircle2,
  Clock3,
  Code2,
  Copy,
  Database,
  Eye,
  Gauge,
  History,
  Inbox,
  Layers3,
  ListChecks,
  Lock,
  Mail,
  MailCheck,
  MailQuestion,
  MousePointerClick,
  RefreshCw,
  Save,
  Search,
  Send,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TerminalSquare,
  ToggleLeft,
  Users,
  Variable,
} from "lucide-react";

type PageKey =
  | "overview"
  | "smtp"
  | "resend"
  | "templates"
  | "campanhas"
  | "fila"
  | "logs"
  | "estatisticas"
  | "eventos"
  | "preferencias"
  | "variaveis"
  | "teste-envio";

type NavItem = {
  key: PageKey;
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { key: "overview", label: "Visão geral", href: "/admin/comunicacao", icon: Mail },
  { key: "smtp", label: "Configuração SMTP", href: "/admin/comunicacao/smtp", icon: Settings },
  { key: "resend", label: "Configuração Resend", href: "/admin/comunicacao/resend", icon: MailCheck },
  { key: "templates", label: "Templates", href: "/admin/comunicacao/templates", icon: Layers3 },
  { key: "campanhas", label: "Campanhas", href: "/admin/comunicacao/campanhas", icon: Send },
  { key: "fila", label: "Fila", href: "/admin/comunicacao/fila", icon: Inbox },
  { key: "logs", label: "Logs", href: "/admin/comunicacao/logs", icon: TerminalSquare },
  { key: "estatisticas", label: "Estatísticas", href: "/admin/comunicacao/estatisticas", icon: BarChart3 },
  { key: "eventos", label: "Eventos", href: "/admin/comunicacao/eventos", icon: BellRing },
  { key: "preferencias", label: "Preferências", href: "/admin/comunicacao/preferencias", icon: SlidersHorizontal },
  { key: "variaveis", label: "Variáveis", href: "/admin/comunicacao/variaveis", icon: Variable },
  { key: "teste-envio", label: "Teste de envio", href: "/admin/comunicacao/teste-envio", icon: MailQuestion },
];

const sampleHtml = `<div style="font-family:Inter,Arial,sans-serif;background:#09090b;color:#fafafa;padding:32px;border-radius:24px">
  <p style="color:#a1a1aa;text-transform:uppercase;letter-spacing:.12em;font-size:12px">Desafio dos Palpites</p>
  <h1 style="font-size:28px;margin:8px 0 12px">Olá, {{nome}}!</h1>
  <p style="line-height:1.6;color:#d4d4d8">Seu novo desafio já está pronto para receber palpites.</p>
  <a href="{{url}}" style="display:inline-block;margin-top:18px;background:#7c3aed;color:white;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:800">Ver desafio</a>
</div>`;

const sampleText = `Olá, {{nome}}!\n\nSeu novo desafio já está pronto para receber palpites.\n\nAcesse: {{url}}`;

const buttonPrimaryClass =
  "h-10 px-4 rounded-full bg-gradient-brand text-primary-foreground text-sm font-bold inline-flex items-center justify-center gap-2 shadow-glow";
const buttonSecondaryClass =
  "h-10 px-4 rounded-full glass-card border border-border/60 text-sm font-bold inline-flex items-center justify-center gap-2 text-foreground";
const inputClass =
  "w-full h-11 px-3 rounded-xl bg-card border border-border/60 text-sm outline-none focus:ring-2 focus:ring-primary/60 placeholder:text-muted-foreground";
const textareaClass =
  "w-full px-3 py-3 rounded-xl bg-card border border-border/60 text-sm outline-none focus:ring-2 focus:ring-primary/60 placeholder:text-muted-foreground";
const labelClass = "mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground font-black";

export function CommunicationAdminPage({ page }: { page: PageKey }) {
  const current = NAV_ITEMS.find((item) => item.key === page) ?? NAV_ITEMS[0];
  const Icon = current.icon;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-brand grid place-items-center shadow-glow shrink-0">
            <Icon className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
              <ShieldCheck className="h-3.5 w-3.5" /> Interface administrativa
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-display font-black">{current.label}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Central de Comunicação do Desafio dos Palpites. Esta sprint cria somente a interface visual,
              sem integração com envio, filas reais ou API do Resend.
            </p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-3 border border-border/60 min-w-[260px]">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <Lock className="h-4 w-4 text-primary" /> Ambiente seguro
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <MiniStatus label="UI" value="Pronta" />
            <MiniStatus label="Envio" value="Off" muted />
            <MiniStatus label="API" value="Mock" muted />
          </div>
        </div>
      </div>

      <CommunicationSubnav active={page} />

      {page === "overview" && <OverviewPanel />}
      {page === "smtp" && <SmtpPanel />}
      {page === "resend" && <ResendPanel />}
      {page === "templates" && <TemplatesPanel />}
      {page === "campanhas" && <CampaignsPanel />}
      {page === "fila" && <QueuePanel />}
      {page === "logs" && <LogsPanel />}
      {page === "estatisticas" && <StatsPanel />}
      {page === "eventos" && <EventsPanel />}
      {page === "preferencias" && <PreferencesPanel />}
      {page === "variaveis" && <VariablesPanel />}
      {page === "teste-envio" && <TestSendPanel />}
    </div>
  );
}

function CommunicationSubnav({ active }: { active: PageKey }) {
  return (
    <div className="glass-card rounded-2xl p-2 border border-border/60 overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {NAV_ITEMS.map(({ key, label, href, icon: Icon }) => (
          <Link
            key={key}
            to={href}
            className={`h-10 px-3 rounded-xl text-sm font-bold inline-flex items-center gap-2 whitespace-nowrap transition ${
              active === key ? "bg-gradient-brand text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-card hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function OverviewPanel() {
  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <MetricCard icon={MailCheck} label="Templates publicados" value="24" tone="primary" />
        <MetricCard icon={Send} label="Campanhas planejadas" value="8" />
        <MetricCard icon={Inbox} label="Itens na fila" value="1.284" tone="gold" />
        <MetricCard icon={Activity} label="Eventos hoje" value="9.742" />
      </div>
      <div className="grid xl:grid-cols-[1.2fr_.8fr] gap-4">
        <Card title="Arquitetura visual da Central" icon={Database}>
          <div className="grid sm:grid-cols-4 gap-3">
            {[
              ["Sistema", "origem do evento"],
              ["Template", "conteúdo aprovado"],
              ["Fila", "processamento seguro"],
              ["Resend", "provedor oficial"],
            ].map(([title, desc], index) => (
              <div key={title} className="rounded-2xl border border-border/60 bg-card/60 p-4">
                <div className="h-8 w-8 rounded-full bg-primary/15 text-primary grid place-items-center text-xs font-black">{index + 1}</div>
                <div className="mt-3 font-display font-black">{title}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Checklist de interface" icon={ListChecks}>
          <Checklist items={["Menus administrativos", "Formulários modernos", "Pré-visualizações", "Tabelas operacionais", "Indicadores e cards", "Sem integração de envio"]} />
        </Card>
      </div>
    </div>
  );
}

function SmtpPanel() {
  return (
    <FormGrid
      title="Configuração SMTP"
      icon={Settings}
      description="Interface para parametrização SMTP futura. Nenhuma credencial é persistida nesta sprint."
      fields={[
        ["Host SMTP", "smtp.exemplo.com"],
        ["Porta", "587"],
        ["Usuário", "mailer@desafiodospalpites.com.br"],
        ["Senha", "••••••••••••", "password"],
        ["Criptografia", "TLS"],
        ["Timeout", "30s"],
      ]}
    />
  );
}

function ResendPanel() {
  const [showSecret, setShowSecret] = useState(false);
  return (
    <div className="grid xl:grid-cols-[1fr_.8fr] gap-4">
      <Card title="Configuração Resend" icon={MailCheck}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="API Key" placeholder="re_••••••••••••••••" type={showSecret ? "text" : "password"} />
          <Field label="Domínio verificado" placeholder="mail.desafiodospalpites.com.br" />
          <Field label="Remetente padrão" placeholder="Desafio dos Palpites <no-reply@...>" />
          <Field label="Reply-to" placeholder="suporte@desafiodospalpites.com.br" />
          <Field label="Webhook Secret" placeholder="whsec_••••••••••" type={showSecret ? "text" : "password"} />
          <Field label="Região" placeholder="Global" />
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button onClick={() => setShowSecret((v) => !v)} className={buttonSecondaryClass}><Eye className="h-4 w-4" /> {showSecret ? "Ocultar segredos" : "Ver segredos"}</button>
          <button className={buttonPrimaryClass}><Save className="h-4 w-4" /> Salvar configuração</button>
        </div>
      </Card>
      <Card title="Status do provedor" icon={Gauge}>
        <ProviderStatus />
      </Card>
    </div>
  );
}

function TemplatesPanel() {
  const [preview, setPreview] = useState<"html" | "text">("html");
  return (
    <div className="grid xl:grid-cols-[1fr_.9fr] gap-4">
      <Card title="Editor de template" icon={Layers3}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Nome" placeholder="Boas-vindas com tokens" />
          <Field label="Chave" placeholder="auth.welcome.tokens" />
          <Field label="Categoria" placeholder="Tokens" />
          <Field label="Assunto" placeholder="{{nome}}, seus tokens chegaram!" />
        </div>
        <label className="mt-4 block">
          <span className={labelClass}>HTML</span>
          <textarea defaultValue={sampleHtml} className={`${textareaClass} min-h-48 font-mono text-xs leading-relaxed`} />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className={buttonSecondaryClass}><Save className="h-4 w-4" /> Salvar rascunho</button>
          <button className={buttonSecondaryClass}><Copy className="h-4 w-4" /> Duplicar template</button>
          <button className={buttonPrimaryClass}><CheckCircle2 className="h-4 w-4" /> Publicar versão</button>
        </div>
      </Card>
      <Card title="Pré-visualização" icon={Eye}>
        <div className="mb-3 flex gap-2">
          <button onClick={() => setPreview("html")} className={preview === "html" ? buttonPrimaryClass : buttonSecondaryClass}>HTML</button>
          <button onClick={() => setPreview("text")} className={preview === "text" ? buttonPrimaryClass : buttonSecondaryClass}>Texto</button>
        </div>
        {preview === "html" ? (
          <div className="rounded-2xl border border-border/60 bg-background p-4" dangerouslySetInnerHTML={{ __html: sampleHtml }} />
        ) : (
          <pre className="rounded-2xl border border-border/60 bg-card p-4 text-sm whitespace-pre-wrap text-muted-foreground">{sampleText}</pre>
        )}
        <div className="mt-4 rounded-2xl border border-border/60 p-4">
          <div className="text-xs font-black uppercase tracking-wider text-muted-foreground">Versionamento</div>
          <Timeline items={["v3 · Rascunho atual", "v2 · Publicado em 27/06", "v1 · Criado em 24/06"]} />
        </div>
      </Card>
    </div>
  );
}

function CampaignsPanel() {
  return (
    <div className="space-y-4">
      <Card title="Nova campanha" icon={Send}>
        <div className="grid md:grid-cols-4 gap-4">
          <Field label="Nome da campanha" placeholder="Newsletter semanal" />
          <Field label="Template" placeholder="newsletter.weekly" />
          <Field label="Segmento" placeholder="Usuários ativos" />
          <Field label="Agendamento" placeholder="28/06/2026 10:00" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className={buttonSecondaryClass}><Save className="h-4 w-4" /> Salvar rascunho</button>
          <button className={buttonPrimaryClass}><Clock3 className="h-4 w-4" /> Agendar campanha</button>
        </div>
      </Card>
      <DataTable
        title="Campanhas recentes"
        icon={History}
        headers={["Campanha", "Segmento", "Status", "Envios", "Abertura"]}
        rows={[
          ["Novos desafios da semana", "Ativos", "Agendada", "12.400", "-"],
          ["Missões relâmpago", "Gamificação", "Rascunho", "0", "-"],
          ["Ranking mensal", "Newsletter", "Finalizada", "8.912", "41%"],
        ]}
      />
    </div>
  );
}

function QueuePanel() {
  return (
    <DataTable
      title="Fila de envio"
      icon={Inbox}
      action={<button className={buttonSecondaryClass}><RefreshCw className="h-4 w-4" /> Atualizar visual</button>}
      headers={["ID", "Destinatário", "Template", "Prioridade", "Status", "Agendado"]}
      rows={[
        ["Q-1029", "ana@exemplo.com", "friend.invite", "Alta", "Queued", "Hoje 10:00"],
        ["Q-1030", "joao@exemplo.com", "tokens.earned", "Normal", "Paused", "Hoje 10:05"],
        ["Q-1031", "bia@exemplo.com", "newsletter.weekly", "Baixa", "Draft", "Amanhã 08:00"],
      ]}
    />
  );
}

function LogsPanel() {
  return (
    <DataTable
      title="Logs operacionais"
      icon={TerminalSquare}
      headers={["Horário", "Nível", "Origem", "Mensagem", "Contexto"]}
      rows={[
        ["09:41", "info", "queue", "Item preparado para envio", "Q-1029"],
        ["09:42", "warning", "preferences", "Usuário sem opt-in marketing", "newsletter"],
        ["09:43", "error", "provider", "Erro real aparecerá aqui na integração", "resend"],
      ]}
    />
  );
}

function StatsPanel() {
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3">
        <MetricCard icon={Send} label="Enviados" value="82.4k" />
        <MetricCard icon={CheckCircle2} label="Entregues" value="79.1k" tone="primary" />
        <MetricCard icon={Eye} label="Abertos" value="38.8k" />
        <MetricCard icon={MousePointerClick} label="Cliques" value="9.7k" />
        <MetricCard icon={AlertTriangle} label="Bounces" value="312" tone="gold" />
      </div>
      <Card title="Performance por categoria" icon={BarChart3}>
        <div className="space-y-3">
          <ProgressLine label="Convites" value={72} />
          <ProgressLine label="Tokens" value={64} />
          <ProgressLine label="Missões" value={58} />
          <ProgressLine label="Newsletter" value={42} />
        </div>
      </Card>
    </div>
  );
}

function EventsPanel() {
  return (
    <DataTable
      title="Eventos do provedor"
      icon={BellRing}
      headers={["Evento", "Mensagem", "Provedor", "Status", "Recebido"]}
      rows={[
        ["email.delivered", "resend_xxx_001", "Resend", "Processed", "há 2 min"],
        ["email.opened", "resend_xxx_001", "Resend", "Processed", "há 1 min"],
        ["email.bounced", "resend_xxx_009", "Resend", "Review", "há 30 seg"],
      ]}
    />
  );
}

function PreferencesPanel() {
  return (
    <div className="grid xl:grid-cols-[.8fr_1.2fr] gap-4">
      <Card title="Categorias de preferência" icon={SlidersHorizontal}>
        <ToggleList items={["Convites de amigos", "Recuperação de senha", "Novos desafios", "Missões", "Tokens", "Prêmios", "Marketing", "Newsletter"]} />
      </Card>
      <DataTable
        title="Preferências por usuário"
        icon={Users}
        headers={["Usuário", "E-mail", "Marketing", "Newsletter", "Transacional"]}
        rows={[
          ["Ana", "ana@exemplo.com", "Opt-in", "Opt-in", "Ativo"],
          ["João", "joao@exemplo.com", "Opt-out", "Opt-in", "Ativo"],
          ["Bia", "bia@exemplo.com", "Opt-in", "Opt-out", "Ativo"],
        ]}
      />
    </div>
  );
}

function VariablesPanel() {
  return (
    <div className="space-y-4">
      <Card title="Nova variável" icon={Variable}>
        <div className="grid md:grid-cols-5 gap-4">
          <Field label="Chave" placeholder="nome" />
          <Field label="Categoria" placeholder="Perfil" />
          <Field label="Tipo" placeholder="Texto" />
          <Field label="Valor exemplo" placeholder="Maria" />
          <Field label="Obrigatória" placeholder="Sim" />
        </div>
      </Card>
      <DataTable
        title="Catálogo de variáveis"
        icon={Code2}
        headers={["Variável", "Descrição", "Tipo", "Exemplo", "Status"]}
        rows={[
          ["{{nome}}", "Nome do usuário", "texto", "Maria", "Ativa"],
          ["{{url}}", "Link de ação", "url", "https://...", "Ativa"],
          ["{{tokens}}", "Saldo de tokens", "número", "150", "Ativa"],
        ]}
      />
    </div>
  );
}

function TestSendPanel() {
  const [status, setStatus] = useState("Aguardando simulação");
  const payload = useMemo(() => ({ template: "auth.confirm_signup", to: "teste@desafiodospalpites.com.br", variables: { nome: "Usuário Teste" } }), []);
  return (
    <div className="grid xl:grid-cols-[1fr_.8fr] gap-4">
      <Card title="Teste de envio" icon={MailQuestion}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Destinatário" placeholder="teste@desafiodospalpites.com.br" />
          <Field label="Template" placeholder="auth.confirm_signup" />
          <Field label="Nome" placeholder="Usuário Teste" />
          <Field label="Modo" placeholder="Somente interface" />
        </div>
        <label className="mt-4 block">
          <span className={labelClass}>Variáveis JSON</span>
          <textarea defaultValue={JSON.stringify(payload.variables, null, 2)} className={`${textareaClass} min-h-28 font-mono text-xs`} />
        </label>
        <button onClick={() => setStatus("Simulação visual concluída — nenhum e-mail foi enviado.")} className={`${buttonPrimaryClass} mt-4`}>
          <Send className="h-4 w-4" /> Testar envio
        </button>
      </Card>
      <Card title="Resultado da simulação" icon={Sparkles}>
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <div className="text-xs font-black uppercase tracking-wider text-muted-foreground">Status</div>
          <div className="mt-2 text-sm font-bold">{status}</div>
        </div>
        <pre className="mt-4 rounded-2xl border border-border/60 bg-background p-4 text-xs overflow-x-auto text-muted-foreground">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </Card>
    </div>
  );
}

function FormGrid({ title, icon, description, fields }: { title: string; icon: ComponentType<{ className?: string }>; description: string; fields: Array<[string, string, string?]> }) {
  const Icon = icon;
  return (
    <Card title={title} icon={Icon} description={description}>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {fields.map(([label, placeholder, type]) => <Field key={label} label={label} placeholder={placeholder} type={type} />)}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button className={buttonSecondaryClass}><ShieldCheck className="h-4 w-4" /> Validar campos</button>
        <button className={buttonPrimaryClass}><Save className="h-4 w-4" /> Salvar rascunho</button>
      </div>
    </Card>
  );
}

function Card({ title, icon: Icon, description, action, children }: { title: string; icon: ComponentType<{ className?: string }>; description?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="glass-card rounded-2xl p-5 sm:p-6 border border-border/60">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 grid place-items-center shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-black text-lg">{title}</h2>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({ label, placeholder, type = "text" }: { label: string; placeholder: string; type?: string }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input type={type} placeholder={placeholder} className={inputClass} />
    </label>
  );
}

function DataTable({ title, icon, headers, rows, action }: { title: string; icon: ComponentType<{ className?: string }>; headers: string[]; rows: string[][]; action?: ReactNode }) {
  return (
    <Card title={title} icon={icon} action={action}>
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder="Buscar registros..." />
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>{headers.map((h) => <th key={h} className="px-4 py-3 text-left font-black">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.map((row, index) => (
              <tr key={index} className="hover:bg-muted/20">
                {row.map((cell, i) => <td key={`${index}-${i}`} className="px-4 py-3 whitespace-nowrap">{renderCell(cell)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function renderCell(value: string) {
  const lower = value.toLowerCase();
  const isStatus = ["agendada", "rascunho", "finalizada", "queued", "paused", "draft", "processed", "review", "ativa", "ativo", "opt-in", "opt-out"].includes(lower);
  if (!isStatus) return value;
  return <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-bold text-primary">{value}</span>;
}

function MetricCard({ icon: Icon, label, value, tone }: { icon: ComponentType<{ className?: string }>; label: string; value: string; tone?: "primary" | "gold" }) {
  const color = tone === "gold" ? "text-gold" : tone === "primary" ? "text-primary" : "text-foreground";
  return (
    <div className="glass-card rounded-2xl p-4 border border-border/60">
      <Icon className={`h-5 w-5 ${color}`} />
      <div className={`mt-2 font-display text-2xl font-black tabular-nums ${color}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function MiniStatus({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="rounded-xl bg-card/70 border border-border/60 px-2 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-xs font-black ${muted ? "text-muted-foreground" : "text-primary"}`}>{value}</div>
    </div>
  );
}

function Checklist({ items }: { items: string[] }) {
  return <ul className="space-y-2">{items.map((item) => <li key={item} className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-primary" />{item}</li>)}</ul>;
}

function Timeline({ items }: { items: string[] }) {
  return <div className="mt-3 space-y-2">{items.map((item) => <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground"><History className="h-4 w-4" />{item}</div>)}</div>;
}

function ProviderStatus() {
  return (
    <div className="space-y-3">
      <ProgressLine label="Domínio" value={92} />
      <ProgressLine label="Webhooks" value={76} />
      <ProgressLine label="Reputação" value={88} />
      <div className="rounded-2xl border border-gold/30 bg-gold/10 p-4 text-sm text-muted-foreground">
        <AlertTriangle className="mb-2 h-5 w-5 text-gold" />
        Indicadores ilustrativos. A validação real será adicionada em sprint de integração.
      </div>
    </div>
  );
}

function ProgressLine({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm"><span className="font-bold">{label}</span><span className="text-muted-foreground">{value}%</span></div>
      <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-gradient-brand" style={{ width: `${value}%` }} /></div>
    </div>
  );
}

function ToggleList({ items }: { items: string[] }) {
  return <div className="space-y-2">{items.map((item, index) => <div key={item} className="flex items-center justify-between rounded-xl border border-border/60 bg-card/60 px-3 py-2"><span className="text-sm font-bold">{item}</span>{index < 2 ? <ToggleLeft className="h-5 w-5 text-muted-foreground" /> : <CheckCircle2 className="h-5 w-5 text-primary" />}</div>)}</div>;
}
