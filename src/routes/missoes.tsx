import { createFileRoute } from "@tanstack/react-router";
import { Target, Gift, Share2, Copy, Check, Instagram, Youtube, Star, Loader2, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
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

function Missoes() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [claimed, setClaimed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [showMore, setShowMore] = useState<Platform | null>(null);

  const referralLink = `vaidar.app/r/${CURRENT_USER.username.toLowerCase()}`;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const all = await listMissions({ activeOnly: true });
        setMissions(all);
        if (user) {
          const claims = await listMyClaims("missoes");
          setClaimed(new Set(claims.map((c) => c.mission_id)));
        }
      } catch (e: any) {
        toast.error(e.message ?? "Erro ao carregar missões");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  async function handleClaim(m: Mission) {
    if (!user) {
      toast.error("Faça login para concluir missões.");
      return;
    }
    if (claimed.has(m.id)) return;
    setBusy(m.id);
    window.open(m.link, "_blank", "noopener,noreferrer");
    try {
      await claimMission(m.id, "missoes", m.tokens);
      setClaimed((prev) => new Set(prev).add(m.id));
      toast.success(`+${m.tokens} Tokens!`);

      // Check completion per platform → prompt "more missions?"
      const platformMissions = missions.filter((x) => x.platform === m.platform);
      const newClaimed = new Set(claimed).add(m.id);
      const done = platformMissions.every((x) => newClaimed.has(x.id));
      if (done && platformMissions.length > 0) setShowMore(m.platform);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao registrar");
    } finally {
      setBusy(null);
    }
  }

  const grouped: Record<Platform, Mission[]> = { instagram: [], youtube: [], google: [] };
  missions.forEach((m) => grouped[m.platform].push(m));

  return (
    <AppShell>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-black flex items-center gap-3">
          <Target className="h-7 w-7 text-primary" /> Missões
        </h1>
        <p className="text-muted-foreground mt-1">Ganhe Tokens fazendo coisas que você já faz.</p>
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
        (Object.keys(PLATFORM_LABEL) as Platform[]).map((p) =>
          grouped[p].length === 0 ? null : (
            <section key={p} className="mb-6">
              <h2 className="font-display font-black text-lg mb-3 flex items-center gap-2">
                {p === "instagram" && <Instagram className="h-5 w-5 text-pink-400" />}
                {p === "youtube" && <Youtube className="h-5 w-5 text-red-400" />}
                {p === "google" && <Star className="h-5 w-5 text-blue-400" />}
                {PLATFORM_LABEL[p]}
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {grouped[p].map((m) => {
                  const done = claimed.has(m.id);
                  return (
                    <div key={m.id} className="rounded-xl bg-card border border-border/60 p-4 flex items-center gap-4 hover:border-primary/40 transition">
                      <div className="h-10 w-10 rounded-lg bg-primary/15 border border-primary/30 grid place-items-center text-primary font-bold uppercase text-xs">
                        {ACTION_LABEL[m.action_type].slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{m.title}</div>
                        <div className="text-xs text-muted-foreground">{m.sponsor_name} · {ACTION_LABEL[m.action_type]}</div>
                        <div className="text-xs text-gold font-bold mt-0.5">+{m.tokens} Tokens</div>
                      </div>
                      <button
                        onClick={() => handleClaim(m)}
                        disabled={done || busy === m.id}
                        className={`h-9 px-4 rounded-full font-bold text-xs inline-flex items-center gap-1 transition ${
                          done
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-gradient-brand text-primary-foreground shadow-glow hover:scale-[1.03]"
                        }`}
                      >
                        {busy === m.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : done ? <Check className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
                        {done ? "Feito" : "Fazer"}
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

      {showMore && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-sm p-4" onClick={() => setShowMore(null)}>
          <div className="max-w-sm w-full rounded-2xl bg-card border border-primary/40 p-6 text-center shadow-glow" onClick={(e) => e.stopPropagation()}>
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="font-display font-black text-xl">Você completou todas do {PLATFORM_LABEL[showMore]}!</h3>
            <p className="text-sm text-muted-foreground mt-2">Quer fazer mais missões patrocinadas e ganhar ainda mais Tokens?</p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setShowMore(null)} className="flex-1 h-11 rounded-xl border border-border/60 font-semibold">Agora não</button>
              <button onClick={() => { setShowMore(null); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex-1 h-11 rounded-xl bg-gradient-brand text-primary-foreground font-bold shadow-glow">
                Sim, mais!
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
