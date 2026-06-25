import { createFileRoute } from "@tanstack/react-router";
import { Target, Gift, Check, Instagram, Youtube, Star, Loader2, Facebook, Music2, Play, AlertTriangle, Trophy, Coins, Calendar, CalendarDays, Sparkles, ListChecks, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { InviteLinkCard } from "@/components/InviteLinkCard";
import { CURRENT_USER, formatTokens } from "@/lib/mock-data";
import {
  type Mission,
  type Platform,
  ACTION_LABEL,
  PLATFORM_LABEL,
  listMissions,
  listMyClaims,
  claimMission,
} from "@/lib/missions";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/missoes")({
  head: () => ({
    meta: [
      { title: "Missões — EU ACHO QUE VAI DAR @#&" },
      { name: "description", content: "Cumpra missões e ganhe Tokens grátis." },
    ],
  }),
  component: Missoes,
});

const COMPLETION_BONUS_TOKENS = 50;
const COMPLETION_BONUS_CHANCES = 1;

type TabKey = "todas" | "instagram" | "facebook" | "youtube" | "tiktok" | "especiais";
type IconCmp = React.ComponentType<React.SVGProps<SVGSVGElement>>;
const TABS: { key: TabKey; label: string; icon: IconCmp; brand?: string }[] = [
  { key: "todas", label: "Todas", icon: ListChecks },
  { key: "instagram", label: "Instagram", icon: Instagram, brand: "#E1306C" },
  { key: "youtube", label: "YouTube", icon: Youtube, brand: "#FF0000" },
  { key: "tiktok", label: "TikTok", icon: Music2, brand: "#25F4EE" },
  { key: "facebook", label: "Facebook", icon: Facebook, brand: "#1877F2" },
  { key: "especiais", label: "Especiais", icon: Sparkles, brand: "#F5C542" },
];

function PlatformIcon({ p, className }: { p: Platform; className?: string }) {
  if (p === "instagram") return <Instagram className={className} />;
  if (p === "facebook") return <Facebook className={className} />;
  if (p === "youtube") return <Youtube className={className} />;
  if (p === "tiktok") return <Music2 className={className} />;
  return <Star className={className} />;
}

function Missoes() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [claimed, setClaimed] = useState<Set<string>>(new Set());
  const [exiting, setExiting] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [tab, setTab] = useState<TabKey>("todas");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const all = await listMissions({ activeOnly: true });
        setMissions(all);
        if (user) {
          const claims = await listMyClaims();
          setClaimed(new Set(claims.map((c) => c.mission_id)));
        }
      } catch (e: any) {
        toast.error(e.message ?? "Erro ao carregar missões");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  async function handleDo(m: Mission) {
    if (!user) {
      toast.error("Faça login para concluir missões.");
      return;
    }
    if (claimed.has(m.id) || running) return;
    setRunning(m.id);
    try {
      const a = document.createElement("a");
      a.href = m.link;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      window.open(m.link, "_blank", "noopener,noreferrer");
    }
    await new Promise((r) => setTimeout(r, 5000));
    try {
      const earned = m.tokens + (m.bonus_tokens || 0);
      const totalAward = earned + COMPLETION_BONUS_TOKENS;
      await claimMission(m.id, "missoes", totalAward);
      toast.success(`+${totalAward} TOKENS creditados! 🎉`, {
        description: `${earned} da missão + ${COMPLETION_BONUS_TOKENS} bônus de conclusão · +${COMPLETION_BONUS_CHANCES} chance extra.`,
        duration: 5000,
      });
      // Trigger fade-out then remove from list
      setExiting((prev) => new Set(prev).add(m.id));
      setTimeout(() => {
        setClaimed((prev) => new Set(prev).add(m.id));
        setExiting((prev) => {
          const next = new Set(prev);
          next.delete(m.id);
          return next;
        });
      }, 450);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao registrar");
    } finally {
      setRunning(null);
    }
  }

  const filtered = useMemo(() => {
    // keep exiting cards visible during fade-out animation
    const open = missions.filter((m) => !claimed.has(m.id) || exiting.has(m.id));
    if (tab === "todas") return open;
    if (tab === "especiais") return open.filter((m) => (m.bonus_tokens || 0) > 0);
    return open.filter((m) => m.platform === tab);
  }, [missions, tab, claimed, exiting]);

  const totalClaimable = useMemo(
    () => missions.filter((m) => !claimed.has(m.id)).reduce((s, m) => s + m.tokens + (m.bonus_tokens || 0) + COMPLETION_BONUS_TOKENS, 0),
    [missions, claimed]
  );
  const completed = claimed.size;
  const totalMissions = missions.length;
  const progressPct = totalMissions > 0 ? Math.round((completed / totalMissions) * 100) : 0;

  return (
    <AppShell>
      {/* HERO */}
      <header className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-card via-card to-primary/10 p-5 sm:p-7 mb-5">
        <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-gold/15 blur-3xl pointer-events-none" />
        <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 border border-primary/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary mb-2">
              <Target className="h-3 w-3" /> Missões
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-black leading-none">
              MISSÕES
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-[26ch]">
              Complete missões e <span className="text-gold font-bold">ganhe tokens</span> e mais chances de palpitar!
            </p>
          </div>
          <div className="shrink-0 grid h-20 w-20 sm:h-24 sm:w-24 place-items-center rounded-2xl bg-gradient-to-br from-gold/30 to-primary/20 border border-gold/40 shadow-glow">
            <Coins className="h-10 w-10 sm:h-12 sm:w-12 text-gold" />
          </div>
        </div>
      </header>

      {/* PROGRESS */}
      <section className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5 mb-5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-primary mb-3">Seu progresso</div>
        <div className="grid grid-cols-[auto_minmax(0,1fr)] sm:grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4">
          <div className="relative h-16 w-16 shrink-0">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.5" fill="none"
                stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${(progressPct / 100) * 97.4} 97.4`}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="font-bold leading-tight text-sm sm:text-base">Missões concluídas</div>
            <div className="text-xs text-muted-foreground">{completed}/{totalMissions} disponíveis</div>
            <div className="text-[11px] text-primary font-bold mt-1">{progressPct}% completo</div>
          </div>
          <div className="col-span-2 sm:col-span-1 sm:text-right border-t sm:border-t-0 sm:border-l border-border/60 pt-3 sm:pt-0 sm:pl-5">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Disponível</div>
            <div className="font-display text-2xl font-black text-gold">+{formatTokens(totalClaimable)}</div>
            <div className="text-[11px] text-muted-foreground">tokens em missões</div>
          </div>
        </div>
      </section>

      {/* TABS */}
      <div className="mb-4 grid grid-cols-6 gap-1.5 sm:gap-2 rounded-2xl bg-card border border-border/60 p-1.5">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              title={t.label}
              aria-label={t.label}
              className={`relative aspect-square grid place-items-center rounded-xl transition ${
                active
                  ? "bg-primary/15 border border-primary/40 shadow-glow"
                  : "border border-transparent hover:bg-muted/40"
              }`}
            >
              <Icon
                className="h-5 w-5"
                style={active && t.brand ? { color: t.brand } : undefined}
              />
              <span className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-tight ${active ? "text-primary" : "text-muted-foreground"} hidden`}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* MISSION LIST */}
      {loading ? (
        <div className="text-center py-10 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin inline" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border/60 p-8 text-center text-muted-foreground">
          Nenhuma missão nessa categoria. Tente outra aba!
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((m) => {
            const done = claimed.has(m.id);
            const isRunning = running === m.id;
            const totalTokens = m.tokens + (m.bonus_tokens || 0) + COMPLETION_BONUS_TOKENS;
            return (
              <div
                key={m.id}
                className={`rounded-2xl border p-3 sm:p-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 transition ${
                  done
                    ? "bg-emerald-500/5 border-emerald-500/30"
                    : "bg-card border-border/60 hover:border-primary/40"
                }`}
              >
                <div className="shrink-0 h-12 w-12 rounded-xl bg-primary/10 border border-primary/25 grid place-items-center">
                  <PlatformIcon p={m.platform} className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate">{m.sponsor_name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {ACTION_LABEL[m.action_type]} · {PLATFORM_LABEL[m.platform]}
                  </div>
                  <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-gold">
                    <Coins className="h-3 w-3" /> +{totalTokens} tokens
                  </div>
                </div>
                <button
                  onClick={() => handleDo(m)}
                  disabled={done || isRunning || !!running}
                  className={`shrink-0 h-9 px-3.5 rounded-full font-bold text-[11px] uppercase tracking-wide inline-flex items-center gap-1 transition ${
                    done
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : "bg-gradient-brand text-primary-foreground shadow-glow hover:scale-[1.03] disabled:opacity-60 disabled:hover:scale-100"
                  }`}
                >
                  {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : done ? <Check className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  {isRunning ? "..." : done ? "Feita" : "Fazer"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* INVITE CTA BANNER */}
      <section className="mt-6 rounded-3xl border border-gold/40 bg-gradient-to-br from-gold/10 via-card to-primary/10 p-5 overflow-hidden relative">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-gold/20 blur-3xl pointer-events-none" />
        <div className="relative grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 mb-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gold/20 border border-gold/40 shrink-0">
            <Users className="h-7 w-7 text-gold" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-black text-lg leading-tight">Seu link simples de convite</h3>
            <p className="text-xs text-muted-foreground mt-1">Compartilhe o mesmo link nas missões, desafios e no seu perfil.</p>
          </div>
        </div>
        <InviteLinkCard />
      </section>

      {/* CONFIRMATION */}
      <section className="mt-5 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="h-5 w-5 mt-0.5 accent-amber-400 shrink-0"
          />
          <span className="text-xs text-foreground leading-relaxed">
            <AlertTriangle className="h-3.5 w-3.5 inline text-amber-400 mr-1" />
            <strong>Confirmo que realizei todas as tarefas.</strong> Em caso de premiação, serão verificadas. Caso constatado que não foram realizadas, o usuário será <strong>desclassificado</strong>.
          </span>
        </label>
      </section>

      {/* SOCIAL BRAND BANNERS */}
      <section className="mt-8">
        <div className="mb-3 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/30 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-3 w-3" /> Siga e ganhe tokens
          </div>
          <h3 className="font-display text-xl font-black mt-2">Nossas redes sociais</h3>
          <p className="text-xs text-muted-foreground">Curta e siga para missões exclusivas toda semana.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Instagram", icon: Instagram, href: "https://instagram.com/desafiodospalpites", gradient: "from-[#F58529] via-[#DD2A7B] to-[#8134AF]" },
            { label: "YouTube", icon: Youtube, href: "https://youtube.com/@desafiodospalpites", gradient: "from-[#FF0000] to-[#CC0000]" },
            { label: "TikTok", icon: Music2, href: "https://tiktok.com/@desafiodospalpites", gradient: "from-[#25F4EE] via-[#000000] to-[#FE2C55]" },
            { label: "Facebook", icon: Facebook, href: "https://facebook.com/desafiodospalpites", gradient: "from-[#1877F2] to-[#0E5BC5]" },
          ].map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`group relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br ${s.gradient} shadow-lg hover:shadow-glow hover:scale-[1.03] transition-transform`}
            >
              <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-white/15 blur-2xl" />
              <div className="relative flex flex-col items-center text-center text-white">
                <s.icon className="h-7 w-7 mb-2 drop-shadow" />
                <div className="font-display font-black text-sm">{s.label}</div>
                <div className="text-[10px] uppercase tracking-wider opacity-90 mt-0.5">Seguir agora</div>
              </div>
            </a>
          ))}
        </div>
      </section>

      <div className="mt-5 mb-2 text-center text-xs text-muted-foreground">
        Saldo atual: <span className="text-gold font-display font-black text-sm">{formatTokens(CURRENT_USER.tokens)} tokens</span>
      </div>
    </AppShell>
  );
}
