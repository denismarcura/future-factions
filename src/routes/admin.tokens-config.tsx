import { createFileRoute } from "@tanstack/react-router";
import { Coins } from "lucide-react";
import { PlaceholderPage } from "@/components/admin/PlaceholderPage";

export const Route = createFileRoute("/admin/tokens-config")({
  component: () => (
    <PlaceholderPage
      icon={Coins}
      title="Configurações de Tokens"
      description="Parametrização de tokens por ação, sem necessidade de programação."
      phase="Fase 7"
      features={[
        "Tokens por cadastro",
        "Tokens por convite",
        "Tokens por acerto",
        "Tokens por missão",
        "Tokens por raspadinha",
        "Tokens por login diário",
      ]}
    />
  ),
});
