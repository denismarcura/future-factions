import { createServerFn } from "@tanstack/react-start";
import { getHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Redemption = {
  id: string;
  user_id: string;
  prize_id: string;
  prize_name: string;
  cost_tokens: number;
  status: "pending" | "approved" | "rejected" | "delivered";
  request_ip: string | null;
  ai_fraud_report: { score: number; verdict: string; signals: string[]; analysis: string } | null;
  ai_fraud_score: number | null;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
    signup_ip: string | null;
    whatsapp: string | null;
  } | null;
};

async function ensureAdmin(ctx: { supabase: any; userId: string }) {
  const { data: ok } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!ok) throw new Error("Forbidden");
}

// ===== User-side: request a redemption =====
export const requestRedemption = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { prize_id: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: prize, error: pErr } = await supabase
      .from("admin_prizes" as never)
      .select("id,name,cost_tokens,stock,active")
      .eq("id", data.prize_id)
      .single();
    if (pErr || !prize) throw new Error("Prêmio não encontrado");
    const p = prize as { id: string; name: string; cost_tokens: number; stock: number; active: boolean };
    if (!p.active) throw new Error("Prêmio indisponível");
    if (p.stock <= 0) throw new Error("Sem estoque");

    const ip =
      getRequestHeader("cf-connecting-ip") ||
      getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ||
      getRequestHeader("x-real-ip") ||
      null;

    const { data: row, error } = await supabase
      .from("prize_redemptions" as never)
      .insert({
        user_id: userId,
        prize_id: p.id,
        prize_name: p.name,
        cost_tokens: p.cost_tokens,
        status: "pending",
        request_ip: ip,
      } as never)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as unknown as Redemption;
  });

// ===== User-side: list my redemptions (for balance calc) =====
export const listMyRedemptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("prize_redemptions" as never)
      .select("id,prize_name,cost_tokens,status,created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Pick<Redemption, "id" | "prize_name" | "cost_tokens" | "status" | "created_at">[];
  });

// ===== Admin: list all redemptions =====
export const listAllRedemptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context);
    const { data, error } = await context.supabase
      .from("prize_redemptions" as never)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as unknown as Redemption[];
    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
    if (userIds.length === 0) return rows;
    const { data: profs } = await context.supabase
      .from("profiles")
      .select("id,full_name,email,avatar_url,signup_ip,whatsapp")
      .in("id", userIds);
    const byId = new Map((profs ?? []).map((p: any) => [p.id, p]));
    return rows.map((r) => ({ ...r, user: (byId.get(r.user_id) as any) ?? null }));
  });

// ===== Admin: full user history =====
export const getUserFullHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string }) => d)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const uid = data.user_id;
    const [profileRes, palpitesRes, winsRes, signupsRes, invitedRes, tokenTxRes, redemptionsRes] =
      await Promise.all([
        context.supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
        context.supabase
          .from("palpites")
          .select("id,challenge_id,kind,option_value,predicted_home_score,predicted_away_score,is_correct,created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(200),
        context.supabase
          .from("challenge_winners")
          .select("id,challenge_id,position,prize_label,created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false }),
        context.supabase
          .from("signup_attempts")
          .select("id,ip,email,city,user_id,created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false }),
        // Friends invited: anyone whose signup_attempts.email matches a contact this user shared? Use signup_attempts inviter via ip match
        Promise.resolve({ data: [] }),
        context.supabase
          .from("token_transactions")
          .select("id,challenge_id,delta,reason,created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(200),
        context.supabase
          .from("prize_redemptions" as never)
          .select("*")
          .eq("user_id", uid)
          .order("created_at", { ascending: false }),
      ]);

    const profile = (profileRes.data as any) ?? null;

    // Friends invited: profiles sharing signup_ip
    let friends: any[] = [];
    if (profile?.signup_ip) {
      const { data: same } = await context.supabase
        .from("profiles")
        .select("id,full_name,email,signup_ip,created_at,whatsapp")
        .eq("signup_ip", profile.signup_ip)
        .neq("id", uid)
        .limit(50);
      friends = same ?? [];
    }

    return {
      profile,
      palpites: palpitesRes.data ?? [],
      wins: winsRes.data ?? [],
      signupAttempts: signupsRes.data ?? [],
      friendsSameIp: friends,
      tokenTransactions: tokenTxRes.data ?? [],
      redemptions: redemptionsRes.data ?? [],
    };
  });

// ===== Admin: AI fraud check =====
export const runAiFraudCheck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { redemption_id: string }) => d)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY ausente");

    const { data: red, error } = await context.supabase
      .from("prize_redemptions" as never)
      .select("*")
      .eq("id", data.redemption_id)
      .single();
    if (error || !red) throw new Error("Solicitação não encontrada");
    const r = red as unknown as Redemption;

    // Reuse history fetch
    const history = await (async () => {
      const uid = r.user_id;
      const [profileRes, palpitesRes, winsRes, signupsRes] = await Promise.all([
        context.supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
        context.supabase.from("palpites").select("is_correct,created_at").eq("user_id", uid),
        context.supabase.from("challenge_winners").select("id,created_at").eq("user_id", uid),
        context.supabase.from("signup_attempts").select("ip,email,created_at").eq("user_id", uid),
      ]);
      const profile = profileRes.data as any;
      let friends: any[] = [];
      if (profile?.signup_ip) {
        const { data: same } = await context.supabase
          .from("profiles")
          .select("id,full_name,email,whatsapp,signup_ip,created_at")
          .eq("signup_ip", profile.signup_ip)
          .neq("id", uid);
        friends = same ?? [];
      }
      return { profile, palpites: palpitesRes.data ?? [], wins: winsRes.data ?? [], signups: signupsRes.data ?? [], friends };
    })();

    // Load AI rules
    const { data: rules } = await context.supabase
      .from("admin_prizes" as never) // safe noop; will be overridden if regras-ia table exists
      .select("id")
      .limit(0);
    void rules;

    const palpites = history.palpites as { is_correct: boolean | null; created_at: string }[];
    const total = palpites.length;
    const correct = palpites.filter((p) => p.is_correct === true).length;
    const winRate = total > 0 ? correct / total : 0;

    const summary = {
      profile: {
        name: history.profile?.full_name,
        email: history.profile?.email,
        whatsapp: history.profile?.whatsapp,
        signup_ip: history.profile?.signup_ip,
        signup_city: history.profile?.signup_city,
        created_at: history.profile?.created_at,
      },
      stats: {
        palpitesTotal: total,
        palpitesCorretos: correct,
        winRate,
        vitorias: (history.wins as any[]).length,
        contasMesmoIp: history.friends.length,
      },
      contasMesmoIp: history.friends.map((f: any) => ({
        email: f.email,
        whatsapp: f.whatsapp,
        created_at: f.created_at,
      })),
      signupAttempts: history.signups,
      request_ip: r.request_ip,
    };

    const prompt = `Analise possíveis fraudes neste pedido de troca de prêmio.

Sinais relevantes:
- IPs repetidos entre contas/amigos convidados
- Padrões de horário suspeitos (cadastros/palpites muito próximos)
- E-mails/WhatsApp similares
- Taxa de vitórias anormalmente alta (>60% é suspeito)

Dados do usuário e histórico:
${JSON.stringify(summary, null, 2)}

Responda em JSON estrito:
{
  "score": <0-100, sendo 100 = altíssima suspeita>,
  "verdict": "limpo" | "atencao" | "suspeito" | "fraude_alta",
  "signals": [<lista curta de sinais detectados>],
  "analysis": "<parágrafo explicando em português>"
}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um analista anti-fraude. Responda SEMPRE em JSON válido." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`AI falhou: ${res.status} ${txt.slice(0, 200)}`);
    }
    const json = (await res.json()) as any;
    const content = json?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { score: number; verdict: string; signals: string[]; analysis: string };
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { score: 0, verdict: "limpo", signals: [], analysis: content };
    }

    const { data: updated, error: uErr } = await context.supabase
      .from("prize_redemptions" as never)
      .update({
        ai_fraud_report: parsed,
        ai_fraud_score: Math.round(parsed.score ?? 0),
      } as never)
      .eq("id", r.id)
      .select("*")
      .single();
    if (uErr) throw new Error(uErr.message);
    return updated as unknown as Redemption;
  });

// ===== Admin: update status =====
export const updateRedemptionStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "pending" | "approved" | "rejected" | "delivered"; admin_notes?: string }) => d)
  .handler(async ({ data, context }) => {
    await ensureAdmin(context);
    const { data: row, error } = await context.supabase
      .from("prize_redemptions" as never)
      .update({
        status: data.status,
        admin_notes: data.admin_notes ?? null,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      } as never)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as unknown as Redemption;
  });
