import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import {
  Building2, Plus, Sparkles, Loader2, Trash2, Pencil, BarChart3, Trophy, FileText,
  Settings, ListChecks, Archive, Gift, LayoutDashboard, Save, X,
} from "lucide-react";
import { toast } from "sonner";
import { generateCorporateChallenge } from "@/lib/corporate-challenge-ai.functions";
import { getCorpStats, type CorpStats } from "@/lib/admin-stats.functions";
import { listAllCorpChallengesAdmin, updateCorpChallengeStatus, deleteCorpChallenge, type AdminCorpChallenge } from "@/lib/admin-data.functions";
import { Criar } from "@/routes/criar";

export const Route = createFileRoute("/admin/empresas")({
  component: AdminEmpresasPage,
});

type Company = {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  responsavel: string;
  email: string;
  whatsapp: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  instagram: string;
  status: "ativa" | "inativa" | "bloqueada";
  plano: "gratuito" | "bronze" | "prata" | "ouro" | "diamante";
  createdAt: string;
};

type CorpChallenge = {
  id: string;
  companyId: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  tipo: string;
  cidade: string;
  estado: string;
  prizeType: string;
  prizeName: string;
  prizeValue: string;
  winners: number;
  startsAt: string;
  endsAt: string;
  awardAt: string;
  missions: string[];
  rules: string[];
  status: "ativo" | "encerrado" | "rascunho";
  participants: number;
  createdAt: string;
};

const LS_COMPANIES = "ddp:admin:companies";
const LS_CHALLENGES = "ddp:admin:corp-challenges";

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : fallback; } catch { return fallback; }
}
function save<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "empresas", label: "Empresas", icon: Building2 },
  { id: "novo", label: "Novo Desafio", icon: Plus },
  { id: "ativos", label: "Ativos", icon: ListChecks },
  { id: "encerrados", label: "Encerrados", icon: Archive },
  { id: "premiacoes", label: "Premiações", icon: Gift },
  { id: "relatorios", label: "Relatórios", icon: FileText },
  { id: "config", label: "Configurações", icon: Settings },
] as const;
type TabId = typeof TABS[number]["id"];

function AdminEmpresasPage() {
  const [tab, setTab] = useState<TabId>("dashboard");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [challenges, setChallenges] = useState<CorpChallenge[]>([]);
  const [dbChallenges, setDbChallenges] = useState<AdminCorpChallenge[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const fetchAll = useServerFn(listAllCorpChallengesAdmin);

  useEffect(() => {
    setCompanies(load<Company[]>(LS_COMPANIES, []));
    setChallenges(load<CorpChallenge[]>(LS_CHALLENGES, []));
  }, []);

  const reloadDb = () => {
    setDbLoading(true);
    fetchAll()
      .then((r) => { setDbChallenges(r); })
      .catch(() => { /* silent */ })
      .finally(() => setDbLoading(false));
  };
  useEffect(() => { reloadDb(); }, [fetchAll]);

  const updateCompanies = (list: Company[]) => { setCompanies(list); save(LS_COMPANIES, list); };
  const updateChallenges = (list: CorpChallenge[]) => { setChallenges(list); save(LS_CHALLENGES, list); };

  const ativosDb = useMemo(() => dbChallenges.filter((c) => c.status === "ativo"), [dbChallenges]);
  const encerradosDb = useMemo(() => dbChallenges.filter((c) => c.status !== "ativo"), [dbChallenges]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-brand grid place-items-center shadow-glow">
          <Building2 className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-display font-black">Desafios para Empresas</h2>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Campanhas corporativas e patrocinadas</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 p-1 glass-card rounded-2xl">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition ${
              tab === id ? "bg-gradient-brand text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground hover:bg-card"
            }`}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && <DashboardTab companies={companies} challenges={challenges} dbChallenges={dbChallenges} />}
      {tab === "empresas" && <EmpresasTab companies={companies} onChange={updateCompanies} />}
      {tab === "novo" && <Criar forCompany bare />}
      {tab === "ativos" && <DbChallengesTab list={ativosDb} loading={dbLoading} onChanged={reloadDb} emptyText="Nenhum desafio ativo no banco." />}
      {tab === "encerrados" && <DbChallengesTab list={encerradosDb} loading={dbLoading} onChanged={reloadDb} emptyText="Nenhum desafio encerrado." />}
      {tab === "premiacoes" && <PremiacoesDbTab list={dbChallenges} />}
      {tab === "relatorios" && <RelatoriosTab companies={companies} challenges={challenges} dbChallenges={dbChallenges} />}
      {tab === "config" && <ConfigTab />}
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-3 text-2xl font-display font-black tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function DashboardTab({ companies, challenges }: { companies: Company[]; challenges: CorpChallenge[] }) {
  const fetchStats = useServerFn(getCorpStats);
  const [stats, setStats] = useState<CorpStats | null>(null);
  useEffect(() => {
    let mounted = true;
    fetchStats()
      .then((s) => { if (mounted) setStats(s); })
      .catch(() => { /* silent — fallback to local */ });
    return () => { mounted = false; };
  }, [fetchStats]);

  const localParticipants = challenges.reduce((s, c) => s + (c.participants || 0), 0);
  const companiesCount = Math.max(stats?.companies ?? 0, companies.length);
  const activeCount = Math.max(stats?.activeChallenges ?? 0, challenges.filter((c) => c.status === "ativo").length);
  const closedCount = Math.max(stats?.closedChallenges ?? 0, challenges.filter((c) => c.status === "encerrado").length);
  const totalParticipants = Math.max(stats?.totalParticipants ?? 0, localParticipants);

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Empresas cadastradas" value={companiesCount} icon={Building2} />
      <StatCard label="Desafios ativos" value={activeCount} icon={ListChecks} />
      <StatCard label="Desafios encerrados" value={closedCount} icon={Archive} />
      <StatCard label="Participações totais" value={totalParticipants.toLocaleString("pt-BR")} icon={BarChart3} />
    </div>
  );
}

const EMPTY_COMPANY: Company = {
  id: "", razaoSocial: "", nomeFantasia: "", cnpj: "", responsavel: "", email: "", whatsapp: "",
  cep: "", rua: "", numero: "", complemento: "", bairro: "",
  cidade: "", estado: "", instagram: "", status: "ativa", plano: "gratuito", createdAt: "",
};

function EmpresasTab({ companies, onChange }: { companies: Company[]; onChange: (l: Company[]) => void }) {
  const [editing, setEditing] = useState<Company | null>(null);

  function startNew() { setEditing({ ...EMPTY_COMPANY, id: crypto.randomUUID() }); }
  function saveCompany(c: Company) {
    if (!c.nomeFantasia.trim()) { toast.error("Nome fantasia é obrigatório"); return; }
    if (!c.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) { toast.error("E-mail válido é obrigatório"); return; }
    if (!c.responsavel.trim()) { toast.error("Responsável é obrigatório"); return; }
    const exists = companies.find((x) => x.id === c.id);
    const next = exists
      ? companies.map((x) => (x.id === c.id ? c : x))
      : [{ ...c, createdAt: new Date().toISOString() }, ...companies];
    onChange(next);
    setEditing(null);
    toast.success(exists ? "✅ Empresa atualizada com sucesso!" : `✅ Cadastro de ${c.nomeFantasia} recebido com sucesso!`);
  }
  function remove(id: string) {
    if (!confirm("Excluir esta empresa?")) return;
    onChange(companies.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-display font-bold text-lg">Empresas cadastradas ({companies.length})</h3>
        <button onClick={startNew} className="h-10 px-4 rounded-full bg-gradient-brand text-primary-foreground text-sm font-bold flex items-center gap-2 shadow-glow">
          <Plus className="h-4 w-4" /> Nova empresa
        </button>
      </div>

      {editing && <CompanyForm value={editing} onSave={saveCompany} onCancel={() => setEditing(null)} />}

      {companies.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center text-muted-foreground text-sm">Nenhuma empresa cadastrada ainda.</div>
      ) : (
        <div className="grid gap-3">
          {companies.map((c) => (
            <div key={c.id} className="glass-card rounded-2xl p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-bold truncate">{c.nomeFantasia}</div>
                <div className="text-xs text-muted-foreground truncate">{c.razaoSocial || "—"} · {c.cidade}/{c.estado || "—"}</div>
                <div className="flex gap-2 mt-1">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-primary/15 text-primary">{c.plano}</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-card text-muted-foreground">{c.status}</span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setEditing(c)} className="h-9 w-9 rounded-lg bg-card grid place-items-center hover:bg-primary/15"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => remove(c.id)} className="h-9 w-9 rounded-lg bg-card grid place-items-center hover:bg-destructive/15 text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TextField({ label, value, onChange, ...rest }: { label: string; value: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <label className="block text-sm">
      <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{label}</span>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full h-10 px-3 rounded-lg bg-card border border-border/60 focus:border-primary outline-none text-sm"
      />
    </label>
  );
}

function CompanyForm({ value, onSave, onCancel }: { value: Company; onSave: (c: Company) => void; onCancel: () => void }) {
  const [c, setC] = useState<Company>(value);
  const [cepLoading, setCepLoading] = useState(false);
  const set = (k: keyof Company) => (v: string) => setC((prev) => ({ ...prev, [k]: v }));

  async function lookupCep(rawCep: string) {
    const cep = rawCep.replace(/\D/g, "");
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) { toast.error("CEP não encontrado. Verifique e tente novamente."); return; }
      setC((prev) => ({
        ...prev,
        rua: data.logradouro || prev.rua,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        estado: data.uf || prev.estado,
      }));
      toast.success("Endereço preenchido automaticamente");
    } catch {
      toast.error("Não foi possível consultar o CEP no momento");
    } finally {
      setCepLoading(false);
    }
  }

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4 border border-primary/30">
      <div className="grid sm:grid-cols-2 gap-3">
        <TextField label="Razão social" value={c.razaoSocial} onChange={set("razaoSocial")} />
        <TextField label="Nome fantasia *" value={c.nomeFantasia} onChange={set("nomeFantasia")} />
        <TextField label="CNPJ" value={c.cnpj} onChange={set("cnpj")} />
        <TextField label="Responsável *" value={c.responsavel} onChange={set("responsavel")} />
        <TextField label="E-mail *" value={c.email} onChange={set("email")} type="email" />
        <TextField label="WhatsApp" value={c.whatsapp} onChange={set("whatsapp")} />
        <TextField label="Instagram" value={c.instagram} onChange={set("instagram")} placeholder="@empresa" />
      </div>

      <div className="pt-2 border-t border-border/40">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gold mb-3">Endereço</h4>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block text-sm sm:col-span-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">CEP</span>
            <div className="relative mt-1">
              <input
                value={c.cep}
                onChange={(e) => { const v = e.target.value; set("cep")(v); if (v.replace(/\D/g, "").length === 8) lookupCep(v); }}
                onBlur={(e) => lookupCep(e.target.value)}
                maxLength={9}
                placeholder="00000-000"
                className="w-full h-10 px-3 rounded-lg bg-card border border-border/60 focus:border-primary outline-none text-sm"
              />
              {cepLoading && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-primary" />}
            </div>
          </label>
          <TextField label="Rua" value={c.rua} onChange={set("rua")} />
          <TextField label="Número" value={c.numero} onChange={set("numero")} placeholder="123" />
          <TextField label="Complemento" value={c.complemento} onChange={set("complemento")} placeholder="Sala 1 / Bloco A" />
          <TextField label="Bairro" value={c.bairro} onChange={set("bairro")} />
          <TextField label="Cidade" value={c.cidade} onChange={set("cidade")} />
          <TextField label="Estado" value={c.estado} onChange={set("estado")} maxLength={2} placeholder="UF" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Plano</span>
          <select value={c.plano} onChange={(e) => setC({ ...c, plano: e.target.value as Company["plano"] })}
            className="mt-1 w-full h-10 px-3 rounded-lg bg-card border border-border/60 text-sm">
            {["gratuito", "bronze", "prata", "ouro", "diamante"].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Status</span>
          <select value={c.status} onChange={(e) => setC({ ...c, status: e.target.value as Company["status"] })}
            className="mt-1 w-full h-10 px-3 rounded-lg bg-card border border-border/60 text-sm">
            {["ativa", "inativa", "bloqueada"].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
      </div>

      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="h-10 px-4 rounded-full bg-card text-sm font-bold flex items-center gap-2"><X className="h-4 w-4" /> Cancelar</button>
        <button onClick={() => onSave(c)} className="h-10 px-4 rounded-full bg-gradient-brand text-primary-foreground text-sm font-bold flex items-center gap-2 shadow-glow"><Save className="h-4 w-4" /> Salvar</button>
      </div>
    </div>
  );
}

function NovoDesafioTab({ companies, onCreate }: { companies: Company[]; onCreate: (c: CorpChallenge) => void }) {
  const generateAi = useServerFn(generateCorporateChallenge);
  const [briefing, setBriefing] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  const [form, setForm] = useState<CorpChallenge>({
    id: "", companyId: companies[0]?.id ?? "", title: "", subtitle: "", description: "",
    category: "Empresas", tipo: "Aberto para todo Brasil", cidade: "", estado: "",
    prizeType: "Produto", prizeName: "", prizeValue: "", winners: 1,
    startsAt: "", endsAt: "", awardAt: "",
    missions: [], rules: [], status: "ativo", participants: 0, createdAt: "",
  });
  const set = <K extends keyof CorpChallenge>(k: K, v: CorpChallenge[K]) => setForm({ ...form, [k]: v });

  async function runAi() {
    if (briefing.trim().length < 5) { toast.error("Descreva brevemente a campanha"); return; }
    setLoadingAi(true);
    try {
      const company = companies.find((c) => c.id === form.companyId);
      const r = await generateAi({ data: { briefing, companyName: company?.nomeFantasia, prizeHint: form.prizeName || undefined } });
      setForm({
        ...form,
        title: r.title, subtitle: r.subtitle, description: r.description,
        prizeName: r.prizeName || form.prizeName,
        missions: r.missions, rules: r.rules,
      });
      toast.success("Desafio gerado pela IA!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar com IA");
    } finally { setLoadingAi(false); }
  }

  function submit() {
    if (!form.title.trim()) { toast.error("Título obrigatório"); return; }
    if (!form.companyId) { toast.error("Selecione uma empresa"); return; }
    onCreate({ ...form, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
    toast.success("Desafio criado!");
    setForm({ ...form, title: "", subtitle: "", description: "", prizeName: "", missions: [], rules: [] });
    setBriefing("");
  }

  return (
    <div className="space-y-5">
      <div className="glass-card rounded-2xl p-5 border border-primary/30 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-display font-bold">Gerar desafio com IA</h3>
        </div>
        <textarea value={briefing} onChange={(e) => setBriefing(e.target.value)} rows={3}
          placeholder="Ex: Pizzaria quer engajar clientes na semana da Copa, sortear 10 rodízios para quem acertar o placar de Brasil x Alemanha"
          className="w-full p-3 rounded-lg bg-card border border-border/60 text-sm resize-none" />
        <button onClick={runAi} disabled={loadingAi}
          className="h-10 px-4 rounded-full bg-gradient-brand text-primary-foreground text-sm font-bold flex items-center gap-2 shadow-glow disabled:opacity-60">
          {loadingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Gerar com IA
        </button>
      </div>

      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h3 className="font-display font-bold">Informações do desafio</h3>
        <label className="block text-sm">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Empresa</span>
          <select value={form.companyId} onChange={(e) => set("companyId", e.target.value)}
            className="mt-1 w-full h-10 px-3 rounded-lg bg-card border border-border/60 text-sm">
            <option value="">Selecione...</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.nomeFantasia}</option>)}
          </select>
        </label>

        <div className="grid sm:grid-cols-2 gap-3">
          <TextField label="Título *" value={form.title} onChange={(v) => set("title", v)} />
          <TextField label="Subtítulo" value={form.subtitle} onChange={(v) => set("subtitle", v)} />
        </div>

        <label className="block text-sm">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Descrição</span>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4}
            className="mt-1 w-full p-3 rounded-lg bg-card border border-border/60 text-sm resize-none" />
        </label>

        <div className="grid sm:grid-cols-3 gap-3">
          <label className="block text-sm">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Categoria</span>
            <select value={form.category} onChange={(e) => set("category", e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-lg bg-card border border-border/60 text-sm">
              {["Futebol", "Copa do Mundo", "Brasileirão", "Libertadores", "UFC", "Fórmula 1", "Reality Shows", "Empresas", "Personalizado"].map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Abrangência</span>
            <select value={form.tipo} onChange={(e) => set("tipo", e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-lg bg-card border border-border/60 text-sm">
              {["Aberto para todo Brasil", "Estado específico", "Cidade específica", "Apenas clientes", "Funcionários", "Privado por convite"].map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
          <TextField label="Vencedores" value={String(form.winners)} onChange={(v) => set("winners", Number(v) || 1)} type="number" min={1} />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <TextField label="Cidade" value={form.cidade} onChange={(v) => set("cidade", v)} />
          <TextField label="Estado" value={form.estado} onChange={(v) => set("estado", v)} maxLength={2} />
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h3 className="font-display font-bold">Premiação</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="block text-sm">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Tipo</span>
            <select value={form.prizeType} onChange={(e) => set("prizeType", e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-lg bg-card border border-border/60 text-sm">
              {["Produto", "Serviço", "Vale-compras", "Dinheiro", "Voucher", "Ingresso", "Experiência", "Outro"].map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
          <TextField label="Nome do prêmio" value={form.prizeName} onChange={(v) => set("prizeName", v)} />
          <TextField label="Valor estimado (R$)" value={form.prizeValue} onChange={(v) => set("prizeValue", v)} />
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h3 className="font-display font-bold">Período</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <TextField label="Início" value={form.startsAt} onChange={(v) => set("startsAt", v)} type="datetime-local" />
          <TextField label="Encerramento" value={form.endsAt} onChange={(v) => set("endsAt", v)} type="datetime-local" />
          <TextField label="Apuração" value={form.awardAt} onChange={(v) => set("awardAt", v)} type="datetime-local" />
        </div>
      </div>

      <ListEditor title="Missões" items={form.missions} onChange={(l) => set("missions", l)} placeholder="Ex: Seguir Instagram da empresa" />
      <ListEditor title="Regras" items={form.rules} onChange={(l) => set("rules", l)} placeholder="Ex: Participação gratuita" />

      <div className="flex justify-end">
        <button onClick={submit} className="h-11 px-6 rounded-full bg-gradient-brand text-primary-foreground font-bold text-sm flex items-center gap-2 shadow-glow">
          <Save className="h-4 w-4" /> Criar desafio
        </button>
      </div>
    </div>
  );
}

function ListEditor({ title, items, onChange, placeholder }: { title: string; items: string[]; onChange: (l: string[]) => void; placeholder: string }) {
  const [v, setV] = useState("");
  return (
    <div className="glass-card rounded-2xl p-5 space-y-3">
      <h3 className="font-display font-bold">{title}</h3>
      <div className="flex gap-2">
        <input value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder}
          className="flex-1 h-10 px-3 rounded-lg bg-card border border-border/60 text-sm" />
        <button onClick={() => { if (v.trim()) { onChange([...items, v.trim()]); setV(""); } }}
          className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-bold">Adicionar</button>
      </div>
      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li key={i} className="flex items-center justify-between gap-2 bg-card rounded-lg p-2 px-3 text-sm">
              <span>{it}</span>
              <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ChallengesListTab({ list, companies, onChange, all, emptyText }: { list: CorpChallenge[]; companies: Company[]; onChange: (l: CorpChallenge[]) => void; all: CorpChallenge[]; emptyText: string }) {
  function toggleStatus(id: string) {
    onChange(all.map((c) => c.id === id ? { ...c, status: c.status === "ativo" ? "encerrado" : "ativo" } : c));
  }
  function remove(id: string) {
    if (!confirm("Excluir desafio?")) return;
    onChange(all.filter((c) => c.id !== id));
  }
  if (list.length === 0) return <div className="glass-card rounded-2xl p-10 text-center text-muted-foreground text-sm">{emptyText}</div>;
  return (
    <div className="grid gap-3">
      {list.map((c) => {
        const company = companies.find((x) => x.id === c.companyId);
        return (
          <div key={c.id} className="glass-card rounded-2xl p-4">
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0">
                <div className="font-bold">{c.title}</div>
                <div className="text-xs text-muted-foreground">{company?.nomeFantasia ?? "—"} · {c.category} · {c.winners} vencedor(es)</div>
                {c.prizeName && <div className="text-xs mt-1">🏆 {c.prizeName}</div>}
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => toggleStatus(c.id)} className="h-9 px-3 rounded-lg bg-card text-xs font-bold hover:bg-primary/15">
                  {c.status === "ativo" ? "Encerrar" : "Reativar"}
                </button>
                <button onClick={() => remove(c.id)} className="h-9 w-9 rounded-lg bg-card grid place-items-center hover:bg-destructive/15 text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PremiacoesTab({ list }: { list: CorpChallenge[] }) {
  const items = list.filter((c) => c.prizeName);
  if (!items.length) return <div className="glass-card rounded-2xl p-10 text-center text-muted-foreground text-sm">Nenhuma premiação cadastrada.</div>;
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {items.map((c) => (
        <div key={c.id} className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-5 w-5 text-primary" />
            <div className="font-bold">{c.prizeName}</div>
          </div>
          <div className="text-xs text-muted-foreground">{c.title}</div>
          <div className="text-xs mt-1">Tipo: {c.prizeType} · Valor: {c.prizeValue || "—"} · {c.winners} vencedor(es)</div>
        </div>
      ))}
    </div>
  );
}

function RelatoriosTab({ companies, challenges }: { companies: Company[]; challenges: CorpChallenge[] }) {
  return (
    <div className="glass-card rounded-2xl p-5 space-y-3">
      <h3 className="font-display font-bold">Relatório resumido</h3>
      <ul className="text-sm space-y-1">
        <li>Total de empresas: <b>{companies.length}</b></li>
        <li>Desafios ativos: <b>{challenges.filter((c) => c.status === "ativo").length}</b></li>
        <li>Desafios encerrados: <b>{challenges.filter((c) => c.status === "encerrado").length}</b></li>
        <li>Premiações distribuídas: <b>{challenges.filter((c) => c.status === "encerrado").reduce((s, c) => s + c.winners, 0)}</b></li>
        <li>Participações estimadas: <b>{challenges.reduce((s, c) => s + (c.participants || 0), 0)}</b></li>
      </ul>
      <p className="text-xs text-muted-foreground">Relatórios detalhados (CSV/PDF) serão liberados quando os dados forem persistidos no banco.</p>
    </div>
  );
}

function ConfigTab() {
  return (
    <div className="glass-card rounded-2xl p-5 space-y-3">
      <h3 className="font-display font-bold">Configurações</h3>
      <p className="text-sm text-muted-foreground">Configurações de créditos, missões padrão, critérios de desempate e regras de comprovação serão habilitadas após a definição do esquema de banco.</p>
      <button
        onClick={() => { if (confirm("Limpar todos os dados de empresas e desafios corporativos?")) { localStorage.removeItem(LS_COMPANIES); localStorage.removeItem(LS_CHALLENGES); location.reload(); } }}
        className="h-10 px-4 rounded-full bg-destructive/15 text-destructive text-sm font-bold">
        Limpar dados locais
      </button>
    </div>
  );
}
