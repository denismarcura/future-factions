// Gerenciamento de chaves de API via painel admin.
// Os valores brutos NUNCA chegam ao client — apenas versões mascaradas.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

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
export async function getApiSetting(keyName: string): Promise<string | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("api_settings")
      .select("key_value")
      .eq("key_name", keyName)
      .maybeSingle();
    return (data as any)?.key_value ?? null;
  } catch {
    return null;
  }
}

// ── Listagem para o painel admin (valores mascarados) ────────────────────────
export type ApiSettingRow = {
  id: string;
  key_name: string;
  masked_value: string;
  description: string | null;
  updated_at: string;
  is_configured: boolean;
};

export const listApiSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ApiSettingRow[]> => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("api_settings")
      .select("id, key_name, key_value, description, updated_at")
      .order("key_name");
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      id: row.id,
      key_name: row.key_name,
      masked_value: maskValue(row.key_value ?? ""),
      description: row.description ?? null,
      updated_at: row.updated_at,
      is_configured: !!row.key_value,
    }));
  });

// ── Cadastro / atualização ───────────────────────────────────────────────────
export const upsertApiSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("api_settings").upsert(
      {
        key_name: data.key_name,
        key_value: data.key_value,
        description: data.description ?? null,
        updated_at: new Date().toISOString(),
        updated_by: context.userId,
      },
      { onConflict: "key_name" },
    );
    if (error) throw error;
    return { ok: true };
  });

// ── Remoção ──────────────────────────────────────────────────────────────────
export const deleteApiSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ key_name: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("api_settings")
      .delete()
      .eq("key_name", data.key_name);
    if (error) throw error;
    return { ok: true };
  });
