// Gerenciamento de chaves de API via painel admin.
// Usa a tabela app_settings (já existente) com chaves prefixadas "api:{key_name}".
// Formato do value: { key_value: string, description?: string }
// Os valores brutos NUNCA chegam ao client — apenas versões mascaradas.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const PREFIX = "api:";

async function ensureAdmin(ctx: { supabase: any; userId: string }) {
  const { data: ok } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (!ok) throw new Error("Forbidden");
}

function maskValue(value: string): string {
  if (!value) return "";
  if (value.length <= 8) return "●●●●●●●●";
  return `${value.slice(0, 4)}●●●●●●●●${value.slice(-4)}`;
}

// ── Leitura bruta (server-only, nunca chamar do client) ─────────────────────
// Usa supabaseAdmin (service role) pois não há contexto de usuário aqui.
export async function getApiSetting(keyName: string): Promise<string | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", `${PREFIX}${keyName}`)
      .maybeSingle();
    return (data?.value as any)?.key_value ?? null;
  } catch {
    return null;
  }
}

// ── Tipo público (sem o valor real) ─────────────────────────────────────────
export type ApiSettingRow = {
  id: string;
  key_name: string;
  masked_value: string;
  description: string | null;
  updated_at: string;
  is_configured: boolean;
};

// ── Listagem para o painel admin (valores mascarados) ────────────────────────
export const listApiSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ApiSettingRow[]> => {
    await ensureAdmin(context);
    const { data, error } = await context.supabase
      .from("app_settings")
      .select("key, value, updated_at")
      .like("key", `${PREFIX}%`)
      .order("key");
    if (error) throw error;
    return (data ?? []).map((row: any) => {
      const keyName = (row.key as string).replace(PREFIX, "");
      const v = (row.value ?? {}) as { key_value?: string; description?: string };
      return {
        id: row.key,
        key_name: keyName,
        masked_value: maskValue(v.key_value ?? ""),
        description: v.description ?? null,
        updated_at: row.updated_at,
        is_configured: !!v.key_value,
      };
    });
  });

// ── Cadastro / atualização ───────────────────────────────────────────────────
export const upsertApiSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        key_name: z.string().min(1).max(100),
        key_value: z.string().min(1),
        description: z.string().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);

    // Preserva description existente se não for fornecida
    const existing = await context.supabase
      .from("app_settings")
      .select("value")
      .eq("key", `${PREFIX}${data.key_name}`)
      .maybeSingle();
    const prev = (existing.data?.value ?? {}) as Record<string, any>;

    const newValue = {
      ...prev,
      key_value: data.key_value,
      ...(data.description !== undefined ? { description: data.description } : {}),
    };

    const { error } = await context.supabase
      .from("app_settings")
      .upsert({ key: `${PREFIX}${data.key_name}`, value: newValue }, { onConflict: "key" });
    if (error) throw error;
    return { ok: true };
  });

// ── Remoção ──────────────────────────────────────────────────────────────────
export const deleteApiSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ key_name: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { error } = await context.supabase
      .from("app_settings")
      .delete()
      .eq("key", `${PREFIX}${data.key_name}`);
    if (error) throw error;
    return { ok: true };
  });
