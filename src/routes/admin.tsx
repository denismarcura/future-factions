import { createFileRoute, Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Users, KeyRound, Mail, LayoutDashboard, Shield, ListChecks, Sparkles, Target, Loader2, Lock, FolderTree, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { checkIsAdmin, claimAdminIfNone } from "@/lib/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administrativo · Desafio dos Palpites" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminLayout,
});

const ADMIN_NAV = [
  { to: "/admin", label: "Painel", icon: LayoutDashboard, exact: true },
  { to: "/admin/cadastros", label: "Cadastros", icon: Users },
  { to: "/admin/desafios", label: "Desafios", icon: ListChecks },
  { to: "/admin/categorias", label: "Categorias Desafios", icon: FolderTree },
  { to: "/admin/banners", label: "Banners", icon: ImageIcon },
  { to: "/admin/regras-ia", label: "Regras IA", icon: Sparkles },
  { to: "/admin/missoes", label: "Missões", icon: Target },
  { to: "/admin/apis", label: "APIs", icon: KeyRound },
  { to: "/admin/email-marketing", label: "E-mail Marketing", icon: Mail },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const check = useServerFn(checkIsAdmin);
  const claim = useServerFn(claimAdminIfNone);
  const [status, setStatus] = useState<"checking" | "admin" | "denied">("checking");
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    let cancelled = false;
    check()
      .then((r) => { if (!cancelled) setStatus(r.isAdmin ? "admin" : "denied"); })
      .catch(() => { if (!cancelled) setStatus("denied"); });
    return () => { cancelled = true; };
  }, [user, loading, navigate, check]);

  async function handleClaim() {
    setClaiming(true);
    try {
      const r = await claim();
      if (r.granted) {
        toast.success("Você agora é administrador!");
        setStatus("admin");
      } else {
        toast.error(r.reason ?? "Não foi possível conceder acesso.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setClaiming(false);
    }
  }

  if (loading || status === "checking") {
    return (
      <AppShell>
        <div className="min-h-[40vh] grid place-items-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (status === "denied") {
    return (
      <AppShell>
        <div className="max-w-md mx-auto mt-12 glass-card rounded-2xl p-8 text-center border border-border/60">
          <div className="h-14 w-14 rounded-2xl bg-destructive/10 grid place-items-center mx-auto mb-4">
            <Lock className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="text-xl font-display font-black mb-2">Acesso restrito</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Sua conta não tem permissão para acessar a área administrativa.
          </p>
          <button
            onClick={handleClaim}
            disabled={claiming}
            className="w-full h-11 rounded-full bg-gradient-brand text-primary-foreground font-bold text-sm shadow-glow flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {claiming && <Loader2 className="h-4 w-4 animate-spin" />}
            Tornar-me admin (1ª conta)
          </button>
          <p className="text-[11px] text-muted-foreground mt-3">
            Só funciona se ainda não existir nenhum administrador. Depois disso, novos admins devem ser
            adicionados pelo painel.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-brand grid place-items-center shadow-glow">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-black">Administrativo</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Área restrita · gestão da plataforma
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 p-1 glass-card rounded-2xl">
        {ADMIN_NAV.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                active
                  ? "bg-gradient-brand text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground hover:bg-card"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </div>

      <Outlet />
    </AppShell>
  );
}
