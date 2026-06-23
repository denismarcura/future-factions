import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminProfile = {
  id: string;
  fullName: string | null;
  email: string | null;
  whatsapp: string | null;
  instagram: string | null;
  city: string | null;
  state: string | null;
  provider: string | null;
  status: string | null;
  welcomeBonus: number | null;
  createdAt: string;
};

export type AdminCorpChallenge = {
  id: string;
  title: string;
  companyName: string | null;
  prizeName: string | null;
  category: string | null;
  subcategory: string | null;
  status: string;
  participants: number;
  endsAt: string | null;
  createdAt: string;
};

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Forbidden");
}

export const listAdminProfiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminProfile[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, whatsapp, instagram, cidade, estado, signup_city, provider, status, welcome_bonus, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => ({
      id: r.id,
      fullName: r.full_name,
      email: r.email,
      whatsapp: r.whatsapp,
      instagram: r.instagram,
      city: r.cidade ?? r.signup_city,
      state: r.estado,
      provider: r.provider,
      status: r.status,
      welcomeBonus: r.welcome_bonus,
      createdAt: r.created_at,
    }));
  });

export const listAllCorpChallengesAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminCorpChallenge[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("corporate_challenges")
      .select("id, title, company_name, prize_name, status, participants, ends_at, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => ({
      id: r.id,
      title: r.title,
      companyName: r.company_name,
      prizeName: r.prize_name,
      status: r.status,
      participants: r.participants ?? 0,
      endsAt: r.ends_at,
      createdAt: r.created_at,
    }));
  });

export const updateCorpChallengeStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => d as { id: string; status: "ativo" | "encerrado" })
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("corporate_challenges")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCorpChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => d as { id: string })
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("corporate_challenges")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
