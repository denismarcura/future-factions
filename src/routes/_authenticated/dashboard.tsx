import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { signOut } from "@/hooks/use-auth";
import { LogOut, Trophy, Target, Coins, Plus, ListChecks, ShoppingBag } from "lucide-react";

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
};

function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      setProfile(data as Profile | null);
    })();
  }, []);

  const name = profile?.full_name ?? "Palpiteiro";
  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <AppShell>
      <div className="space-y-6">
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat icon={Coins} label="Tokens" value="0" />
          <Stat icon={Target} label="Palpites" value="0" />
          <Stat icon={Trophy} label="Acertos" value="0" />
          <Stat icon={ListChecks} label="Desafios" value="0" />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <ActionCard to="/criar" icon={Plus} title="Criar desafio" desc="Monte seu próprio palpite" />
          <ActionCard to="/desafios" icon={ListChecks} title="Participar" desc="Veja desafios abertos" />
          <ActionCard to="/shop" icon={ShoppingBag} title="Trocar tokens" desc="Brindes na loja" />
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="glass-card rounded-2xl p-4 border border-border/60">
      <Icon className="h-5 w-5 text-primary" />
      <div className="font-display font-black text-2xl mt-2 tabular-nums">{value}</div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function ActionCard({ to, icon: Icon, title, desc }: { to: string; icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <Link to={to} className="glass-card rounded-2xl p-5 border border-border/60 hover:border-primary/60 transition group">
      <Icon className="h-6 w-6 text-primary group-hover:scale-110 transition" />
      <div className="font-display font-bold mt-3">{title}</div>
      <div className="text-xs text-muted-foreground mt-1">{desc}</div>
    </Link>
  );
}
