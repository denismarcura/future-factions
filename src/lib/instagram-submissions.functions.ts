import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type InstagramSubmission = {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  instagram_url: string;
  status: string;
  reward_tokens: number;
  reward_palpite_tokens: number;
  notes: string | null;
  created_at: string;
  reviewed_at: string | null;
};

export const submitInstagramVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { instagramUrl: string; userName?: string; userEmail?: string }) => {
    const url = (data.instagramUrl || "").trim();
    if (!url) throw new Error("Informe o link do Instagram.");
    if (!/^https?:\/\/.+/i.test(url)) throw new Error("Link inválido.");
    return {
      instagramUrl: url,
      userName: data.userName?.trim() || null,
      userEmail: data.userEmail?.trim() || null,
    };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("instagram_submissions")
      .insert({
        user_id: userId,
        user_name: data.userName,
        user_email: data.userEmail,
        instagram_url: data.instagramUrl,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as InstagramSubmission;
  });

export const listMyInstagramSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("instagram_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as InstagramSubmission[];
  });

export const listAllInstagramSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { data, error } = await context.supabase
      .from("instagram_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as InstagramSubmission[];
  });

export const updateInstagramSubmissionStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; status: "pending" | "approved" | "rejected"; notes?: string }) => data)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { error } = await context.supabase
      .from("instagram_submissions")
      .update({ status: data.status, notes: data.notes ?? null, reviewed_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
