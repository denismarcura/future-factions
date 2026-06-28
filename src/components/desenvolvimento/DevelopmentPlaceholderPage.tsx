import { Link, useRouterState } from "@tanstack/react-router";
import { DEVELOPMENT_MODULE_NAME, DEVELOPMENT_ROUTES } from "@/lib/desenvolvimento";
import type { DevelopmentRouteKey } from "@/lib/desenvolvimento";

type Props = {
  pageKey: DevelopmentRouteKey;
};

export function DevelopmentPlaceholderPage({ pageKey }: Props) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const current =
    DEVELOPMENT_ROUTES.find((route) => route.key === pageKey) ?? DEVELOPMENT_ROUTES[0];

  return (
    <section className="space-y-6">
      <nav className="text-xs text-muted-foreground" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link to="/admin" className="hover:text-primary">
              Admin
            </Link>
          </li>
          <li>/</li>
          <li>{DEVELOPMENT_MODULE_NAME}</li>
          <li>/</li>
          <li className="font-semibold text-foreground">{current.label}</li>
        </ol>
      </nav>

      <header className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
          {DEVELOPMENT_MODULE_NAME}
        </p>
        <h2 className="text-2xl font-display font-black">{current.label}</h2>
        <p className="max-w-3xl text-sm text-muted-foreground">{current.description}</p>
      </header>

      <nav className="flex flex-wrap gap-2" aria-label="Navegação do módulo Desenvolvimento">
        {DEVELOPMENT_ROUTES.map((route) => {
          const active = pathname === route.path;
          return (
            <Link
              key={route.key}
              to={route.path}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {route.label}
            </Link>
          );
        })}
      </nav>

      <main className="min-h-[320px] rounded-2xl border border-dashed border-border/70 p-6">
        <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-primary">
            Em desenvolvimento
          </p>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Estrutura visual reservada para a Sprint 0.1. Esta tela ainda não possui integração,
            dados, filtros, tabelas, cards, formulários ou gráficos.
          </p>
        </div>
      </main>
    </section>
  );
}
