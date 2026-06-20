import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

const MAX_PER_IP = 5;

function extractIp(req: Request): string {
  const h = req.headers;
  // Prefer trusted edge headers that clients cannot spoof.
  const trusted = h.get("cf-connecting-ip") || h.get("true-client-ip");
  if (trusted) return trusted.trim();
  // Fall back to x-forwarded-for (take the LAST entry, set by our edge,
  // not the first which is the client-controlled value).
  const fwd = h.get("x-forwarded-for");
  if (fwd) {
    const parts = fwd.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1]!;
  }
  return h.get("x-real-ip") || "0.0.0.0";
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
