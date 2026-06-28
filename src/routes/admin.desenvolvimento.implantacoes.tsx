import { createFileRoute } from "@tanstack/react-router";
import { DevelopmentPlaceholderPage } from "@/components/desenvolvimento/DevelopmentPlaceholderPage";

export const Route = createFileRoute("/admin/desenvolvimento/implantacoes")({
  component: () => <DevelopmentPlaceholderPage pageKey="implantacoes" />,
});
