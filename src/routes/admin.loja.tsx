import { createFileRoute } from "@tanstack/react-router";
import { Store } from "lucide-react";
import { PlaceholderPage } from "@/components/admin/PlaceholderPage";

export const Route = createFileRoute("/admin/loja")({
  component: () => (
    <PlaceholderPage
      icon={Store}
      title="Loja de Prêmios"
      description="Produtos resgatáveis com tokens, controle de estoque e aprovação de resgates."
      phase="Fase 5"
      features={[
        "Cadastro de produtos (imagem, estoque, custo em tokens)",
        "Aprovar / rejeitar resgates",
        "Controle de estoque",
        "Histórico de resgates",
      ]}
    />
  ),
});
