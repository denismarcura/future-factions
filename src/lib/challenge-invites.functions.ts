import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const InvitesInput = z.object({
  challengeId: z.string().trim().min(1).max(64),
  challengeName: z.string().trim().min(1).max(200),
  challengeUrl: z.string().trim().url().max(500),
  bannerUrl: z.string().trim().max(800).optional(),
  senderName: z.string().trim().min(1).max(120),
  recipients: z.array(z.string().trim().email()).min(1).max(50),
});

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml(opts: { senderName: string; challengeName: string; challengeUrl: string; bannerUrl?: string }) {
  const banner = opts.bannerUrl
    ? `<tr><td><img src="${esc(opts.bannerUrl)}" alt="${esc(opts.challengeName)}" style="display:block;width:100%;max-width:640px;height:auto"/></td></tr>`
    : "";
  return `<!doctype html><html lang="pt-br"><head><meta charset="utf-8"><title>${esc(opts.challengeName)}</title></head>
<body style="margin:0;padding:0;background:#020617;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e2e8f0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#020617;padding:24px 0"><tr><td align="center">
  <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#0f172a;border-radius:20px;overflow:hidden;border:1px solid #1f2937">
    ${banner}
    <tr><td style="padding:24px">
      <div style="font-size:13px;letter-spacing:2px;color:#a78bfa;font-weight:800">VOCÊ FOI CONVIDADO</div>
      <div style="font-size:22px;font-weight:900;color:#fff;margin-top:6px">🏆 ${esc(opts.challengeName)}</div>
      <div style="margin-top:14px;font-size:15px;color:#cbd5e1;line-height:1.55"><b style="color:#fff">${esc(opts.senderName)}</b> te convidou para participar deste desafio no <b>Desafio dos Palpites</b> — é 100% gratuito.</div>
      <div style="text-align:center;margin-top:24px">
        <a href="${esc(opts.challengeUrl)}" style="display:inline-block;background:linear-gradient(135deg,#22d3ee,#a3e635);color:#020617;font-weight:900;padding:14px 34px;border-radius:999px;text-decoration:none;font-size:15px">🚀 Participar agora</a>
      </div>
      <div style="margin-top:18px;font-size:12px;color:#64748b;text-align:center;word-break:break-all">${esc(opts.challengeUrl)}</div>
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

export const sendChallengeInvites = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InvitesInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const html = buildHtml({
      senderName: data.senderName,
      challengeName: data.challengeName,
      challengeUrl: data.challengeUrl,
      bannerUrl: data.bannerUrl,
    });
    const subject = `🏆 ${data.senderName} te convidou: ${data.challengeName}`;

    let ok = 0;
    let failed = 0;
    for (const to of data.recipients) {
      const messageId = `challenge-invite:${data.challengeId}:${to}`;
      const payload = {
        message_id: messageId,
        idempotency_key: messageId,
        to,
        subject,
        html,
        label: "challenge_invite",
        purpose: "transactional",
        queued_at: new Date().toISOString(),
      };
      const { error } = await supabase.rpc("enqueue_email", {
        queue_name: "transactional_emails",
        payload,
      });
      if (error) {
        console.error("invite enqueue failed", to, error);
        failed++;
      } else {
        ok++;
      }
    }
    return { ok, failed, total: data.recipients.length };
  });
