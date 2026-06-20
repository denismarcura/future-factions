import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Instagram, Youtube, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  type Mission,
  type Platform,
  type ActionType,
  ACTION_LABEL,
  PLATFORM_LABEL,
  PLATFORM_DEFAULT_ACTIONS,
  listMissions,
  createMission,
  updateMission,
  deleteMission,
} from "@/lib/missions";

export const Route = createFileRoute("/admin/missoes")({
  head: () => ({ meta: [{ title: "Missões · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminMissions,
});

type FormState = {
  id?: string;
  sponsor_name: string;
  platform: Platform;
  action_type: ActionType;
  title: string;
  link: string;
  tokens: number;
  bonus_tokens: number;
  active: boolean;
};

const EMPTY: FormState = {
  sponsor_name: "",
  platform: "instagram",
  action_type: "follow",
  title: "",
  link: "",
  tokens: 50,
  bonus_tokens: 0,
  active: true,
};

function AdminMissions() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      setMissions(await listMissions());
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao carregar missões");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.sponsor_name || !form.title || !form.link) {
      toast.error("Preencha patrocinador, título e link.");
      return;
    }
    setSaving(true);
    try {
      const { id, ...payload } = form;
      if (id) {
        await updateMission(id, payload);
        toast.success("Missão atualizada");
      } else {
        await createMission(payload);
        toast.success("Missão criada");
      }
      setForm(EMPTY);
      await reload();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esta missão?")) return;
    try {
      await deleteMission(id);
      toast.success("Removida");
      await reload();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  function editRow(m: Mission) {
    setForm({
      id: m.id,
      sponsor_name: m.sponsor_name,
      platform: m.platform,
      action_type: m.action_type,
      title: m.title,
      link: m.link,
      tokens: m.tokens,
      bonus_tokens: m.bonus_tokens,
      active: m.active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function quickSeed(platform: Platform, sponsor: string, baseLink: string) {
    const defaults = PLATFORM_DEFAULT_ACTIONS[platform];
    setForm({
      ...EMPTY,
      platform,
      sponsor_name: sponsor,
      action_type: defaults[0].action,
      tokens: defaults[0].tokens,
      title: `${ACTION_LABEL[defaults[0].action]} ${sponsor} no ${PLATFORM_LABEL[platform]}`,
      link: baseLink,
      bonus_tokens: platform === "instagram" ? 100 : 0,
    });
  }

  const grouped: Record<Platform, Mission[]> = { instagram: [], youtube: [], google: [] };
  missions.forEach((m) => grouped[m.platform].push(m));

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-black">
            {form.id ? "Editar missão" : "Nova missão"}
          </h2>
          <div className="flex gap-1.5 text-xs">
            <button type="button" onClick={() => quickSeed("instagram", "", "")} className="px-2 py-1 rounded-md bg-pink-500/15 text-pink-300 border border-pink-500/30 font-semibold inline-flex items-center gap-1"><Instagram className="h-3 w-3" /> IG</button>
            <button type="button" onClick={() => quickSeed("youtube", "", "")} className="px-2 py-1 rounded-md bg-red-500/15 text-red-300 border border-red-500/30 font-semibold inline-flex items-center gap-1"><Youtube className="h-3 w-3" /> YT</button>
            <button type="button" onClick={() => quickSeed("google", "", "")} className="px-2 py-1 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30 font-semibold inline-flex items-center gap-1"><Star className="h-3 w-3" /> Google</button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Patrocinador">
            <input value={form.sponsor_name} onChange={(e) => setForm({ ...form, sponsor_name: e.target.value })} className={inputCls} placeholder="Ex: Loja X" />
          </Field>
          <Field label="Plataforma">
            <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value as Platform })} className={inputCls}>
              {(Object.keys(PLATFORM_LABEL) as Platform[]).map((p) => (
                <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>
              ))}
            </select>
          </Field>
          <Field label="Ação">
            <select value={form.action_type} onChange={(e) => setForm({ ...form, action_type: e.target.value as ActionType })} className={inputCls}>
              {(Object.keys(ACTION_LABEL) as ActionType[]).map((a) => (
                <option key={a} value={a}>{ACTION_LABEL[a]}</option>
              ))}
            </select>
          </Field>
          <Field label="Tokens">
            <input type="number" min={0} value={form.tokens} onChange={(e) => setForm({ ...form, tokens: Number(e.target.value) })} className={inputCls} />
          </Field>
          <Field label="Título exibido">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} placeholder="Ex: Seguir @lojax no Instagram" />
          </Field>
          <Field label="Link">
            <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} className={inputCls} placeholder="https://..." />
          </Field>
          <Field label="Bônus se completar todas (Tokens)">
            <input type="number" min={0} value={form.bonus_tokens} onChange={(e) => setForm({ ...form, bonus_tokens: Number(e.target.value) })} className={inputCls} />
          </Field>
          <Field label="Ativa">
            <label className="h-11 inline-flex items-center gap-2">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4" />
              <span className="text-sm">{form.active ? "Sim" : "Não"}</span>
            </label>
          </Field>
        </div>

        <div className="flex gap-2">
          <button disabled={saving} className="h-11 px-5 rounded-xl bg-gradient-brand text-primary-foreground font-bold shadow-glow inline-flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {form.id ? "Salvar alterações" : "Cadastrar missão"}
          </button>
          {form.id && (
            <button type="button" onClick={() => setForm(EMPTY)} className="h-11 px-4 rounded-xl border border-border/60 font-semibold">
              Cancelar
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <div className="text-center text-muted-foreground py-10"><Loader2 className="h-6 w-6 animate-spin inline" /></div>
      ) : (
        (Object.keys(PLATFORM_LABEL) as Platform[]).map((p) => (
          <section key={p} className="rounded-2xl bg-card border border-border/60 p-5">
            <h3 className="font-display font-black text-lg mb-3 flex items-center gap-2">
              {p === "instagram" && <Instagram className="h-5 w-5 text-pink-400" />}
              {p === "youtube" && <Youtube className="h-5 w-5 text-red-400" />}
              {p === "google" && <Star className="h-5 w-5 text-blue-400" />}
              {PLATFORM_LABEL[p]} <span className="text-xs text-muted-foreground font-normal">({grouped[p].length})</span>
            </h3>
            {grouped[p].length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma missão cadastrada.</p>
            ) : (
              <div className="space-y-2">
                {grouped[p].map((m) => (
                  <div key={m.id} className="rounded-lg border border-border/60 p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{m.title}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {m.sponsor_name} · {ACTION_LABEL[m.action_type]} · +{m.tokens} TKN
                        {m.bonus_tokens > 0 && ` · bônus +${m.bonus_tokens}`}
                        {!m.active && " · INATIVA"}
                      </div>
                      <a href={m.link} target="_blank" rel="noreferrer" className="text-xs text-primary truncate block hover:underline">{m.link}</a>
                    </div>
                    <button onClick={() => editRow(m)} className="h-9 w-9 rounded-lg border border-border/60 grid place-items-center hover:border-primary/60"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(m.id)} className="h-9 w-9 rounded-lg border border-destructive/40 text-destructive grid place-items-center hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))
      )}
    </div>
  );
}

const inputCls = "h-11 w-full px-3 rounded-lg bg-background border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
