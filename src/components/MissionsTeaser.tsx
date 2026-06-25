import { useEffect, useState } from "react";
import { Instagram, Youtube, Facebook, Music2, Star, ExternalLink, Loader2, Sparkles, Coins, Check } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { listMissions, listMyClaims, claimMission, type Mission, type Platform } from "@/lib/missions";
import { useAuth } from "@/hooks/use-auth";

function PIcon({ p, className }: { p: Platform; className?: string }) {
  if (p === "instagram") return <Instagram className={className} />;
  if (p === "facebook") return <Facebook className={className} />;
  if (p === "youtube") return <Youtube className={className} />;
  if (p === "tiktok") return <Music2 className={className} />;
  return <Star className={className} />;
}

const BRAND: Record<Platform, string> = {
  instagram: "from-[#E1306C] to-[#F77737]",
  facebook: "from-[#1877F2] to-[#4267B2]",
  youtube: "from-[#FF0000] to-[#CC0000]",
  tiktok: "from-[#25F4EE] to-[#FE2C55]",
  google: "from-[#4285F4] to-[#34A853]",
};

export function MissionsTeaser({ limit = 6 }: { limit?: number }) {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [claimed, setClaimed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const all = await listMissions({ activeOnly: true });
        setMissions(all);
        if (user) {
          const c = await listMyClaims();
          setClaimed(new Set(c.map((x) => x.mission_id)));
        }
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const pool = missions.filter((m) => !claimed.has(m.id)).slice(0, limit);

  async function doIt(m: Mission) {
    if (!user) {
      toast.error("Entre para concluir missões.");
      return;
    }
    setBusy(m.id);
    if (m.link) window.open(m.link, "_blank", "noopener,noreferrer");
    setTimeout(async () => {
      try {
        const total = (m.tokens ?? 0) + (m.bonus_tokens ?? 0);
        await claimMission(m.id, "teaser", total);
        setClaimed((s) => new Set(s).add(m.id));
        toast.success(`+${total} TOKENS creditados! 🎉`);
      } catch (e: any) {
        toast.error(e?.message ?? "Erro ao concluir missão");
      } finally {
        setBusy(null);
      }
    }, 1500);
  }

  return (
    <section className="rounded-2xl glass-card p-5 sm:p-6 mb-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-primary font-bold">
            <Sparkles className="h-3.5 w-3.5" /> Ganhe mais pontos
          </div>
          <h2 className="font-display text-xl font-black">Ganhe mais pontos para dar palpites</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cumpra missões rápidas e receba TOKENS + chances de palpites grátis.
          </p>
        </div>
        <Link
          to="/missoes"
          className="shrink-0 text-xs font-bold text-primary hover:underline"
        >
          Ver todas →
        </Link>
      </div>

      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-card border border-border/60 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && pool.length === 0 && (
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
          Você completou todas as missões disponíveis. Volte em breve para novas!
        </div>
      )}

      {!loading && pool.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pool.map((m) => {
            const total = (m.tokens ?? 0) + (m.bonus_tokens ?? 0);
            const isClaimed = claimed.has(m.id);
            const isBusy = busy === m.id;
            return (
              <div
                key={m.id}
                className="relative rounded-2xl border border-border/60 bg-card p-4 overflow-hidden hover:border-primary/60 transition flex flex-col"
              >
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${BRAND[m.platform]}`} />
                <div className="flex items-center gap-2 mb-2">
                  <div className={`h-9 w-9 rounded-lg grid place-items-center bg-gradient-to-br ${BRAND[m.platform]} text-white shrink-0`}>
                    <PIcon p={m.platform} className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                      {m.sponsor_name}
                    </div>
                    <div className="font-bold text-sm leading-tight line-clamp-2">{m.title}</div>
                  </div>
                </div>
                <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-black text-gold">
                    <Coins className="h-3.5 w-3.5" /> +{total}
                  </span>
                  <button
                    onClick={() => doIt(m)}
                    disabled={isBusy || isClaimed}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-gradient-brand text-primary-foreground text-xs font-bold shadow-glow disabled:opacity-50"
                  >
                    {isClaimed ? (
                      <><Check className="h-3.5 w-3.5" /> Feita</>
                    ) : isBusy ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Verificando</>
                    ) : (
                      <><ExternalLink className="h-3.5 w-3.5" /> Fazer agora</>
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
