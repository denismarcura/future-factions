import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type AdminPrize = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  estimated_value: number | null;
  cost_tokens: number;
  stock: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

function publicClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const listActivePrizes = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("admin_prizes" as never)
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as AdminPrize[];
});

export const listAllPrizes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { data, error } = await context.supabase
      .from("admin_prizes" as never)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as AdminPrize[];
  });

export const upsertPrize = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Partial<AdminPrize> & { name: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const payload = {
      ...(data.id ? { id: data.id } : {}),
      name: data.name,
      description: data.description ?? null,
      image_url: data.image_url ?? null,
      estimated_value: data.estimated_value ?? null,
      cost_tokens: data.cost_tokens ?? 0,
      stock: data.stock ?? 0,
      active: data.active ?? true,
    };
    const { data: row, error } = await context.supabase
      .from("admin_prizes" as never)
      .upsert(payload as never)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as unknown as AdminPrize;
  });

export const deletePrize = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { error } = await context.supabase.from("admin_prizes" as never).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
