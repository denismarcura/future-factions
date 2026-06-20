import { supabase } from "@/integrations/supabase/client";

export type Platform = "instagram" | "facebook" | "youtube" | "tiktok" | "google";
export type ActionType = "follow" | "like" | "comment" | "share" | "tag" | "review" | "like_comment" | "subscribe";

export interface Mission {
  id: string;
  sponsor_name: string;
  platform: Platform;
  action_type: ActionType;
  title: string;
  link: string;
  tokens: number;
  bonus_tokens: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MissionClaim {
  id: string;
  user_id: string;
  mission_id: string;
  context: string;
  tokens_awarded: number;
  created_at: string;
}

export const ACTION_LABEL: Record<ActionType, string> = {
  follow: "Seguir perfil",
  like: "Curtir",
  comment: "Comentar",
  share: "Compartilhar",
  tag: "Marcar amigo",
  review: "Avaliar",
  like_comment: "Curtir e comentar",
  subscribe: "Inscrever-se",
};

export const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  tiktok: "TikTok",
  google: "Google Meu Negócio",
};

export const PLATFORM_FOLLOW_ACTION: Record<Platform, ActionType> = {
  instagram: "follow",
  facebook: "follow",
  youtube: "subscribe",
  tiktok: "follow",
  google: "review",
};

export const TOKEN_OPTIONS = [50, 100, 200] as const;
export const DEFAULT_BONUS_TOKENS = 500;
export const MAX_POSTS_PER_CAMPAIGN = 5;

export async function listMissions(opts?: { platform?: Platform; activeOnly?: boolean }) {
  let q = supabase.from("missions").select("*").order("created_at", { ascending: false });
  if (opts?.platform) q = q.eq("platform", opts.platform);
  if (opts?.activeOnly) q = q.eq("active", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Mission[];
}

export async function createMission(payload: Omit<Mission, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase.from("missions").insert(payload).select().single();
  if (error) throw error;
  return data as Mission;
}

export async function updateMission(id: string, payload: Partial<Mission>) {
  const { data, error } = await supabase.from("missions").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data as Mission;
}

export async function deleteMission(id: string) {
  const { error } = await supabase.from("missions").delete().eq("id", id);
  if (error) throw error;
}

export async function listMyClaims(context?: string) {
  let q = supabase.from("mission_claims").select("*");
  if (context) q = q.eq("context", context);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as MissionClaim[];
}

export async function claimMission(missionId: string, context: string, tokensAwarded: number) {
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) throw new Error("Faça login para concluir missões.");
  const { data, error } = await supabase
    .from("mission_claims")
    .insert({
      user_id: user.id,
      mission_id: missionId,
      context,
      tokens_awarded: tokensAwarded,
    })
    .select()
    .single();
  if (error) throw error;
  return data as MissionClaim;
}

// Deterministic pick: same challenge always shows the same Instagram mission
export function pickRandomFor(missions: Mission[], seed: string): Mission | null {
  if (!missions.length) return null;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return missions[h % missions.length];
}
