import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const PublishedInput = z.object({
  challengeId: z.string().trim().min(1).max(64),
  challengeName: z.string().trim().min(1).max(200),
  category: z.string().trim().max(80).optional(),
  endsAt: z.string().trim().max(50).optional(),
  prizeName: z.string().trim().max(200).optional(),
  visibility: z.enum(["public", "private"]).default("public"),
  subs: z
    .array(z.object({ question: z.string(), options: z.array(z.string()) }))
    .max(20)
    .optional(),
  inviteLink: z.string().trim().max(400).optional(),
});

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildPublishedHtml(opts: {
  userName: string;
  challengeName: string;
  category?: string;
  endsAt?: string;
  prizeName?: string;
  visibility: "public" | "private";
  subs: { question: string; options: string[] }[];
  inviteLink?: string;
}) {
  const subsHtml = opts.subs
    .map(
      (s, i) => `
      <tr><td style="padding:10px 12px;border-bottom:1px solid #1f2937;color:#cbd5e1;font-size:14px">
        <b style="color:#fde047">#${i + 1}</b> ${escapeHtml(s.question)}
        <div style="font-size:12px;color:#94a3b8;margin-top:4px">${s.options.map((o) => escapeHtml(o)).join(" • ")}</div>
      </td></tr>`,
    )
    .join("");

  const cta = opts.inviteLink
    ? `<a href="${escapeHtml(opts.inviteLink)}" style="display:inline-block;background:linear-gradient(135deg,#22d3ee,#a3e635);color:#020617;font-weight:900;padding:14px 28px;border-radius:999px;text-decoration:none;font-size:15px">🚀 Convidar amigos</a>`
    : "";

  return `<!doctype html><html lang="pt-br"><head><meta charset="utf-8"><title>Desafio publicado</title></head>
<body style="margin:0;padding:0;background:#020617;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e2e8f0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#020617;padding:24px 0"><tr><td align="center">
  <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#0f172a;border-radius:20px;overflow:hidden;border:1px solid #1f2937">
    <tr><td style="background:linear-gradient(135deg,#22d3ee,#a3e635);padding:28px;text-align:center">
      <div style="font-size:12px;letter-spacing:3px;color:#020617;font-weight:900">DESAFIO DOS PALPITES</div>
      <div style="font-size:26px;font-weight:900;color:#020617;margin-top:6px">🎉 Seu desafio está no ar!</div>
    </td></tr>
    <tr><td style="padding:24px">
      <div style="font-size:16px;color:#cbd5e1;line-height:1.55">Olá <b style="color:#fff">${escapeHtml(opts.userName)}</b>, seu desafio foi publicado com sucesso.</div>
      <div style="margin-top:18px;padding:16px;background:#0b1220;border:1px solid #1f2937;border-radius:12px">
        <div style="font-size:20px;font-weight:900;color:#fff">${escapeHtml(opts.challengeName)}</div>
        ${opts.category ? `<div style="margin-top:6px;font-size:12px;color:#a78bfa;font-weight:800;letter-spacing:1.5px">${escapeHtml(opts.category.toUpperCase())}</div>` : ""}
        ${opts.endsAt ? `<div style="margin-top:8px;font-size:13px;color:#cbd5e1">⏰ Encerra em: <b>${escapeHtml(opts.endsAt)}</b></div>` : ""}
        ${opts.prizeName ? `<div style="margin-top:6px;font-size:13px;color:#fde047">🎁 Prêmio: <b>${escapeHtml(opts.prizeName)}</b></div>` : ""}
        <div style="margin-top:6px;font-size:13px;color:#94a3b8">👁️ Visibilidade: <b>${opts.visibility === "public" ? "Público" : "Privado (apenas pelo link)"}</b></div>
      </div>
      ${opts.subs.length ? `<div style="margin-top:18px"><div style="font-size:12px;letter-spacing:2px;color:#a78bfa;font-weight:800">PALPITES</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;background:#0b1220;border:1px solid #1f2937;border-radius:12px;overflow:hidden">${subsHtml}</table></div>` : ""}
      ${cta ? `<div style="text-align:center;margin-top:24px">${cta}</div>` : ""}
      <div style="margin-top:18px;font-size:12px;color:#64748b;text-align:center">Divulgue para os amigos e bora ver quem acerta mais 🏆</div>
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

export const sendChallengePublishedEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PublishedInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Get user profile (name + email)
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .maybeSingle();

    const email = profile?.email;
    if (!email) return { ok: false, reason: "no_email" as const };

    const html = buildPublishedHtml({
      userName: profile?.full_name ?? "amigo(a)",
      challengeName: data.challengeName,
      category: data.category,
      endsAt: data.endsAt,
      prizeName: data.prizeName,
      visibility: data.visibility,
      subs: data.subs ?? [],
      inviteLink: data.inviteLink,
    });

    const { sendEmailViaResend } = await import("./resend.server");
    const r = await sendEmailViaResend({
      to: email,
      subject: `🎉 Seu desafio "${data.challengeName}" está no ar!`,
      html,
      label: "challenge_published",
    });

    if (!r.ok) {
      console.error("resend send failed", r.error);
      return { ok: false, reason: "send_failed" as const };
    }
    return { ok: true as const };
  });
