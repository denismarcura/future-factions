import { createFileRoute } from "@tanstack/react-router";
import { CommunicationAdminPage } from "@/components/admin/communication/CommunicationAdminPage";

export const Route = createFileRoute("/admin/comunicacao/smtp")({
  component: () => <CommunicationAdminPage page="smtp" />,
});
