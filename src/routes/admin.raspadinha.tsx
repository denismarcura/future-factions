import { createFileRoute } from "@tanstack/react-router";
import { Sparkle } from "lucide-react";
import { PlaceholderPage } from "@/components/admin/PlaceholderPage";

export const Route = createFileRoute("/admin/raspadinha")({
  component: () => (
    <PlaceholderPage
      icon={Sparkle}
      title="Raspadinha"
      description="Mini-jogo de recompensas com probabilidades e limite diário."
      phase="Fase 4"
      features={[
        "Ativar/desativar",
        "Configuração de probabilidades e prêmios",
        "Limite diário por usuário",
        "Quantidade utilizada e tokens distribuídos",
      ]}
    />
  ),
});
