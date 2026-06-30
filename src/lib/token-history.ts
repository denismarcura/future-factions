// Builds a unified token movement history from the same sources used by
// getTokenBalance(): welcome bonus, mission claims, challenge participations,
// referral bonuses, and prize redemptions.

import { supabase } from "@/integrations/supabase/client";
import { listMyClaims } from "@/lib/missions";
import { listParticipations } from "@/lib/my-participations";
import { listMyRedemptions } from "@/lib/prize-redemptions.functions";

export type TokenMovement = {
  id: string;
  date: string; // ISO
  type: "credit" | "debit";
  amount: number; // always positive
  reason: string;
  source: "welcome" | "mission" | "participation" | "redemption" | "referral";
  detail?: string;
  link?: { to: string; label: string };
  status?: "pending" | "approved" | "rejected" | "delivered";
  refunded?: boolean;
};

export type TokenHistory = {
  balance: number;
  totalCredits: number;
  totalDebits: number;
  movements: TokenMovement[];
};

export async function buildTokenHistory(): Promise<TokenHistory> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { balance: 0, totalCredits: 0, totalDebits: 0, movements: [] };
  }

  const [{ data: prof }, claims, reds, { data: partTxs }, { data: refTxs }] = await Promise.all([
    supabase
      .from("profiles")
      .select("welcome_bonus, created_at")
      .eq("id", user.id)
      .maybeSingle(),
    listMyClaims().catch(() => []),
    listMyRedemptions().catch(() => []),
    // Débitos de participação gravados no banco
    supabase
      .from("token_transactions")
      .select("id, challenge_id, delta, created_at")
      .eq("user_id", user.id)
      .eq("reason", "participation")
      .lt("delta", 0),
    // Bônus de referral recebidos (quando o usuário foi o convidador)
    supabase
      .from("token_transactions")
      .select("id, delta, created_at")
      .eq("user_id", user.id)
      .eq("reason", "referral_signup")
      .gt("delta", 0),
  ]);

  const movements: TokenMovement[] = [];

  // ── Welcome bonus ────────────────────────────────────────────────────────
  const welcome = (prof?.welcome_bonus as number | undefined) ?? 0;
  if (welcome > 0) {
    movements.push({
      id: "welcome",
      date: (prof?.created_at as string | undefined) ?? new Date(0).toISOString(),
      type: "credit",
      amount: welcome,
      reason: "Bônus de boas-vindas",
      source: "welcome",
      detail: "Crédito inicial concedido ao criar sua conta.",
    });
  }

  // ── Referral bonuses ─────────────────────────────────────────────────────
  for (const tx of (refTxs ?? []) as Array<{ id: string; delta: number; created_at: string }>) {
    movements.push({
      id: `referral:${tx.id}`,
      date: tx.created_at,
      type: "credit",
      amount: tx.delta,
      reason: "Bônus de convite: amigo se cadastrou",
      source: "referral",
      detail: "Você ganhou 500 TKN por convidar um amigo que criou uma conta.",
    });
  }

  // ── Mission claims ───────────────────────────────────────────────────────
  const missionIds = Array.from(new Set(claims.map((c) => c.mission_id)));
  let titleById = new Map<string, string>();
  if (missionIds.length) {
    const { data: missions } = await supabase
      .from("missions")
      .select("id, title, platform")
      .in("id", missionIds);
    for (const m of (missions ?? []) as Array<{ id: string; title: string | null; platform: string }>) {
      titleById.set(m.id, m.title || m.platform);
    }
  }
  for (const c of claims) {
    if (!c.tokens_awarded) continue;
    movements.push({
      id: `mission:${c.id}`,
      date: c.created_at,
      type: "credit",
      amount: c.tokens_awarded,
      reason: `Missão concluída: ${titleById.get(c.mission_id) ?? "missão"}`,
      source: "mission",
      detail: c.context ? `Contexto: ${c.context}` : undefined,
    });
  }

  // ── Participation debits (banco) ─────────────────────────────────────────
  const dbPartTxs = (partTxs ?? []) as Array<{
    id: string;
    challenge_id: string | null;
    delta: number;
    created_at: string;
  }>;
  const dbChallengeIds = new Set(dbPartTxs.map((t) => t.challenge_id).filter(Boolean));

  // Busca títulos dos desafios em batch
  const challengeIds = [...dbChallengeIds] as string[];
  const challengeTitles = new Map<string, string>();
  if (challengeIds.length) {
    const { data: challenges } = await supabase
      .from("challenges")
      .select("id, title")
      .in("id", challengeIds);
    for (const c of (challenges ?? []) as Array<{ id: string; title: string }>) {
      challengeTitles.set(c.id, c.title);
    }
  }

  for (const tx of dbPartTxs) {
    const title = tx.challenge_id ? (challengeTitles.get(tx.challenge_id) ?? "desafio") : "desafio";
    movements.push({
      id: `part:${tx.id}`,
      date: tx.created_at,
      type: "debit",
      amount: Math.abs(tx.delta),
      reason: `Palpite enviado: ${title}`,
      source: "participation",
      link: tx.challenge_id ? { to: `/previsao/${tx.challenge_id}`, label: "Ver desafio" } : undefined,
    });
  }

  // ── Participation debits (localStorage — apenas os não registrados no banco) ──
  for (const p of listParticipations()) {
    if (!p.entryFee) continue;
    if (dbChallengeIds.has(p.id)) continue; // já incluído via banco
    movements.push({
      id: `part:local:${p.id}:${p.participatedAt}`,
      date: p.participatedAt,
      type: "debit",
      amount: p.entryFee,
      reason: `Palpite enviado: ${p.title}`,
      source: "participation",
      detail: p.category ? `Categoria: ${p.category}` : undefined,
      link: { to: `/previsao/${p.id}`, label: "Ver desafio" },
    });
  }

  // ── Redemptions ──────────────────────────────────────────────────────────
  for (const r of reds) {
    if (!r.cost_tokens) continue;
    const refunded = r.status === "rejected";
    movements.push({
      id: `red:${r.id}`,
      date: r.created_at,
      type: "debit",
      amount: r.cost_tokens,
      reason: `Resgate de prêmio: ${r.prize_name}`,
      source: "redemption",
      status: r.status,
      refunded,
      detail: refunded
        ? "Solicitação recusada — tokens estornados ao saldo."
        : r.status === "pending"
          ? "Aguardando aprovação do administrador."
          : r.status === "approved"
            ? "Resgate aprovado — em preparação."
            : "Prêmio entregue.",
    });
  }

  movements.sort((a, b) => (a.date < b.date ? 1 : -1));

  const totalCredits = movements
    .filter((m) => m.type === "credit")
    .reduce((s, m) => s + m.amount, 0);
  const totalDebits = movements
    .filter((m) => m.type === "debit" && !m.refunded)
    .reduce((s, m) => s + m.amount, 0);
  const balance = totalCredits - totalDebits;

  return { balance, totalCredits, totalDebits, movements };
}
