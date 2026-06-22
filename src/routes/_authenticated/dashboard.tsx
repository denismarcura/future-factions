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
  QrCode,
  History,
  Clock,
  ClipboardPaste,
  Check,
  AlertCircle,
  Camera,
  Upload,
  FileText,
  MapPin,
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
  addManyFromText,
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
import { uploadAvatar, takePendingAvatar } from "@/lib/avatar-upload";
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
  instagram: string | null;
  cpf: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  avatar_url: string | null;
  provider: string | null;
  status: string;
  created_at: string;
  welcome_bonus?: number | null;
};

function isProfileIncomplete(p: Profile | null): boolean {
  if (!p) return false;
  return !p.cpf || !p.whatsapp || !p.instagram || !p.avatar_url;
}

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

  // Auto-upload pending avatar saved during signup (before email confirmation).
  useEffect(() => {
    if (!profile) return;
    if (profile.avatar_url) return;
    const pending = takePendingAvatar();
    if (!pending) return;
    (async () => {
      try {
        const url = await uploadAvatar(profile.id, pending);
        const { data, error } = await supabase
          .from("profiles")
          .update({ avatar_url: url })
          .eq("id", profile.id)
          .select()
          .single();
        if (error) throw error;
        setProfile(data as Profile);
      } catch (err) {
        console.warn("avatar upload failed", err);
      }
    })();
  }, [profile]);

  const claimedIds = useMemo(() => new Set(claims.map((c) => c.mission_id)), [claims]);
  const spentTokens = useMemo(
    () => participations.reduce((s, p) => s + (p.entryFee ?? 0), 0),
    [participations],
  );
  const tokens = useMemo(
    () =>
      (profile?.welcome_bonus ?? 0) +
      claims.reduce((s, c) => s + (c.tokens_awarded ?? 0), 0) -
      spentTokens,
    [claims, profile?.welcome_bonus, spentTokens],
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
        {/* Banner: complete profile (mostly for Google sign-ups) */}
        {isProfileIncomplete(profile) && (
          <a
            href="#meus-dados"
            className="flex items-center gap-3 p-4 rounded-2xl border-2 border-destructive/60 bg-destructive/10 text-destructive hover:bg-destructive/15 transition"
          >
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div className="flex-1">
              <div className="font-display font-black text-sm sm:text-base">Complete seu cadastro</div>
              <div className="text-xs sm:text-sm opacity-90">
                Faltam dados obrigatórios:{" "}
                {[
                  !profile?.avatar_url && "foto",
                  !profile?.cpf && "CPF",
                  !profile?.whatsapp && "WhatsApp",
                  !profile?.instagram && "Instagram",
                ]
                  .filter(Boolean)
                  .join(", ")}
                . Necessário para validar prêmios.
              </div>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider underline">Completar agora</span>
          </a>
        )}
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

        {/* TOKENS EXTRACT */}
        <TokensExtractSection
          welcomeBonus={profile?.welcome_bonus ?? 0}
          claims={claims}
          missions={missions}
          participations={participations}
          balance={tokens}
        />

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
          userId={profile?.id ?? ""}
          onChange={() => setFriends(listFriends())}
        />

        {/* INVITE PROMO (email + whatsapp + artes prontas) */}
        <InvitePromoSection
          inviterName={name}
          userId={profile?.id ?? ""}
          myChallenges={myChallenges}
        />

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

function formatCPFView(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatCEPView(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.replace(/(\d{5})(\d)/, "$1-$2");
}

function ProfileEditor({
  profile,
  onSaved,
}: {
  profile: Profile | null;
  onSaved: (p: Profile) => void;
}) {
  const incomplete = isProfileIncomplete(profile);
  const [editing, setEditing] = useState(incomplete);
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [cpf, setCpf] = useState("");
  const [avatar, setAvatar] = useState("");
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setWhatsapp(profile?.whatsapp ?? "");
    setInstagram(profile?.instagram ?? "");
    setCpf(profile?.cpf ? formatCPFView(profile.cpf) : "");
    setAvatar(profile?.avatar_url ?? "");
    setCep(profile?.cep ? formatCEPView(profile.cep) : "");
    setEndereco(profile?.endereco ?? "");
    setNumero(profile?.numero ?? "");
    setComplemento(profile?.complemento ?? "");
    setBairro(profile?.bairro ?? "");
    setCidade(profile?.cidade ?? "");
    setEstado(profile?.estado ?? "");
    if (isProfileIncomplete(profile)) setEditing(true);
  }, [profile]);

  async function lookupCep(rawCep: string) {
    const digits = rawCep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data?.erro) {
        toast.error("CEP não encontrado");
        return;
      }
      setEndereco(data.logradouro ?? "");
      setBairro(data.bairro ?? "");
      setCidade(data.localidade ?? "");
      setEstado(data.uf ?? "");
    } catch {
      toast.error("Não foi possível buscar o CEP");
    } finally {
      setCepLoading(false);
    }
  }

  if (!profile) return null;

  async function handleFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A foto deve ter no máximo 5MB.");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadAvatar(profile!.id, file);
      setAvatar(url);
      toast.success("Foto enviada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao enviar a foto");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    const cpfDigits = cpf.replace(/\D/g, "");
    if (cpf && cpfDigits.length !== 11) {
      toast.error("CPF inválido");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          whatsapp,
          instagram: instagram.trim() || null,
          cpf: cpfDigits || null,
          avatar_url: avatar || null,
          cep: cep.replace(/\D/g, "") || null,
          endereco: endereco.trim() || null,
          numero: numero.trim() || null,
          complemento: complemento.trim() || null,
          bairro: bairro.trim() || null,
          cidade: cidade.trim() || null,
          estado: estado.trim() || null,
        })
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
    <section id="meus-dados" className="glass-card rounded-2xl p-5 border border-border/60">
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

      {/* Avatar uploader */}
      <div className="flex items-center gap-4 mb-4 p-3 rounded-xl border border-border/60 bg-background/40">
        <div className="relative h-20 w-20 rounded-full overflow-hidden border border-border/60 bg-background grid place-items-center shrink-0">
          {avatar ? (
            <img src={avatar} alt="Foto" className="h-full w-full object-cover" />
          ) : (
            <Camera className="h-7 w-7 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold uppercase tracking-wider text-foreground/80">Foto de perfil</div>
          <div className="text-[11px] text-muted-foreground mb-2">JPG ou PNG, até 5MB.</div>
          {editing && (
            <label className="inline-flex items-center gap-1.5 text-xs font-bold px-3 h-8 rounded-full border border-primary/40 text-primary hover:bg-primary/10 cursor-pointer">
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {avatar ? "Trocar foto" : "Enviar foto"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) void handleFile(f);
                }}
              />
            </label>
          )}
        </div>
      </div>

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
        <Field
          label="Instagram"
          value={instagram}
          onChange={setInstagram}
          disabled={!editing}
          placeholder="@seuinstagram"
        />
        <Field
          label="CPF"
          value={cpf}
          onChange={(v) => setCpf(formatCPFView(v))}
          disabled={!editing}
          placeholder="000.000.000-00"
        />
      </div>

      <div className="mt-5 pt-5 border-t border-border/60">
        <div className="text-xs font-bold uppercase tracking-wider text-foreground/80 mb-3 flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-primary" /> Endereço
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field
            label={cepLoading ? "CEP (buscando...)" : "CEP"}
            value={cep}
            onChange={(v) => {
              const formatted = formatCEPView(v);
              setCep(formatted);
              if (formatted.replace(/\D/g, "").length === 8) void lookupCep(formatted);
            }}
            disabled={!editing}
            placeholder="00000-000"
          />
          <Field label="Endereço" value={endereco} onChange={setEndereco} disabled placeholder="Preenchido pelo CEP" />
          <Field label="Número" value={numero} onChange={setNumero} disabled={!editing} placeholder="123" />
          <Field label="Complemento" value={complemento} onChange={setComplemento} disabled={!editing} placeholder="Apto / Bloco" />
          <Field label="Bairro" value={bairro} onChange={setBairro} disabled placeholder="Preenchido pelo CEP" />
          <Field label="Cidade" value={cidade} onChange={setCidade} disabled placeholder="Preenchido pelo CEP" />
          <Field label="Estado" value={estado} onChange={setEstado} disabled placeholder="UF" />
        </div>
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
  // Show pending missions first, then completed ones (marked "Concluída").
  const pending = missions.filter((m) => !claimedIds.has(m.id));
  const completed = missions.filter((m) => claimedIds.has(m.id));
  const list = [...pending, ...completed].slice(0, 8);

  return (
    <section className="glass-card rounded-2xl p-5 border border-border/60">
      <SectionTitle
        icon={Target}
        title="Missões"
        hint={`Ganhe mais tokens · ${done} feitas · ${todo} para fazer · prazo de 24h cada`}
        right={
          <Link
            to="/missoes"
            className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
          >
            Ver todas <ExternalLink className="h-3 w-3" />
          </Link>
        }
      />
      <div className="grid sm:grid-cols-2 gap-2">
        {list.length === 0 ? (
          <Empty>Nenhuma missão pendente. Boa! 🎉</Empty>
        ) : (
          list.map((m) => <MissionRow key={m.id} m={m} done={claimedIds.has(m.id)} />)
        )}
      </div>
    </section>
  );
}

function useMissionDeadline(missionId: string) {
  // 24h window from when this user first sees the mission (stored locally).
  const [now, setNow] = useState(() => Date.now());
  const deadline = useMemo(() => {
    if (typeof window === "undefined") return Date.now() + 24 * 3600 * 1000;
    const k = `ddp:mission-seen:${missionId}`;
    let seen = Number(window.localStorage.getItem(k) || 0);
    if (!seen) {
      seen = Date.now();
      window.localStorage.setItem(k, String(seen));
    }
    return seen + 24 * 3600 * 1000;
  }, [missionId]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const ms = Math.max(0, deadline - now);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const expired = ms <= 0;
  const label = expired ? "Expirou" : `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return { label, expired };
}

function MissionCountdown({ missionId }: { missionId: string }) {
  const { label, expired } = useMissionDeadline(missionId);
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums ${
        expired
          ? "bg-red-500/20 text-red-400 border border-red-500/40"
          : "bg-red-500/15 text-red-400 border border-red-500/30"
      }`}
      title="Tempo restante para concluir a missão"
    >
      <Clock className="h-3 w-3" />
      {expired ? "Expirou" : `Faltam ${label}`}
    </span>
  );
}

function getPlatformTheme(m: Mission) {
  if (m.platform === "instagram") {
    return {
      icon: Instagram,
      color: "#E1306C",
      gradient: "var(--gradient-instagram)",
      border: "#E1306C/40",
      bg: "#E1306C/10",
    };
  }
  if (m.platform === "youtube") {
    return {
      icon: YoutubeIcon,
      color: "#FF0000",
      gradient: "var(--gradient-youtube)",
      border: "#FF0000/40",
      bg: "#FF0000/10",
    };
  }
  if (m.platform === "facebook") {
    return {
      icon: FacebookIcon,
      color: "#1877F2",
      gradient: "var(--gradient-facebook)",
      border: "#1877F2/40",
      bg: "#1877F2/10",
    };
  }
  if (m.platform === "tiktok" && m.action_type === "follow") {
    return {
      icon: TikTokIcon,
      color: "#ffffff",
      gradient: "var(--gradient-tiktok)",
      border: "#ffffff/30",
      bg: "#ffffff/5",
    };
  }
  return {
    icon: Circle,
    color: "var(--primary)",
    gradient: "var(--gradient-brand)",
    border: "var(--primary)/30",
    bg: "var(--primary)/10",
  };
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a2.996 2.996 0 0 0-2.122-2.124C19.514 3.5 12 3.5 12 3.5s-7.514 0-9.376.562A2.996 2.996 0 0 0 .502 6.186 31.264 31.264 0 0 0 0 12a31.264 31.264 0 0 0 .502 5.814 2.996 2.996 0 0 0 2.122 2.124c1.862.562 9.376.562 9.376.562s7.514 0 9.376-.562a2.996 2.996 0 0 0 2.122-2.124A31.264 31.264 0 0 0 24 12a31.264 31.264 0 0 0-.502-5.814zM9.546 15.556V8.444L15.818 12l-6.272 3.556z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.095 10.125 24v-8.437H7.078v-3.49h3.047V9.412c0-3.017 1.791-4.682 4.534-4.682 1.312 0 2.686.235 2.686.235v2.953h-1.513c-1.491 0-1.956.926-1.956 1.875v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.095 24 18.1 24 12.073z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.88-2.89 2.89 2.89 0 0 1 2.88-2.89c.27 0 .53.04.78.11V9.4a6.37 6.37 0 0 0-.78-.05A6.34 6.34 0 0 0 3.06 15.7a6.34 6.34 0 0 0 6.33 6.34 6.34 6.34 0 0 0 6.33-6.34V8.56a8.25 8.25 0 0 0 4.87 1.58V6.69z" />
    </svg>
  );
}

function MissionRow({ m, done = false }: { m: Mission; done?: boolean }) {
  const theme = getPlatformTheme(m);
  const Icon = theme.icon;

  return (
    <div
      className="flex flex-col gap-3 p-4 rounded-2xl border"
      style={{
        background: done
          ? "color-mix(in srgb, #10b981 6%, #0f0f0f)"
          : `color-mix(in srgb, ${theme.color} 8%, #0f0f0f)`,
        borderColor: done
          ? "color-mix(in srgb, #10b981 40%, transparent)"
          : `color-mix(in srgb, ${theme.color} 35%, transparent)`,
        opacity: done ? 0.85 : 1,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="h-10 w-10 rounded-xl grid place-items-center shrink-0"
          style={{
            background: `color-mix(in srgb, ${theme.color} 18%, transparent)`,
            color: theme.color,
          }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold" style={{ color: theme.color }}>
              {PLATFORM_LABEL[m.platform]}
            </span>
            <span className="text-[10px] text-muted-foreground">· {ACTION_LABEL[m.action_type]}</span>
          </div>
          <div className="text-sm font-semibold truncate mt-0.5">{m.title}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Ganhe <span className="font-bold text-gold">+{m.tokens} tokens</span>
          </div>
        </div>
      </div>

      {done ? (
        <a
          href={m.link}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full text-sm font-bold h-10 rounded-full inline-flex items-center justify-center gap-2 transition hover:opacity-90"
          style={{
            background: "color-mix(in srgb, #10b981 18%, transparent)",
            color: "#10b981",
            border: "1px solid color-mix(in srgb, #10b981 45%, transparent)",
          }}
          title="Abrir link da missão para verificação"
        >
          <Check className="h-4 w-4" />
          Concluída · Ver verificação
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ) : (
        <Link
          to="/missoes"
          className="w-full text-sm font-bold h-10 rounded-full text-white inline-flex items-center justify-center gap-2 transition hover:opacity-90"
          style={{ background: theme.gradient }}
        >
          <ExternalLink className="h-4 w-4" />
          Fazer missão
        </Link>
      )}

      {!done && (
        <div className="flex items-center justify-between">
          <MissionCountdown missionId={m.id} />
        </div>
      )}
    </div>
  );
}

/* ---------- Tokens extract ---------- */

function TokensExtractSection({
  welcomeBonus,
  claims,
  missions,
  participations,
  balance,
}: {
  welcomeBonus: number;
  claims: MissionClaim[];
  missions: Mission[];
  participations: MyParticipation[];
  balance: number;
}) {
  const missionMap = useMemo(() => new Map(missions.map((m) => [m.id, m])), [missions]);
  const entries = useMemo(() => {
    const items: Array<{ id: string; date: string; label: string; amount: number }> = [];
    if (welcomeBonus > 0) {
      items.push({ id: "welcome", date: "", label: "Bônus de boas-vindas", amount: welcomeBonus });
    }
    for (const c of claims) {
      const m = missionMap.get(c.mission_id);
      items.push({
        id: c.id,
        date: c.created_at,
        label: m ? `Missão: ${m.title}` : "Missão concluída",
        amount: c.tokens_awarded ?? 0,
      });
    }
    for (const p of participations) {
      if (!p.entryFee) continue;
      items.push({
        id: `part-${p.id}-${p.participatedAt}`,
        date: p.participatedAt,
        label: `Participação: ${p.title}`,
        amount: -p.entryFee,
      });
    }
    return items.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [welcomeBonus, claims, missionMap, participations]);

  return (
    <section className="glass-card rounded-2xl p-5 border border-border/60">
      <SectionTitle
        icon={History}
        title="Extrato de tokens"
        hint={`Saldo atual: ${formatTokens(balance)} tokens`}
        right={
          <span className="inline-flex items-center gap-1 text-gold font-display font-black">
            <Coins className="h-4 w-4" /> {formatTokens(balance)}
          </span>
        }
      />
      {entries.length === 0 ? (
        <Empty>Nenhuma movimentação ainda.</Empty>
      ) : (
        <div className="rounded-xl border border-border/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-card text-muted-foreground text-[11px] uppercase tracking-wider">
              <tr>
                <th className="text-left px-3 py-2">Data</th>
                <th className="text-left px-3 py-2">Descrição</th>
                <th className="text-right px-3 py-2">Tokens</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-t border-border/60">
                  <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                    {e.date
                      ? new Date(e.date).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td className="px-3 py-2">{e.label}</td>
                  <td
                    className={`px-3 py-2 text-right font-bold tabular-nums ${
                      e.amount < 0 ? "text-destructive" : "text-emerald-400"
                    }`}
                  >
                    {e.amount < 0 ? "−" : "+"}
                    {formatTokens(Math.abs(e.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ---------- My challenges ---------- */

function MyChallengesSection({ items }: { items: Prediction[] }) {
  return (
    <section className="glass-card rounded-2xl p-5 border border-border/60">
      <SectionTitle
        icon={ListChecks}
        title="Desafios que eu Criei"
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
  userId,
  onChange,
}: {
  friends: Friend[];
  inviterName: string;
  userId: string;
  onChange: () => void;
}) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [bulkText, setBulkText] = useState("");

  const registered = friends.filter((f) => f.registered);
  const pending = friends.filter((f) => !f.registered);

  const refCode = (userId || "").slice(0, 8);
  const referralLink = refCode ? `${SITE_URL}/auth?ref=${refCode}` : `${SITE_URL}/auth`;
  const inviteMessage = `Oi! Vem jogar comigo no Desafio dos Palpites. ${inviterName} te convidou — você ganha 1.000 tokens de boas-vindas. ${referralLink}`;

  function handleBulk() {
    const n = addManyFromText(bulkText);
    if (n === 0) {
      toast.error("Nenhum amigo identificado no texto.");
      return;
    }
    setBulkText("");
    onChange();
    toast.success(`${n} amigo(s) adicionado(s) à lista`);
  }

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

      <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 mb-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-bold">
          <ClipboardPaste className="h-4 w-4 text-primary" /> Cole sua lista de amigos
        </div>
        <p className="text-[11px] text-muted-foreground">
          Cole nomes, e-mails ou telefones separados por vírgula, ponto-e-vírgula ou em linhas
          diferentes. Ex.: <code className="px-1 rounded bg-card">Ana, ana@email.com, 11988887777</code>
        </p>
        <textarea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          rows={4}
          placeholder={"Ana Silva, ana@email.com\nJoão, 11988887777\npedro@email.com"}
          className="w-full px-3 py-2 rounded-lg bg-background border border-border/60 text-xs leading-relaxed"
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleBulk}
            className="h-9 px-4 rounded-full bg-gradient-brand text-primary-foreground text-xs font-bold inline-flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" /> Adicionar todos
          </button>
        </div>
      </div>


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

const SITE_URL = "https://www.desafiodospalpites.com.br";

function InvitePromoSection({
  inviterName,
  userId,
  myChallenges,
}: {
  inviterName: string;
  userId: string;
  myChallenges: Prediction[];
}) {
  const refCode = (userId || "").slice(0, 8);
  const link = refCode ? `${SITE_URL}/auth?ref=${refCode}` : `${SITE_URL}/auth`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=10&data=${encodeURIComponent(link)}`;
  const defaultWhats = `🎯 Já imaginou dar seus palpites e ainda ganhar prêmios?\n\nConheça o Desafio dos Palpites!\n\n✅ Totalmente gratuito\n✅ Ganhe tokens participando dos desafios\n✅ Troque seus tokens por produtos, brindes e vale-compras\n✅ Crie seus próprios desafios para amigos, familiares ou empresas\n✅ Convide amigos e ganhe ainda mais créditos\n\nTem desafios de futebol, Copa do Mundo, Brasileirão, UFC, reality shows e muito mais!\n\nCadastre-se agora e comece a acumular tokens:\n\n👉 ${link}\n\nNos vemos no ranking! 🏆🚀`;
  const defaultEmail = `Olá!\n\nQuero te convidar para conhecer o Desafio dos Palpites, uma plataforma gratuita onde você participa de desafios, acumula tokens e troca por prêmios incríveis.\n\nNa plataforma você pode:\n\n🏆 Participar de desafios esportivos e promocionais\n🎁 Ganhar tokens gratuitamente\n🎯 Trocar tokens por produtos, serviços e vale-compras\n👥 Criar seus próprios desafios para amigos, familiares ou clientes\n🚀 Participar de rankings e competir com outros usuários\n\nO melhor de tudo: a participação é totalmente gratuita.\n\nFaça seu cadastro através do link abaixo:\n\n👉 ${link}\n\nVenha se divertir, dar seus palpites e concorrer a prêmios!\n\nEquipe Desafio dos Palpites\nwww.desafiodospalpites.com.br`;

  const [whatsText, setWhatsText] = useState(defaultWhats);
  const [emailText, setEmailText] = useState(defaultEmail);
  const [emailSubject, setEmailSubject] = useState("Vem jogar comigo no Desafio dos Palpites 🏆");
  const [aiBusy, setAiBusy] = useState<"whatsapp" | "email" | null>(null);
  const [igHandle, setIgHandle] = useState("");

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

        <div className="rounded-lg border border-border/60 bg-background p-3 flex flex-col sm:flex-row items-center gap-4">
          <img
            src={qrUrl}
            alt="QR Code do seu link de convite"
            className="h-40 w-40 rounded-md bg-white p-2"
            loading="lazy"
          />
          <div className="flex-1 space-y-2 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-sm font-bold">
              <QrCode className="h-4 w-4 text-primary" /> Seu QR Code de convite
            </div>
            <p className="text-[11px] text-muted-foreground">
              Cada amigo que se cadastrar pelo seu link/QR Code conta como sua indicação.
              Use no Instagram, e-mail, panfletos ou WhatsApp.
            </p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <a
                href={qrUrl}
                download={`qrcode-convite-${refCode}.png`}
                className="h-9 px-3 rounded-full bg-gradient-brand text-primary-foreground text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" /> Baixar QR Code
              </a>
              <button
                onClick={() => copy(qrUrl, "URL do QR Code")}
                className="h-9 px-3 rounded-full bg-background border border-border/60 text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Copy className="h-3.5 w-3.5" /> Copiar URL do QR
              </button>
            </div>
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
