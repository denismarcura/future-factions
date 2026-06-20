import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Instagram, Youtube, Star, Loader2, Facebook, Music2, X } from "lucide-react";
import { toast } from "sonner";
import {
  type Mission,
  type Platform,
  ACTION_LABEL,
  PLATFORM_LABEL,
  PLATFORM_FOLLOW_ACTION,
  TOKEN_OPTIONS,
  DEFAULT_BONUS_TOKENS,
  MAX_POSTS_PER_CAMPAIGN,
  listMissions,
  createMission,
  updateMission,
  deleteMission,
} from "@/lib/missions";

export const Route = createFileRoute("/admin/missoes")({
  head: () => ({ meta: [{ title: "Missões · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminMissions,
});

type CampaignForm = {
  sponsor_name: string;
  handle: string; // @perfil
  platform: Platform;
  follow_link: string;
  posts: string[]; // links de posts para curtir+comentar
  tokens: number; // 50/100/200
  bonus_tokens: number;
  active: boolean;
};

const PLATFORMS: Platform[] = ["instagram", "facebook", "youtube", "tiktok", "google"];

const EMPTY: CampaignForm = {
  sponsor_name: "",
  handle: "",
  platform: "instagram",
  follow_link: "",
  posts: [""],
  tokens: 50,
  bonus_tokens: DEFAULT_BONUS_TOKENS,
  active: true,
};

function PlatformIcon({ p, className }: { p: Platform; className?: string }) {
  if (p === "instagram") return <Instagram className={className} />;
  if (p === "facebook") return <Facebook className={className} />;
  if (p === "youtube") return <Youtube className={className} />;
  if (p === "tiktok") return <Music2 className={className} />;
  return <Star className={className} />;
}

function AdminMissions() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<CampaignForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<{ ids: string[] } | null>(null);

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

  function resetForm() {
    setForm(EMPTY);
    setEditing(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.sponsor_name || !form.handle) {
      toast.error("Preencha nome do cliente e perfil.");
      return;
    }
    if (!form.follow_link && form.posts.filter((p) => p.trim()).length === 0) {
      toast.error("Informe o perfil para seguir e/ou ao menos um post.");
      return;
    }
    setSaving(true);
    try {
      // If editing, delete previous campaign rows first (simple replace strategy)
      if (editing) {
        for (const id of editing.ids) {
          try { await deleteMission(id); } catch {}
        }
      }
      const platformLabel = PLATFORM_LABEL[form.platform];
      const handle = form.handle.startsWith("@") ? form.handle : `@${form.handle}`;

      const rows: Array<Parameters<typeof createMission>[0]> = [];
      if (form.follow_link.trim()) {
        rows.push({
          sponsor_name: form.sponsor_name,
          platform: form.platform,
          action_type: PLATFORM_FOLLOW_ACTION[form.platform],
          title: `Seguir ${handle} no ${platformLabel}`,
          link: form.follow_link.trim(),
          tokens: form.tokens,
          bonus_tokens: 0,
          active: form.active,
        });
      }
      const validPosts = form.posts.map((p) => p.trim()).filter(Boolean).slice(0, MAX_POSTS_PER_CAMPAIGN);
      validPosts.forEach((link, i) => {
        rows.push({
          sponsor_name: form.sponsor_name,
          platform: form.platform,
          action_type: "like_comment",
          title: `Curtir e comentar post ${i + 1} de ${handle}`,
          link,
          tokens: form.tokens,
          bonus_tokens: i === validPosts.length - 1 ? form.bonus_tokens : 0,
          active: form.active,
        });
      });

      for (const r of rows) await createMission(r);
      toast.success(editing ? "Campanha atualizada" : "Campanha criada");
      resetForm();
      await reload();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCampaign(ids: string[]) {
    if (!confirm("Remover esta campanha inteira?")) return;
    try {
      for (const id of ids) await deleteMission(id);
      toast.success("Campanha removida");
      await reload();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function toggleCampaign(ids: string[], active: boolean) {
    try {
      for (const id of ids) await updateMission(id, { active });
      toast.success(active ? "Ativada" : "Pausada");
      await reload();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  function editCampaign(group: CampaignGroup) {
    setForm({
      sponsor_name: group.sponsor_name,
      handle: group.handle,
      platform: group.platform,
      follow_link: group.follow_link,
      posts: group.posts.length ? group.posts : [""],
      tokens: group.tokens,
      bonus_tokens: group.bonus_tokens,
      active: group.active,
    });
    setEditing({ ids: group.ids });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addPost() {
    if (form.posts.length >= MAX_POSTS_PER_CAMPAIGN) return;
    setForm({ ...form, posts: [...form.posts, ""] });
  }
  function setPost(i: number, v: string) {
    const next = [...form.posts];
    next[i] = v;
    setForm({ ...form, posts: next });
  }
  function removePost(i: number) {
    setForm({ ...form, posts: form.posts.filter((_, idx) => idx !== i) });
  }

  const grouped = groupCampaigns(missions);

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-black">
            {editing ? "Editar campanha" : "Nova campanha de missões"}
          </h2>
          {editing && (
            <button type="button" onClick={resetForm} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <X className="h-3 w-3" /> Cancelar edição
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Nome do cliente">
            <input value={form.sponsor_name} onChange={(e) => setForm({ ...form, sponsor_name: e.target.value })} className={inputCls} placeholder="Ex: Loja X" />
          </Field>
          <Field label="Plataforma">
            <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value as Platform })} className={inputCls}>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>
              ))}
            </select>
          </Field>
          <Field label={`Perfil (@) no ${PLATFORM_LABEL[form.platform]}`}>
            <input value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })} className={inputCls} placeholder="@lojax" />
          </Field>
          <Field label="Link do perfil para seguir">
            <input value={form.follow_link} onChange={(e) => setForm({ ...form, follow_link: e.target.value })} className={inputCls} placeholder="https://..." />
          </Field>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
              Posts para curtir e comentar (até {MAX_POSTS_PER_CAMPAIGN})
            </span>
            <button
              type="button"
              onClick={addPost}
              disabled={form.posts.length >= MAX_POSTS_PER_CAMPAIGN}
              className="text-xs px-2 py-1 rounded-md bg-primary/15 text-primary border border-primary/30 font-semibold inline-flex items-center gap-1 disabled:opacity-40"
            >
              <Plus className="h-3 w-3" /> Adicionar post ({form.posts.length}/{MAX_POSTS_PER_CAMPAIGN})
            </button>
          </div>
          <div className="space-y-2">
            {form.posts.map((p, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={p}
                  onChange={(e) => setPost(i, e.target.value)}
                  className={inputCls}
                  placeholder={`https://... (post ${i + 1})`}
                />
                {form.posts.length > 1 && (
                  <button type="button" onClick={() => removePost(i)} className="h-11 w-11 rounded-lg border border-destructive/40 text-destructive grid place-items-center hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <Field label="Tokens pagos por tarefa">
            <div className="flex gap-2">
              {TOKEN_OPTIONS.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setForm({ ...form, tokens: t })}
                  className={`flex-1 h-11 rounded-lg border font-bold text-sm ${form.tokens === t ? "bg-gradient-brand text-primary-foreground shadow-glow border-transparent" : "border-border/60 hover:border-primary/60"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Bônus por completar todas">
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
            {editing ? "Salvar campanha" : "Cadastrar campanha"}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="text-center text-muted-foreground py-10"><Loader2 className="h-6 w-6 animate-spin inline" /></div>
      ) : (
        PLATFORMS.map((p) => {
          const items = grouped.filter((g) => g.platform === p);
          return (
            <section key={p} className="rounded-2xl bg-card border border-border/60 p-5">
              <h3 className="font-display font-black text-lg mb-3 flex items-center gap-2">
                <PlatformIcon p={p} className="h-5 w-5 text-primary" />
                {PLATFORM_LABEL[p]} <span className="text-xs text-muted-foreground font-normal">({items.length})</span>
              </h3>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma campanha cadastrada.</p>
              ) : (
                <div className="space-y-2">
                  {items.map((g) => (
                    <div key={g.key} className="rounded-lg border border-border/60 p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{g.sponsor_name} · {g.handle}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {g.follow_link ? "1 perfil" : "0 perfil"} · {g.posts.length} posts · {g.tokens} TKN/tarefa
                          {g.bonus_tokens > 0 && ` · bônus +${g.bonus_tokens}`}
                          {!g.active && " · PAUSADA"}
                        </div>
                      </div>
                      <button onClick={() => toggleCampaign(g.ids, !g.active)} className="text-xs px-3 h-9 rounded-lg border border-border/60 hover:border-primary/60">
                        {g.active ? "Pausar" : "Ativar"}
                      </button>
                      <button onClick={() => editCampaign(g)} className="h-9 w-9 rounded-lg border border-border/60 grid place-items-center hover:border-primary/60"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDeleteCampaign(g.ids)} className="h-9 w-9 rounded-lg border border-destructive/40 text-destructive grid place-items-center hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}

type CampaignGroup = {
  key: string;
  ids: string[];
  sponsor_name: string;
  handle: string;
  platform: Platform;
  follow_link: string;
  posts: string[];
  tokens: number;
  bonus_tokens: number;
  active: boolean;
};

function groupCampaigns(missions: Mission[]): CampaignGroup[] {
  const map = new Map<string, CampaignGroup>();
  for (const m of missions) {
    const key = `${m.platform}::${m.sponsor_name.toLowerCase()}`;
    let g = map.get(key);
    if (!g) {
      g = {
        key,
        ids: [],
        sponsor_name: m.sponsor_name,
        handle: "",
        platform: m.platform,
        follow_link: "",
        posts: [],
        tokens: m.tokens,
        bonus_tokens: 0,
        active: m.active,
      };
      map.set(key, g);
    }
    g.ids.push(m.id);
    g.tokens = m.tokens;
    if (m.bonus_tokens > g.bonus_tokens) g.bonus_tokens = m.bonus_tokens;
    if (m.action_type === "follow" || m.action_type === "subscribe" || m.action_type === "review") {
      g.follow_link = m.link;
      const match = m.title.match(/@[\w._-]+/);
      if (match) g.handle = match[0];
    } else if (m.action_type === "like_comment" || m.action_type === "like" || m.action_type === "comment") {
      g.posts.push(m.link);
      if (!g.handle) {
        const match = m.title.match(/@[\w._-]+/);
        if (match) g.handle = match[0];
      }
    }
  }
  return Array.from(map.values());
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
