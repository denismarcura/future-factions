import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

const MAX_PER_IP = 5;

function extractIp(req: Request): string {
  const h = req.headers;
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return (
    h.get("cf-connecting-ip") ||
    h.get("x-real-ip") ||
    h.get("x-client-ip") ||
    "0.0.0.0"
  );
}

async function lookupCity(ip: string): Promise<string | null> {
  if (!ip || ip === "0.0.0.0" || ip.startsWith("127.") || ip.startsWith("192.168.")) return null;
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { "User-Agent": "DesafioPalpites/1.0" },
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { city?: string; region?: string; country_name?: string };
    return [j.city, j.region, j.country_name].filter(Boolean).join(", ") || null;
  } catch {
    return null;
  }
}

/** Returns IP + city for the caller, and rejects if the IP exceeds the signup limit. */
export const prepareSignup = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string }) => data)
  .handler(async ({ data }) => {
    const req = getRequest();
    const ip = extractIp(req);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count, error: cErr } = await supabaseAdmin
      .from("signup_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip);
    if (cErr) throw new Error(cErr.message);

    if ((count ?? 0) >= MAX_PER_IP) {
      throw new Error(
        `Limite de ${MAX_PER_IP} cadastros atingido para este IP. Entre em contato com o suporte.`,
      );
    }

    const city = await lookupCity(ip);

    await supabaseAdmin.from("signup_attempts").insert({
      ip,
      city,
      email: data.email,
    });

    return { ip, city };
  });
