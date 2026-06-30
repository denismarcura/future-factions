import { createFileRoute } from "@tanstack/react-router";
import { DevelopmentPlaceholderPage } from "@/components/desenvolvimento/DevelopmentPlaceholderPage";

export const Route = createFileRoute("/admin/desenvolvimento/base-conhecimento")({
  component: () => <DevelopmentPlaceholderPage pageKey="base-conhecimento" />,
});
