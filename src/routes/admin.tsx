import { createFileRoute, Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Users, KeyRound, Mail, LayoutDashboard, Shield, ListChecks, Sparkles, Target,
  Loader2, Lock, FolderTree, Image as ImageIcon, Building2, UserPlus, Gift,
  Sparkle, Store, Trophy, Bell, Coins, FileBarChart, ShieldAlert, ChevronLeft,
  ChevronRight, Trophy as TrophyIcon, Menu,
} from "lucide-react";
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

type NavItem = { to: string; label: string; icon: any; exact?: boolean };
type NavGroup = { label: string; items: NavItem[] };

const ADMIN_GROUPS: NavGroup[] = [
  {
    label: "Painel",
    items: [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "Operação",
    items: [
      { to: "/admin/cadastros", label: "Usuários", icon: Users },
      { to: "/admin/empresas", label: "Empresas", icon: Building2 },
      { to: "/admin/convites", label: "Convites", icon: UserPlus },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      { to: "/admin/desafios", label: "Desafios", icon: ListChecks },
      { to: "/admin/categorias", label: "Categorias", icon: FolderTree },
      { to: "/admin/banners", label: "Banners", icon: ImageIcon },
      { to: "/admin/resultado-jogos", label: "Resultado Jogos", icon: TrophyIcon },
      { to: "/admin/apuracao-copa", label: "Apuração Copa", icon: TrophyIcon },
    ],
  },
  {
    label: "Gamificação",
    items: [
      { to: "/admin/missoes", label: "Missões", icon: Target },
      { to: "/admin/bonus-login", label: "Bônus de Login", icon: Gift },
      { to: "/admin/raspadinha", label: "Raspadinha", icon: Sparkle },
      { to: "/admin/loja", label: "Loja de Prêmios", icon: Store },
      { to: "/admin/ranking", label: "Ranking", icon: Trophy },
    ],
  },
  {
    label: "Comunicação",
    items: [
      { to: "/admin/email-marketing", label: "E-mail Marketing", icon: Mail },
      { to: "/admin/notificacoes", label: "Notificações", icon: Bell },
    ],
  },
  {
    label: "Sistema",
    items: [
      { to: "/admin/regras-ia", label: "Regras IA", icon: Sparkles },
      { to: "/admin/apis", label: "APIs", icon: KeyRound },
      { to: "/admin/tokens-config", label: "Config. Tokens", icon: Coins },
      { to: "/admin/relatorios", label: "Relatórios", icon: FileBarChart },
      { to: "/admin/seguranca", label: "Segurança / Logs", icon: ShieldAlert },
    ],
  },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const check = useServerFn(checkIsAdmin);
  const claim = useServerFn(claimAdminIfNone);
  const [status, setStatus] = useState<"checking" | "admin" | "denied">("checking");
  const [claiming, setClaiming] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showPrimary, setShowPrimary] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    let cancelled = false;
    check()
      .then((r) => { if (!cancelled) setStatus(r.isAdmin ? "admin" : "denied"); })
      .catch(() => { if (!cancelled) setStatus("denied"); });
    return () => { cancelled = true; };
  }, [user, loading, navigate, check]);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  async function handleClaim() {
    setClaiming(true);
    try {
      const r = await claim();
      if (r.granted) { toast.success("Você agora é administrador!"); setStatus("admin"); }
      else toast.error(r.reason ?? "Não foi possível conceder acesso.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally { setClaiming(false); }
  }

  if (loading || status === "checking") {
    return (
      <AppShell hidePrimarySidebar>
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
            Só funciona se ainda não existir nenhum administrador.
          </p>
        </div>
      </AppShell>
    );
  }

  const sidebarWidth = collapsed ? "w-[68px]" : "w-[248px]";

  return (
    <AppShell hidePrimarySidebar={!showPrimary}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          onClick={() => setShowPrimary((v) => !v)}
          className="hidden md:inline-flex items-center gap-2 h-10 px-4 rounded-full glass-card border border-border/60 text-sm font-semibold hover:border-primary/60 transition"
        >
          <Menu className="h-4 w-4" />
          {showPrimary ? "Ocultar menu principal" : "Abrir menu principal"}
        </button>
        <div className="lg:hidden flex items-center justify-between flex-1">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-brand grid place-items-center shadow-glow">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-display font-black leading-tight">Administrativo</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Painel de controle</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="h-10 w-10 rounded-xl glass-card grid place-items-center"
            aria-label="Abrir menu admin"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar desktop */}
        <aside className={`hidden lg:flex flex-col shrink-0 ${sidebarWidth} transition-all`}>
          <div className="glass-card rounded-2xl p-3 sticky top-4">
            <div className="flex items-center gap-2 px-2 pb-3 border-b border-border/40 mb-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-brand grid place-items-center shadow-glow shrink-0">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-display font-black leading-tight truncate">Administrativo</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Área restrita</div>
                </div>
              )}
              <button
                onClick={() => setCollapsed((c) => !c)}
                className="h-7 w-7 rounded-lg hover:bg-muted/40 grid place-items-center text-muted-foreground"
                aria-label={collapsed ? "Expandir" : "Recolher"}
              >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
            </div>
            <NavGroups collapsed={collapsed} pathname={pathname} />
          </div>
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-card border-r border-border/60 p-3 overflow-y-auto">
              <div className="flex items-center gap-2 px-2 pb-3 border-b border-border/40 mb-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-brand grid place-items-center shadow-glow">
                  <Shield className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-display font-black leading-tight">Administrativo</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Área restrita</div>
                </div>
              </div>
              <NavGroups collapsed={false} pathname={pathname} />
            </aside>
          </div>
        )}

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </AppShell>
  );
}

function NavGroups({ collapsed, pathname }: { collapsed: boolean; pathname: string }) {
  return (
    <nav className="space-y-3">
      {ADMIN_GROUPS.map((group) => (
        <div key={group.label}>
          {!collapsed && (
            <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              {group.label}
            </div>
          )}
          <div className="space-y-0.5">
            {group.items.map(({ to, label, icon: Icon, exact }) => {
              const active = exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");
              return (
                <Link
                  key={to}
                  to={to}
                  title={collapsed ? label : undefined}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    active
                      ? "bg-gradient-brand text-primary-foreground shadow-glow"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  } ${collapsed ? "justify-center" : ""}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
