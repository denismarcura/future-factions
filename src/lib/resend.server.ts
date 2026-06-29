import { supabaseAdmin } from "@/integrations/supabase/client.server";

const DEFAULT_FROM = "Desafio dos Palpites <no-reply@desafiodospalpites.com.br>";

type ResendConfig = { apiKey: string; from: string };

export async function getResendConfig(): Promise<ResendConfig | null> {
  const { data, error } = await supabaseAdmin
    .from("app_settings")
    .select("value")
    .eq("key", "resend")
    .maybeSingle();
  if (error) {
    console.error("resend config read failed", error);
    return null;
  }
  const v = (data?.value ?? {}) as { apiKey?: string; from?: string };
  if (!v.apiKey) return null;
  return { apiKey: v.apiKey, from: (v.from || "").trim() || DEFAULT_FROM };
}

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  label?: string;
};

export type SendEmailResult = {
  ok: boolean;
  id?: string;
  error?: string;
};

export async function sendEmailViaResend(input: SendEmailInput): Promise<SendEmailResult> {
  const cfg = await getResendConfig();
  if (!cfg) {
    return { ok: false, error: "Configure a chave do Resend em /admin/apis" };
  }
  const from = input.from?.trim() || cfg.from;
  const toList = Array.isArray(input.to) ? input.to : [input.to];

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: toList,
        subject: input.subject,
        html: input.html,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string; name?: string };
    if (!res.ok) {
      const err = json?.message || json?.name || `HTTP ${res.status}`;
      await logEmail({ to: toList, subject: input.subject, label: input.label, status: "failed", error: err });
      return { ok: false, error: err };
    }
    await logEmail({ to: toList, subject: input.subject, label: input.label, status: "sent", providerId: json?.id });
    return { ok: true, id: json?.id };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    await logEmail({ to: toList, subject: input.subject, label: input.label, status: "failed", error: err });
    return { ok: false, error: err };
  }
}

async function logEmail(opts: {
  to: string[];
  subject: string;
  label?: string;
  status: "sent" | "failed";
  error?: string;
  providerId?: string;
}) {
  try {
    await supabaseAdmin.from("email_send_log").insert(
      opts.to.map((recipient) => ({
        recipient_email: recipient,
        template_name: opts.label ?? "resend",
        status: opts.status,
        error_message: opts.error ?? null,
        message_id: opts.providerId ?? null,
        metadata: { subject: opts.subject, provider: "resend" },
      })) as never,
    );
  } catch (e) {
    console.error("email_send_log insert failed", e);
  }
}
