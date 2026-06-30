import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { DevelopmentPlaceholderPage } from "@/components/desenvolvimento/DevelopmentPlaceholderPage";

export const Route = createFileRoute("/admin/desenvolvimento")({
  head: () => ({
    meta: [{ title: "Desenvolvimento · Admin" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: DevelopmentRoute,
});

function DevelopmentRoute() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (pathname === "/admin/desenvolvimento") {
    return <DevelopmentPlaceholderPage pageKey="dashboard" />;
  }

  return <Outlet />;
}
