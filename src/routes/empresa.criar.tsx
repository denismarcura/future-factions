import { createFileRoute } from "@tanstack/react-router";
import { Criar } from "./criar";

export const Route = createFileRoute("/empresa/criar")({
  head: () => ({
    meta: [
      { title: "Cadastro de Desafio Empresa — Desafio dos Palpites" },
      { name: "description", content: "Empresas criam desafios com missões obrigatórias de redes sociais." },
    ],
  }),
  component: () => <Criar forCompany />,
});
