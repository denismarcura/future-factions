import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Coins, Target, Mail, MessageCircle, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { whatsappLink } from "@/lib/friends";

export function EarnMorePointsCTA() {
  const [userId, setUserId] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? ""));
  }, []);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const inviteUrl = userId ? `${origin}/auth?ref=${userId}` : `${origin}/auth`;
  const code = userId ? userId.slice(0, 8).toUpperCase() : "";

  const waMsg = `🎯 Vem palpitar comigo no Desafio dos Palpites! 100% grátis, só tokens. Use meu link e ganhe tokens de boas-vindas: ${inviteUrl}`;
  const emailSubject = "Vem palpitar comigo no Desafio dos Palpites";
  const emailBody = `Oi! Tô participando do Desafio dos Palpites — 100% grátis, só tokens.\n\nUsa meu link pra ganhar tokens de boas-vindas:\n${inviteUrl}\n\nQualquer dúvida me chama.`;
  const mailto = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${waMsg}`);
      setCopied(true);
      toast.success("Link de indicação copiado! Cole no seu WhatsApp.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar. Copie manualmente.");
    }
  }

  return (
    <section className="rounded-2xl border-2 border-gold/50 bg-gradient-to-br from-gold/10 via-card to-card p-5 space-y-4">
      <header className="flex items-center gap-2">
        <Coins className="h-5 w-5 text-gold" />
        <h2 className="font-display font-black text-base uppercase tracking-wide text-gold">
          Ganhe mais pontos para dar palpites
        </h2>
      </header>
      <p className="text-xs text-muted-foreground">
        Acumule tokens e troque por <strong className="text-gold">Tokens Palpite</strong> no Dashboard
        (100 TKN = 1 Token Palpite).
      </p>

      <div className="grid sm:grid-cols-2 gap-2.5">
        <Link
          to="/missoes"
          className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/60 hover:border-primary/60 transition"
        >
          <Target className="h-5 w-5 text-primary shrink-0" />
          <div className="min-w-0">
            <div className="font-display font-bold text-sm">Siga as missões</div>
            <div className="text-[11px] text-muted-foreground">Curta, siga e inscreva para ganhar TKN</div>
          </div>
        </Link>

        <a
          href={mailto}
          className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/60 hover:border-primary/60 transition"
        >
          <Mail className="h-5 w-5 text-primary shrink-0" />
          <div className="min-w-0">
            <div className="font-display font-bold text-sm">Convide amigos por e-mail</div>
            <div className="text-[11px] text-muted-foreground">+200 TKN por amigo cadastrado</div>
          </div>
        </a>

        <a
          href={whatsappLink(undefined, waMsg)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/60 hover:border-emerald-500/60 transition"
        >
          <MessageCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <div className="font-display font-bold text-sm">Convide pelo WhatsApp</div>
            <div className="text-[11px] text-muted-foreground">Compartilhe seu link de indicação</div>
          </div>
        </a>

        <button
          onClick={copyLink}
          className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/60 hover:border-gold/60 transition text-left"
        >
          {copied ? (
            <Check className="h-5 w-5 text-emerald-400 shrink-0" />
          ) : (
            <Copy className="h-5 w-5 text-gold shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <div className="font-display font-bold text-sm">
              {copied ? "Copiado!" : "Copiar código de indicação"}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              {code ? `Código: ${code}` : "Cole no seu WhatsApp"}
            </div>
          </div>
        </button>
      </div>
    </section>
  );
}
