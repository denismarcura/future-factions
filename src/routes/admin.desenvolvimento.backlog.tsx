import { createFileRoute } from "@tanstack/react-router";
import { DevelopmentPlaceholderPage } from "@/components/desenvolvimento/DevelopmentPlaceholderPage";

export const Route = createFileRoute("/admin/desenvolvimento/backlog")({
  component: () => <DevelopmentPlaceholderPage pageKey="backlog" />,
});
