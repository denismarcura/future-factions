import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mail, Send, Copy, Check, ArrowLeft, Users, Sparkles, Eye, Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { useInviteUrl } from "@/hooks/use-invite-url";
import { sendFriendInviteEmails } from "@/lib/friend-invite-emails.functions";




export const Route = createFileRoute("/convidar-amigos")({
  head: () => ({
    meta: [
      { title: "Convidar amigos por e-mail — EU ACHO QUE VAI DAR @#&" },
      { name: "description", content: "Envie um e-mail bonito para seus amigos e ganhe TOKENS por cada cadastro." },
    ],
  }),
  component: ConvidarAmigos,
});

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseEmails(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[\s,;]+/)
        .map((s) => s.trim().toLowerCase())
        .filter((s) => EMAIL_RX.test(s))
    )
  );
}

function ConvidarAmigos() {
  const { user } = useAuth();
  const inviteUrl = useInviteUrl(user) ?? "";
  const fullName = (user?.user_metadata as any)?.full_name || (user?.user_metadata as any)?.name || user?.email || "Seu amigo";

  const [raw, setRaw] = useState("");
  const [subject, setSubject] = useState("Vem dar palpites comigo no Desafio dos Palpites 🏆");
  const [intro, setIntro] = useState(
    `Oi! Eu tô curtindo muito o Desafio dos Palpites — dá pra ganhar TOKENS, prêmios e desafiar amigos com seus palpites.\n\nUse meu link e a gente sobe o ranking juntos 👇`,
  );
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState(false);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const sendInvites = useServerFn(sendFriendInviteEmails);

  const emails = useMemo(() => parseEmails(raw), [raw]);
  const invalidCount = useMemo(() => {
    const tokens = raw.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
    return tokens.filter((t) => !EMAIL_RX.test(t.toLowerCase())).length;
  }, [raw]);

  const body = `${intro}\n\n👉 ${inviteUrl}\n\nAbraço,\n${fullName}`;

  async function send() {
    if (emails.length === 0) {
      toast.error("Adicione pelo menos um e-mail válido.");
      return;
    }
    if (!inviteUrl) {
      toast.error("Faça login para gerar seu link de convite.");
      return;
    }
    setSending(true);
    try {
      const res = await sendInvites({
        data: {
          recipients: emails,
          subject,
          intro,
          inviteUrl,
          senderName: fullName,
        },
      });
      setSent(true);
      if (res.sent > 0) {
        toast.success(`✅ ${res.sent} convite(s) enviado(s) com o link no corpo do e-mail!`);
      }
      if (res.failed.length > 0) {
        toast.error(`Falha em ${res.failed.length}: ${res.failed.join(", ")}`);
      }
    } catch (e: any) {
      console.error("sendFriendInviteEmails failed", e);
      const msg = e?.message || e?.toString?.() || "erro desconhecido";
      toast.error(`Não foi possível enviar os e-mails: ${msg}`);
    } finally {
      setSending(false);
    }
  }


  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(`${subject}\n\n${body}`);
      setCopied(true);
      toast.success("Mensagem copiada!");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  function removeEmail(e: string) {
    const next = emails.filter((x) => x !== e).join("\n");
    setRaw(next);
  }

  function addFromInput(value: string) {
    const merged = `${raw}\n${value}`.trim();
    setRaw(merged);
  }

  return (
    <AppShell>
      <div className="mb-4">
        <Link to="/perfil" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao perfil
        </Link>
      </div>

      <section className="rounded-3xl glass-card p-6 sm:p-8 mb-6 relative overflow-hidden">
        <div className="absolute -top-16 -right-10 h-56 w-56 rounded-full bg-primary/30 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-brand grid place-items-center shadow-glow shrink-0">
            <Mail className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-primary font-bold">
              <Sparkles className="h-3.5 w-3.5" /> E-mail marketing
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-black">Convidar amigos por e-mail</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Monte um e-mail bonito, adicione vários endereços e envie tudo de uma vez pelo seu cliente de e-mail. Você
              ganha TOKENS a cada cadastro feito pelo seu link.
            </p>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-5">
          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              <Users className="inline h-3.5 w-3.5 mr-1" /> E-mails dos amigos
            </label>
            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              rows={5}
              placeholder={"Cole vários e-mails separados por vírgula, ponto-e-vírgula ou linha:\nana@email.com\njoao@email.com, maria@email.com"}
              className="w-full rounded-xl bg-background border border-border/60 p-3 text-sm font-mono focus:border-primary outline-none resize-y"
            />
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {emails.length} válido(s){invalidCount > 0 ? ` · ${invalidCount} inválido(s) ignorado(s)` : ""}
              </span>
              <QuickAdd onAdd={addFromInput} />
            </div>
            {emails.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {emails.map((e) => (
                  <span
                    key={e}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/30"
                  >
                    {e}
                    <button onClick={() => removeEmail(e)} aria-label={`Remover ${e}`} className="hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Assunto</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full h-11 rounded-xl bg-background border border-border/60 px-3 text-sm focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Mensagem</label>
              <textarea
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                rows={6}
                className="w-full rounded-xl bg-background border border-border/60 p-3 text-sm focus:border-primary outline-none resize-y"
              />
              <p className="mt-2 text-[11px] text-muted-foreground">
                Seu link de convite e sua assinatura são adicionados automaticamente ao final do e-mail.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={send}
              disabled={emails.length === 0 || sending}
              className="inline-flex items-center gap-2 h-12 px-5 rounded-xl bg-gradient-brand text-primary-foreground font-display font-black shadow-glow disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? "Enviando..." : `Enviar para ${emails.length || 0} amigo(s)`}
            </button>
            <button
              onClick={copyMessage}
              className="inline-flex items-center gap-2 h-12 px-5 rounded-xl border border-gold/60 text-gold font-bold hover:bg-gold/10"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado!" : "Copiar mensagem"}
            </button>
            <button
              onClick={() => setPreview((v) => !v)}
              className="inline-flex items-center gap-2 h-12 px-5 rounded-xl border border-border/60 text-foreground font-bold hover:bg-muted"
            >
              <Eye className="h-4 w-4" /> {preview ? "Ocultar prévia" : "Ver prévia"}
            </button>
          </div>

          {sent && (
            <div className="rounded-xl border border-success/40 bg-success/10 text-success p-3 text-sm font-semibold">
              ✅ Convites enviados! Seus amigos vão receber um e-mail HTML com o botão e o link de cadastro destacados.
            </div>
          )}

          {preview && (
            <div className="rounded-2xl border border-border/60 bg-background p-5">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Prévia do e-mail</div>
              <div className="text-sm font-bold mb-3">{subject}</div>
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">{body}</pre>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-gold/40 bg-gold/5 p-5">
            <div className="text-xs uppercase tracking-wider font-bold text-gold mb-1">Seu link</div>
            <div className="font-mono text-xs break-all">{inviteUrl || "Faça login para gerar seu link."}</div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-5 text-sm space-y-2">
            <div className="font-bold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Dicas</div>
            <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
              <li>Use o BCC (cópia oculta) — protege a privacidade dos seus amigos.</li>
              <li>Personalize a mensagem para parecer mais humano.</li>
              <li>Cada cadastro confirmado pelo seu link rende TOKENS extras.</li>
              <li>Evite enviar mais de 50 e-mails por vez para não cair em spam.</li>
            </ul>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function QuickAdd({ onAdd }: { onAdd: (v: string) => void }) {
  const [v, setV] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!v.trim()) return;
        onAdd(v);
        setV("");
      }}
      className="inline-flex items-center gap-1"
    >
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder="adicionar um e-mail"
        className="h-7 px-2 rounded-md bg-background border border-border/60 text-[11px] w-40 focus:border-primary outline-none"
      />
      <button type="submit" className="h-7 px-2 rounded-md bg-primary text-primary-foreground text-[11px] font-bold inline-flex items-center gap-1">
        <Plus className="h-3 w-3" /> add
      </button>
    </form>
  );
}
