import { createFileRoute } from "@tanstack/react-router";
import { FileBarChart } from "lucide-react";
import { PlaceholderPage } from "@/components/admin/PlaceholderPage";

export const Route = createFileRoute("/admin/relatorios")({
  component: () => (
    <PlaceholderPage
      icon={FileBarChart}
      title="Relatórios"
      description="Exportação de relatórios em Excel, CSV e PDF."
      phase="Fase 8"
      features={[
        "Relatório de usuários",
        "Relatório de empresas",
        "Relatório de desafios",
        "Relatório de tokens",
        "Relatório de prêmios",
        "Relatório de participações",
      ]}
    />
  ),
});
