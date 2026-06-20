import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { signOut } from "@/hooks/use-auth";
import {
  LogOut, Target, Coins, Plus, ListChecks, ShoppingBag,
  Pencil, Save, X, Users, Send, MessageCircle, Sparkles, Loader2,
  CheckCircle2, Circle, UserPlus, Trash2, ExternalLink, Gift,
} from "lucide-react";
import { toast } from "sonner";
import { CATEGORIES, formatTokens, type Category } from "@/lib/mock-data";
import { PRODUCTS } from "@/lib/mock-extra";
import { listMissions, listMyClaims, type Mission, type MissionClaim, PLATFORM_LABEL, ACTION_LABEL } from "@/lib/missions";
import {
  listFriends, addFriend, removeFriend, markInviteSent, toggleRegistered,
  whatsappLink, type Friend,
} from "@/lib/friends";
import { getUserChallenges } from "@/lib/user-challenges";
import { generateChallenges, type GeneratedChallenge } from "@/lib/generate-challenges.functions";
import type { Prediction } from "@/lib/mock-data";

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

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
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
    const onF = () => setFriends(listFriends());
    const onC = () => setMyChallenges(getUserChallenges());
    window.addEventListener("ddp:friends-updated", onF);
    window.addEventListener("ddp:user-challenges-updated", onC);
    return () => {
      window.removeEventListener("ddp:friends-updated", onF);
      window.removeEventListener("ddp:user-challenges-updated", onC);
    };
  }, []);

  const claimedIds = useMemo(() => new Set(claims.map((c) => c.mission_id)), [claims]);
  const tokens = useMemo(() => claims.reduce((s, c) => s + (c.tokens_awarded ?? 0), 0), [claims]);
  const missionsDone = claims.length;
  const missionsTodo = missions.filter((m) => !claimedIds.has(m.id)).length;

  const name = profile?.full_name ?? "Palpiteiro";
  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <AppShell>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="glass-card rounded-2xl p-6 border border-border/60 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/60" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gradient-brand grid place-items-center text-primary-foreground font-display font-black text-xl">
                {initials || "P"}
              </div>
            )}
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Bem-vindo</div>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat icon={Coins} label="Tokens" value={formatTokens(tokens)} accent="text-gold" />
          <Stat icon={Target} label="Missões feitas" value={String(missionsDone)} />
          <Stat icon={ListChecks} label="Desafios criados" value={String(myChallenges.length)} />
          <Stat icon={Users} label="Amigos" value={String(friends.length)} />
        </div>

        {/* QUICK ACTIONS */}
        <div className="grid sm:grid-cols-3 gap-4">
          <ActionCard to="/criar" icon={Plus} title="Criar desafio" desc="Monte seu próprio palpite" />
          <ActionCard to="/desafios" icon={ListChecks} title="Participar" desc="Veja desafios abertos" />
          <ActionCard to="/shop" icon={ShoppingBag} title="Trocar tokens" desc="Brindes na loja" />
        </div>

        {/* PROFILE EDITOR */}
        <ProfileEditor profile={profile} onSaved={setProfile} />

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

        {/* SHOP PREVIEW */}
        <ShopPreviewSection tokens={tokens} />
      </div>
    </AppShell>
  );
}

/* ---------- Header bits ---------- */

function Stat({
  icon: Icon, label, value, accent,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; accent?: string }) {
  return (
    <div className="glass-card rounded-2xl p-4 border border-border/60">
      <Icon className={`h-5 w-5 ${accent ?? "text-primary"}`} />
      <div className={`font-display font-black text-2xl mt-2 tabular-nums ${accent ?? ""}`}>{value}</div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function ActionCard({
  to, icon: Icon, title, desc,
}: { to: string; icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <Link to={to} className="glass-card rounded-2xl p-5 border border-border/60 hover:border-primary/60 transition group">
      <Icon className="h-6 w-6 text-primary group-hover:scale-110 transition" />
      <div className="font-display font-bold mt-3">{title}</div>
      <div className="text-xs text-muted-foreground mt-1">{desc}</div>
    </Link>
  );
}

function SectionTitle({
  icon: Icon, title, hint, right,
}: { icon: React.ComponentType<{ className?: string }>; title: string; hint?: string; right?: React.ReactNode }) {
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
  profile, onSaved,
}: { profile: Profile | null; onSaved: (p: Profile) => void }) {
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
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Salvar
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
        <Field label="WhatsApp" value={whatsapp} onChange={setWhatsapp} disabled={!editing} placeholder="(11) 98888-7777" />
        <Field label="E-mail" value={profile.email ?? ""} onChange={() => {}} disabled />
        <Field label="Foto (URL)" value={avatar} onChange={setAvatar} disabled={!editing} />
      </div>
    </section>
  );
}

function Field({
  label, value, onChange, disabled, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean; placeholder?: string }) {
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
  missions, claimedIds, done, todo,
}: { missions: Mission[]; claimedIds: Set<string>; done: number; todo: number }) {
  const todoList = missions.filter((m) => !claimedIds.has(m.id)).slice(0, 6);
  const doneList = missions.filter((m) => claimedIds.has(m.id)).slice(0, 6);

  return (
    <section className="glass-card rounded-2xl p-5 border border-border/60">
      <SectionTitle
        icon={Target}
        title="Missões"
        hint={`${done} concluídas · ${todo} para fazer`}
        right={
          <Link to="/missoes" className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1">
            Ver todas <ExternalLink className="h-3 w-3" />
          </Link>
        }
      />
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Para fazer</h3>
          <div className="space-y-2">
            {todoList.length === 0 ? (
              <Empty>Nenhuma missão disponível agora.</Empty>
            ) : todoList.map((m) => <MissionRow key={m.id} m={m} done={false} />)}
          </div>
        </div>
        <div>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Concluídas</h3>
          <div className="space-y-2">
            {doneList.length === 0 ? (
              <Empty>Você ainda não concluiu missões.</Empty>
            ) : doneList.map((m) => <MissionRow key={m.id} m={m} done />)}
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
          Você ainda não tem desafios. <Link to="/criar" className="text-primary underline">Criar agora</Link>.
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
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.category}</div>
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
  const generate = useServerFn(generateChallenges);

  async function run() {
    setLoading(true);
    try {
      const r = await generate({ data: { category: taste, count: 5 } });
      setItems(r.challenges);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar");
    } finally {
      setLoading(false);
    }
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
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button
          onClick={run}
          disabled={loading}
          className="h-10 px-4 rounded-full bg-gradient-brand text-primary-foreground text-sm font-bold inline-flex items-center gap-2 shadow-glow disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Gerar 5 ideias
        </button>
      </div>
      {items.length === 0 ? (
        <Empty>Escolha uma categoria e clique em "Gerar 5 ideias".</Empty>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((c, i) => (
            <div key={i} className="p-4 rounded-xl bg-card border border-border/60">
              <div className="font-display font-bold line-clamp-2">{c.title}</div>
              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.description}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {c.options.map((o, j) => (
                  <span key={j} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-background border border-border/60">
                    {o}
                  </span>
                ))}
              </div>
              <div className="text-[11px] text-gold mt-2 font-bold">{c.minTokens} tokens</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------- Friends ---------- */

function FriendsSection({
  friends, inviterName, onChange,
}: { friends: Friend[]; inviterName: string; onChange: () => void }) {
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
    setName(""); setWhatsapp(""); setEmail("");
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
        hint={`${registered.length} cadastrados · ${pending.length} pendentes`}
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
          value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do amigo"
          className="h-10 px-3 rounded-xl bg-card border border-border/60 text-sm sm:col-span-1"
        />
        <input
          value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp (DDD+número)"
          className="h-10 px-3 rounded-xl bg-card border border-border/60 text-sm sm:col-span-1"
        />
        <input
          value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail (opcional)" type="email"
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
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Cadastrados</h3>
          <div className="space-y-2">
            {registered.length === 0 ? (
              <Empty>Nenhum amigo cadastrado ainda.</Empty>
            ) : registered.map((f) => (
              <FriendRow key={f.id} f={f} onChange={onChange} onInvite={sendInvite} />
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Ainda não cadastrados
          </h3>
          <div className="space-y-2">
            {pending.length === 0 ? (
              <Empty>Convide alguém e acompanhe aqui.</Empty>
            ) : pending.map((f) => (
              <FriendRow key={f.id} f={f} onChange={onChange} onInvite={sendInvite} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FriendRow({
  f, onChange, onInvite,
}: { f: Friend; onChange: () => void; onInvite: (f: Friend) => void }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/60">
      <div className="h-9 w-9 rounded-full bg-gradient-brand grid place-items-center text-primary-foreground text-xs font-black">
        {f.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate">{f.name}</div>
        <div className="text-[11px] text-muted-foreground truncate">
          {f.whatsapp || f.email || "Sem contato"}
          {f.lastInviteAt && <> · convite reenviado em {new Date(f.lastInviteAt).toLocaleDateString("pt-BR")}</>}
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
        onClick={() => { toggleRegistered(f.id); onChange(); }}
        className="text-[11px] font-bold px-2 h-8 rounded-full border border-border/60"
        title="Marcar/desmarcar como cadastrado"
      >
        {f.registered ? "Cadastrado" : "Pendente"}
      </button>
      <button
        onClick={() => { removeFriend(f.id); onChange(); }}
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
          <Link to="/shop" className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1">
            Ver todos <ExternalLink className="h-3 w-3" />
          </Link>
        }
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((p) => {
          const can = tokens >= p.cost;
          return (
            <div key={p.id} className={`p-3 rounded-xl border ${can ? "border-primary/60 bg-card" : "border-border/60 bg-card opacity-70"}`}>
              <div className="aspect-square rounded-lg bg-background grid place-items-center text-4xl overflow-hidden">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="w-full h-full object-contain p-2" loading="lazy" />
                ) : <span>{p.emoji}</span>}
              </div>
              <div className="text-sm font-semibold mt-2 line-clamp-2">{p.name}</div>
              <div className="flex items-center justify-between mt-2">
                <span className="inline-flex items-center gap-1 text-gold font-display font-black text-sm">
                  <Coins className="h-3.5 w-3.5" /> {formatTokens(p.cost)}
                </span>
                <span className={`text-[10px] font-bold uppercase ${can ? "text-primary" : "text-muted-foreground"}`}>
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
