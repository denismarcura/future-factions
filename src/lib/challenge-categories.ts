import { supabase } from "@/integrations/supabase/client";

export interface ChallengeCategory {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ChallengeSubcategory {
  id: string;
  category_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export async function listCategories(): Promise<ChallengeCategory[]> {
  const { data, error } = await supabase
    .from("challenge_categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ChallengeCategory[];
}

export async function listSubcategories(categoryId?: string): Promise<ChallengeSubcategory[]> {
  let q = supabase
    .from("challenge_subcategories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (categoryId) q = q.eq("category_id", categoryId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ChallengeSubcategory[];
}

export async function createCategory(input: { name: string; sort_order?: number }) {
  const { data, error } = await supabase
    .from("challenge_categories")
    .insert({ name: input.name, sort_order: input.sort_order ?? 0 })
    .select()
    .single();
  if (error) throw error;
  return data as ChallengeCategory;
}

export async function updateCategory(id: string, patch: Partial<Pick<ChallengeCategory, "name" | "sort_order">>) {
  const { error } = await supabase.from("challenge_categories").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from("challenge_categories").delete().eq("id", id);
  if (error) throw error;
}

export async function createSubcategory(input: { category_id: string; name: string; sort_order?: number }) {
  const { data, error } = await supabase
    .from("challenge_subcategories")
    .insert({ category_id: input.category_id, name: input.name, sort_order: input.sort_order ?? 0 })
    .select()
    .single();
  if (error) throw error;
  return data as ChallengeSubcategory;
}

export async function updateSubcategory(id: string, patch: Partial<Pick<ChallengeSubcategory, "name" | "sort_order">>) {
  const { error } = await supabase.from("challenge_subcategories").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteSubcategory(id: string) {
  const { error } = await supabase.from("challenge_subcategories").delete().eq("id", id);
  if (error) throw error;
}
