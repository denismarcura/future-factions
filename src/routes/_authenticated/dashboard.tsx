import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { signOut } from "@/hooks/use-auth";
import {
  LogOut,
  Target,
  Coins,
  Plus,
  ListChecks,
  ShoppingBag,
  Pencil,
  Save,
  X,
  Users,
  Send,
  MessageCircle,
  Sparkles,
  Loader2,
  CheckCircle2,
  Circle,
  UserPlus,
  Trash2,
  ExternalLink,
  Gift,
  Rocket,
  Copy,
  Download,
  Mail,
  Image as ImageIcon,
  Instagram,
} from "lucide-react";
import { toast } from "sonner";
import { CATEGORIES, formatTokens, type Category } from "@/lib/mock-data";
import { PRODUCTS } from "@/lib/mock-extra";
import {
  listMissions,
  listMyClaims,
  type Mission,
  type MissionClaim,
  PLATFORM_LABEL,
  ACTION_LABEL,
} from "@/lib/missions";
import {
  listFriends,
  addFriend,
  removeFriend,
  markInviteSent,
  toggleRegistered,
  whatsappLink,
  type Friend,
} from "@/lib/friends";
import { getUserChallenges, saveUserChallenge } from "@/lib/user-challenges";
import { generateChallenges, type GeneratedChallenge } from "@/lib/generate-challenges.functions";
import { generateInvitePromoText } from "@/lib/invite-ai.functions";
import { listParticipations, type MyParticipation } from "@/lib/my-participations";
import type { Prediction } from "@/lib/mock-data";
import arte01 from "@/assets/dashboard-arte-01.png.asset.json";
import arte02 from "@/assets/dashboard-arte-02.png.asset.json";
import arte03 from "@/assets/dashboard-arte-03.png.asset.json";
import arte04 from "@/assets/dashboard-arte-04.png.asset.json";
import arte05 from "@/assets/dashboard-arte-05.png.asset.json";
import arte06 from "@/assets/dashboard-arte-06.png.asset.json";
import arte07 from "@/assets/dashboard-arte-07.png.asset.json";
import arte08 from "@/assets/dashboard-arte-08.png.asset.json";
import arte09 from "@/assets/dashboard-arte-09.png.asset.json";
import arte10 from "@/assets/dashboard-arte-10.png.asset.json";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  whatsapp: string | null;
  avatar_url: string | null;
  provider: string | null;
  status: string;
  created_at: string;
  welcome_bonus?: number | null;
};

function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [claims, setClaims] = useState<MissionClaim[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [myChallenges, setMyChallenges] = useState<Prediction[]>([]);
  const [participations, setParticipations] = useState<MyParticipation[]>([]);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: prof }, ms, cl] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        listMissions({ activeOnly: true }).catch(() => []),
        listMyClaims().catch(() => []),
      ]);
      setProfile(prof as Profile | null);
      setMissions(ms);
      setClaims(cl);
    })();
    setFriends(listFriends());
    setMyChallenges(getUserChallenges());
    setParticipations(listParticipations());
    const onF = () => setFriends(listFriends());
    const onC = () => setMyChallenges(getUserChallenges());
    const onP = () => setParticipations(listParticipations());
    window.addEventListener("ddp:friends-updated", onF);
    window.addEventListener("ddp:user-challenges-updated", onC);
    window.addEventListener("ddp:participations-updated", onP);
    return () => {
      window.removeEventListener("ddp:friends-updated", onF);
      window.removeEventListener("ddp:user-challenges-updated", onC);
      window.removeEventListener("ddp:participations-updated", onP);
    };
  }, []);

  const claimedIds = useMemo(() => new Set(claims.map((c) => c.mission_id)), [claims]);
  const tokens = useMemo(
    () => (profile?.welcome_bonus ?? 0) + claims.reduce((s, c) => s + (c.tokens_awarded ?? 0), 0),
    [claims, profile?.welcome_bonus],
  );
  const missionsDone = claims.length;
  const missionsTodo = missions.filter((m) => !claimedIds.has(m.id)).length;

  const name = profile?.full_name ?? "Palpiteiro";
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <AppShell>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="glass-card rounded-2xl p-6 border border-border/60 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/60"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gradient-brand grid place-items-center text-primary-foreground font-display font-black text-xl">
                {initials || "P"}
              </div>
            )}
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Bem-vindo
              </div>
              <h1 className="font-display font-black text-2xl">{name}</h1>
              <p className="text-xs text-muted-foreground">
                {profile?.email} {profile?.provider && `· via ${profile.provider}`}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-border/60 hover:border-destructive/60 hover:text-destructive text-sm font-semibold transition"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Stat icon={Coins} label="Tokens" value={formatTokens(tokens)} accent="text-gold" />
          <Stat icon={Target} label="Palpites feitos" value={String(participations.length)} />
          <Stat icon={Target} label="Missões feitas" value={String(missionsDone)} />
          <Stat icon={ListChecks} label="Desafios criados" value={String(myChallenges.length)} />
          <Stat icon={Users} label="Amigos" value={String(friends.length)} />
        </div>

        {/* QUICK ACTIONS */}
        <div className="grid sm:grid-cols-3 gap-4">
          <ActionCard
            to="/criar"
            icon={Plus}
            title="Criar desafio"
            desc="Monte seu próprio palpite"
          />
          <ActionCard
            to="/desafios"
            icon={ListChecks}
            title="Participar"
            desc="Veja desafios abertos"
          />
          <ActionCard to="/shop" icon={ShoppingBag} title="Trocar tokens" desc="Brindes na loja" />
        </div>

        {/* PROFILE EDITOR */}
        <ProfileEditor profile={profile} onSaved={setProfile} />

        {/* MY PARTICIPATIONS */}
        <MyParticipationsSection items={participations} />

        {/* MISSIONS */}
        <MissionsSection
          missions={missions}
          claimedIds={claimedIds}
          done={missionsDone}
          todo={missionsTodo}
        />

        {/* MY CHALLENGES */}
        <MyChallengesSection items={myChallenges} />

        {/* AI RECOMMENDATIONS */}
        <RecommendationsSection />

        {/* FRIENDS */}
        <FriendsSection
          friends={friends}
          inviterName={name}
          onChange={() => setFriends(listFriends())}
        />

        {/* INVITE PROMO (email + whatsapp + artes prontas) */}
        <InvitePromoSection inviterName={name} myChallenges={myChallenges} />

        {/* SHOP PREVIEW */}
        <ShopPreviewSection tokens={tokens} />
      </div>
    </AppShell>
  );
}

/* ---------- Header bits ---------- */

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-4 border border-border/60">
      <Icon className={`h-5 w-5 ${accent ?? "text-primary"}`} />
      <div className={`font-display font-black text-2xl mt-2 tabular-nums ${accent ?? ""}`}>
        {value}
      </div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function ActionCard({
  to,
  icon: Icon,
  title,
  desc,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="glass-card rounded-2xl p-5 border border-border/60 hover:border-primary/60 transition group"
    >
      <Icon className="h-6 w-6 text-primary group-hover:scale-110 transition" />
      <div className="font-display font-bold mt-3">{title}</div>
      <div className="text-xs text-muted-foreground mt-1">{desc}</div>
    </Link>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  hint,
  right,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-3 gap-3">
      <div>
        <h2 className="font-display font-black text-xl flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" /> {title}
        </h2>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      {right}
    </div>
  );
}

/* ---------- Profile editor ---------- */

function ProfileEditor({
  profile,
  onSaved,
}: {
  profile: Profile | null;
  onSaved: (p: Profile) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setWhatsapp(profile?.whatsapp ?? "");
    setAvatar(profile?.avatar_url ?? "");
  }, [profile]);

  if (!profile) return null;

  async function save() {
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, whatsapp, avatar_url: avatar })
        .eq("id", profile!.id)
        .select()
        .single();
      if (error) throw error;
      onSaved(data as Profile);
      toast.success("Dados atualizados");
      setEditing(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="glass-card rounded-2xl p-5 border border-border/60">
      <SectionTitle
        icon={UserPlus}
        title="Meus dados"
        hint="Mantenha seus dados atualizados para receber convites e prêmios."
        right={
          !editing ? (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 h-8 rounded-full border border-border/60 hover:border-primary/60"
            >
              <Pencil className="h-3.5 w-3.5" /> Editar
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 h-8 rounded-full bg-gradient-brand text-primary-foreground shadow-glow disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}{" "}
                Salvar
              </button>
              <button
                onClick={() => setEditing(false)}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 h-8 rounded-full border border-border/60"
              >
                <X className="h-3.5 w-3.5" /> Cancelar
              </button>
            </div>
          )
        }
      />
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Nome" value={fullName} onChange={setFullName} disabled={!editing} />
        <Field
          label="WhatsApp"
          value={whatsapp}
          onChange={setWhatsapp}
          disabled={!editing}
          placeholder="(11) 98888-7777"
        />
        <Field label="E-mail" value={profile.email ?? ""} onChange={() => {}} disabled />
        <Field label="Foto (URL)" value={avatar} onChange={setAvatar} disabled={!editing} />
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="mt-1 w-full h-10 px-3 rounded-xl bg-card border border-border/60 text-sm disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-primary/60"
      />
    </label>
  );
}

/* ---------- Missions ---------- */

function MissionsSection({
  missions,
  claimedIds,
  done,
  todo,
}: {
  missions: Mission[];
  claimedIds: Set<string>;
  done: number;
  todo: number;
}) {
  const todoList = missions.filter((m) => !claimedIds.has(m.id)).slice(0, 6);
  const doneList = missions.filter((m) => claimedIds.has(m.id)).slice(0, 6);

  return (
    <section className="glass-card rounded-2xl p-5 border border-border/60">
      <SectionTitle
        icon={Target}
        title="Missões"
        hint={`Ganhe mais tokens participando de missões · ${done} feitas · ${todo} para fazer`}
        right={
          <Link
            to="/missoes"
            className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
          >
            Ver todas <ExternalLink className="h-3 w-3" />
          </Link>
        }
      />
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Para fazer
          </h3>
          <div className="space-y-2">
            {todoList.length === 0 ? (
              <Empty>Nenhuma missão disponível agora.</Empty>
            ) : (
              todoList.map((m) => <MissionRow key={m.id} m={m} done={false} />)
            )}
          </div>
        </div>
        <div>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Concluídas
          </h3>
          <div className="space-y-2">
            {doneList.length === 0 ? (
              <Empty>Você ainda não concluiu missões.</Empty>
            ) : (
              doneList.map((m) => <MissionRow key={m.id} m={m} done />)
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function MissionRow({ m, done }: { m: Mission; done: boolean }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/60">
      {done ? (
        <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
      ) : (
        <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate">{m.title}</div>
        <div className="text-[11px] text-muted-foreground">
          {PLATFORM_LABEL[m.platform]} · {ACTION_LABEL[m.action_type]} · +{m.tokens} tokens
        </div>
      </div>
      {!done && (
        <Link
          to="/missoes"
          className="text-[11px] font-bold px-3 h-8 rounded-full bg-gradient-brand text-primary-foreground inline-flex items-center"
        >
          Fazer
        </Link>
      )}
    </div>
  );
}

/* ---------- My challenges ---------- */

function MyChallengesSection({ items }: { items: Prediction[] }) {
  return (
    <section className="glass-card rounded-2xl p-5 border border-border/60">
      <SectionTitle
        icon={ListChecks}
        title="Desafios que eu participo / criei"
        right={
          <Link
            to="/criar"
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 h-8 rounded-full bg-gradient-brand text-primary-foreground shadow-glow"
          >
            <Plus className="h-3.5 w-3.5" /> Novo desafio
          </Link>
        }
      />
      {items.length === 0 ? (
        <Empty>
          Você ainda não tem desafios.{" "}
          <Link to="/criar" className="text-primary underline">
            Criar agora
          </Link>
          .
        </Empty>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.slice(0, 6).map((c) => (
            <Link
              key={c.id}
              to="/previsao/$id"
              params={{ id: c.id }}
              className="p-4 rounded-xl bg-card border border-border/60 hover:border-primary/60 transition block"
            >
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {c.category}
              </div>
              <div className="font-display font-bold mt-1 line-clamp-2">{c.title}</div>
              <div className="text-[11px] text-muted-foreground mt-2">{c.bettors} apostadores</div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------- AI Recommendations ---------- */

function RecommendationsSection() {
  const [taste, setTaste] = useState<Category>("Futebol");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<GeneratedChallenge[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [publishedIdx, setPublishedIdx] = useState<Set<number>>(new Set());
  const generate = useServerFn(generateChallenges);

  async function run() {
    setLoading(true);
    try {
      const r = await generate({ data: { category: taste, count: 5 } });
      setItems(r.challenges);
      setPublishedIdx(new Set());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar");
    } finally {
      setLoading(false);
    }
  }

  function updateItem(idx: number, patch: Partial<GeneratedChallenge>) {
    setItems((arr) => arr.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function publish(idx: number) {
    const it = items[idx];
    if (!it) return;
    if (!it.title.trim()) return toast.error("Adicione um título.");
    const opts = it.options.map((o) => o.trim()).filter(Boolean);
    if (opts.length < 2) return toast.error("Adicione pelo menos 2 opções.");
    saveUserChallenge({
      id: `ai-${Date.now()}-${idx}`,
      name: it.title.trim(),
      category: taste,
      endsAt: "",
      isOpen: true,
      subs: [{ id: "s0", question: it.description || it.title, options: opts }],
    });
    setPublishedIdx((s) => new Set(s).add(idx));
    toast.success("Desafio publicado!");
  }

  return (
    <section className="glass-card rounded-2xl p-5 border border-border/60">
      <SectionTitle
        icon={Sparkles}
        title="Recomendados pra você"
        hint="A IA cria desafios novos a partir das suas preferências."
      />
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select
          value={taste}
          onChange={(e) => setTaste(e.target.value as Category)}
          className="h-10 px-3 rounded-xl bg-card border border-border/60 text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          onClick={run}
          disabled={loading}
          className="h-10 px-4 rounded-full bg-gradient-brand text-primary-foreground text-sm font-bold inline-flex items-center gap-2 shadow-glow disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Gerar 5 ideias
        </button>
      </div>
      {items.length === 0 ? (
        <Empty>Escolha uma categoria e clique em "Gerar 5 ideias".</Empty>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((c, i) => {
            const isEditing = editingIdx === i;
            const isPublished = publishedIdx.has(i);
            return (
              <div
                key={i}
                className="p-4 rounded-xl bg-card border border-border/60 flex flex-col gap-2"
              >
                {isEditing ? (
                  <>
                    <input
                      value={c.title}
                      onChange={(e) => updateItem(i, { title: e.target.value })}
                      className="w-full h-9 px-2 rounded-lg bg-background border border-border/60 text-sm font-bold"
                      placeholder="Título"
                    />
                    <textarea
                      value={c.description}
                      onChange={(e) => updateItem(i, { description: e.target.value })}
                      rows={2}
                      className="w-full px-2 py-1 rounded-lg bg-background border border-border/60 text-xs"
                      placeholder="Descrição"
                    />
                    <div className="flex flex-col gap-1">
                      {c.options.map((o, j) => (
                        <div key={j} className="flex gap-1">
                          <input
                            value={o}
                            onChange={(e) => {
                              const next = [...c.options];
                              next[j] = e.target.value;
                              updateItem(i, { options: next });
                            }}
                            className="flex-1 h-8 px-2 rounded-lg bg-background border border-border/60 text-xs"
                            placeholder={`Opção ${j + 1}`}
                          />
                          <button
                            onClick={() =>
                              updateItem(i, { options: c.options.filter((_, k) => k !== j) })
                            }
                            className="h-8 w-8 rounded-lg border border-border/60 inline-flex items-center justify-center text-muted-foreground hover:text-destructive"
                            aria-label="Remover opção"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => updateItem(i, { options: [...c.options, ""] })}
                        className="h-8 rounded-lg border border-dashed border-border/60 text-xs text-muted-foreground hover:text-foreground"
                      >
                        + opção
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] text-muted-foreground">Tokens mín.</label>
                      <input
                        type="number"
                        min={0}
                        value={c.minTokens}
                        onChange={(e) => updateItem(i, { minTokens: Number(e.target.value) || 0 })}
                        className="w-20 h-8 px-2 rounded-lg bg-background border border-border/60 text-xs"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-display font-bold line-clamp-2">{c.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {c.description}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {c.options.map((o, j) => (
                        <span
                          key={j}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-background border border-border/60"
                        >
                          {o}
                        </span>
                      ))}
                    </div>
                    <div className="text-[11px] text-gold font-bold">{c.minTokens} tokens</div>
                  </>
                )}
                <div className="flex items-center gap-2 mt-auto pt-2">
                  {isEditing ? (
                    <button
                      onClick={() => setEditingIdx(null)}
                      className="h-8 px-3 rounded-full bg-background border border-border/60 text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <Save className="h-3.5 w-3.5" /> OK
                    </button>
                  ) : (
                    <button
                      onClick={() => setEditingIdx(i)}
                      className="h-8 px-3 rounded-full bg-background border border-border/60 text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Editar
                    </button>
                  )}
                  <button
                    onClick={() => publish(i)}
                    disabled={isPublished}
                    className="h-8 px-3 rounded-full bg-gradient-brand text-primary-foreground text-xs font-bold inline-flex items-center gap-1 shadow-glow disabled:opacity-60"
                  >
                    {isPublished ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Publicado
                      </>
                    ) : (
                      <>
                        <Rocket className="h-3.5 w-3.5" /> Publicar
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ---------- Friends ---------- */

function FriendsSection({
  friends,
  inviterName,
  onChange,
}: {
  friends: Friend[];
  inviterName: string;
  onChange: () => void;
}) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");

  const registered = friends.filter((f) => f.registered);
  const pending = friends.filter((f) => !f.registered);

  const inviteMessage = `Oi! Vem jogar comigo no Desafio dos Palpites. ${inviterName} te convidou — você ganha 1.000 tokens de boas-vindas. ${typeof window !== "undefined" ? window.location.origin : ""}/auth`;

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addFriend({ name, whatsapp, email });
    setName("");
    setWhatsapp("");
    setEmail("");
    onChange();
    toast.success("Amigo adicionado à lista");
  }

  function sendInvite(f: Friend) {
    if (!f.whatsapp) {
      toast.error("Adicione um WhatsApp para esse amigo.");
      return;
    }
    window.open(whatsappLink(f.whatsapp, inviteMessage), "_blank");
    markInviteSent(f.id);
    onChange();
    toast.success("Convite enviado pelo WhatsApp");
  }

  return (
    <section className="glass-card rounded-2xl p-5 border border-border/60">
      <SectionTitle
        icon={Users}
        title="Meus amigos"
        hint={`Cada amigo que se cadastrar você ganha 100 tokens · ${registered.length} cadastrados · ${pending.length} pendentes`}
        right={
          <a
            href={whatsappLink(undefined, inviteMessage)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 h-8 rounded-full bg-[#25D366] text-white"
          >
            <MessageCircle className="h-3.5 w-3.5" /> Convidar pelo WhatsApp
          </a>
        }
      />

      <form onSubmit={handleAdd} className="grid sm:grid-cols-4 gap-2 mb-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do amigo"
          className="h-10 px-3 rounded-xl bg-card border border-border/60 text-sm sm:col-span-1"
        />
        <input
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="WhatsApp (DDD+número)"
          className="h-10 px-3 rounded-xl bg-card border border-border/60 text-sm sm:col-span-1"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail (opcional)"
          type="email"
          className="h-10 px-3 rounded-xl bg-card border border-border/60 text-sm sm:col-span-1"
        />
        <button
          type="submit"
          className="h-10 px-4 rounded-full bg-gradient-brand text-primary-foreground text-sm font-bold inline-flex items-center justify-center gap-2"
        >
          <UserPlus className="h-4 w-4" /> Adicionar
        </button>
      </form>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Cadastrados
          </h3>
          <div className="space-y-2">
            {registered.length === 0 ? (
              <Empty>Nenhum amigo cadastrado ainda.</Empty>
            ) : (
              registered.map((f) => (
                <FriendRow key={f.id} f={f} onChange={onChange} onInvite={sendInvite} />
              ))
            )}
          </div>
        </div>
        <div>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Ainda não cadastrados
          </h3>
          <div className="space-y-2">
            {pending.length === 0 ? (
              <Empty>Convide alguém e acompanhe aqui.</Empty>
            ) : (
              pending.map((f) => (
                <FriendRow key={f.id} f={f} onChange={onChange} onInvite={sendInvite} />
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function FriendRow({
  f,
  onChange,
  onInvite,
}: {
  f: Friend;
  onChange: () => void;
  onInvite: (f: Friend) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/60">
      <div className="h-9 w-9 rounded-full bg-gradient-brand grid place-items-center text-primary-foreground text-xs font-black">
        {f.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate">{f.name}</div>
        <div className="text-[11px] text-muted-foreground truncate">
          {f.whatsapp || f.email || "Sem contato"}
          {f.lastInviteAt && (
            <> · convite reenviado em {new Date(f.lastInviteAt).toLocaleDateString("pt-BR")}</>
          )}
        </div>
      </div>
      {!f.registered && (
        <button
          onClick={() => onInvite(f)}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 h-8 rounded-full bg-[#25D366] text-white"
          title="Enviar / reenviar convite no WhatsApp"
        >
          <Send className="h-3.5 w-3.5" /> {f.lastInviteAt ? "Reenviar" : "Convidar"}
        </button>
      )}
      <button
        onClick={() => {
          toggleRegistered(f.id);
          onChange();
        }}
        className="text-[11px] font-bold px-2 h-8 rounded-full border border-border/60"
        title="Marcar/desmarcar como cadastrado"
      >
        {f.registered ? "Cadastrado" : "Pendente"}
      </button>
      <button
        onClick={() => {
          removeFriend(f.id);
          onChange();
        }}
        className="text-muted-foreground hover:text-destructive p-1"
        title="Remover"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ---------- Shop preview ---------- */

function ShopPreviewSection({ tokens }: { tokens: number }) {
  const items = PRODUCTS.slice(0, 8);
  return (
    <section className="glass-card rounded-2xl p-5 border border-border/60">
      <SectionTitle
        icon={Gift}
        title="Prêmios que você pode trocar"
        hint={`Seu saldo: ${formatTokens(tokens)} tokens`}
        right={
          <Link
            to="/shop"
            className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
          >
            Ver todos <ExternalLink className="h-3 w-3" />
          </Link>
        }
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((p) => {
          const can = tokens >= p.cost;
          return (
            <div
              key={p.id}
              className={`p-3 rounded-xl border ${can ? "border-primary/60 bg-card" : "border-border/60 bg-card opacity-70"}`}
            >
              <div className="aspect-square rounded-lg bg-background grid place-items-center text-4xl overflow-hidden">
                {p.image ? (
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-contain p-2"
                    loading="lazy"
                  />
                ) : (
                  <span>{p.emoji}</span>
                )}
              </div>
              <div className="text-sm font-semibold mt-2 line-clamp-2">{p.name}</div>
              <div className="flex items-center justify-between mt-2">
                <span className="inline-flex items-center gap-1 text-gold font-display font-black text-sm">
                  <Coins className="h-3.5 w-3.5" /> {formatTokens(p.cost)}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase ${can ? "text-primary" : "text-muted-foreground"}`}
                >
                  {can ? "Disponível" : "Faltam tokens"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs text-muted-foreground italic p-3 rounded-xl border border-dashed border-border/60">
      {children}
    </div>
  );
}

/* ---------- Invite Promo (email + whatsapp + artes prontas) ---------- */

const SITE_URL = "https://future-factions.lovable.app";

function InvitePromoSection({
  inviterName,
  myChallenges,
}: {
  inviterName: string;
  myChallenges: Prediction[];
}) {
  const link = `${SITE_URL}/auth`;
  const defaultWhats = `Oi! 👋 Vem jogar no *Desafio dos Palpites* comigo!\n\n${inviterName} te convidou. Dê seus palpites sobre a Copa, futebol, política, entretenimento e muito mais — e concorra a prêmios incríveis:\n\n📱 iPhone\n📺 TV LED\n🎮 PS5\n💻 Notebook\n👕 Camiseta da Copa\n\n🎁 Você ganha 1.000 tokens só por se cadastrar.\n✅ 100% grátis — sem nenhum custo!\n\nEntra aqui: ${link}`;
  const defaultEmail = `Olá!\n\n${inviterName} te convidou para participar do Desafio dos Palpites — uma plataforma onde você dá seus palpites sobre Copa do Mundo, futebol, política, ciência e muito mais, acumula tokens e concorre a prêmios reais como:\n\n• iPhone\n• TV LED\n• PlayStation 5\n• Notebook\n• Camiseta oficial da Copa\n\nAo se cadastrar pelo link abaixo você já ganha 1.000 tokens de boas-vindas. É 100% grátis, sem nenhum custo.\n\nAcesse: ${link}\n\nNos vemos lá! 🏆`;

  const [whatsText, setWhatsText] = useState(defaultWhats);
  const [emailText, setEmailText] = useState(defaultEmail);
  const [emailSubject, setEmailSubject] = useState("Vem jogar comigo no Desafio dos Palpites 🏆");
  const [aiBusy, setAiBusy] = useState<"whatsapp" | "email" | null>(null);

  const generateAi = useServerFn(generateInvitePromoText);

  const galleryItems = [
    { src: arte01.url, name: "Brasil x Escócia — versão 1" },
    { src: arte02.url, name: "Brasil x Escócia — versão 2" },
    { src: arte03.url, name: "Palpites fechados" },
    { src: arte04.url, name: "Acerte o placar" },
    { src: arte05.url, name: "Desafios dos patrocinadores" },
    { src: arte06.url, name: "Todo jogo vale tokens" },
    { src: arte07.url, name: "Ranking e premiações" },
    { src: arte08.url, name: "Desafie seus amigos" },
    { src: arte09.url, name: "Faça seus palpites" },
    { src: arte10.url, name: "Candidatos 2026" },
  ];

  // Build the lists the AI uses: my challenges + the 3 expiring soonest
  const meta = useMemo(() => {
    const fmt = (iso?: string) => {
      if (!iso) return undefined;
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return undefined;
      return d.toLocaleDateString("pt-BR");
    };
    const mine = myChallenges.slice(0, 5).map((c) => ({
      title: c.title,
      category: typeof c.category === "string" ? c.category : undefined,
      closesAt: fmt(c.closesAt),
    }));
    const expiring = [...myChallenges]
      .filter((c) => c.closesAt && new Date(c.closesAt).getTime() > Date.now())
      .sort((a, b) => new Date(a.closesAt).getTime() - new Date(b.closesAt).getTime())
      .slice(0, 3)
      .map((c) => ({
        title: c.title,
        category: typeof c.category === "string" ? c.category : undefined,
        closesAt: fmt(c.closesAt),
      }));
    return { mine, expiring };
  }, [myChallenges]);

  async function gerarTextoIA(channel: "whatsapp" | "email") {
    setAiBusy(channel);
    try {
      const { text } = await generateAi({
        data: {
          inviterName,
          channel,
          link,
          myChallenges: meta.mine,
          expiringChallenges: meta.expiring,
        },
      });
      if (channel === "whatsapp") setWhatsText(text);
      else setEmailText(text);
      toast.success("Texto gerado com IA");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar texto");
    } finally {
      setAiBusy(null);
    }
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text).then(
      () => toast.success(`${label} copiado!`),
      () => toast.error("Não foi possível copiar."),
    );
  }

  function openWhats() {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function openEmail() {
    const url = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailText)}`;
    window.location.href = url;
  }

  return (
    <section className="glass-card rounded-2xl p-5 border border-border/60 space-y-5">
      <SectionTitle
        icon={Sparkles}
        title="Divulgue e convide"
        hint="Textos prontos pra WhatsApp e e-mail + artes prontas para baixar e postar."
      />

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl bg-card border border-border/60 p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-[#25D366]" />
              <div className="text-sm font-bold">Texto para WhatsApp</div>
            </div>
            <button
              onClick={() => gerarTextoIA("whatsapp")}
              disabled={aiBusy === "whatsapp"}
              className="h-7 px-2.5 rounded-full bg-background border border-primary/40 text-[11px] font-bold text-primary inline-flex items-center gap-1.5 disabled:opacity-60"
            >
              {aiBusy === "whatsapp" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              Gerar com IA
            </button>
          </div>
          <textarea
            value={whatsText}
            onChange={(e) => setWhatsText(e.target.value)}
            rows={10}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border/60 text-xs leading-relaxed"
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => copy(whatsText, "Texto do WhatsApp")}
              className="h-9 px-3 rounded-full bg-background border border-border/60 text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Copy className="h-3.5 w-3.5" /> Copiar texto
            </button>
            <button
              onClick={openWhats}
              className="h-9 px-3 rounded-full bg-[#25D366] text-white text-xs font-bold inline-flex items-center gap-1.5"
            >
              <MessageCircle className="h-3.5 w-3.5" /> Enviar no WhatsApp
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-card border border-border/60 p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <div className="text-sm font-bold">Texto para e-mail</div>
            </div>
            <button
              onClick={() => gerarTextoIA("email")}
              disabled={aiBusy === "email"}
              className="h-7 px-2.5 rounded-full bg-background border border-primary/40 text-[11px] font-bold text-primary inline-flex items-center gap-1.5 disabled:opacity-60"
            >
              {aiBusy === "email" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              Gerar com IA
            </button>
          </div>
          <input
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            placeholder="Assunto"
            className="w-full h-9 px-3 rounded-lg bg-background border border-border/60 text-xs font-semibold"
          />
          <textarea
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border/60 text-xs leading-relaxed"
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => copy(`${emailSubject}\n\n${emailText}`, "Texto do e-mail")}
              className="h-9 px-3 rounded-full bg-background border border-border/60 text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Copy className="h-3.5 w-3.5" /> Copiar texto
            </button>
            <button
              onClick={openEmail}
              className="h-9 px-3 rounded-full bg-gradient-brand text-primary-foreground text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" /> Abrir e-mail
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border/60 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-primary" />
          <div className="text-sm font-bold">Artes prontas para divulgação</div>
        </div>

        <p className="text-xs text-muted-foreground">
          Selecione uma arte para postar em seu Instagram.
        </p>

        <div className="rounded-lg border border-border/60 bg-background p-3 space-y-2">
          <label className="text-xs font-semibold flex items-center gap-1.5">
            <Copy className="h-3.5 w-3.5 text-primary" />
            Link para incluir na sua postagem
          </label>
          <div className="flex gap-2">
            <input
              readOnly
              value={link}
              className="flex-1 h-9 px-3 rounded-md border border-border/60 bg-card text-xs"
            />
            <button
              onClick={() => copy(link, "Link copiado")}
              className="h-9 px-3 rounded-md bg-gradient-brand text-primary-foreground text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Copy className="h-3.5 w-3.5" /> Copiar
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {galleryItems.map((item) => (
            <article
              key={item.src}
              className="rounded-xl border border-border/60 bg-background overflow-hidden"
            >
              <img
                src={item.src}
                alt={item.name}
                className="w-full aspect-[4/5] object-cover"
                loading="lazy"
              />
              <div className="p-3 flex items-center justify-between gap-3">
                <div className="text-xs font-semibold leading-tight">{item.name}</div>
                <a
                  href={item.src}
                  download={item.name.toLowerCase().replace(/\s+/g, "-") + ".png"}
                  className="shrink-0 h-9 px-3 rounded-full bg-gradient-brand text-primary-foreground text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" /> Baixar
                </a>
              </div>
            </article>
          ))}
        </div>

        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
          <label className="text-xs font-semibold flex items-center gap-1.5">
            <Instagram className="h-3.5 w-3.5 text-primary" />
            Após postar, coloque aqui seu Instagram para ganhar 5.000 tokens
          </label>
          <div className="flex gap-2">
            <input
              value={igHandle}
              onChange={(e) => setIgHandle(e.target.value)}
              placeholder="@seuinstagram"
              className="flex-1 h-9 px-3 rounded-md border border-border/60 bg-background text-xs"
            />
            <button
              onClick={() => {
                if (!igHandle.trim()) {
                  toast.error("Informe seu @ do Instagram");
                  return;
                }
                toast.success("Postagem registrada! +5.000 tokens em análise.");
                setIgHandle("");
              }}
              className="h-9 px-3 rounded-md bg-gradient-brand text-primary-foreground text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" /> Enviar
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            * Você pode fazer postagens a cada 60 dias.
          </p>
        </div>
      </div>

    </section>
  );
}

/* ---------- My Participations ---------- */

function MyParticipationsSection({ items }: { items: MyParticipation[] }) {
  return (
    <section className="glass-card rounded-2xl p-5 border border-border/60">
      <SectionTitle
        icon={Target}
        title="Meus palpites e resultados"
        hint="Acompanhe os desafios em que você participou e veja os resultados quando saírem."
        right={
          <Link
            to="/desafios"
            className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
          >
            Mais desafios <ExternalLink className="h-3 w-3" />
          </Link>
        }
      />
      {items.length === 0 ? (
        <Empty>
          Você ainda não fez nenhum palpite.{" "}
          <Link to="/desafios" className="text-primary underline">
            Participar agora
          </Link>
          .
        </Empty>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((p) => {
            const closedAt = new Date(p.closesAt).getTime();
            const now = Date.now();
            const ended = closedAt <= now;
            const answersCount = Object.keys(p.answers).length;
            return (
              <Link
                key={p.id}
                to="/previsao/$id"
                params={{ id: p.id }}
                className="p-4 rounded-xl bg-card border border-border/60 hover:border-primary/60 transition flex flex-col"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {p.category}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      ended
                        ? "bg-gold/15 text-gold border border-gold/30"
                        : "bg-primary/15 text-primary border border-primary/30"
                    }`}
                  >
                    {ended ? "Resultado em breve" : "Aguardando jogo"}
                  </span>
                </div>
                <div className="font-display font-bold mt-2 line-clamp-2">{p.title}</div>
                <div className="mt-3 text-[11px] text-muted-foreground space-y-0.5">
                  {p.optionLabel ? (
                    <div>
                      Sua escolha:{" "}
                      <span className="text-foreground font-semibold">{p.optionLabel}</span>
                    </div>
                  ) : (
                    <div>{answersCount} palpites enviados</div>
                  )}
                  {p.entryFee > 0 && (
                    <div>
                      Entrada: <span className="text-gold font-bold">{p.entryFee} TKN</span>
                    </div>
                  )}
                  <div>
                    Participou em{" "}
                    {new Date(p.participatedAt).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "America/Sao_Paulo",
                    })}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
