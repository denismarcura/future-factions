import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { PlaceholderPage } from "@/components/admin/PlaceholderPage";

export const Route = createFileRoute("/admin/seguranca")({
  component: () => (
    <PlaceholderPage
      icon={ShieldAlert}
      title="Segurança / Logs"
      description="Logs completos de auditoria com usuário, data, hora, IP e ação executada."
      phase="Fase 9"
      features={[
        "Logs de login",
        "Alterações de cadastro",
        "Distribuição de tokens",
        "Aprovações e rejeições",
        "Exclusões",
        "Registro com usuário, data/hora, IP e ação",
      ]}
    />
  ),
});
