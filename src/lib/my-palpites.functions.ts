import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type MyPalpiteRow = {
  id: string;
  challenge_id: string;
  is_correct: boolean | null;
  evaluated_at: string | null;
  created_at: string;
};

export const listMyPalpites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyPalpiteRow[]> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("palpites")
      .select("id, challenge_id, is_correct, evaluated_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as MyPalpiteRow[];
  });
