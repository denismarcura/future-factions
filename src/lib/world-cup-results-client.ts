import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  listWorldCupResults,
  type WorldCupResultRow,
} from "@/lib/world-cup-results.functions";

const BUCKET = "match-results";
const SIGN_TTL = 60 * 60 * 24 * 365; // 1 year

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

export type OrientedResult = {
  id: string;
  status: WorldCupResultRow["status"];
  homeScore: number;
  awayScore: number;
  imageUrl: string | null;
  matchDate: string;
};

export function findOrientedResult(
  rows: WorldCupResultRow[] | undefined,
  home: string,
  away: string,
): OrientedResult | null {
  if (!rows?.length) return null;
  const h = norm(home);
  const a = norm(away);
  const row = rows.find(
    (r) =>
      (norm(r.home_team) === h && norm(r.away_team) === a) ||
      (norm(r.home_team) === a && norm(r.away_team) === h),
  );
  if (!row) return null;
  const swap = norm(row.home_team) !== h;
  return {
    id: row.id,
    status: row.status,
    homeScore: swap ? row.away_score : row.home_score,
    awayScore: swap ? row.home_score : row.away_score,
    imageUrl: row.image_url,
    matchDate: row.match_date,
  };
}

export function useWorldCupResults() {
  const listFn = useServerFn(listWorldCupResults);
  return useQuery({
    queryKey: ["wc-results"],
    queryFn: () => listFn(),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

/** Upload an image for a match result and return a signed URL. Admin-only enforced by storage RLS. */
export async function uploadResultImage(matchKey: string, file: Blob): Promise<string> {
  const ext = file.type.includes("png")
    ? "png"
    : file.type.includes("webp")
      ? "webp"
      : "jpg";
  const path = `${matchKey}/${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || "image/jpeg", upsert: true });
  if (upErr) throw new Error(upErr.message);
  const { data: signed, error: signErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGN_TTL);
  if (signErr || !signed) throw new Error(signErr?.message ?? "Falha ao gerar URL");
  return signed.signedUrl;
}
