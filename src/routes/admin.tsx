import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Users, KeyRound, Mail, LayoutDashboard, Shield } from "lucide-react";

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
  { to: "/admin/apis", label: "Cadastro de APIs", icon: KeyRound },
  { to: "/admin/email-marketing", label: "E-mail Marketing", icon: Mail },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
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
