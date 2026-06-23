import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Trophy,
  Target,
  User as UserIcon,
  Plus,
  Search,
  Coins,
  Bell,
  Crown,
  ShoppingBag,
  Building2,
  HelpCircle,
  BookOpen,
  Flame,
  ListChecks,
  Shield,
  Brain,
  LogIn,
  LogOut,
  Menu,
  LayoutDashboard,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { CURRENT_USER, formatTokens } from "@/lib/mock-data";
import { useAuth, signOut } from "@/hooks/use-auth";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import logoAsset from "@/assets/logo-desafio.png.asset.json";
import { LiveUsersBadge } from "@/components/LiveUsersBadge";
import { Footer } from "@/components/layout/Footer";


const ADMIN_EMAILS = ["denismarcura@gmail.com", "antoinio.salvador@gmail.com"];

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/como-funciona", label: "Como Funciona", icon: BookOpen },
  { to: "/desafios", label: "Desafios", icon: ListChecks },
  { to: "/criar", label: "Criar Desafio", icon: Plus },
  { to: "/palpite-ia", label: "Palpite da IA", icon: Brain },
  { to: "/ranking", label: "Ranking", icon: Trophy },
  { to: "/top100", label: "Top 100", icon: Crown },
  { to: "/shop", label: "Prêmios", icon: ShoppingBag },
  { to: "/empresas", label: "Empresas", icon: Building2 },
  { to: "/missoes", label: "Missões", icon: Target },
  { to: "/perfil", label: "Perfil", icon: UserIcon },
  { to: "/faq", label: "FAQ", icon: HelpCircle },
  { to: "/admin", label: "Administrativo", icon: Shield, adminOnly: true },
];

const MOBILE_NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/desafios", label: "Desafios", icon: ListChecks },
  { to: "/shop", label: "Shop", icon: ShoppingBag },
  { to: "/ranking", label: "Ranking", icon: Trophy },
];

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3 group">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/40 blur-lg opacity-60 group-hover:opacity-100 transition" />
        <img
          src={logoAsset.url}
          alt="Desafio dos Palpites"
          className="relative h-12 w-12 object-contain drop-shadow-[0_0_8px_rgba(0,230,118,0.55)]"
        />
      </div>
      <div className="leading-none hidden sm:block">
        <div className="font-display font-black text-sm tracking-tight">
          DESAFIO <span className="text-gradient-brand">DOS</span>{" "}
          <span className="text-gradient-silver">PALPITES</span>
        </div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-0.5">
          100% grátis · Só Tokens, sem dinheiro real
        </div>
      </div>
    </Link>
  );
}

function TokenPill() {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-card shadow-glow-gold">
      <Coins className="h-4 w-4 text-gold" />
      <span className="font-display font-bold text-sm tabular-nums">
        {formatTokens(CURRENT_USER.tokens)}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Tokens</span>
    </div>
  );
}

export function AppShell({ children, hidePrimarySidebar = false }: { children: ReactNode; hidePrimarySidebar?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = !!(user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));
  const visibleNav = NAV.filter((n) => !n.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-background bg-radial-brand">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/75 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-18 py-2 flex items-center gap-2 sm:gap-4">
          <Logo />

          <div className="hidden lg:flex flex-1 max-w-md ml-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Buscar desafios, empresas, palpiteiros…"
                className="w-full h-10 pl-9 pr-4 rounded-full bg-card border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
            </div>
          </div>

          <div className="flex-1 lg:hidden" />

          <div className="flex items-center gap-2 sm:gap-3">
            <TokenPill />
            <button className="hidden sm:grid h-9 w-9 place-items-center rounded-full bg-card border border-border/60 hover:border-primary/60 transition">
              <Bell className="h-4 w-4" />
            </button>
            <Link
              to="/criar"
              className="hidden sm:inline-flex items-center gap-2 h-10 px-4 rounded-full bg-gradient-brand text-primary-foreground font-bold text-sm shadow-glow hover:scale-[1.02] transition"
            >
              <Plus className="h-4 w-4" />
              Criar desafio
            </Link>
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="hidden sm:inline-flex items-center gap-2 h-10 px-3 rounded-full bg-card border border-border/60 hover:border-primary/60 text-sm font-semibold transition"
                >
                  <UserIcon className="h-4 w-4" /> Dashboard
                </Link>
                <button
                  onClick={() => signOut()}
                  className="hidden sm:grid h-9 w-9 place-items-center rounded-full bg-card border border-border/60 hover:border-destructive/60 hover:text-destructive transition"
                  aria-label="Sair"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="hidden sm:inline-flex items-center gap-2 h-10 px-4 rounded-full bg-card border border-border/60 hover:border-primary/60 text-sm font-semibold transition"
                >
                  <LogIn className="h-4 w-4" /> Entrar
                </Link>
                <Link
                  to="/auth"
                  search={{ mode: "signup" }}
                  className="hidden sm:inline-flex items-center gap-2 h-10 px-4 rounded-full border-2 border-gold text-gold bg-gold/5 hover:bg-gold/10 text-sm font-bold transition"
                >
                  Cadastre-se
                </Link>
              </>

            )}

            {/* Hamburger - mobile only */}
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button
                  className="md:hidden h-9 w-9 grid place-items-center rounded-full bg-card border border-border/60 hover:border-primary/60 transition"
                  aria-label="Abrir menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-sm bg-background p-0 overflow-y-auto">
                <div className="p-5 border-b border-border/60">
                  {user ? (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-brand grid place-items-center text-primary-foreground font-bold">
                        {(user.email || "U")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{user.email}</div>
                        <div className="text-[11px] text-muted-foreground">Bem-vindo de volta</div>
                      </div>
                    </div>
                  ) : (
                    <SheetClose asChild>
                      <Link
                        to="/auth"
                        className="flex items-center justify-center gap-2 h-11 rounded-full bg-gradient-brand text-primary-foreground font-bold text-sm shadow-glow"
                      >
                        <LogIn className="h-4 w-4" /> Entrar / Cadastrar
                      </Link>
                    </SheetClose>
                  )}
                </div>

                {user && (
                  <div className="p-3 border-b border-border/60 grid grid-cols-2 gap-2">
                    <SheetClose asChild>
                      <Link
                        to="/dashboard"
                        className="flex items-center justify-center gap-2 h-11 rounded-lg bg-gradient-brand text-primary-foreground text-sm font-bold shadow-glow"
                      >
                        <LayoutDashboard className="h-4 w-4" /> Dashboard
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        to="/perfil"
                        className="flex items-center justify-center gap-2 h-11 rounded-lg border border-border/60 text-sm font-semibold hover:border-primary/60"
                      >
                        <UserIcon className="h-4 w-4" /> Perfil
                      </Link>
                    </SheetClose>
                  </div>
                )}

                <nav className="p-3 space-y-1">
                  {visibleNav.map(({ to, label, icon: Icon }) => {
                    const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
                    return (
                      <SheetClose asChild key={to}>
                        <Link
                          to={to}
                          className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition ${
                            active
                              ? "bg-gradient-brand text-primary-foreground shadow-glow"
                              : "text-muted-foreground hover:text-foreground hover:bg-card"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {label}
                        </Link>
                      </SheetClose>
                    );
                  })}
                </nav>

                {user && (
                  <div className="p-3 border-t border-border/60">
                    <button
                      onClick={() => { setMenuOpen(false); signOut(); }}
                      className="w-full flex items-center justify-center gap-2 h-11 rounded-lg border border-destructive/40 text-destructive text-sm font-bold hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" /> Sair
                    </button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>


      <div className="max-w-7xl mx-auto px-4 pb-24 md:pb-12 md:flex md:gap-8 pt-6">
        {!hidePrimarySidebar && (
          <aside className="hidden md:block w-60 shrink-0">
            <nav className="sticky top-24 space-y-1">
              {NAV.filter((n) => !n.adminOnly || (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()))).map(({ to, label, icon: Icon }) => {
                const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
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
              <div className="mt-6 p-4 rounded-2xl glass-card">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gold font-bold">
                  <Flame className="h-4 w-4" /> Profeta da Copa
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Acerte palpites improváveis e ganhe um selo dourado. Compartilhe com seus amigos.
                </p>
              </div>
              <LiveUsersBadge />
            </nav>
          </aside>
        )}

        <main className="flex-1 min-w-0">{children}</main>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 backdrop-blur-xl bg-background/90 border-t border-border/60">
        <div className="grid grid-cols-5">
          {MOBILE_NAV.slice(0, 2).map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center justify-center py-3 text-[10px] gap-1 ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
          <Link
            to="/criar"
            className="flex items-center justify-center -mt-6"
            aria-label="Criar desafio"
          >
            <span className="h-14 w-14 rounded-full bg-gradient-brand grid place-items-center shadow-glow text-primary-foreground">
              <Plus className="h-6 w-6" />
            </span>
          </Link>
          {MOBILE_NAV.slice(2).map(({ to, label, icon: Icon }) => {
            const active = pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center justify-center py-3 text-[10px] gap-1 ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
