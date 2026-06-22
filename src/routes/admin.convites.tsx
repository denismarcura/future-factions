import { createFileRoute } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { PlaceholderPage } from "@/components/admin/PlaceholderPage";

export const Route = createFileRoute("/admin/convites")({
  component: () => (
    <PlaceholderPage
      icon={UserPlus}
      title="Convites"
      description="Acompanhe quem convidou quem e os tokens gerados por indicação."
      phase="Fase 6"
      features={[
        "Listagem de quem convidou e quem foi convidado",
        "Tokens gerados por indicação",
        "Filtros por data e usuário",
        "Ranking de melhores indicadores",
      ]}
    />
  ),
});
