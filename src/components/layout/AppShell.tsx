import { Link, useRouterState } from "@tanstack/react-router";
import {
  Flame,
  Home,
  Trophy,
  Target,
  User as UserIcon,
  Plus,
  Search,
  Coins,
  Bell,
  Rocket,
} from "lucide-react";
import type { ReactNode } from "react";
import { CURRENT_USER, formatTokens } from "@/lib/mock-data";

const NAV = [
  { to: "/", label: "Feed", icon: Home },
  { to: "/ranking", label: "Ranking", icon: Trophy },
  { to: "/missoes", label: "Missões", icon: Target },
  { to: "/perfil", label: "Perfil", icon: UserIcon },
];

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 group">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-brand blur-md opacity-60 group-hover:opacity-100 transition" />
        <div className="relative h-9 w-9 rounded-lg bg-gradient-brand grid place-items-center text-primary-foreground font-black">
          <Rocket className="h-5 w-5" />
        </div>
      </div>
      <div className="leading-none">
        <div className="font-display font-black text-sm tracking-tight">
          EU ACHO QUE <span className="text-gradient-brand">VAI DAR</span>{" "}
          <span className="text-destructive">@#&amp;</span>
        </div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-0.5">
          Beta · Aposte com seus amigos
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

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background bg-radial-brand">
      {/* Top bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <Logo />

          <div className="hidden md:flex flex-1 max-w-md ml-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Buscar previsões, categorias, profetas…"
                className="w-full h-10 pl-9 pr-4 rounded-full bg-card border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
            </div>
          </div>

          <div className="flex-1 md:hidden" />

          <div className="flex items-center gap-3">
            <TokenPill />
            <button className="h-9 w-9 grid place-items-center rounded-full bg-card border border-border/60 hover:border-primary/60 transition">
              <Bell className="h-4 w-4" />
            </button>
            <Link
              to="/criar"
              className="hidden sm:inline-flex items-center gap-2 h-10 px-4 rounded-full bg-gradient-brand text-primary-foreground font-bold text-sm shadow-glow hover:scale-[1.02] transition"
            >
              <Plus className="h-4 w-4" />
              Criar previsão
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 pb-24 md:pb-12 md:flex md:gap-8 pt-6">
        {/* Sidebar */}
        <aside className="hidden md:block w-56 shrink-0">
          <nav className="sticky top-24 space-y-1">
            {NAV.map(({ to, label, icon: Icon }) => {
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
                Acerte previsões improváveis e ganhe um selo dourado. Compartilhe com seus amigos.
              </p>
            </div>
          </nav>
        </aside>

        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 backdrop-blur-xl bg-background/85 border-t border-border/60">
        <div className="grid grid-cols-5">
          {NAV.slice(0, 2).map(({ to, label, icon: Icon }) => {
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
            aria-label="Criar previsão"
          >
            <span className="h-14 w-14 rounded-full bg-gradient-brand grid place-items-center shadow-glow text-primary-foreground">
              <Plus className="h-6 w-6" />
            </span>
          </Link>
          {NAV.slice(2).map(({ to, label, icon: Icon }) => {
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
