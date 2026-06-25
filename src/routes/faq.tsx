import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { HelpCircle } from "lucide-react";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Desafio dos Palpites" },
      { name: "description", content: "Tire suas dúvidas sobre tokens, prêmios, desafios e como ganhar." },
    ],
  }),
  component: FAQPage,
});

const FAQ: { q: string; a: string }[] = [
  { q: "Preciso pagar para participar?", a: "Não. O Desafio dos Palpites é 100% gratuito. Toda a economia roda em Tokens virtuais." },
  { q: "Os Tokens valem dinheiro?", a: "Não. Tokens não têm valor monetário e não podem ser convertidos em dinheiro. Você troca por prêmios reais no Shop." },
  { q: "Como ganho Tokens?", a: "Acertando palpites, criando desafios, cumprindo missões diárias/semanais/mensais, indicando amigos e participando de eventos." },
  { q: "Como funciona o Shop de Prêmios?", a: "Você acumula Tokens e troca por produtos reais (smartphones, vouchers, eletrônicos, brindes parceiros). Quanto mais Tokens, melhores os prêmios." },
  { q: "Posso criar um desafio entre amigos?", a: "Sim. Você cria desafios privados e convida apenas quem quiser. Funciona como uma palpite entre amigos — só que sem dinheiro real." },
  { q: "Sou empresa, posso criar desafios?", a: "Sim! Empresas oferecem prêmios (combos, brindes, vouchers) e ganham visibilidade. Cadastre-se em /empresas." },
  { q: "O que é o Profeta da Copa?", a: "Um selo dourado concedido a quem acerta palpites improváveis. Aparece no seu perfil e impulsiona seu ranking." },
  { q: "Quantos Tokens ganho ao me cadastrar?", a: "1.000 Tokens grátis para começar a dar palpite imediatamente." },
];

function FAQPage() {
  return (
    <AppShell>
      <header className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-black flex items-center gap-3">
          <HelpCircle className="h-8 w-8 text-primary" /> Perguntas <span className="text-gradient-brand">frequentes</span>
        </h1>
        <p className="text-muted-foreground mt-1">Tudo que você precisa saber antes de começar.</p>
      </header>

      <div className="space-y-3 max-w-3xl">
        {FAQ.map((f, i) => (
          <details key={i} className="group rounded-2xl border border-border/60 bg-card p-5 open:border-primary/50 open:shadow-glow transition">
            <summary className="cursor-pointer font-display font-bold text-base flex items-center justify-between gap-4">
              {f.q}
              <span className="text-primary text-2xl leading-none transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
          </details>
        ))}
      </div>
    </AppShell>
  );
}
