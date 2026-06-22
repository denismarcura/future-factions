import { createFileRoute, Link } from "@tanstack/react-router";
import { USERS } from "@/lib/mock-data";
import { COMPANIES } from "@/lib/mock-extra";
import { Users, KeyRound, Mail, TrendingUp, Building2, Coins, Trophy } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const totalTokens = USERS.reduce((s, u) => s + u.tokens, 0);
  const stats = [
    { label: "Usuários cadastrados", value: USERS.length, icon: Users, to: "/admin/cadastros" },
    { label: "Empresas parceiras", value: COMPANIES.length, icon: Building2, to: "/admin/cadastros" },
    { label: "Tokens em circulação", value: totalTokens.toLocaleString("pt-BR"), icon: Coins },
    { label: "Acertos totais", value: USERS.reduce((s, u) => s + u.acertos, 0).toLocaleString("pt-BR"), icon: TrendingUp },
  ];

  const shortcuts = [
    { to: "/admin/apuracao-copa", title: "Apuração da Copa", desc: "IA + FIFA atualizam placares e liberam tokens automaticamente.", icon: Trophy },
    { to: "/admin/cadastros", title: "Cadastros", desc: "Veja todos os usuários, indicações, tokens e estatísticas.", icon: Users },
    { to: "/admin/apis", title: "Cadastro de APIs", desc: "Configure ChatGPT, Resend e Maritaca.", icon: KeyRound },
    { to: "/admin/email-marketing", title: "E-mail Marketing", desc: "Disparos inteligentes por preferência usando IA.", icon: Mail },
  ];

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, to }) => {
          const card = (
            <div className="glass-card rounded-2xl p-5 hover:border-primary/40 transition h-full">
              <Icon className="h-5 w-5 text-primary" />
              <div className="mt-3 text-2xl font-display font-black tabular-nums">{value}</div>
              <div className="text-xs text-muted-foreground mt-1">{label}</div>
            </div>
          );
          return to ? <Link key={label} to={to}>{card}</Link> : <div key={label}>{card}</div>;
        })}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {shortcuts.map(({ to, title, desc, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="glass-card rounded-2xl p-6 hover:border-primary/60 transition group"
          >
            <div className="h-10 w-10 rounded-xl bg-primary/15 grid place-items-center mb-3 group-hover:bg-primary/25 transition">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-display font-bold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
