import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { PlaceholderPage } from "@/components/admin/PlaceholderPage";

export const Route = createFileRoute("/admin/notificacoes")({
  component: () => (
    <PlaceholderPage
      icon={Bell}
      title="Notificações"
      description="Envio de notificações gerais ou segmentadas, com agendamento."
      phase="Fase 6"
      features={[
        "Notificação geral ou segmentada",
        "Envio para todos, usuários específicos ou empresas",
        "Agendamento imediato ou para data futura",
        "Histórico de envios",
      ]}
    />
  ),
});
