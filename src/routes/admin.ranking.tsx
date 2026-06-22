import { createFileRoute } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { PlaceholderPage } from "@/components/admin/PlaceholderPage";

export const Route = createFileRoute("/admin/ranking")({
  component: () => (
    <PlaceholderPage
      icon={Trophy}
      title="Ranking"
      description="Gestão de ranking semanal e mensal com premiações e medalhas."
      phase="Fase 3"
      features={[
        "Critérios de pontuação",
        "Premiações por posição",
        "Medalhas (ouro, prata, bronze)",
        "Períodos (semanal / mensal)",
        "Ranking completo e histórico",
      ]}
    />
  ),
});
