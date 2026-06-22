import { createFileRoute } from "@tanstack/react-router";
import { Gift } from "lucide-react";
import { PlaceholderPage } from "@/components/admin/PlaceholderPage";

export const Route = createFileRoute("/admin/bonus-login")({
  component: () => (
    <PlaceholderPage
      icon={Gift}
      title="Bônus de Login"
      description="Configuração da recompensa diária por sequência de acessos (Dia 1 ao Dia 30)."
      phase="Fase 2"
      features={[
        "Tabela editável dia 1 → 30 com tokens de cada dia",
        "Regras de reinício de sequência",
        "KPIs: usuários ativos hoje e sequência média",
        "Histórico de claims paginado",
        "Top streaks (maiores sequências ativas)",
      ]}
    />
  ),
});
