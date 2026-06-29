import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const KeySchema = z.object({ key: z.string().trim().min(1).max(64) });

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Apenas administradores podem executar esta ação.");
}

export const getAdminSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => KeySchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("app_settings")
      .select("value, updated_at")
      .eq("key", data.key)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { value: (row?.value ?? null) as Record<string, unknown> | null, updatedAt: row?.updated_at ?? null };
  });

const SaveSchema = z.object({
  key: z.string().trim().min(1).max(64),
  value: z.record(z.any()),
});

export const saveAdminSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SaveSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("app_settings")
      .upsert({ key: data.key, value: data.value, updated_by: userId } as never, { onConflict: "key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const TestSchema = z.object({
  to: z.string().trim().email(),
});

export const sendResendTestEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => TestSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { sendEmailViaResend } = await import("./resend.server");
    const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#0f172a;color:#e2e8f0;padding:32px">
      <div style="max-width:560px;margin:0 auto;background:#020617;border:1px solid #1f2937;border-radius:16px;padding:28px">
        <div style="font-size:12px;letter-spacing:3px;color:#fde047;font-weight:900">DESAFIO DOS PALPITES</div>
        <h1 style="color:#fff;margin:8px 0 0;font-size:22px">✅ Resend configurado</h1>
        <p style="color:#cbd5e1;font-size:14px;line-height:1.6">Este é um e-mail de teste enviado a partir do painel administrativo. Se você está lendo isso, sua chave do Resend está funcionando.</p>
        <p style="color:#64748b;font-size:12px;margin-top:18px">Disparado em ${new Date().toLocaleString("pt-BR")}</p>
      </div>
    </body></html>`;
    const r = await sendEmailViaResend({
      to: data.to,
      subject: "✅ Teste de envio — Resend",
      html,
      label: "resend_test",
    });
    if (!r.ok) throw new Error(r.error || "Falha no envio");
    return { ok: true, id: r.id };
  });
