// Builds a unified token movement history from the same sources used by
// getTokenBalance(): welcome bonus, mission claims, challenge participations,
// and prize redemptions.

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
  source: "welcome" | "mission" | "participation" | "redemption";
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

  const [{ data: prof }, claims, reds] = await Promise.all([
    supabase
      .from("profiles")
      .select("welcome_bonus, created_at")
      .eq("id", user.id)
      .maybeSingle(),
    listMyClaims().catch(() => []),
    listMyRedemptions().catch(() => []),
  ]);

  const movements: TokenMovement[] = [];

  // Welcome bonus
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

  // Mission claims (try to fetch mission titles in one round-trip)
  const missionIds = Array.from(new Set(claims.map((c) => c.mission_id)));
  let titleById = new Map<string, string>();
  if (missionIds.length) {
    const { data: missions } = await supabase
      .from("missions")
      .select("id, title, platform, action")
      .in("id", missionIds);
    for (const m of (missions ?? []) as Array<{ id: string; title: string | null; platform: string; action: string }>) {
      titleById.set(m.id, m.title || `${m.platform} · ${m.action}`);
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

  // Participations (localStorage)
  for (const p of listParticipations()) {
    if (!p.entryFee) continue;
    movements.push({
      id: `part:${p.id}:${p.participatedAt}`,
      date: p.participatedAt,
      type: "debit",
      amount: p.entryFee,
      reason: `Palpite enviado: ${p.title}`,
      source: "participation",
      detail: p.category ? `Categoria: ${p.category}` : undefined,
      link: { to: `/previsao/${p.id}`, label: "Ver desafio" },
    });
  }

  // Redemptions
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
