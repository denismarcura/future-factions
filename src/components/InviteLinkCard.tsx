import { useRef, useState } from "react";
import { Copy, Check, Share2, Gift, QrCode, Download } from "lucide-react";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";
import { useAuth } from "@/hooks/use-auth";
import { useInviteUrl } from "@/hooks/use-invite-url";

type Variant = "full" | "compact";

export function InviteLinkCard({ variant = "full", title }: { variant?: Variant; title?: string }) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const url = useInviteUrl(user);

  if (!user || !url) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  async function share() {
    const data = {
      title: "Desafio dos Palpites",
      text: "Vem dar palpites e ganhar prêmios comigo!",
      url,
    };
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share(data);
        return;
      } catch {
        /* user cancelled */
      }
    }
    copy();
  }

  if (variant === "compact") {
    return (
      <div className="rounded-xl border border-gold/40 bg-gold/5 p-3 flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Gift className="h-4 w-4 text-gold shrink-0" />
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground shrink-0">Seu link</span>
          <span className="font-mono text-xs truncate min-w-0">{url}</span>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={copy}
            className="h-9 px-3 rounded-lg bg-gradient-brand text-primary-foreground text-xs font-bold inline-flex items-center gap-1.5 shadow-glow"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copiado" : "Copiar"}
          </button>
          <button
            onClick={share}
            className="h-9 px-3 rounded-lg border border-gold/60 text-gold text-xs font-bold inline-flex items-center gap-1.5 hover:bg-gold/10"
          >
            <Share2 className="h-3.5 w-3.5" /> Compartilhar
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-2xl glass-card p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-gradient-brand grid place-items-center shadow-glow shrink-0">
          <Gift className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-xl font-black">{title ?? "Seu link de convite"}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Esse é seu link único. Ele leva para uma página com seus desafios abertos, suas participações e oportunidades.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <div className="flex-1 h-11 px-3 rounded-lg bg-background border border-border/60 flex items-center font-mono text-sm overflow-hidden">
              <span className="truncate">{url}</span>
            </div>
            <button
              onClick={copy}
              className="h-11 px-4 rounded-lg bg-gradient-brand text-primary-foreground font-bold inline-flex items-center gap-2 shadow-glow"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado!" : "Copiar link"}
            </button>
            <button
              onClick={share}
              className="h-11 px-4 rounded-lg border border-gold/60 text-gold font-bold inline-flex items-center gap-2 hover:bg-gold/10"
            >
              <Share2 className="h-4 w-4" /> Compartilhar
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
