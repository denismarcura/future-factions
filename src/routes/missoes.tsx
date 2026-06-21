import { createFileRoute } from "@tanstack/react-router";
import { Target, Gift, Share2, Copy, Check, Instagram, Youtube, Star, Loader2, Facebook, Music2, Play, AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
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

const PLATFORMS: Platform[] = ["instagram", "facebook", "youtube", "tiktok", "google"];
const COMPLETION_BONUS_TOKENS = 50; // bônus extra por cada missão cumprida
const COMPLETION_BONUS_CHANCES = 1; // +1 chance de palpite por missão cumprida

function PlatformIcon({ p, className }: { p: Platform; className?: string }) {
  if (p === "instagram") return <Instagram className={className} />;
  if (p === "facebook") return <Facebook className={className} />;
  if (p === "youtube") return <Youtube className={className} />;
  if (p === "tiktok") return <Music2 className={className} />;
  return <Star className={className} />;
}

function Missoes() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [claimed, setClaimed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const referralLink = `vaidar.app/r/${CURRENT_USER.username.toLowerCase()}`;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const all = await listMissions({ activeOnly: true });
        setMissions(all);
        if (user) {
          // Consider claims from any context (dashboard, previsão, missões page)
          // so a mission completed elsewhere shows as "Concluída" here too.
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
    // open the target in a new tab using a real anchor (more compatible inside iframes)
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
      const totalAward = m.tokens + (m.bonus_tokens || 0) + COMPLETION_BONUS_TOKENS;
      await claimMission(m.id, "missoes", totalAward);
      setClaimed((prev) => new Set(prev).add(m.id));
      toast.success(
        `Tarefa concluída! +${m.tokens + (m.bonus_tokens || 0)} Tokens da missão · +${COMPLETION_BONUS_TOKENS} bônus · +${COMPLETION_BONUS_CHANCES} chance de palpite.`
      );
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao registrar");
    } finally {
      setRunning(null);
    }
  }

  const grouped = useMemo(() => {
    const base: Record<Platform, Mission[]> = { instagram: [], facebook: [], youtube: [], tiktok: [], google: [] };
    missions.forEach((m) => base[m.platform].push(m));
    return base;
  }, [missions]);

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-black flex items-center gap-3">
          <Target className="h-7 w-7 text-primary" /> Missões
        </h1>
        <p className="text-muted-foreground mt-1">Ganhe Tokens fazendo coisas que você já faz.</p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-3 py-2 text-sm">
          <Gift className="h-4 w-4 text-gold" />
          <span>
            A cada missão cumprida você ganha{" "}
            <span className="font-bold text-gold">+{COMPLETION_BONUS_CHANCES} chance</span> de fazer um novo palpite e{" "}
            <span className="font-bold text-gold">+{COMPLETION_BONUS_TOKENS} tokens</span> extras.
          </span>
        </div>
      </header>

      <section className="rounded-2xl glass-card p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-brand grid place-items-center shadow-glow shrink-0">
            <Gift className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-xl font-black">Indique amigos · +100 Tokens cada</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Compartilhe seu link e ganhe Tokens toda vez que um amigo entrar.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <div className="flex-1 h-11 px-3 rounded-lg bg-background border border-border/60 flex items-center font-mono text-sm overflow-hidden">
                {referralLink}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(referralLink);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="h-11 px-4 rounded-lg bg-gradient-brand text-primary-foreground font-bold inline-flex items-center gap-2 shadow-glow"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copiado!" : "Copiar link"}
              </button>
              <button className="h-11 px-4 rounded-lg border border-gold/60 text-gold font-bold inline-flex items-center gap-2 hover:bg-gold/10">
                <Share2 className="h-4 w-4" /> Compartilhar
              </button>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin inline" /></div>
      ) : missions.length === 0 ? (
        <div className="rounded-2xl bg-card border border-border/60 p-8 text-center text-muted-foreground">
          Nenhuma missão disponível agora. Volte em breve!
        </div>
      ) : (
        PLATFORMS.map((p) =>
          grouped[p].length === 0 ? null : (
            <section key={p} className="mb-6">
              <h2 className="font-display font-black text-lg mb-3 flex items-center gap-2">
                <PlatformIcon p={p} className="h-5 w-5 text-primary" />
                {PLATFORM_LABEL[p]}
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {grouped[p].map((m) => {
                  const done = claimed.has(m.id);
                  const isRunning = running === m.id;
                  return (
                    <div key={m.id} className="rounded-xl bg-card border border-border/60 p-4 flex items-center gap-4 hover:border-primary/40 transition">
                      <div className="h-10 w-10 rounded-lg bg-primary/15 border border-primary/30 grid place-items-center text-primary font-bold uppercase text-xs">
                        {ACTION_LABEL[m.action_type].slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{m.sponsor_name}</div>
                        <div className="text-xs text-muted-foreground truncate">{ACTION_LABEL[m.action_type]}</div>
                        <div className="text-xs text-gold font-bold mt-0.5">
                          +{m.tokens} Tokens{m.bonus_tokens > 0 && ` · +${m.bonus_tokens} bônus`}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDo(m)}
                        disabled={done || isRunning || !!running}
                        className={`h-9 px-4 rounded-full font-bold text-xs inline-flex items-center gap-1 transition ${
                          done
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-gradient-brand text-primary-foreground shadow-glow hover:scale-[1.03] disabled:opacity-60 disabled:hover:scale-100"
                        }`}
                      >
                        {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : done ? <Check className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                        {isRunning ? "Verificando…" : done ? "Concluída" : "Fazer tarefa"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )
        )
      )}

      <section className="mt-8 rounded-2xl bg-card border border-border/60 p-5 text-sm text-muted-foreground">
        Saldo atual: <span className="text-gold font-display font-black text-base">{formatTokens(CURRENT_USER.tokens)} Tokens</span>
      </section>

      <section className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="h-5 w-5 mt-0.5 accent-amber-400"
              />
              <span className="text-sm text-foreground">
                <strong>Confirmo que realizei todas as tarefas selecionadas.</strong> Em caso de premiação, as tarefas serão verificadas. Caso constatado que não foram realizadas, o usuário será <strong>desclassificado</strong>.
              </span>
            </label>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
