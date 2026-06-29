import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import nodemailer from "nodemailer";

const InviteInput = z.object({
  recipients: z.array(z.string().trim().email()).min(1).max(50),
  subject: z.string().trim().min(1).max(200),
  intro: z.string().trim().min(1).max(2000),
  inviteUrl: z.string().trim().url().max(400),
  senderName: z.string().trim().min(1).max(120),
});

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildInviteHtml(opts: { intro: string; inviteUrl: string; senderName: string }) {
  const introHtml = escapeHtml(opts.intro).replace(/\n/g, "<br/>");
  const url = escapeHtml(opts.inviteUrl);
  return `<!doctype html><html lang="pt-br"><head><meta charset="utf-8"><title>Convite</title></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:24px 0"><tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0f172a;border-radius:20px;overflow:hidden;border:1px solid #1f2937">
    <tr><td style="background:linear-gradient(135deg,#facc15,#f59e0b);padding:28px;text-align:center">
      <div style="font-size:12px;letter-spacing:3px;color:#020617;font-weight:900">DESAFIO DOS PALPITES</div>
      <div style="font-size:24px;font-weight:900;color:#020617;margin-top:6px">🏆 Você foi convidado(a)!</div>
    </td></tr>
    <tr><td style="padding:28px 24px;color:#e2e8f0;font-size:15px;line-height:1.6">
      <div>${introHtml}</div>
      <div style="text-align:center;margin:28px 0">
        <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#facc15,#f59e0b);color:#020617;font-weight:900;padding:16px 32px;border-radius:999px;text-decoration:none;font-size:16px">👉 Criar minha conta grátis</a>
      </div>
      <div style="font-size:12px;color:#94a3b8;text-align:center;margin-top:8px">
        Ou copie e cole este link no navegador:<br/>
        <a href="${url}" style="color:#fde047;word-break:break-all">${url}</a>
      </div>
      <div style="margin-top:28px;font-size:13px;color:#cbd5e1">Abraço,<br/><b style="color:#fff">${escapeHtml(opts.senderName)}</b></div>
    </td></tr>
    <tr><td style="background:#0b1220;padding:16px;text-align:center;font-size:11px;color:#64748b">
      Desafio dos Palpites — palpites, tokens e prêmios entre amigos.
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

function readSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "465");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;
  const secure = String(process.env.SMTP_SECURE ?? "true").toLowerCase() === "true";

  if (!host || !port || !user || !pass || !from) {
    throw new Error("Configuração SMTP incompleta.");
  }

  return { host, port, secure, user, pass, from };
}

function logSmtpDiagnostics(smtp: ReturnType<typeof readSmtpConfig>) {
  console.log("SMTP_HOST", smtp.host ? "OK" : "MISSING");
  console.log("SMTP_PORT", smtp.port);
  console.log("SMTP_SECURE", smtp.secure);
  console.log("SMTP_USER", smtp.user || "MISSING");
  console.log("SMTP_PASS", smtp.pass ? "OK" : "MISSING");
  console.log("SMTP_FROM", smtp.from || "MISSING");
}

function logNodemailerError(error: unknown) {
  if (error instanceof Error) {
    console.error("smtp invite send failed error", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(typeof error === "object" ? error : {}),
    });
    return;
  }

  console.error("smtp invite send failed error", error);
}

export const sendFriendInviteEmails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InviteInput.parse(input))
  .handler(async ({ data }) => {
    const html = buildInviteHtml({
      intro: data.intro,
      inviteUrl: data.inviteUrl,
      senderName: data.senderName,
    });
    const smtp = readSmtpConfig();
    logSmtpDiagnostics(smtp);

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });

    let sent = 0;
    const failed: string[] = [];

    for (const to of data.recipients) {
      try {
        await transporter.sendMail({
          from: smtp.from,
          to,
          subject: data.subject,
          html,
        });
        sent++;
      } catch (error) {
        console.error("smtp invite send failed recipient", to);
        logNodemailerError(error);
        failed.push(to);
      }
    }

    return { ok: failed.length === 0, sent, failed };
  });
