import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CATEGORIES, USERS } from "@/lib/mock-data";
import { Mail, Sparkles, Send, Wand2, Users, Eye, Check } from "lucide-react";

export const Route = createFileRoute("/admin/email-marketing")({
  component: EmailMarketing,
});

const CAMPAIGNS = [
  {
    id: "c1",
    name: "Desafios de Futebol da Semana",
    audience: "Futebol",
    sent: 1240,
    opens: "62%",
    clicks: "27%",
    status: "Enviada",
  },
  {
    id: "c2",
    name: "Novos palpites de IA para você",
    audience: "Inteligência Artificial",
    sent: 540,
    opens: "58%",
    clicks: "31%",
    status: "Enviada",
  },
  {
    id: "c3",
    name: "Bitcoin acima de 200k? Solte seu palpite",
    audience: "Economia",
    sent: 0,
    opens: "—",
    clicks: "—",
    status: "Rascunho IA",
  },
];

function EmailMarketing() {
  const [audience, setAudience] = useState<string>("Futebol");
  const [tone, setTone] = useState<string>("Empolgado");
  const [prompt, setPrompt] = useState("");
  const [generated, setGenerated] = useState<{ subject: string; body: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const targetCount = useMemo(() => {
    // simulate audience size from mock users
    return Math.max(120, Math.floor((USERS.length * 17) % 950) + 80);
  }, []);

  function generate() {
    setLoading(true);
    setGenerated(null);
    setTimeout(() => {
      setGenerated({
        subject: `🔥 Novos desafios de ${audience} esperando seu palpite!`,
        body: `Olá, palpiteiro!\n\nSeparamos os desafios mais quentes de ${audience} que estão abertos agora. Acertou? Você ganha tokens, sobe no ranking e fica mais perto do prêmio dos seus sonhos.\n\n• 3 desafios em destaque\n• Recompensas em tokens turbinadas\n• Disputa direta entre amigos\n\n${prompt ? "Mensagem do admin: " + prompt + "\n\n" : ""}Bora dar seu palpite agora! 🚀\n\nEquipe Desafio dos Palpites`,
      });
      setLoading(false);
    }, 900);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Mail className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-display font-bold">E-mail Marketing Inteligente</h2>
      </div>

      <div className="glass-card rounded-2xl p-5 border-primary/20">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h3 className="font-display font-bold">Powered by ChatGPT</h3>
            <p className="text-sm text-muted-foreground mt-1">
              A IA monta e-mails personalizados de acordo com as preferências de cada usuário. Quem
              curte futebol recebe os desafios de futebol; quem curte cripto recebe os de cripto. E
              por aí vai.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h3 className="font-display font-bold flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" /> Nova campanha
          </h3>

          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Público-alvo (preferência)
            </span>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-lg bg-card border border-border/60 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Users className="h-3 w-3" /> ~{targetCount.toLocaleString("pt-BR")} usuários nesse
              segmento
            </div>
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Tom</span>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="mt-1 w-full h-10 px-3 rounded-lg bg-card border border-border/60 text-sm"
            >
              <option>Empolgado</option>
              <option>Formal</option>
              <option>Engraçado</option>
              <option>Provocador</option>
            </select>
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Instruções extras (opcional)
            </span>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Ex.: destacar o desafio do Flamengo x Palmeiras de domingo"
              className="mt-1 w-full px-3 py-2 rounded-lg bg-card border border-border/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
            />
          </label>

          <button
            onClick={generate}
            disabled={loading}
            className="w-full h-11 rounded-full bg-gradient-brand text-primary-foreground font-bold shadow-glow hover:scale-[1.01] transition inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" />
            {loading ? "Gerando com IA..." : "Gerar e-mail com IA"}
          </button>
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-3">
          <h3 className="font-display font-bold flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" /> Pré-visualização
          </h3>
          {!generated ? (
            <div className="text-sm text-muted-foreground border border-dashed border-border rounded-xl p-8 text-center">
              Gere um e-mail para visualizar aqui.
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Assunto
                </div>
                <div className="font-semibold">{generated.subject}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Corpo
                </div>
                <pre className="whitespace-pre-wrap text-sm bg-card/60 rounded-lg p-3 border border-border/60 font-sans">
{generated.body}
                </pre>
              </div>
              <button className="w-full h-10 rounded-full bg-card border border-primary/40 text-primary font-bold text-sm hover:bg-primary/10 transition inline-flex items-center justify-center gap-2">
                <Send className="h-4 w-4" /> Enviar para {targetCount.toLocaleString("pt-BR")}{" "}
                usuários
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border/60 flex items-center justify-between">
          <h3 className="font-display font-bold">Campanhas recentes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-3 font-semibold">Campanha</th>
                <th className="text-left p-3 font-semibold">Público</th>
                <th className="text-right p-3 font-semibold">Enviados</th>
                <th className="text-right p-3 font-semibold">Aberturas</th>
                <th className="text-right p-3 font-semibold">Cliques</th>
                <th className="text-left p-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {CAMPAIGNS.map((c) => (
                <tr key={c.id} className="border-t border-border/40">
                  <td className="p-3 font-semibold">{c.name}</td>
                  <td className="p-3 text-muted-foreground">{c.audience}</td>
                  <td className="p-3 text-right tabular-nums">
                    {c.sent.toLocaleString("pt-BR")}
                  </td>
                  <td className="p-3 text-right tabular-nums">{c.opens}</td>
                  <td className="p-3 text-right tabular-nums">{c.clicks}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                        c.status === "Enviada"
                          ? "bg-primary/15 text-primary border-primary/30"
                          : "bg-gold/15 text-gold border-gold/30"
                      }`}
                    >
                      {c.status === "Enviada" && <Check className="inline h-3 w-3 mr-1" />}
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
